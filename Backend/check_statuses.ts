import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.booking.groupBy({
    by: ['status'],
    _count: true
  });
  console.log('Booking statuses in DB:');
  console.log(JSON.stringify(statuses, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
