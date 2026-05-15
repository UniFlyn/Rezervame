"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  Bell,
  Send,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import TablePagination from "@/components/admin/TablePagination";

type NotificationStatus = "open" | "resolved" | "in_review";
type NotificationCategory = "security" | "finance" | "merchant" | "system";

type AlertItem = {
  id: string;
  category: NotificationCategory;
  status: NotificationStatus;
  title: string;
  description: string;
  time: string;
};

type BroadcastRow = {
  id: string;
  audience: string;
  status: string;
  reach: number;
  readRate: string;
  sentAt: string;
  summary: string;
};

export default function NotificationsPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastRow[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<AlertItem[]>([]);
  const [activeTab, setActiveTab] = useState("feed");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCompose, setShowCompose] = useState(false);
  const [target, setTarget] = useState("all_users");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const [broadcastPage, setBroadcastPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    void apiGet<AlertItem[]>("/admin/notifications").then((rows) => {
      setSystemAlerts(
        rows.map((r, idx) => ({
          ...r,
          id: String(r.id || `alert-${idx + 1}`),
          category: (r.category as NotificationCategory) || "system",
          status: (r.status as NotificationStatus) || "open",
        })),
      );
    });
    void apiGet<BroadcastRow[]>("/admin/broadcasts").then(setBroadcasts);
  }, []);

  const handleSend = async () => {
    setIsSending(true);
    await apiPost("/admin/broadcast", { target, message });
    const history = await apiGet<BroadcastRow[]>("/admin/broadcasts");
    setBroadcasts(history);
    const rows = await apiGet<AlertItem[]>("/admin/notifications");
    setSystemAlerts(
      rows.map((r, idx) => ({
        ...r,
        id: String(r.id || `alert-${idx + 1}`),
        category: (r.category as NotificationCategory) || "system",
        status: (r.status as NotificationStatus) || "open",
      })),
    );
    setIsSending(false);
    setMessage("");
    setShowCompose(false);
  };

  const filteredAlerts = useMemo(() => systemAlerts.filter((alert) => {
    const normalized = searchTerm.toLowerCase();
    const matchesSearch =
      alert.title.toLowerCase().includes(normalized) ||
      alert.description.toLowerCase().includes(normalized);
    const matchesCategory = categoryFilter === "all" || alert.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  }), [systemAlerts, searchTerm, categoryFilter, statusFilter]);
  const totalFeedPages = Math.max(1, Math.ceil(filteredAlerts.length / pageSize));
  const pagedAlerts = filteredAlerts.slice((feedPage - 1) * pageSize, feedPage * pageSize);
  const totalBroadcastPages = Math.max(1, Math.ceil(broadcasts.length / pageSize));
  const pagedBroadcasts = broadcasts.slice((broadcastPage - 1) * pageSize, broadcastPage * pageSize);
  useEffect(() => {
    setFeedPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  async function deleteNotification(id: string | number) {
    if (!window.confirm("Delete this notification permanently?")) return;
    await apiDelete(`/admin/notifications/${String(id)}`);
    setSystemAlerts((prev) => prev.filter((n) => String(n.id) !== String(id)));
    setBroadcasts((prev) => prev.filter((n) => String(n.id) !== String(id)));
  }

  const headerKpis = [
    { label: "Total Alerts", value: systemAlerts.length.toString(), icon: Bell },
    { label: "Open", value: systemAlerts.filter((item) => item.status === "open").length.toString(), icon: AlertTriangle },
    { label: "Resolved", value: systemAlerts.filter((item) => item.status === "resolved").length.toString(), icon: CheckCircle2 },
    { label: "Avg. Response", value: "14m", icon: Clock },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h1>
          <p className="text-slate-500 text-sm mt-1">Manage system-wide alerts and outgoing broadcast communications.</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab("feed")}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all flex items-center gap-2",
              activeTab === "feed" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Bell className="w-3 h-3" /> System Feed
          </button>
          <button 
            onClick={() => setActiveTab("broadcast")}
            className={cn(
              "px-6 py-2 rounded-xl text-xs font-semibold uppercase tracking-wide transition-all flex items-center gap-2",
              activeTab === "broadcast" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            <Send className="w-3 h-3" /> Broadcast Tool
          </button>
        </div>
      </div>

      {activeTab === "feed" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {headerKpis.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <item.icon className="h-4 w-4 text-slate-500" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <FilterToolbar
            searchPlaceholder="Search alerts by title or description..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filterGroups={[
              {
                key: "notification-category",
                label: "Category",
                value: categoryFilter,
                onChange: setCategoryFilter,
                options: [
                  { label: "All", value: "all" },
                  { label: "Security", value: "security" },
                  { label: "Finance", value: "finance" },
                  { label: "Merchant", value: "merchant" },
                  { label: "System", value: "system" },
                ],
              },
              {
                key: "notification-status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "All", value: "all" },
                  { label: "Open", value: "open" },
                  { label: "In Review", value: "in_review" },
                  { label: "Resolved", value: "resolved" },
                ],
              },
            ]}
          />

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Title</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Time</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm capitalize text-slate-700">{alert.category}</td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-semibold text-slate-900">{alert.title}</p>
                        <p className="text-xs text-slate-500">{alert.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "rounded-full px-2.5 py-1 text-xs font-semibold capitalize",
                          alert.status === "resolved"
                            ? "bg-emerald-100 text-emerald-700"
                            : alert.status === "open"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700",
                        )}>
                          {alert.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{alert.time}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                          View
                        </button>
                        <button className="ml-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100">
                          Resolve
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteNotification(alert.id)}
                          className="ml-2 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-500">
                        No notifications found for current filters.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={feedPage}
              totalPages={totalFeedPages}
              totalItems={filteredAlerts.length}
              pageSize={pageSize}
              onPageChange={setFeedPage}
            />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Broadcast Transmission History</h3>
            <button
              type="button"
              onClick={() => setShowCompose(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              Compose Broadcast
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Broadcast ID</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Audience</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Summary</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Reach</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Read Rate</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Sent</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {broadcasts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                        No broadcasts yet. Compose one to reach users or businesses.
                      </td>
                    </tr>
                  ) : (
                    pagedBroadcasts.map((history) => (
                      <tr key={history.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-sm font-mono text-slate-700">{history.id}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{history.audience}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{history.summary}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{history.reach}</td>
                        <td className="px-6 py-4 text-sm text-slate-700">{history.readRate}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                            {history.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-700">
                          {new Date(history.sentAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => void deleteNotification(history.id)}
                            className="rounded-lg border border-rose-200 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <TablePagination
              page={broadcastPage}
              totalPages={totalBroadcastPages}
              totalItems={broadcasts.length}
              pageSize={pageSize}
              onPageChange={setBroadcastPage}
            />
          </div>
        </div>
      )}

      {showCompose ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">Compose Broadcast</h2>
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Audience
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "all_users", label: "All Users" },
                    { id: "all_businesses", label: "All Businesses" },
                    { id: "pro_users", label: "Pro Subscribers" },
                    { id: "new_merchants", label: "New Merchants" },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTarget(option.id)}
                      className={cn(
                        "rounded-lg border px-3 py-2 text-sm font-medium transition",
                        target === option.id
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-2 px-6 pb-6">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Message
              </label>
              <textarea
                className="h-40 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                placeholder="Type your message..."
                value={message}
                onChange={(event) => setMessage(event.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSend}
                disabled={!message || isSending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSending ? "Sending..." : "Send Broadcast"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
