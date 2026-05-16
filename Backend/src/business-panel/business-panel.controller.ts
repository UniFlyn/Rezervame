import { Body, Controller, Get, Headers, Param, Patch, Query } from '@nestjs/common';
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

  @Patch('bookings/bulk-complete')
  async bulkCompleteBookings(
    @Param('businessId') id: string,
    @Body() body: { bookingIds: string[] },
    @Headers('authorization') authorization?: string,
  ) {
    console.log(`[bulkComplete] businessId=${id}, bookings=${body.bookingIds}`);
    await requireBusinessOwner(this.prisma, authorization, id);
    return await this.prisma.booking.updateMany({
      where: { 
        id: { in: body.bookingIds }, 
        businessId: id,
        OR: [
          { status: 'Paid' },
          { transactionId: { not: null } }
        ]
      },
      data: { status: 'Completed' },
    });
  }

  @Patch('bookings/bulk-status')
  async bulkUpdateBookingStatus(
    @Param('businessId') id: string,
    @Body() body: { bookingIds: string[]; status: string },
    @Headers('authorization') authorization?: string,
  ) {
    console.log(`[bulkStatus] businessId=${id}, bookings=${body.bookingIds}, status=${body.status}`);
    await requireBusinessOwner(this.prisma, authorization, id);
    return await this.prisma.booking.updateMany({
      where: { id: { in: body.bookingIds }, businessId: id },
      data: { status: body.status },
    });
  }
}
