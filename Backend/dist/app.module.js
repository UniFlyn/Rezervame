"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const health_controller_1 = require("./health.controller");
const business_panel_module_1 = require("./business-panel/business-panel.module");
const prisma_module_1 = require("./prisma.module");
const stripe_webhook_controller_1 = require("./payments/stripe-webhook.controller");
const wompi_webhook_controller_1 = require("./payments/wompi/wompi-webhook.controller");
const yappy_webhook_controller_1 = require("./payments/yappy/yappy-webhook.controller");
const email_module_1 = require("./email/email.module");
const storage_module_1 = require("./storage/storage.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, email_module_1.EmailModule, storage_module_1.StorageModule, business_panel_module_1.BusinessPanelModule],
        controllers: [
            health_controller_1.HealthController,
            app_controller_1.AppController,
            stripe_webhook_controller_1.StripeWebhookController,
            wompi_webhook_controller_1.WompiWebhookController,
            yappy_webhook_controller_1.YappyWebhookController,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map