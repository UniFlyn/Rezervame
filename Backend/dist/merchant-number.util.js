"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allocateMerchantNumber = allocateMerchantNumber;
exports.backfillMerchantNumbers = backfillMerchantNumbers;
async function allocateMerchantNumber(prisma) {
    for (let attempt = 0; attempt < 120; attempt++) {
        const merchantNumber = 100000 + Math.floor(Math.random() * 900000);
        const clash = await prisma.business.findFirst({ where: { merchantNumber } });
        if (!clash)
            return merchantNumber;
    }
    throw new Error('Could not allocate a unique merchant number');
}
async function backfillMerchantNumbers(prisma) {
    const missing = await prisma.business.findMany({ where: { merchantNumber: null } });
    for (const b of missing) {
        const merchantNumber = await allocateMerchantNumber(prisma);
        await prisma.business.update({ where: { id: b.id }, data: { merchantNumber } });
    }
}
//# sourceMappingURL=merchant-number.util.js.map