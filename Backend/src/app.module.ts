import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { HealthController } from './health.controller';
import { BusinessPanelModule } from './business-panel/business-panel.module';
import { PrismaModule } from './prisma.module';
import { StripeWebhookController } from './payments/stripe-webhook.controller';
import { EmailModule } from './email/email.module';

import { StorageModule } from './storage/storage.module';

@Module({
  imports: [PrismaModule, EmailModule, StorageModule, BusinessPanelModule],
  controllers: [HealthController, AppController, StripeWebhookController],
})
export class AppModule {}
