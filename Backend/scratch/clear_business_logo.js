
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.business.update({
    where: { id: 'cmp6dhgwm0006gne0151t5tpv' },
    data: { logoUrl: null }
  });
  console.log('Updated business logo:', updated.id);
}

main().catch(console.error).finally(() => prisma.$disconnect());
