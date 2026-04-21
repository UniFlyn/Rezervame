'use client';

import { useMemo, useState, type ElementType } from 'react';
import { useBusinessStore } from '../../../store/businessStore';
import { useBookingsStore, Booking } from '../../../store/bookingsStore';
import { useTransactionsStore, Transaction } from '../../../store/transactionsStore';
import { useServicesStore, Service } from '../../../store/servicesStore';
import { Users, CalendarCheck, TrendingUp, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import clsx from 'clsx';

type Period = 'day' | 'week' | 'month';

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

/** Monday-based week start */
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

function getPeriodWindow(period: Period, anchor: Date) {
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

/** Calendar current month vs previous month — used only for KPI % deltas (client spec). */
function getThisMonthVsLastMonth(anchor: Date) {
  const now = new Date(anchor);
  const thisMonthStart = sod(new Date(now.getFullYear(), now.getMonth(), 1));
  const thisMonthEnd = eod(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const lastMonthStart = sod(new Date(prevMonthEnd.getFullYear(), prevMonthEnd.getMonth(), 1));
  const lastMonthEnd = eod(prevMonthEnd);
  return { thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd };
}

function inWindow(iso: string, a: Date, b: Date) {
  const t = new Date(iso).getTime();
  return t >= a.getTime() && t <= b.getTime();
}

function KPI({
  title,
  value,
  icon: Icon,
  desc,
  deltaPct,
  monthCompare,
}: {
  title: string;
  value: string | number;
  icon: ElementType;
  desc: string;
  deltaPct?: number | null;
  /** Mes en curso vs mes anterior (base del %). */
  monthCompare?: { current: string; previous: string };
}) {
  const up = deltaPct != null && deltaPct > 0;
  const down = deltaPct != null && deltaPct < 0;
  return (
    <div className="flex items-center space-x-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="rounded-lg bg-primary/10 p-3 text-primary">
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold tracking-tight text-gray-900">{value}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-xs text-gray-400">{desc}</p>
          {deltaPct != null && !Number.isNaN(deltaPct) && (
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider',
                up && 'bg-emerald-50 text-emerald-700',
                down && 'bg-rose-50 text-rose-700',
                !up && !down && 'bg-slate-100 text-slate-500',
              )}
            >
              {up ? <ArrowUpRight className="h-3 w-3" /> : down ? <ArrowDownRight className="h-3 w-3" /> : null}
              {deltaPct > 0 ? '+' : ''}
              {deltaPct.toFixed(0)}%
            </span>
          )}
        </div>
        {monthCompare && (
          <p className="mt-2 text-[10px] leading-snug text-slate-500">
            <span className="font-bold text-slate-700">Este mes {monthCompare.current}</span>
            <span className="mx-1 text-slate-300">·</span>
            <span>Mes ant. {monthCompare.previous}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const business = useBusinessStore((state) => state.business);
  const bookings = useBookingsStore((state) => state.bookings);
  const transactions = useTransactionsStore((state) => state.transactions);
  const services = useServicesStore((state) => state.services);

  const [period, setPeriod] = useState<Period>('week');

  const { curStart, curEnd } = useMemo(() => getPeriodWindow(period, new Date()), [period]);

  const stats = useMemo(() => {
    const anchor = new Date();
    const { thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd } = getThisMonthVsLastMonth(anchor);

    const curBookings = bookings.filter((b: Booking) => inWindow(b.date, curStart, curEnd));
    const bookingsThisMonth = bookings.filter((b: Booking) => inWindow(b.date, thisMonthStart, thisMonthEnd));
    const bookingsLastMonth = bookings.filter((b: Booking) => inWindow(b.date, lastMonthStart, lastMonthEnd));

    const earnings = (list: Booking[]) => list.reduce((s, b) => s + (b.price || 0), 0);

    const txEarnings = (start: Date, end: Date) =>
      transactions
        .filter(
          (t: Transaction) =>
            t.type === 'Earning' && inWindow(t.date, start, end),
        )
        .reduce((a, t) => a + t.amount, 0);

    const revCur = txEarnings(curStart, curEnd) || earnings(curBookings);
    const revMonthCur = txEarnings(thisMonthStart, thisMonthEnd) || earnings(bookingsThisMonth);
    const revMonthPrev = txEarnings(lastMonthStart, lastMonthEnd) || earnings(bookingsLastMonth);

    const delta = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : ((cur - prev) / prev) * 100;

    const pendingCur = curBookings.filter((b) => b.status === 'Pending').length;
    const pendingThisMonth = bookingsThisMonth.filter((b) => b.status === 'Pending').length;
    const pendingLastMonth = bookingsLastMonth.filter((b) => b.status === 'Pending').length;

    const clientsCur = new Set(curBookings.map((b) => b.customerName)).size;
    const clientsThisMonth = new Set(bookingsThisMonth.map((b) => b.customerName)).size;
    const clientsLastMonth = new Set(bookingsLastMonth.map((b) => b.customerName)).size;

    const serviceCounts = new Map<string, number>();
    curBookings.forEach((b) => {
      serviceCounts.set(b.serviceId, (serviceCounts.get(b.serviceId) || 0) + 1);
    });
    const topServices = Array.from(serviceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([serviceId, count]) => {
        const name = services.find((s: Service) => s.id === serviceId)?.name || serviceId;
        return { name, count };
      });

    const chartData = Array.from({ length: 7 }).map((_, i) => {
      let bucketStart: Date;
      let bucketEnd: Date;
      let label: string;

      if (period === 'day') {
        const base = sod(new Date());
        bucketStart = new Date(base);
        bucketStart.setHours(8 + i * 2, 0, 0, 0);
        bucketEnd = new Date(bucketStart);
        bucketEnd.setHours(bucketStart.getHours() + 2, 0, 0, -1);
        label = bucketStart.toLocaleTimeString('es-ES', { hour: 'numeric', hour12: true });
      } else if (period === 'week') {
        const ws = startOfWeekMonday(new Date());
        bucketStart = sod(addDays(ws, i));
        bucketEnd = eod(bucketStart);
        label = bucketStart.toLocaleDateString('es-ES', { weekday: 'short' });
      } else {
        const today = sod(new Date());
        bucketStart = sod(addDays(today, -6 + i));
        bucketEnd = eod(bucketStart);
        label = bucketStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      }

      const dayBookings = bookings.filter((b) => inWindow(b.date, bucketStart, bucketEnd));
      const rev = dayBookings.reduce((s, b) => s + (b.price || 0), 0);
      return {
        name: label,
        bookings: dayBookings.length,
        revenue: rev,
      };
    });

    return {
      revCur,
      revDelta: delta(revMonthCur, revMonthPrev),
      revMonthCur,
      revMonthPrev,
      bookingsCur: curBookings.length,
      bookingsDelta: delta(bookingsThisMonth.length, bookingsLastMonth.length),
      bookingsThisMonthCount: bookingsThisMonth.length,
      bookingsLastMonthCount: bookingsLastMonth.length,
      pendingCur,
      pendingDelta: delta(pendingThisMonth, pendingLastMonth),
      pendingThisMonth,
      pendingLastMonth,
      clientsCur,
      clientsDelta: delta(clientsThisMonth, clientsLastMonth),
      clientsThisMonth,
      clientsLastMonth,
      topServices,
      chartData,
    };
  }, [bookings, transactions, services, curStart, curEnd, period]);

  const periodLabel =
    period === 'day' ? 'Hoy' : period === 'week' ? 'Esta semana' : 'Este mes';

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">Resumen del negocio</h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{business?.name}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Período</span>
          <div className="flex rounded-2xl bg-slate-100 p-1.5" role="tablist" aria-label="Período">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={clsx(
                  'rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all',
                  period === p ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-800',
                )}
              >
                {p === 'day' ? 'Día' : p === 'week' ? 'Semana' : 'Mes'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KPI
          title="Ingresos"
          value={`$${stats.revCur.toFixed(0)}`}
          icon={TrendingUp}
          desc={periodLabel}
          deltaPct={stats.revDelta}
          monthCompare={{
            current: `$${stats.revMonthCur.toFixed(0)}`,
            previous: `$${stats.revMonthPrev.toFixed(0)}`,
          }}
        />
        <KPI
          title="Citas"
          value={stats.bookingsCur}
          icon={CalendarCheck}
          desc={periodLabel}
          deltaPct={stats.bookingsDelta}
          monthCompare={{
            current: String(stats.bookingsThisMonthCount),
            previous: String(stats.bookingsLastMonthCount),
          }}
        />
        <KPI
          title="Pendientes"
          value={stats.pendingCur}
          icon={Clock}
          desc="Por revisar"
          deltaPct={stats.pendingDelta}
          monthCompare={{
            current: String(stats.pendingThisMonth),
            previous: String(stats.pendingLastMonth),
          }}
        />
        <KPI
          title="Clientes únicos"
          value={stats.clientsCur}
          icon={Users}
          desc={periodLabel}
          deltaPct={stats.clientsDelta}
          monthCompare={{
            current: String(stats.clientsThisMonth),
            previous: String(stats.clientsLastMonth),
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Actividad</h3>
            <span className="rounded-full bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
              {periodLabel}
            </span>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff5a5f" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#ff5a5f" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontWeight: 'bold',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#ff5a5f"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevDash)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
            <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-slate-800">Top 5 servicios</h3>
            <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{periodLabel}</p>
            <ul className="space-y-3">
              {stats.topServices.length === 0 ? (
                <li className="text-sm font-bold text-slate-400">Sin datos en este período</li>
              ) : (
                stats.topServices.map((row, i) => (
                  <li key={row.name} className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-700">
                      <span className="mr-2 text-slate-300">{i + 1}.</span>
                      {row.name}
                    </span>
                    <span className="font-black text-primary">{row.count}</span>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
            <h3 className="mb-6 text-lg font-black uppercase tracking-tight text-slate-800">Citas recientes</h3>
            <ul className="space-y-4">
              {bookings.slice(0, 5).map((b) => (
                <li key={b.id} className="group flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 font-black uppercase text-slate-400 transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      {b.customerName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800">{b.customerName}</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {new Date(b.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={clsx(
                      'rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest',
                      b.status === 'Approved' && 'bg-emerald-50 text-emerald-600',
                      b.status === 'Pending' && 'bg-amber-50 text-amber-600',
                      b.status !== 'Approved' && b.status !== 'Pending' && 'bg-slate-50 text-slate-500',
                    )}
                  >
                    {b.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
