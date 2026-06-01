import { PrismaClient } from '@prisma/client';
export declare function allocateMerchantNumber(prisma: PrismaClient): Promise<number>;
export declare function backfillMerchantNumbers(prisma: PrismaClient): Promise<void>;
