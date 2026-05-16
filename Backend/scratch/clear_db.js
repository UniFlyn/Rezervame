const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Clearing bookings, reviews, and transactions...');
  
  const deletedReviews = await prisma.review.deleteMany({});
  console.log(`Deleted ${deletedReviews.count} reviews.`);
  
  const deletedBookings = await prisma.booking.deleteMany({});
  console.log(`Deleted ${deletedBookings.count} bookings.`);
  
  const deletedTransactions = await prisma.transaction.deleteMany({});
  console.log(`Deleted ${deletedTransactions.count} transactions.`);

  // Reset business revenue/balance if needed? User didn't ask but usually clearing bookings implies resetting financials.
  // I will only do what they asked: "clear booking and ratings and invoices DB"
  
  console.log('Database cleared successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
