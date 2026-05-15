
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const id = 'cmp6foznu0002ill8jtq4efg8';
  const b = await prisma.business.findUnique({
    where: { id }
  });
  console.log('Result:', b ? b.name : 'NULL');
}

main().catch(console.error).finally(() => prisma.$disconnect());
