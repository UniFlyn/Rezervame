"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  Users, 
  Store, 
  CalendarCheck, 
  DollarSign, 
  UserPlus,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp
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
  Area
} from "recharts";
import { apiGet } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const StatCard = ({ title, value, change, icon: Icon, color }: KpiCardProps) => {
  const isTrend = change.startsWith("+") || change.startsWith("-");
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg bg-opacity-10", color)}>
          <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
        </div>
        <div
          className={cn(
            "flex items-center space-x-1 text-xs font-medium",
            !isTrend ? "text-slate-400" : isPositive ? "text-green-600" : "text-red-600",
          )}
        >
          <span>{change}</span>
          {isTrend ? isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" /> : null}
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-slate-500 text-sm font-medium">{title}</h3>
        <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
      </div>
    </div>
  );
};

// Simple CN helper since I might not have it yet
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<any | null>(null);
  useEffect(() => {
    void apiGet<any>("/admin/dashboard").then(setDashboardData);
  }, []);
  const stats = dashboardData?.stats ?? {};
  const charts = dashboardData?.charts ?? { weeklyBookings: [], revenue: [] };
  const recentActivities = dashboardData?.recentActivities ?? [];

  const dash = "—";

  const businessKpis = useMemo(
    () => [
      {
        title: "Total Businesses",
        value: Number(stats.businesses ?? 0).toLocaleString(),
        change: dash,
        icon: Store,
        color: "bg-purple-500",
      },
      {
        title: "Total Bookings",
        value: Number(stats.bookings ?? 0).toLocaleString(),
        change: dash,
        icon: CalendarCheck,
        color: "bg-orange-500",
      },
      {
        title: "Platform Revenue",
        value: formatCurrency(Number(stats.revenue ?? 0)),
        change: dash,
        icon: DollarSign,
        color: "bg-emerald-500",
      },
      {
        title: "Pending business approvals",
        value: Number(stats.pendingApprovals ?? 0).toLocaleString(),
        change: dash,
        icon: TrendingUp,
        color: "bg-sky-500",
      },
      {
        title: "Avg. booking value",
        value: formatCurrency(Number(stats.avgBookingValue ?? 0)),
        change: dash,
        icon: Repeat,
        color: "bg-indigo-500",
      },
    ],
    [stats.avgBookingValue, stats.bookings, stats.businesses, stats.pendingApprovals, stats.revenue],
  );

  const customerKpis = useMemo(
    () => [
      {
        title: "Registered customers",
        value: Number(stats.users ?? 0).toLocaleString(),
        change: dash,
        icon: Users,
        color: "bg-blue-500",
      },
      {
        title: "Customers per booking (avg)",
        value:
          stats.users > 0 && stats.bookings > 0
            ? (stats.bookings / stats.users).toFixed(2)
            : "0",
        change: dash,
        icon: UserPlus,
        color: "bg-cyan-500",
      },
      {
        title: "Bookings (platform)",
        value: Number(stats.bookings ?? 0).toLocaleString(),
        change: dash,
        icon: CalendarCheck,
        color: "bg-violet-500",
      },
      {
        title: "Revenue per customer (avg)",
        value:
          stats.users > 0 ? formatCurrency(Number(stats.revenue ?? 0) / stats.users) : formatCurrency(0),
        change: dash,
        icon: DollarSign,
        color: "bg-teal-500",
      },
      {
        title: "Avg. booking value",
        value: formatCurrency(Number(stats.avgBookingValue ?? 0)),
        change: dash,
        icon: Repeat,
        color: "bg-fuchsia-500",
      },
    ],
    [stats.avgBookingValue, stats.bookings, stats.revenue, stats.users],
  );

  if (!dashboardData) return <div className="text-sm text-slate-500">Loading dashboard...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-xs text-slate-500">Live data from API</p>
      </div>

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

      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Customer KPIs
        </p>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-5">
          {customerKpis.map((kpi) => (
            <StatCard key={kpi.title} {...kpi} />
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Weekly Bookings
            </h3>
            <select className="text-xs font-medium border-none bg-slate-50 rounded-md px-2 py-1 outline-none">
              <option>Last 7 Days</option>
              <option>Previous Week</option>
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.weeklyBookings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
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
              Monthly Revenue
            </h3>
            <button className="text-xs font-medium text-blue-600 hover:underline">View Report</button>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.revenue}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fillOpacity={1} fill="url(#colorRev)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Recent Platform Activity
        </h3>
        <div className="space-y-4">
          {recentActivities.map((activity: any) => (
            <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-slate-50 transition-colors rounded-xl border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-slate-500">
                  {(activity.title || activity.user || "?").toString().charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{activity.title || activity.user}</p>
                <p className="text-sm text-slate-500 mt-0.5">{activity.message}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium text-slate-400">
                  {new Date(activity.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
                <span className={cn(
                  "inline-block px-2 py-0.5 rounded-full text-[10px] mt-1 font-bold",
                  activity.type.includes('CONFIRMED') ? "text-green-600 bg-green-100" : "text-blue-600 bg-blue-100"
                )}>
                  {activity.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
