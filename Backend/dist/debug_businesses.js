"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const businesses = await prisma.business.findMany({
        take: 10,
        orderBy: { joinedDate: 'desc' },
        select: {
            id: true,
            name: true,
            logoUrl: true,
            bannerUrl: true,
            status: true,
        }
    });
    console.log(JSON.stringify(businesses, null, 2));
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=debug_businesses.js.map