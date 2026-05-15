
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const staff = await prisma.staff.findMany({
    where: { businessId: 'cmp6dhgwm0006gne0151t5tpv' },
    select: { id: true, name: true, image: true }
  });
  staff.forEach(s => {
    console.log(`Staff: ${s.name}, Image Length: ${s.image?.length || 0}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
