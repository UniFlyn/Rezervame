"use client";

import React, { useState } from "react";
import { 
  Bell,
  Send,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";

type NotificationStatus = "open" | "resolved" | "in_review";
type NotificationCategory = "security" | "finance" | "merchant" | "system";

const systemAlerts: Array<{
  id: number;
  category: NotificationCategory;
  status: NotificationStatus;
  title: string;
  description: string;
  time: string;
}> = [
  {
    id: 1,
    category: "security",
    status: "open",
    title: 'New Admin Login Attempt',
    description: 'Suspicious login attempt from IP 192.168.1.105 (London, UK).',
    time: '5 mins ago'
  },
  {
    id: 2,
    category: "finance",
    status: "in_review",
    title: 'High Value Withdrawal',
    description: 'Zen Spa & Wellness requested a withdrawal of $5,400.00.',
    time: '25 mins ago'
  },
  {
    id: 3,
    category: "merchant",
    status: "resolved",
    title: 'New Merchant Signup',
    description: '"Urban Kicks Store" has completed their business profile.',
    time: '1h ago'
  },
  {
    id: 4,
    category: "system",
    status: "open",
    title: 'Server Load Advisory',
    description: 'CPU usage exceeded 85% on Node EU-West-1 for 10 minutes.',
    time: '2h ago'
  }
];

const transmissionHistory = [
  {
    id: "BR-1101",
    audience: "All Businesses",
    status: "Sent",
    reach: 845,
    readRate: "92%",
    sentAt: "2h ago",
    summary: "New commission structure starting June 1st.",
  },
  {
    id: "BR-1102",
    audience: "All Users",
    status: "Sent",
    reach: 1450,
    readRate: "88%",
    sentAt: "5h ago",
    summary: "Maintenance window notice for this weekend.",
  },
];

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState("feed");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCompose, setShowCompose] = useState(false);
  const [target, setTarget] = useState("all_users");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      setMessage("");
      setShowCompose(false);
    }, 1500);
  };

  const filteredAlerts = systemAlerts.filter((alert) => {
    const normalized = searchTerm.toLowerCase();
    const matchesSearch =
      alert.title.toLowerCase().includes(normalized) ||
      alert.description.toLowerCase().includes(normalized);
    const matchesCategory = categoryFilter === "all" || alert.category === categoryFilter;
    const matchesStatus = statusFilter === "all" || alert.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

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
                  {filteredAlerts.map((alert) => (
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transmissionHistory.map((history) => (
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
                      <td className="px-6 py-4 text-sm text-slate-700">{history.sentAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
