"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Users,
  Store,
  CalendarCheck,
  DollarSign,
  UserPlus,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { apiGet } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type DashboardRange = "day" | "week" | "month" | "ytd";

type DashboardPayload = {
  range: DashboardRange;
  stats: Record<string, number>;
  previous: Record<string, number>;
  changes: Record<string, number>;
  charts: {
    weeklyBookings: { day: string; bookings: number }[];
    revenue: { month: string; amount: number }[];
  };
  recentActivities: Array<{
    id: string;
    user?: string;
    title?: string;
    message: string;
    timestamp: string;
    type: string;
  }>;
};

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

function formatPctChange(pct: number | undefined): string {
  if (pct === undefined || Number.isNaN(pct)) return "—";
  if (Math.abs(pct) < 0.05) return "0%";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

const StatCard = ({ title, value, change, icon: Icon, color }: KpiCardProps) => {
  const isTrend = change.startsWith("+") || change.startsWith("-") || change === "0%";
  const isPositive = change.startsWith("+") || change === "0%";
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg bg-opacity-10", color)}>
          <Icon className={cn("w-6 h-6", color.replace("bg-", "text-"))} />
        </div>
        <div
          className={cn(
            "flex items-center space-x-1 text-xs font-medium",
            !isTrend ? "text-slate-400" : isPositive ? "text-green-600" : "text-red-600",
          )}
          title="vs previous period"
        >
          <span>{change}</span>
          {isTrend && change !== "0%" ? (
            isPositive ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : (
              <ArrowDownRight className="w-3 h-3" />
            )
          ) : null}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
};

const RANGE_OPTIONS: { id: DashboardRange; label: string }[] = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "ytd", label: "YTD" },
];

export default function Dashboard() {
  const [range, setRange] = useState<DashboardRange>("ytd");
  const [dashboardData, setDashboardData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async (r: DashboardRange) => {
    setLoading(true);
    try {
      const data = await apiGet<DashboardPayload>(`/admin/dashboard?range=${r}`);
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard load failed", err);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(range);
  }, [range, loadDashboard]);

  const stats = dashboardData?.stats ?? {};
  const changes = dashboardData?.changes ?? {};
  const charts = dashboardData?.charts ?? { weeklyBookings: [], revenue: [] };
  const recentActivities = dashboardData?.recentActivities ?? [];

  const businessKpis = useMemo(
    () => [
      {
        title: "Total Businesses",
        value: Number(stats.businesses ?? 0).toLocaleString(),
        change: formatPctChange(changes.businesses),
        icon: Store,
        color: "bg-purple-500",
      },
      {
        title: "Total Bookings",
        value: Number(stats.bookings ?? 0).toLocaleString(),
        change: formatPctChange(changes.bookings),
        icon: CalendarCheck,
        color: "bg-orange-500",
      },
      {
        title: "Platform Revenue",
        value: formatCurrency(Number(stats.revenue ?? 0)),
        change: formatPctChange(changes.revenue),
        icon: DollarSign,
        color: "bg-emerald-500",
      },
      {
        title: "Pending business approvals",
        value: Number(stats.pendingApprovals ?? 0).toLocaleString(),
        change: formatPctChange(changes.pendingApprovals),
        icon: TrendingUp,
        color: "bg-sky-500",
      },
      {
        title: "Avg. booking value",
        value: formatCurrency(Number(stats.avgBookingValue ?? 0)),
        change: formatPctChange(changes.avgBookingValue),
        icon: Repeat,
        color: "bg-indigo-500",
      },
    ],
    [stats, changes],
  );

  const customerKpis = useMemo(
    () => [
      {
        title: "Registered customers",
        value: Number(stats.users ?? 0).toLocaleString(),
        change: formatPctChange(changes.users),
        icon: Users,
        color: "bg-blue-500",
      },
      {
        title: "Bookings per customer (avg)",
        value: Number(stats.bookingsPerCustomer ?? 0).toFixed(2),
        change: formatPctChange(changes.bookingsPerCustomer),
        icon: UserPlus,
        color: "bg-cyan-500",
      },
      {
        title: "Bookings (platform)",
        value: Number(stats.bookings ?? 0).toLocaleString(),
        change: formatPctChange(changes.bookings),
        icon: CalendarCheck,
        color: "bg-violet-500",
      },
      {
        title: "Revenue per customer (avg)",
        value: formatCurrency(Number(stats.revenuePerCustomer ?? 0)),
        change: formatPctChange(changes.revenuePerCustomer),
        icon: DollarSign,
        color: "bg-teal-500",
      },
      {
        title: "Avg. booking value",
        value: formatCurrency(Number(stats.avgBookingValue ?? 0)),
        change: formatPctChange(changes.avgBookingValue),
        icon: Repeat,
        color: "bg-fuchsia-500",
      },
    ],
    [stats, changes],
  );

  const rangeLabel =
    RANGE_OPTIONS.find((o) => o.id === range)?.label ?? "YTD";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-slate-500 mt-1">
            Live metrics for <span className="font-semibold text-slate-700">{rangeLabel}</span> vs
            prior period
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRange(opt.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-bold transition",
                range === opt.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !dashboardData ? (
        <div className="text-sm text-slate-500">Loading dashboard…</div>
      ) : null}

      <div className={loading ? "opacity-60 pointer-events-none" : ""}>
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Business KPIs
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            {businessKpis.map((kpi) => (
              <StatCard key={kpi.title} {...kpi} />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Customer KPIs
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
            {customerKpis.map((kpi) => (
              <StatCard key={kpi.title} {...kpi} />
            ))}
          </div>
        </div>
      </div>

      <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-8", loading && "opacity-60")}>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Weekly Bookings
            </h3>
            <span className="text-xs font-medium text-slate-400">Last 7 days</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.weeklyBookings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Monthly Platform Revenue
            </h3>
            <span className="text-xs font-medium text-slate-400">Commission (6 mo)</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  dy={10}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorRev)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={cn("bg-white p-6 rounded-2xl border border-slate-200 shadow-sm", loading && "opacity-60")}>
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Recent Platform Activity
        </h3>
        <div className="space-y-4">
          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No recent activity.</p>
          ) : (
            recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-4 p-4 hover:bg-slate-50 transition-colors rounded-xl border border-transparent hover:border-slate-100"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-slate-500">
                    {(activity.title || activity.user || "?").toString().charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {activity.title || activity.user}
                  </p>
                  <p className="text-sm text-slate-500 mt-0.5">{activity.message}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-slate-400">
                    {new Date(activity.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded-full text-[10px] mt-1 font-bold",
                      activity.type.includes("CONFIRMED")
                        ? "text-green-600 bg-green-100"
                        : "text-blue-600 bg-blue-100",
                    )}
                  >
                    {activity.type.replace("_", " ")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
