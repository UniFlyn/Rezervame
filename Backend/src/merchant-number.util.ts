import { PrismaClient } from '@prisma/client';

/** Random 6-digit numeric id in [100000, 999999], unique among businesses. */
export async function allocateMerchantNumber(prisma: PrismaClient): Promise<number> {
  for (let attempt = 0; attempt < 120; attempt++) {
    const merchantNumber = 100000 + Math.floor(Math.random() * 900000);
    const clash = await prisma.business.findFirst({ where: { merchantNumber } });
    if (!clash) return merchantNumber;
  }
  throw new Error('Could not allocate a unique merchant number');
}

export async function backfillMerchantNumbers(prisma: PrismaClient): Promise<void> {
  const missing = await prisma.business.findMany({ where: { merchantNumber: null } });
  for (const b of missing) {
    const merchantNumber = await allocateMerchantNumber(prisma);
    await prisma.business.update({ where: { id: b.id }, data: { merchantNumber } });
  }
}
