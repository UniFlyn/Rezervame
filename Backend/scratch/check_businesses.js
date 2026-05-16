
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBusinesses() {
  console.log('--- Checking Business Statuses ---');
  const businesses = await prisma.business.findMany({
    select: { id: true, name: true, status: true, email: true }
  });
  console.log(`Found ${businesses.length} businesses.`);
  businesses.forEach(b => {
    console.log(`ID: ${b.id}, Name: ${b.name}, Status: ${JSON.stringify(b.status)}, Email: ${b.email}`);
  });
  console.log('--- End ---');
}

checkBusinesses().catch(e => console.error(e)).finally(() => prisma.$disconnect());
