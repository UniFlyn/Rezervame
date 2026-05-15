
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const counts = await prisma.business.groupBy({
    by: ['status'],
    _count: { _all: true }
  });
  console.log(JSON.stringify(counts, null, 2));
  
  const activeCount = await prisma.business.count({ where: { status: 'active' } });
  console.log('Active Businesses:', activeCount);
  
  const allBiz = await prisma.business.findMany({ 
    select: { id: true, name: true, status: true } 
  });
  console.log('All Businesses:', JSON.stringify(allBiz, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
