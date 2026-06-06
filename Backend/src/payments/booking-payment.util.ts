import { BadRequestException } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { sendPlatformEmail } from '../notifications/notification-delivery.service';

type PayableBooking = {
  id: string;
  businessId: string;
  price: number;
  taxAmount: number;
  status: string;
  staff?: { name: string } | null;
  service?: { name: string } | null;
  user?: { email: string } | null;
};

export type SettlementResult = {
  grossSubtotal: number;
  totalTax: number;
  commissionAmount: number;
  businessCredit: number;
  customerTotal: number;
};

export async function loadDefaultCommissionPercent(prisma: PrismaService): Promise<number> {
  try {
    const cfg = await prisma.systemConfig.findFirst({
      select: { defaultCommission: true },
    });
    const pct = cfg?.defaultCommission ?? 15;
    return Number.isFinite(pct) && pct >= 0 ? pct : 15;
  } catch {
    return 15;
  }
}

export function calculateBookingSettlement(
  bookings: Array<{ price: number; taxAmount?: number | null }>,
  commissionPercent: number,
): SettlementResult {
  const grossSubtotal = bookings.reduce((sum, b) => sum + Number(b.price || 0), 0);
  const totalTax = bookings.reduce((sum, b) => sum + Number(b.taxAmount || 0), 0);
  const pct = Number.isFinite(commissionPercent) && commissionPercent >= 0 ? commissionPercent : 15;
  const commissionAmount = Number((grossSubtotal * (pct / 100)).toFixed(2));
  /** Net service amount credited to the business withdrawable balance (tax is pass-through). */
  const businessCredit = Number((grossSubtotal - commissionAmount).toFixed(2));
  const customerTotal = Number((grossSubtotal + totalTax + commissionAmount).toFixed(2));
  return { grossSubtotal, totalTax, commissionAmount, businessCredit, customerTotal };
}

async function creditPlatformCommission(
  tx: Prisma.TransactionClient,
  commissionAmount: number,
): Promise<void> {
  if (commissionAmount <= 0) return;
  await tx.systemConfig.upsert({
    where: { id: 1 },
    update: { platformBalance: { increment: commissionAmount } },
    create: { id: 1, platformBalance: commissionAmount },
  });
}

async function creditBusinessWallet(
  tx: Prisma.TransactionClient,
  businessId: string,
  settlement: SettlementResult,
): Promise<void> {
  if (settlement.businessCredit <= 0 && settlement.grossSubtotal <= 0) return;
  await tx.business.update({
    where: { id: businessId },
    data: {
      balance: { increment: settlement.businessCredit },
      revenue: { increment: settlement.customerTotal },
    },
  });
}

export async function applyPaymentSettlement(
  prisma: PrismaService,
  businessId: string,
  settlement: SettlementResult,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await creditBusinessWallet(tx, businessId, settlement);
    await creditPlatformCommission(tx, settlement.commissionAmount);
  });
}

export async function finalizeBookingGroupPayment(
  prisma: PrismaService,
  user: User,
  bookingIds: string[],
  paymentMethod: string,
): Promise<{
  ok: true;
  transactionId: string;
  total: number;
  commissionAmount: number;
  businessCredit: number;
}> {
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    throw new BadRequestException('bookingIds must be a non-empty array');
  }

  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds }, userId: user.id },
    include: {
      staff: true,
      business: true,
      service: true,
      user: { select: { id: true, email: true, name: true, phone: true, role: true } },
    },
  });
  if (bookings.length === 0) throw new BadRequestException('No valid bookings found');

  const payableBookings = bookings.filter(
    (b) =>
      b.status !== 'Cancelled' &&
      b.status !== 'Rejected' &&
      b.status !== 'Completed' &&
      b.status !== 'Paid' &&
      !b.transactionId,
  );
  if (payableBookings.length === 0) {
    throw new BadRequestException('All bookings are already completed or paid');
  }

  const businessId = payableBookings[0].businessId;
  const commissionPercent = await loadDefaultCommissionPercent(prisma);
  const settlement = calculateBookingSettlement(payableBookings, commissionPercent);

  const staffNames = [...new Set(payableBookings.map((b) => b.staff?.name).filter(Boolean))].join(', ');
  const serviceNames = payableBookings.map((b) => b.service?.name || 'Service').join(', ');

  const result = await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        bookingId: payableBookings[0].id,
        businessId,
        amount: settlement.customerTotal,
        taxAmount: settlement.totalTax,
        commissionAmount: settlement.commissionAmount,
        status: 'Completed',
        paymentMethod,
        description: serviceNames,
        customerEmail: user.email,
        staffMember: staffNames || null,
        bookings: { connect: payableBookings.map((b) => ({ id: b.id })) },
      },
    });

    await tx.booking.updateMany({
      where: { id: { in: payableBookings.map((b) => b.id) } },
      data: { status: 'Paid', transactionId: transaction.id },
    });

    await creditBusinessWallet(tx, businessId, settlement);
    await creditPlatformCommission(tx, settlement.commissionAmount);

    await tx.notification.create({
      data: {
        userId: user.id,
        role: user.role,
        type: 'PAYMENT_COMPLETED',
        title: 'Payment received',
        body: `Your payment of $${settlement.customerTotal.toFixed(2)} was processed successfully.`,
      },
    });

    return transaction;
  });

  const biz = payableBookings[0].business;
  const amountLabel = `$${settlement.customerTotal.toFixed(2)}`;
  if (biz?.notifyBookingEmail && biz.email) {
    void sendPlatformEmail(prisma, {
      to: biz.email,
      template: 'payment-received-business',
      model: { businessName: biz.name, amount: amountLabel },
    });
  }
  if (user.email) {
    void sendPlatformEmail(prisma, {
      to: user.email,
      template: 'payment-receipt',
      model: {
        userName: user.name,
        customerName: user.name,
        amount: amountLabel,
        paymentMethod,
      },
    });
  }

  return {
    ok: true,
    transactionId: result.id,
    total: settlement.customerTotal,
    commissionAmount: settlement.commissionAmount,
    businessCredit: settlement.businessCredit,
  };
}

