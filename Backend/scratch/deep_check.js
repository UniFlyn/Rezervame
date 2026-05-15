
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const b = await prisma.business.findUnique({
    where: { id: 'cmp6dhgwm0006gne0151t5tpv' }
  });
  console.log(JSON.stringify(b, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
