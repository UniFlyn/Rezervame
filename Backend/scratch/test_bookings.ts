import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const bizEmail = 'owner@rezervame.com';
  const biz = await prisma.business.findUnique({ where: { email: bizEmail } });
  if (!biz) {
    console.error('Business not found');
    return;
  }

  console.log(`Testing bookings for business: ${biz.id}`);

  try {
    const where: any = { businessId: biz.id };
    const [total, bookings] = await Promise.all([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
        where,
        include: { service: true, staff: true, user: true, transaction: true },
        orderBy: { date: 'desc' },
        take: 20,
      }),
    ]);
    console.log(`Total bookings: ${total}`);
    console.log(`Fetched ${bookings.length} bookings`);
  } catch (err) {
    console.error('FAILED to fetch bookings:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
