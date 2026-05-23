/**
 * Removes all bookings, transactions (invoice history), and Stripe checkout rows.
 * Resets business revenue/balance totals derived from bookings.
 *
 * Usage: cd Backend && node scripts/clear-bookings-invoices.mjs
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing bookings and invoice (transaction) data…');

  const unlinked = await prisma.booking.updateMany({
    data: { transactionId: null },
  });
  console.log(`Unlinked ${unlinked.count} bookings from transactions.`);

  try {
    const checkouts = await prisma.paymentCheckout.deleteMany({});
    console.log(`Deleted ${checkouts.count} payment checkouts.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes('PaymentCheckout')) throw e;
    console.log('Skipped payment checkouts (table not present).');
  }

  const transactions = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${transactions.count} transactions (invoices).`);

  const bookings = await prisma.booking.deleteMany({});
  console.log(`Deleted ${bookings.count} bookings.`);

  const businesses = await prisma.business.updateMany({
    data: { revenue: 0, balance: 0 },
  });
  console.log(`Reset revenue/balance on ${businesses.count} businesses.`);

  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
