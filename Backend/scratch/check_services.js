
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({
    include: { business: true }
  });
  console.log('Total Services:', services.length);
  services.forEach(s => {
    console.log(`- Service: ${s.name} (Business: ${s.business.name})`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
