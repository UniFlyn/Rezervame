import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const b = await prisma.business.findFirst({
    select: {
      id: true,
      name: true,
      images: true,
      logoUrl: true,
      bannerUrl: true,
      status: true
    }
  });
  if (b) {
    console.log('ID:', b.id);
  } else {
    console.log('No business found');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
