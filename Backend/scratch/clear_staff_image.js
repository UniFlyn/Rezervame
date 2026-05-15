
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.staff.updateMany({
    where: { 
      businessId: 'cmp6dhgwm0006gne0151t5tpv',
      name: 'Barbie'
    },
    data: { image: null }
  });
  console.log('Updated staff:', updated.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
