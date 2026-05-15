import { Module } from '@nestjs/common';
import { BusinessPanelController } from './business-panel.controller';
import { BusinessPanelService } from './business-panel.service';

@Module({
  controllers: [BusinessPanelController],
  providers: [BusinessPanelService],
})
export class BusinessPanelModule {}
