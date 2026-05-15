"use client";

import React, { useEffect, useState } from "react";
import { Store, Users, CalendarCheck, DollarSign, TrendingUp } from "lucide-react";
import { apiGet } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { formatCurrency } from "@/lib/utils";

type DashboardPayload = {
  stats?: {
    businesses?: number;
    users?: number;
    bookings?: number;
    revenue?: number;
    pendingApprovals?: number;
    avgBookingValue?: number;
  };
};

export default function SubscriptionsPage() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    void apiGet<DashboardPayload>("/admin/dashboard")
      .then(setData)
      .catch((e) => {
        const msg = e instanceof Error ? e.message : "Failed to load";
        setError(msg);
        toastError("Dashboard load failed", msg);
      });
  }, []);

  const stats = data?.stats ?? {};
  const cards = [
    { label: "Active businesses", value: Number(stats.businesses ?? 0).toLocaleString(), icon: Store },
    { label: "End customers", value: Number(stats.users ?? 0).toLocaleString(), icon: Users },
    { label: "Bookings (all time)", value: Number(stats.bookings ?? 0).toLocaleString(), icon: CalendarCheck },
    { label: "Gross transaction volume", value: formatCurrency(Number(stats.revenue ?? 0)), icon: DollarSign },
    { label: "Pending merchant approvals", value: Number(stats.pendingApprovals ?? 0).toLocaleString(), icon: TrendingUp },
    { label: "Avg. booking value", value: formatCurrency(Number(stats.avgBookingValue ?? 0)), icon: DollarSign },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-700">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & subscriptions</h1>
        <p className="mt-1 text-sm text-slate-500">
          There is no separate subscription-plan table in this deployment yet. The metrics below are live aggregates
          from the same source as the admin dashboard—no mock tier counts or fabricated growth.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="rounded-xl bg-slate-900 p-3 text-white">
              <c.icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
              <p className="text-xl font-bold text-slate-900">{data ? c.value : "—"}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
        To sell named plans (Basic / Pro / Enterprise) from the database, add a Prisma model and admin CRUD routes,
        then replace this page with editors backed by those endpoints.
      </div>
    </div>
  );
}
