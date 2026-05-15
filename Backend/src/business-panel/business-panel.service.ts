import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/** Merchant sidebar: labels are English defaults; Web can localize later. Icons match `lucide-react` export names. */
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

function sod(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function eod(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeekMonday(d: Date) {
  const x = sod(new Date(d));
  const dow = x.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  x.setDate(x.getDate() + offset);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

type PanelPeriod = 'day' | 'week' | 'month';

function getPeriodWindow(period: PanelPeriod, anchor: Date) {
  const now = new Date(anchor);
  let curStart: Date;
  let curEnd: Date;

  if (period === 'day') {
    curStart = sod(now);
    curEnd = eod(now);
  } else if (period === 'week') {
    curStart = startOfWeekMonday(now);
    curEnd = eod(addDays(curStart, 6));
  } else {
    curStart = sod(new Date(now.getFullYear(), now.getMonth(), 1));
    curEnd = eod(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }

  return { curStart, curEnd };
}

function getThisMonthVsLastMonth(anchor: Date) {
  const now = new Date(anchor);
  const thisMonthStart = sod(new Date(now.getFullYear(), now.getMonth(), 1));
  const thisMonthEnd = eod(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthStart = sod(new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1));
  const lastMonthEnd = eod(prevMonthEnd);
  return { thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd };
}

function inWindow(t: Date, a: Date, b: Date) {
  const ms = t.getTime();
  return ms >= a.getTime() && ms <= b.getTime();
}

function pctDelta(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

/** Full merchant sidebar — keep in sync with `Web/src/components/business/layout/Sidebar.tsx` FALLBACK_MENU. */
const MERCHANT_NAV_ITEMS: PanelNavItem[] = [
  { id: 'dashboard', href: '/business/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'appointments', href: '/business/appointments', label: 'Appointments', icon: 'Calendar' },
  { id: 'services', href: '/business/services', label: 'Services', icon: 'Layers' },
  { id: 'staff', href: '/business/staff', label: 'Staff', icon: 'UserSquare' },
  { id: 'users', href: '/business/users', label: 'Customers', icon: 'Users' },
  { id: 'reviews', href: '/business/reviews', label: 'Ratings & Reviews', icon: 'Star' },
  { id: 'transactions', href: '/business/transactions', label: 'Transactions', icon: 'CreditCard' },
  { id: 'withdrawals', href: '/business/withdrawals', label: 'Withdrawals', icon: 'ArrowDownToLine' },
  { id: 'profile', href: '/business/profile', label: 'Business Profile', icon: 'Building' },
  { id: 'settings', href: '/business/settings', label: 'Settings', icon: 'Settings' },
  { id: 'support', href: '/business/support', label: 'Support', icon: 'Headphones' },
];

@Injectable()
export class BusinessPanelService {
  constructor(private readonly prisma: PrismaService) {}

  async getPanelMenu(businessId: string): Promise<PanelMenuPayload> {
    const b = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { categoryKeys: true },
    });
    if (!b) throw new NotFoundException('Business not found');
    return {
      items: MERCHANT_NAV_ITEMS,
      categoryKeys: b.categoryKeys ?? [],
    };
  }

  async getCustomers(businessId: string, page?: string, limit?: string, search?: string) {
    const where: any = { businessId };
    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const rows = await this.prisma.booking.findMany({
      where,
      include: { user: true },
      orderBy: { date: 'desc' },
    });

    const agg = new Map<
      string,
      {
        userId: string;
        name: string;
        email: string;
        totalSpent: number;
        bookingsCount: number;
        lastVisit: Date;
        firstSeen: Date;
        phone: string | null;
      }
    >();

    for (const b of rows) {
      const key = b.userId;
      const existing = agg.get(key);
      const visit = new Date(b.date);
      const spent = typeof b.price === 'number' ? b.price : 0;

      if (!existing) {
        agg.set(key, {
          userId: key,
          name: b.user.name ?? b.customerName,
          email: b.user.email,
          totalSpent: spent,
          bookingsCount: 1,
          lastVisit: visit,
          firstSeen: visit,
          phone: b.user.phone || null,
        });
      } else {
        existing.totalSpent += spent;
        existing.bookingsCount += 1;
        if (visit > existing.lastVisit) existing.lastVisit = visit;
        if (visit < existing.firstSeen) existing.firstSeen = visit;
        if (!existing.phone && b.user.phone) existing.phone = b.user.phone;
      }
    }

    const allResults = Array.from(agg.values())
      .map((row) => ({
        userId: row.userId,
        name: row.name,
        email: row.email,
        phone: row.phone,
        totalSpent: row.totalSpent,
        bookingsCount: row.bookingsCount,
        lastVisit: row.lastVisit.toISOString(),
        memberSince: row.firstSeen.toISOString(),
      }))
      .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

    if (page) {
      const p = Math.max(1, parseInt(page));
      const l = Math.max(1, parseInt(limit || '10'));
      const start = (p - 1) * l;
      const data = allResults.slice(start, start + l);
      return {
        data,
        total: allResults.length,
        page: p,
        limit: l,
        totalPages: Math.ceil(allResults.length / l),
      };
    }

    return allResults;
  }

  async getDashboard(businessId: string, period: PanelPeriod) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      select: { name: true },
    });

    const [bookingsRaw, transactions, servicesList] = await Promise.all([
      this.prisma.booking.findMany({
        where: { businessId },
        include: { service: { select: { id: true, name: true } } },
      }),
      this.prisma.transaction.findMany({
        where: { businessId },
      }),
      this.prisma.service.findMany({
        where: { businessId },
        select: { id: true, name: true },
      }),
    ]);

    const serviceNameById = new Map(servicesList.map((s) => [s.id, s.name]));

    const bookings = bookingsRaw.map((b) => ({
      ...b,
      date: new Date(b.date),
    }));

    const anchor = new Date();
    const { curStart, curEnd } = getPeriodWindow(period, anchor);
    const { thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd } = getThisMonthVsLastMonth(anchor);

    const curBookings = bookings.filter((b) => inWindow(b.date, curStart, curEnd));
    const bookingsThisMonth = bookings.filter((b) => inWindow(b.date, thisMonthStart, thisMonthEnd));
    const bookingsLastMonth = bookings.filter((b) => inWindow(b.date, lastMonthStart, lastMonthEnd));

    const earnings = (list: typeof bookings) =>
      list.reduce((s, b) => s + (typeof b.price === 'number' ? b.price : 0), 0);

    const txEarnings = (start: Date, end: Date) =>
      transactions
        .filter((t) => t.type === 'Earning' && inWindow(new Date(t.date), start, end))
        .reduce((a, t) => a + t.amount, 0);

    const revCur = txEarnings(curStart, curEnd) || earnings(curBookings);
    const revMonthCur = txEarnings(thisMonthStart, thisMonthEnd) || earnings(bookingsThisMonth);
    const revMonthPrev = txEarnings(lastMonthStart, lastMonthEnd) || earnings(bookingsLastMonth);

    const pendingCur = curBookings.filter((b) => b.status === 'Pending').length;
    const pendingThisMonth = bookingsThisMonth.filter((b) => b.status === 'Pending').length;
    const pendingLastMonth = bookingsLastMonth.filter((b) => b.status === 'Pending').length;

    const clientsCur = new Set(curBookings.map((b) => b.userId)).size;
    const clientsThisMonth = new Set(bookingsThisMonth.map((b) => b.userId)).size;
    const clientsLastMonth = new Set(bookingsLastMonth.map((b) => b.userId)).size;

    const serviceCounts = new Map<string, number>();
    for (const b of curBookings) {
      const sid = b.serviceId;
      if (!sid) continue;
      serviceCounts.set(sid, (serviceCounts.get(sid) || 0) + 1);
    }
    const topServices = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([serviceId, count]) => ({
        name: serviceNameById.get(serviceId) || serviceId,
        count,
      }));

    const chartData: { name: string; bookings: number; revenue: number }[] = [];
    for (let i = 0; i < 7; i++) {
      let bucketStart: Date;
      let bucketEnd: Date;
      let label: string;

      if (period === 'day') {
        const base = sod(new Date());
        bucketStart = new Date(base);
        bucketStart.setHours(8 + i * 2, 0, 0, 0);
        bucketEnd = new Date(bucketStart);
        bucketEnd.setHours(bucketStart.getHours() + 2, 0, 0, -1);
        label = bucketStart.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      } else if (period === 'week') {
        const ws = startOfWeekMonday(new Date());
        bucketStart = sod(addDays(ws, i));
        bucketEnd = eod(bucketStart);
        label = bucketStart.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        const today = sod(new Date());
        bucketStart = sod(addDays(today, -6 + i));
        bucketEnd = eod(bucketStart);
        label = bucketStart.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      }

      const dayBookings = bookings.filter((b) => inWindow(b.date, bucketStart, bucketEnd));
      const rev = dayBookings.reduce((s, b) => s + (typeof b.price === 'number' ? b.price : 0), 0);
      chartData.push({
        name: label,
        bookings: dayBookings.length,
        revenue: rev,
      });
    }

    const recentBookings = bookings
      .slice()
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5)
      .map((b) => ({
        id: b.id,
        customerName: b.customerName,
        date: b.date.toISOString(),
        status: b.status,
      }));

    const periodLabel = period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month';

    return {
      businessName: business?.name ?? '',
      period,
      periodLabel,
      kpis: {
        revenue: revCur,
        revenueDeltaPct: pctDelta(revMonthCur, revMonthPrev),
        revenueMonthCurrent: revMonthCur,
        revenueMonthPrevious: revMonthPrev,
        bookings: curBookings.length,
        bookingsDeltaPct: pctDelta(bookingsThisMonth.length, bookingsLastMonth.length),
        bookingsThisMonth: bookingsThisMonth.length,
        bookingsLastMonth: bookingsLastMonth.length,
        pending: pendingCur,
        pendingDeltaPct: pctDelta(pendingThisMonth, pendingLastMonth),
        pendingThisMonth,
        pendingLastMonth,
        uniqueClients: clientsCur,
        clientsDeltaPct: pctDelta(clientsThisMonth, clientsLastMonth),
        clientsThisMonth,
        clientsLastMonth,
      },
      chart: chartData,
      topServices,
      recentBookings,
    };
  }
}
