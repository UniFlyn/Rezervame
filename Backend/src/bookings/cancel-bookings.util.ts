import { BadRequestException } from '@nestjs/common';
import { Business, Booking, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';
import {
  assertCustomerCanCancelBooking,
  canCustomerCancelBooking,
} from './cancellation-policy.util';
import {
  calculateBookingSettlement,
  loadDefaultCommissionPercent,
} from '../payments/booking-payment.util';
import { sendPlatformEmail } from '../notifications/notification-delivery.service';

type BookingWithBiz = Booking & { business: Business; transaction?: { id: string; status: string } | null };

async function reverseSettlement(
  tx: Prisma.TransactionClient,
  businessId: string,
  settlement: ReturnType<typeof calculateBookingSettlement>,
): Promise<void> {
  if (settlement.businessCredit > 0) {
    await tx.business.update({
      where: { id: businessId },
      data: {
        balance: { decrement: settlement.businessCredit },
        revenue: { decrement: settlement.customerTotal },
      },
    });
  }
  if (settlement.commissionAmount > 0) {
    await tx.systemConfig.upsert({
      where: { id: 1 },
      update: { platformBalance: { decrement: settlement.commissionAmount } },
      create: { id: 1, platformBalance: 0 },
    });
  }
}

async function reversePaidBookings(
  prisma: PrismaService,
  bookings: BookingWithBiz[],
): Promise<void> {
  const paid = bookings.filter((b) => b.transactionId);
  if (paid.length === 0) return;

  const commissionPercent = await loadDefaultCommissionPercent(prisma);
  const byTx = new Map<string, BookingWithBiz[]>();
  for (const b of paid) {
    const tid = b.transactionId!;
    const arr = byTx.get(tid) ?? [];
    arr.push(b);
    byTx.set(tid, arr);
  }

  for (const [transactionId, cancelling] of byTx.entries()) {
    const businessId = cancelling[0].businessId;
    const settlement = calculateBookingSettlement(cancelling, commissionPercent);

    await prisma.$transaction(async (tx) => {
      await reverseSettlement(tx, businessId, settlement);

      const allLinked = await tx.booking.findMany({
        where: { transactionId },
        select: { id: true, status: true },
      });
      const cancellingIds = new Set(cancelling.map((b) => b.id));
      const stillActive = allLinked.filter(
        (b) => !cancellingIds.has(b.id) && b.status !== 'Cancelled' && b.status !== 'Rejected',
      );

      await tx.booking.updateMany({
        where: { id: { in: cancelling.map((b) => b.id) } },
        data: { status: 'Cancelled' },
      });

      if (stillActive.length === 0) {
        await tx.transaction.update({
          where: { id: transactionId },
          data: { status: 'Refunded' },
        });
      } else {
        const txRow = await tx.transaction.findUnique({ where: { id: transactionId } });
        const nextAmount = Math.max(
          0,
          Number((txRow?.amount ?? 0) - settlement.customerTotal),
        );
        await tx.transaction.update({
          where: { id: transactionId },
          data: {
            status: 'Partially Refunded',
            amount: nextAmount,
            commissionAmount: Math.max(
              0,
              Number((txRow?.commissionAmount ?? 0) - settlement.commissionAmount),
            ),
            taxAmount: Math.max(0, Number((txRow?.taxAmount ?? 0) - settlement.totalTax)),
          },
        });
      }
    });
  }
}

export async function cancelBookingsForCustomer(
  prisma: PrismaService,
  userId: string,
  bookingIds: string[],
): Promise<{ cancelled: number }> {
  if (!bookingIds.length) {
    throw new BadRequestException('bookingIds must be a non-empty array');
  }

  const bookings = await prisma.booking.findMany({
    where: { id: { in: bookingIds }, userId },
    include: { business: true, transaction: true, user: true },
  });
  if (bookings.length === 0) {
    throw new BadRequestException('No valid bookings found');
  }

  for (const b of bookings) {
    assertCustomerCanCancelBooking(b, b.business);
  }

  const cancellable = bookings.filter(
    (b) =>
      b.status !== 'Completed' &&
      b.status !== 'Cancelled' &&
      b.status !== 'Rejected',
  );
  if (cancellable.length === 0) {
    throw new BadRequestException('No cancellable bookings in this group');
  }

  const unpaid = cancellable.filter((b) => !b.transactionId);
  const paid = cancellable.filter((b) => b.transactionId) as BookingWithBiz[];

  if (unpaid.length > 0) {
    await prisma.booking.updateMany({
      where: { id: { in: unpaid.map((b) => b.id) } },
      data: { status: 'Cancelled' },
    });
  }

  if (paid.length > 0) {
    await reversePaidBookings(prisma, paid);
  }

  const biz = cancellable[0].business;
  if (biz.notifyCancellationEmail && biz.email) {
    void sendPlatformEmail(prisma, {
      to: biz.email,
      template: 'booking-cancelled-business',
      model: {
        businessName: biz.name,
        count: String(cancellable.length),
      },
    });
  }

  const userEmail = cancellable[0].user?.email;
  if (userEmail) {
    void sendPlatformEmail(prisma, {
      to: userEmail,
      template: 'booking-cancelled-client',
      model: {
        businessName: biz.name,
        customerName: cancellable[0].customerName || cancellable[0].user?.name,
      },
    });
  }

  return { cancelled: cancellable.length };
}

export function enrichBookingCancellationFields<
  T extends Record<string, unknown> & {
    status?: string;
    date?: Date;
    transactionId?: string | null;
    business?: Business | null;
  },
>(row: T) {
  const business = row.business ?? null;
  const check = canCustomerCancelBooking(
    {
      status: String(row.status ?? ''),
      date: row.date as Date,
      transactionId: row.transactionId ?? null,
    },
    business,
  );
  const policy = {
    allowed: business?.cancellationAllowed !== false,
    hoursBefore:
      typeof business?.cancellationHoursBefore === 'number'
        ? business.cancellationHoursBefore
        : 24,
  };
  return {
    ...row,
    cancellationPolicy: policy,
    canCancel: check.allowed,
    cancelBlockReason: check.allowed ? null : check.message,
  };
}
