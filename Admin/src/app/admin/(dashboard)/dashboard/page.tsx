"use client";

import React, { useMemo, useState } from "react";
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
import dashboardData from "@/mock-data/admin-dashboard.json";
import { formatCurrency } from "@/lib/utils";

type TimeRange = "day" | "week" | "month";

type KpiCardProps = {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

const StatCard = ({ title, value, change, icon: Icon, color }: KpiCardProps) => {
  const isPositive = change.startsWith("+");
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg bg-opacity-10", color)}>
          <Icon className={cn("w-6 h-6", color.replace('bg-', 'text-'))} />
        </div>
        <div className={cn("flex items-center space-x-1 text-xs font-medium", isPositive ? "text-green-600" : "text-red-600")}>
          <span>{change}</span>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
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
  const { stats, charts, recentActivities } = dashboardData;
  const [timeRange, setTimeRange] = useState<TimeRange>("week");
  const scale = timeRange === "day" ? 0.2 : timeRange === "week" ? 1 : 4;

  const businessKpis = useMemo(
    () => [
      {
        title: "Total Businesses",
        value: Math.round(stats.businesses * scale).toLocaleString(),
        change: "+5.2%",
        icon: Store,
        color: "bg-purple-500",
      },
      {
        title: "Business Bookings",
        value: Math.round(stats.bookings * scale).toLocaleString(),
        change: "+10.9%",
        icon: CalendarCheck,
        color: "bg-orange-500",
      },
      {
        title: "Business Revenue",
        value: formatCurrency(stats.revenue * scale),
        change: "+8.7%",
        icon: DollarSign,
        color: "bg-emerald-500",
      },
      {
        title: "YTD Revenue",
        value: formatCurrency(stats.revenue * 1.32),
        change: "+19.1%",
        icon: TrendingUp,
        color: "bg-sky-500",
      },
      {
        title: "YTD vs Last YTD",
        value: "+14.8%",
        change: "+2.4%",
        icon: Repeat,
        color: "bg-indigo-500",
      },
    ],
    [scale, stats.bookings, stats.businesses, stats.revenue],
  );

  const customerKpis = useMemo(
    () => [
      {
        title: "Total Customers",
        value: Math.round(stats.users * scale).toLocaleString(),
        change: "+12.5%",
        icon: Users,
        color: "bg-blue-500",
      },
      {
        title: "New Signups",
        value: Math.round(stats.users * 0.07 * scale).toLocaleString(),
        change: "+6.0%",
        icon: UserPlus,
        color: "bg-cyan-500",
      },
      {
        title: "Customer Bookings",
        value: Math.round(stats.bookings * 0.78 * scale).toLocaleString(),
        change: "+11.2%",
        icon: CalendarCheck,
        color: "bg-violet-500",
      },
      {
        title: "YTD Customer Spend",
        value: formatCurrency(stats.revenue * 0.78 * 1.24),
        change: "+16.0%",
        icon: DollarSign,
        color: "bg-teal-500",
      },
      {
        title: "YTD vs Last YTD",
        value: "+12.3%",
        change: "+1.8%",
        icon: Repeat,
        color: "bg-fuchsia-500",
      },
    ],
    [scale, stats.bookings, stats.revenue, stats.users],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <div className="inline-flex items-center rounded-xl border border-slate-200 bg-white p-1">
          {(["day", "week", "month"] as TimeRange[]).map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                timeRange === range
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100",
              )}
            >
              {range}
            </button>
          ))}
        </div>
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
          {recentActivities.map((activity, idx) => (
            <div key={activity.id} className="flex items-start space-x-4 p-4 hover:bg-slate-50 transition-colors rounded-xl border border-transparent hover:border-slate-100">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-slate-500">{activity.user[0]}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">{activity.user}</p>
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
