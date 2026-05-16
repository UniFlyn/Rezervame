
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const reviews = await prisma.review.findMany({
    include: { business: true }
  });
  console.log('Total Reviews:', reviews.length);
  reviews.forEach(r => {
    console.log(`Review ID: ${r.id}, Biz: ${r.businessId}, Staff: ${r.staffId}, StaffName: ${r.staffName}, Rating: ${r.rating}, StaffRating: ${r.staffRating}, BizRating: ${r.businessRating}`);
  });
  
  const staff = await prisma.staff.findMany();
  console.log('\nTotal Staff:', staff.length);
  staff.forEach(s => {
    console.log(`Staff ID: ${s.id}, Name: ${s.name}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
