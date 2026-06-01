"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPublicPaymentConfig = buildPublicPaymentConfig;
const wompi_config_1 = require("./wompi/wompi.config");
const yappy_config_1 = require("./yappy/yappy.config");
function buildPublicPaymentConfigFromRow(row) {
    const wompiCfg = (0, wompi_config_1.resolveWompiConfigFromRow)(row);
    const wompiFlagOn = (0, wompi_config_1.isWompiEnabledFlag)(row);
    const wompiConfigured = (0, wompi_config_1.isWompiConfigured)(row);
    const wompiOn = wompiFlagOn && wompiConfigured;
    const yappyCfg = (0, yappy_config_1.resolveYappyConfigFromRow)(row);
    const yappyFlagOn = row?.yappyEnabled !== false;
    const yappyConfigured = (0, yappy_config_1.isYappyConfigured)(row);
    const yappyOn = yappyFlagOn && yappyConfigured;
    const payAtVenueOn = row?.cashPayEnabled !== false;
    const defaultCommission = row?.defaultCommission ?? 15;
    const platformBranding = typeof row?.platformBranding === 'string' && row.platformBranding.trim()
        ? row.platformBranding.trim()
        : 'Rezervame';
    const maintenanceMode = row?.maintenanceMode === true;
    const methods = [
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
async function buildPublicPaymentConfig(prisma) {
    try {
        const cfg = await prisma.systemConfig.findUnique({ where: { id: 1 } });
        return buildPublicPaymentConfigFromRow(cfg);
    }
    catch {
        return buildPublicPaymentConfigFromRow(null);
    }
}
//# sourceMappingURL=payment-config.util.js.map