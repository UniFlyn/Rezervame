'use client';

import { useState, useEffect, type ElementType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBusinessStore } from '../../../store/businessStore';
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
import { apiGet } from '@/lib/api';
import type { PanelDashboard } from '@/lib/business-panel-types';

type Period = 'day' | 'week' | 'month';

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
            <span className="font-bold text-slate-700">This month {monthCompare.current}</span>
            <span className="mx-1 text-slate-300">·</span>
            <span>Prior month {monthCompare.previous}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const business = useBusinessStore((state) => state.business);
  const [period, setPeriod] = useState<Period>('week');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    setSessionReady(Boolean(business?.id));
  }, [business?.id]);

  const { data, isLoading, error, refetch, isFetching, isPending } = useQuery({
    queryKey: ['panel-dashboard', business?.id, period],
    enabled: Boolean(business?.id && sessionReady),
    queryFn: () =>
      apiGet<PanelDashboard>(
        `/business/${business!.id}/panel/dashboard?period=${period}`,
        'BUSINESS',
      ),
  });

  const periodLabel = data?.periodLabel ?? (period === 'day' ? 'Today' : period === 'week' ? 'This week' : 'This month');

  if (!business?.id) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-sm font-bold text-slate-500">
        Preparing your workspace…
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">Business overview</h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">{business?.name}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Period</span>
          <div className="flex rounded-2xl bg-slate-100 p-1.5" role="tablist" aria-label="Period">
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
                {p === 'day' ? 'Day' : p === 'week' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>
          {isFetching ? (
            <span className="text-[10px] font-bold uppercase text-slate-400">Updating…</span>
          ) : null}
        </div>
      </div>

      {error instanceof Error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <p className="font-bold">Could not load dashboard</p>
          <p className="mt-1">{error.message}</p>
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-3 rounded-xl bg-rose-900 px-4 py-2 text-xs font-black uppercase tracking-widest text-white"
          >
            Retry
          </button>
        </div>
      ) : null}

      {!(error instanceof Error) &&
        ((isLoading || isPending) && !data ? (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-sm font-bold text-slate-500">
          Loading metrics…
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <KPI
              title="Revenue"
              value={`$${data.kpis.revenue.toFixed(0)}`}
              icon={TrendingUp}
              desc={periodLabel}
              deltaPct={data.kpis.revenueDeltaPct}
              monthCompare={{
                current: `$${data.kpis.revenueMonthCurrent.toFixed(0)}`,
                previous: `$${data.kpis.revenueMonthPrevious.toFixed(0)}`,
              }}
            />
            <KPI
              title="Bookings"
              value={data.kpis.bookings}
              icon={CalendarCheck}
              desc={periodLabel}
              deltaPct={data.kpis.bookingsDeltaPct}
              monthCompare={{
                current: String(data.kpis.bookingsThisMonth),
                previous: String(data.kpis.bookingsLastMonth),
              }}
            />
            <KPI
              title="Pending"
              value={data.kpis.pending}
              icon={Clock}
              desc="Needs review"
              deltaPct={data.kpis.pendingDeltaPct}
              monthCompare={{
                current: String(data.kpis.pendingThisMonth),
                previous: String(data.kpis.pendingLastMonth),
              }}
            />
            <KPI
              title="Unique clients"
              value={data.kpis.uniqueClients}
              icon={Users}
              desc={periodLabel}
              deltaPct={data.kpis.clientsDeltaPct}
              monthCompare={{
                current: String(data.kpis.clientsThisMonth),
                previous: String(data.kpis.clientsLastMonth),
              }}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50 lg:col-span-2">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-800">Activity</h3>
                <span className="rounded-full bg-primary/5 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary">
                  {periodLabel}
                </span>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.chart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                    />
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
                <h3 className="mb-4 text-lg font-black uppercase tracking-tight text-slate-800">Top services</h3>
                <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{periodLabel}</p>
                <ul className="space-y-3">
                  {data.topServices.length === 0 ? (
                    <li className="text-sm font-bold text-slate-400">No data for this period</li>
                  ) : (
                    data.topServices.map((row, i) => (
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
                <h3 className="mb-6 text-lg font-black uppercase tracking-tight text-slate-800">Recent bookings</h3>
                <ul className="space-y-4">
                  {data.recentBookings.map((b) => (
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
        </>
      ) : (
        <div className="rounded-2xl border border-slate-100 bg-white p-12 text-center text-sm font-bold text-slate-500">
          No metrics available yet.
        </div>
      ))}
    </div>
  );
}
