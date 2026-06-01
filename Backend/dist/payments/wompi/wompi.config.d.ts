import type { PrismaService } from '../../prisma.service';
export type WompiEnv = 'sandbox' | 'production';
export type WompiConfig = {
    publicKey: string;
    privateKey: string;
    env: WompiEnv;
    webhookSecret: string | null;
};
export declare function readWompiConfigFromEnv(): WompiConfig | null;
export type WompiConfigRow = {
    wompiEnabled?: boolean | null;
    cardPayEnabled?: boolean | null;
    wompiPublicKey?: string | null;
    wompiPrivateKey?: string | null;
    wompiEnv?: string | null;
    wompiWebhookSecret?: string | null;
};
export declare function isWompiEnabledFlag(row: WompiConfigRow | null | undefined): boolean;
export declare function resolveWompiConfigFromRow(row: WompiConfigRow | null | undefined): WompiConfig | null;
export declare function resolveWompiConfig(prisma: PrismaService): Promise<WompiConfig | null>;
export declare function isWompiConfigured(row?: WompiConfigRow | null): boolean;