/** Business panel: mark a group of bookings as paid (cash/card in-store). */
/** One invoice row per combined checkout (bookingGroupId), not per service line. */
export function dedupeTransactionsByBookingGroup<
  T extends {
    id: string;
    date: Date;
    bookings: Array<{ id: string; bookingGroupId: string | null }>;
  },
>(txList: T[]): T[] {
  const byGroup = new Map<string, T[]>();
  const standalone: T[] = [];
  for (const t of txList) {
    const gids = [
      ...new Set(
        t.bookings.map((b) => b.bookingGroupId?.trim()).filter((g): g is string => Boolean(g)),
      ),
    ];
    if (gids.length === 1) {
      const gid = gids[0];
      const arr = byGroup.get(gid) ?? [];
      arr.push(t);
      byGroup.set(gid, arr);
    } else {
      standalone.push(t);
    }
  }
  const out: T[] = [...standalone];
  for (const groupTxs of byGroup.values()) {
    const best = groupTxs.reduce((a, b) =>
      a.bookings.length >= b.bookings.length ? a : b,
    );
    out.push(best);
  }
  return out.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export async function finalizeBusinessBookingGroupPayment(
  prisma: PrismaService,
  businessId: string,
  bookingIds: string[],
  paymentMethod: string,
) {
  if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
    throw new BadRequestException('bookingIds must be a non-empty array');
  }

  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds }, businessId },
    include: {
      staff: true,
      service: true,
      user: { select: { id: true, email: true, name: true, phone: true, role: true } },
    },
  });
  if (bookings.length === 0) throw new BadRequestException('No valid bookings found');

  const payableBookings = bookings.filter(
    (b) =>
      b.status !== 'Cancelled' &&
      b.status !== 'Rejected' &&
      b.status !== 'Completed' &&
      b.status !== 'Paid' &&
      !b.transactionId,
  );
  if (payableBookings.length === 0) {
    throw new BadRequestException('All bookings are already completed or paid');
  }

  const commissionPercent = await loadDefaultCommissionPercent(prisma);
  const settlement = calculateBookingSettlement(payableBookings, commissionPercent);
  const staffNames = [...new Set(payableBookings.map((b) => b.staff?.name).filter(Boolean))].join(', ');
  const serviceNames = payableBookings.map((b) => b.service?.name || 'Service').join(', ');

  return prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        bookingId: payableBookings[0].id,
        businessId,
        amount: settlement.customerTotal,
        taxAmount: settlement.totalTax,
        commissionAmount: settlement.commissionAmount,
        status: 'Completed',
        paymentMethod,
        description: serviceNames,
        customerEmail: payableBookings[0].user?.email || null,
        staffMember: staffNames || null,
        bookings: { connect: payableBookings.map((b) => ({ id: b.id })) },
      },
    });

    await tx.booking.updateMany({
      where: { id: { in: payableBookings.map((b) => b.id) } },
      data: { status: 'Paid', transactionId: transaction.id },
    });

    await creditBusinessWallet(tx, businessId, settlement);
    await creditPlatformCommission(tx, settlement.commissionAmount);

    return transaction;
  });
}
