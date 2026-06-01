import { PrismaService } from '../prisma.service';
export type PanelNavItem = {
    id: string;
    href: string;
    label: string;
    icon: string;
};
export type PanelMenuPayload = {
    items: PanelNavItem[];
    categoryKeys: string[];
};
type PanelPeriod = 'day' | 'week' | 'month';
export declare class BusinessPanelService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPanelMenu(businessId: string): Promise<PanelMenuPayload>;
    getCustomers(businessId: string, page?: string, limit?: string, search?: string): Promise<{
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
    getDashboard(businessId: string, period: PanelPeriod): Promise<{
        businessName: string;
        period: PanelPeriod;
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
}
export {};
