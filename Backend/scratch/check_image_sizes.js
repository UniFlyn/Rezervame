
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const b = await prisma.business.findUnique({
    where: { id: 'cmp6dhgwm0006gne0151t5tpv' },
    select: { logoUrl: true, bannerUrl: true, description: true }
  });
  if (!b) {
    console.log('Business not found');
    return;
  }
  console.log('Logo Length:', b.logoUrl?.length || 0);
  console.log('Banner Length:', b.bannerUrl?.length || 0);
  console.log('Description Length:', b.description?.length || 0);
  
  if (b.bannerUrl && b.bannerUrl.startsWith('data:')) {
    console.log('Banner is Data URI');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
