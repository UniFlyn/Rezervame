import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany({
    take: 10,
    orderBy: { joinedDate: 'desc' },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      bannerUrl: true,
      status: true,
    }
  });
  console.log(JSON.stringify(businesses, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
