import type { PrismaService } from '../prisma.service';
export type PublicPaymentMethod = {
    id: 'wompi' | 'yappy' | 'pay_at_venue';
    label: string;
    enabled: boolean;
    configured: boolean;
};
export type PublicPaymentConfig = {
    maintenanceMode: boolean;
    platformBranding: string;
    wompiEnabled: boolean;
    wompiPublicKey: string;
    wompiEnv: 'sandbox' | 'production';
    wompiConfigured: boolean;
    yappyEnabled: boolean;
    yappyConfigured: boolean;
    payAtVenueEnabled: boolean;
    defaultCommission: number;
    methods: PublicPaymentMethod[];
};
export declare function buildPublicPaymentConfig(prisma: PrismaService): Promise<PublicPaymentConfig>;
