"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStripeClient = getStripeClient;
exports.resolveStripeSecretKey = resolveStripeSecretKey;
const stripe_1 = __importDefault(require("stripe"));
function getStripeClient(secretKey) {
    return new stripe_1.default(secretKey);
}
async function resolveStripeSecretKey(prisma) {
    const fromEnv = process.env.STRIPE_SECRET_KEY?.trim();
    if (fromEnv)
        return fromEnv;
    try {
        const config = await prisma.systemConfig.findUnique({ where: { id: 1 } });
        return config?.stripeApiKey?.trim() || null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=stripe.util.js.map