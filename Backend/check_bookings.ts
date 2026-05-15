import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { bookings: true }
      }
    }
  });
  console.log('Users and booking counts:');
  users.forEach(u => {
    console.log(`- ${u.name} (${u.email}): ${u._count.bookings} bookings`);
  });

  const bookings = await prisma.booking.findMany({
    take: 5,
    include: { business: true, service: true }
  });
  console.log('\nSample Bookings:');
  bookings.forEach(b => {
    console.log(`- ${b.id}: ${b.customerName} at ${b.business.name} for ${b.service?.name} on ${b.date}`);
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
