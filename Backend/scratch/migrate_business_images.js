
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration of banner and logo to images array...');
  
  const businesses = await prisma.business.findMany({
    where: {
      OR: [
        { bannerUrl: { not: null } },
        { logoUrl: { not: null } }
      ]
    }
  });

  console.log(`Found ${businesses.length} businesses to migrate.`);

  for (const business of businesses) {
    const newImages = [...(business.images || [])];
    
    if (business.bannerUrl && !newImages.includes(business.bannerUrl)) {
      newImages.push(business.bannerUrl);
    }
    
    if (business.logoUrl && !newImages.includes(business.logoUrl)) {
      newImages.push(business.logoUrl);
    }

    if (newImages.length > (business.images || []).length) {
      await prisma.business.update({
        where: { id: business.id },
        data: { images: newImages }
      });
      console.log(`Updated business ${business.id} with ${newImages.length} images.`);
    }
  }

  console.log('Migration complete.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
