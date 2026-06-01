import type { PrismaService } from '../prisma.service';
import {
  isWompiConfigured,
  isWompiEnabledFlag,
  resolveWompiConfigFromRow,
} from './wompi/wompi.config';
import { isYappyConfigured, resolveYappyConfigFromRow } from './yappy/yappy.config';

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

function buildPublicPaymentConfigFromRow(row: Awaited<
  ReturnType<PrismaService['systemConfig']['findUnique']>
>): PublicPaymentConfig {

  const wompiCfg = resolveWompiConfigFromRow(row);
  const wompiFlagOn = isWompiEnabledFlag(row);
  const wompiConfigured = isWompiConfigured(row);
  const wompiOn = wompiFlagOn && wompiConfigured;

  const yappyCfg = resolveYappyConfigFromRow(row);
  const yappyFlagOn = row?.yappyEnabled !== false;
  const yappyConfigured = isYappyConfigured(row);
  const yappyOn = yappyFlagOn && yappyConfigured;

  const payAtVenueOn = row?.cashPayEnabled !== false;
  const defaultCommission = row?.defaultCommission ?? 15;
  const platformBranding =
    typeof row?.platformBranding === 'string' && row.platformBranding.trim()
      ? row.platformBranding.trim()
      : 'Rezervame';
  const maintenanceMode = row?.maintenanceMode === true;

  const methods: PublicPaymentMethod[] = [
    {
      id: 'wompi',
      label: 'Card (Visa, Mastercard, Clave)',
      enabled: wompiFlagOn,
      configured: wompiConfigured,
    },
    {
      id: 'yappy',
      label: 'Yappy',
      enabled: yappyFlagOn,
      configured: yappyConfigured,
    },
    {
      id: 'pay_at_venue',
      label: 'Pay by visit',
      enabled: payAtVenueOn,
      configured: true,
    },
  ];

  return {
    maintenanceMode,
    platformBranding,
    wompiEnabled: wompiOn,
    wompiPublicKey: wompiOn && wompiCfg ? wompiCfg.publicKey : '',
    wompiEnv: wompiCfg?.env ?? 'sandbox',
    wompiConfigured,
    yappyEnabled: yappyOn,
    yappyConfigured,
    payAtVenueEnabled: payAtVenueOn,
    defaultCommission,
    methods,
  };
}

export async function buildPublicPaymentConfig(prisma: PrismaService): Promise<PublicPaymentConfig> {
  try {
    const cfg = await prisma.systemConfig.findUnique({ where: { id: 1 } });
    return buildPublicPaymentConfigFromRow(cfg);
  } catch {
    return buildPublicPaymentConfigFromRow(null);
  }
}
