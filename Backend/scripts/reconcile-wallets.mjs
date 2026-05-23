/**
 * Recomputes business balance/revenue and platform commission wallet from Paid/Completed bookings.
 * Run after fixing payment settlement so existing data matches the new rules.
 *
 * Usage: cd Backend && node scripts/reconcile-wallets.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function settlement(bookings, commissionPercent) {
  const grossSubtotal = bookings.reduce((s, b) => s + Number(b.price || 0), 0);
  const totalTax = bookings.reduce((s, b) => s + Number(b.taxAmount || 0), 0);
  const pct = Number.isFinite(commissionPercent) && commissionPercent >= 0 ? commissionPercent : 15;
  const commissionAmount = Number((grossSubtotal * (pct / 100)).toFixed(2));
  const businessCredit = Number((grossSubtotal - commissionAmount).toFixed(2));
  const customerTotal = Number((grossSubtotal + totalTax + commissionAmount).toFixed(2));
  return { commissionAmount, businessCredit, customerTotal };
}

async function main() {
  const cfg = await prisma.systemConfig.findFirst({ select: { defaultCommission: true } });
  const commissionPct = cfg?.defaultCommission ?? 15;

  const businesses = await prisma.business.findMany({ select: { id: true, name: true } });
  let totalPlatform = 0;

  for (const biz of businesses) {
    const earned = await prisma.booking.findMany({
      where: { businessId: biz.id, status: { in: ['Paid', 'Completed'] } },
      select: { price: true, taxAmount: true },
    });
    const { businessCredit, customerTotal, commissionAmount } = settlement(earned, commissionPct);
    totalPlatform += commissionAmount;

    const withdrawals = await prisma.withdrawal.findMany({
      where: {
        businessId: biz.id,
        status: { notIn: ['Rejected', 'rejected'] },
      },
      select: { amount: true },
    });
    const withdrawn = withdrawals.reduce((s, w) => s + Number(w.amount || 0), 0);
    const balance = Number(Math.max(0, businessCredit - withdrawn).toFixed(2));

    await prisma.business.update({
      where: { id: biz.id },
      data: {
        balance,
        revenue: customerTotal,
      },
    });
    console.log(
      `${biz.name}: earned credit $${businessCredit.toFixed(2)}, withdrawn $${withdrawn.toFixed(2)} → balance $${balance.toFixed(2)}`,
    );
  }

  await prisma.systemConfig.upsert({
    where: { id: 1 },
    update: { platformBalance: Number(totalPlatform.toFixed(2)) },
    create: { id: 1, platformBalance: Number(totalPlatform.toFixed(2)) },
  });
  console.log(`Platform wallet (commission): $${totalPlatform.toFixed(2)}`);
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
