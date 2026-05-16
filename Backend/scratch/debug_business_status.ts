
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const b = await prisma.business.findUnique({
    where: { id: 'cmp6foznu0002ill8jtq4efg8' }
  });
  if (b) {
    console.log('Business Name:', b.name);
    console.log('Business Status:', b.status);
  } else {
    console.log('Business not found');
  }
  await prisma.$disconnect();
}

check();
