import { PrismaService } from '../prisma.service';
import { BusinessPanelService } from './business-panel.service';
export declare class BusinessPanelController {
    private readonly prisma;
    private readonly panel;
    constructor(prisma: PrismaService, panel: BusinessPanelService);
    dashboard(businessId: string, period?: 'day' | 'week' | 'month', authorization?: string): Promise<{
        businessName: string;
        period: "week" | "day" | "month";
        periodLabel: string;
        kpis: {
            revenue: number;
            revenueDeltaPct: number;
            revenueMonthCurrent: number;
            revenueMonthPrevious: number;
            bookings: number;
            bookingsDeltaPct: number;
            bookingsThisMonth: number;
            bookingsLastMonth: number;
            pending: number;
            pendingDeltaPct: number;
            pendingThisMonth: number;
            pendingLastMonth: number;
            uniqueClients: number;
            clientsDeltaPct: number;
            clientsThisMonth: number;
            clientsLastMonth: number;
        };
        chart: {
            name: string;
            bookings: number;
            revenue: number;
        }[];
        topServices: {
            name: string;
            count: number;
        }[];
        recentBookings: {
            id: string;
            customerName: string;
            date: string;
            status: string;
        }[];
    }>;
    menu(businessId: string, authorization?: string): Promise<import("./business-panel.service").PanelMenuPayload>;
    customers(businessId: string, page?: string, limit?: string, search?: string, authorization?: string): Promise<{
        userId: string;
        name: string;
        email: string;
        phone: string | null;
        totalSpent: number;
        bookingsCount: number;
        lastVisit: string;
        memberSince: string;
    }[] | {
        data: {
            userId: string;
            name: string;
            email: string;
            phone: string | null;
            totalSpent: number;
            bookingsCount: number;
            lastVisit: string;
            memberSince: string;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    bulkCompleteBookings(id: string, body: {
        bookingIds: string[];
    }, authorization?: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    bulkUpdateBookingStatus(id: string, body: {
        bookingIds: string[];
        status: string;
    }, authorization?: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
}
