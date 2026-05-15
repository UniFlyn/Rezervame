
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({
    where: { businessId: 'cmp6dhgwm0006gne0151t5tpv' },
    select: { id: true, name: true, imageUrl: true }
  });
  services.forEach(s => {
    console.log(`Service: ${s.name}, Image Length: ${s.imageUrl?.length || 0}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
