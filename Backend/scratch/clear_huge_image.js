
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.service.updateMany({
    where: { 
      businessId: 'cmp6dhgwm0006gne0151t5tpv',
      name: 'Beard Trim'
    },
    data: { imageUrl: null }
  });
  console.log('Updated services:', updated.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
