import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const businessId = 'cmp6foznu0002ill8jtq4efg8';
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      status: true,
      email: true,
      images: true,
    }
  });

  if (!business) {
    console.log('Business not found in database');
  } else {
    console.log('Business found:', JSON.stringify(business, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
