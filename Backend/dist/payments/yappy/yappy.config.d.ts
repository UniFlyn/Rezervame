import type { PrismaService } from '../../prisma.service';
export type YappyEnv = 'sandbox' | 'production';
export type YappyConfig = {
    merchantId: string;
    secretToken: string;
    env: YappyEnv;
};
export declare function readYappyConfigFromEnv(): YappyConfig | null;
export type YappyConfigRow = {
    yappyEnabled?: boolean | null;
    yappyMerchantId?: string | null;
    yappySecretToken?: string | null;
};
export declare function resolveYappyConfigFromRow(row: YappyConfigRow | null | undefined): YappyConfig | null;
export declare function resolveYappyConfig(prisma: PrismaService): Promise<YappyConfig | null>;
export declare function isYappyConfigured(row?: YappyConfigRow | null): boolean;
