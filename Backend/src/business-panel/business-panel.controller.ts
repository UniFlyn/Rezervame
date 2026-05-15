import { Controller, Get, Headers, Param, Query } from '@nestjs/common';
import { requireBusinessOwner } from '../auth.helpers';
import { PrismaService } from '../prisma.service';
import { BusinessPanelService } from './business-panel.service';

@Controller('api/business/:businessId/panel')
export class BusinessPanelController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly panel: BusinessPanelService,
  ) {}

  @Get('dashboard')
  async dashboard(
    @Param('businessId') businessId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week',
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, businessId);
    const p = period === 'day' || period === 'week' || period === 'month' ? period : 'week';
    return this.panel.getDashboard(businessId, p);
  }

  @Get('menu')
  async menu(
    @Param('businessId') businessId: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, businessId);
    return this.panel.getPanelMenu(businessId);
  }

  @Get('customers')
  async customers(
    @Param('businessId') businessId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Headers('authorization') authorization?: string,
  ) {
    await requireBusinessOwner(this.prisma, authorization, businessId);
    return this.panel.getCustomers(businessId, page, limit, search);
  }
}
