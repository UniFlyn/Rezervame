import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const kumar = await prisma.user.findFirst({ where: { email: 'kumar@gmail.com' } });
  if (!kumar) {
    console.log('Kumar not found');
    return;
  }
  const bookings = await prisma.booking.findMany({
    where: { userId: kumar.id },
    select: { id: true, status: true, date: true }
  });
  console.log(`Bookings for Kumar (${kumar.id}):`);
  console.log(JSON.stringify(bookings, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
