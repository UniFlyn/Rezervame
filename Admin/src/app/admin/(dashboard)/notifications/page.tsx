"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Send,
  CheckCircle2,
  Clock,
  MessageSquare,
  X,
  Loader2,
  Eye,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import TablePagination from "@/components/admin/TablePagination";
import { OverlayLoader } from "@/components/admin/OverlayLoader";
import { BrowserPushSettings } from "@/components/admin/BrowserPushSettings";

type SupportTicket = {
  id: string;
  ticketRef: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  businessName: string | null;
  requesterName: string;
  requesterEmail: string | null;
  screenshotUrl: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessage: string | null;
  messages?: Array<{
    id: string;
    body: string;
    senderRole: string;
    senderName: string | null;
    attachmentUrl: string | null;
    createdAt: string;
  }>;
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

type PlatformAlert = {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
};

const statusStyles: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

export default function NotificationsPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [broadcasts, setBroadcasts] = useState<BroadcastRow[]>([]);
  const [activeTab, setActiveTab] = useState<"alerts" | "support" | "broadcast">("alerts");
  const [alerts, setAlerts] = useState<PlatformAlert[]>([]);
  const [alertUnread, setAlertUnread] = useState(0);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [detail, setDetail] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [target, setTarget] = useState("all_users");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const pageSize = 10;

  const loadTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        status: statusFilter,
        search: searchTerm,
      });
      const res = await apiGet<{
        data: SupportTicket[];
        total: number;
        totalPages: number;
        openCount: number;
      }>(`/admin/support-tickets?${query.toString()}`);
      setTickets(res.data);
      setTotalItems(res.total);
      setTotalPages(res.totalPages);
      setOpenCount(res.openCount ?? 0);
    } catch (err) {
      toastError("Failed to load tickets", String(err));
    } finally {
      setIsLoading(false);
    }
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => void loadTickets(), 300);
    return () => clearTimeout(t);
  }, [loadTickets]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const loadAlerts = useCallback(async () => {
    setAlertsLoading(true);
    try {
      const res = await apiGet<{
        data: PlatformAlert[];
        unread: number;
      }>("/admin/alert-feed?limit=50");
      setAlerts(res.data);
      setAlertUnread(res.unread ?? 0);
    } catch (err) {
      toastError("Failed to load alerts", String(err));
    } finally {
      setAlertsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAlerts();
    void apiGet<BroadcastRow[]>("/admin/broadcasts").then(setBroadcasts).catch(() => setBroadcasts([]));
  }, [loadAlerts]);

  useEffect(() => {
    if (activeTab === "alerts") void loadAlerts();
  }, [activeTab, loadAlerts]);

  async function markAlertRead(id: string) {
    try {
      await apiPatch(`/admin/alert-feed/${id}/read`, {});
      await loadAlerts();
    } catch {
      toastError("Could not mark alert as read");
    }
  }

  async function markAllAlertsRead() {
    try {
      await apiPatch("/admin/alert-feed/read-all", {});
      await loadAlerts();
      toastSuccess("All alerts marked read");
    } catch {
      toastError("Could not mark alerts read");
    }
  }

  async function openTicket(id: string) {
    try {
      const row = await apiGet<SupportTicket>(`/admin/support-tickets/${id}`);
      setDetail(row);
      setReply("");
    } catch (err) {
      toastError("Could not load ticket", String(err));
    }
  }

  async function updateStatus(id: string, status: string) {
    try {
      await apiPatch(`/admin/support-tickets/${id}/status`, { status });
      toastSuccess("Status updated");
      await loadTickets();
      if (detail?.id === id) void openTicket(id);
    } catch (err) {
      toastError("Update failed", String(err));
    }
  }

  async function sendReply() {
    if (!detail || !reply.trim()) return;
    setReplying(true);
    try {
      await apiPost(`/admin/support-tickets/${detail.id}/reply`, { message: reply.trim() });
      toastSuccess("Reply sent", "Merchant will be notified by email/SMS when configured.");
      setReply("");
      try {
        await openTicket(detail.id);
        await loadTickets();
      } catch {
        toastSuccess("Reply saved", "Refresh the ticket list if it does not update.");
      }
    } catch (err) {
      toastError("Reply failed", String(err));
    } finally {
      setReplying(false);
    }
  }

  async function batchResolve() {
    if (!window.confirm(`Mark all ${openCount} open tickets as resolved?`)) return;
    try {
      const res = await apiPost<{ resolved: number }>("/admin/support-tickets/batch-resolve", {});
      toastSuccess("Batch complete", `${res.resolved} ticket(s) resolved.`);
      await loadTickets();
    } catch (err) {
      toastError("Batch failed", String(err));
    }
  }

  async function handleBroadcast() {
    if (!message.trim()) return;
    setIsSending(true);
    try {
      const res = await apiPost<{
        status: string;
        push?: { sent: number; failed: number; recipients: number };
      }>("/admin/broadcast", { target, message: message.trim() });
      const history = await apiGet<BroadcastRow[]>("/admin/broadcasts");
      setBroadcasts(history);
      setMessage("");
      setShowCompose(false);
      const push = res.push;
      const pushNote =
        push && push.recipients > 0
          ? `Browser push: ${push.sent} delivered to ${push.recipients} opted-in account(s).`
          : push
            ? "In-app broadcast saved. No browsers opted in for push yet."
            : undefined;
      toastSuccess("Broadcast sent", pushNote);
    } catch (err) {
      toastError("Broadcast failed", String(err));
    } finally {
      setIsSending(false);
    }
  }

  const kpis = useMemo(
    () => [
      { label: "Open tickets", value: String(openCount), icon: AlertTriangleIcon },
      { label: "On this page", value: String(tickets.length), icon: MessageSquare },
      { label: "Resolved", value: String(tickets.filter((t) => t.status === "resolved").length), icon: CheckCircle2 },
      { label: "Total listed", value: String(totalItems), icon: Bell },
    ],
    [openCount, tickets, totalItems],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            Platform alerts (registrations, bookings), support tickets, and broadcasts to businesses or customers.
          </p>
        </div>
        <div className="flex rounded-2xl border border-slate-200 bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("alerts")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wide transition",
              activeTab === "alerts" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
            )}
          >
            <Bell className="h-3 w-3" /> Alerts
            {alertUnread > 0 ? (
              <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                {alertUnread}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("support")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wide transition",
              activeTab === "support" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
            )}
          >
            <MessageSquare className="h-3 w-3" /> Support tickets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            className={cn(
              "flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-wide transition",
              activeTab === "broadcast" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400",
            )}
          >
            <Send className="h-3 w-3" /> Broadcasts
          </button>
        </div>
      </div>

      {activeTab === "alerts" ? (
        <div className="space-y-4">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={alertUnread === 0}
              onClick={() => void markAllAlertsRead()}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={() => void loadAlerts()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {alertsLoading ? <OverlayLoader /> : null}
            {alerts.length === 0 && !alertsLoading ? (
              <p className="px-6 py-12 text-center text-sm text-slate-500">No platform alerts yet.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {alerts.map((a) => (
                  <li
                    key={a.id}
                    className={cn(
                      "flex gap-4 px-6 py-4 hover:bg-slate-50",
                      !a.read && "bg-blue-50/40",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                          {a.type.replace(/_/g, " ")}
                        </span>
                        {!a.read ? (
                          <span className="text-[9px] font-bold uppercase text-blue-600">New</span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm font-bold text-slate-900">{a.title}</p>
                      <p className="mt-1 text-sm text-slate-600">{a.body}</p>
                      <p className="mt-2 text-xs text-slate-400">{formatDate(a.createdAt)}</p>
                    </div>
                    {!a.read ? (
                      <button
                        type="button"
                        onClick={() => void markAlertRead(a.id)}
                        className="shrink-0 self-start rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold uppercase text-slate-600 hover:bg-white"
                      >
                        Mark read
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : activeTab === "support" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {kpis.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                  <item.icon className="h-4 w-4 text-slate-500" />
                </div>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              disabled={openCount === 0}
              onClick={() => void batchResolve()}
              className="rounded-2xl bg-slate-900 px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Resolve all open
            </button>
          </div>

          <FilterToolbar
            searchPlaceholder="Search ticket ref, subject, business, email..."
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            filterGroups={[
              {
                key: "ticket-status",
                label: "Status",
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: "All", value: "all" },
                  { label: "Open", value: "open" },
                  { label: "In progress", value: "in_progress" },
                  { label: "Resolved", value: "resolved" },
                  { label: "Closed", value: "closed" },
                ],
              },
            ]}
          />

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {isLoading ? <OverlayLoader /> : null}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Ticket</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">From</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Category</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase text-slate-500">Updated</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs font-bold text-slate-700">{t.ticketRef}</p>
                        <p className="text-sm font-semibold text-slate-900">{t.subject}</p>
                        {t.lastMessage ? <p className="mt-1 line-clamp-1 text-xs text-slate-500">{t.lastMessage}</p> : null}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <p className="font-semibold text-slate-800">{t.requesterName}</p>
                        <p className="text-xs text-slate-500">{t.businessName || t.requesterEmail || "—"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm capitalize text-slate-600">{t.category}</td>
                      <td className="px-6 py-4">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold capitalize", statusStyles[t.status] ?? statusStyles.open)}>
                          {t.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{formatDate(t.updatedAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => void openTicket(t.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                  {tickets.length === 0 && !isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">
                        No support tickets yet. They appear when merchants or customers submit requests.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
            <TablePagination page={page} totalPages={totalPages} totalItems={totalItems} pageSize={pageSize} onPageChange={setPage} />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="mb-3 text-sm text-slate-600">
              Enable browser push on this machine to receive platform alerts. Customer and business broadcasts are sent to every opted-in browser for that role.
            </p>
            <BrowserPushSettings compact />
          </div>
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-600">In-app broadcasts for users/businesses (separate from support tickets).</p>
            <button
              type="button"
              onClick={() => setShowCompose(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold uppercase text-white hover:bg-blue-700"
            >
              <Send className="h-4 w-4" /> Compose
            </button>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                  <th className="px-6 py-4">Audience</th>
                  <th className="px-6 py-4">Summary</th>
                  <th className="px-6 py-4">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {broadcasts.map((b) => (
                  <tr key={b.id}>
                    <td className="px-6 py-4 text-sm">{b.audience}</td>
                    <td className="px-6 py-4 text-sm">{b.summary}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(b.sentAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detail ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div>
                <p className="font-mono text-xs font-bold text-slate-500">{detail.ticketRef}</p>
                <h2 className="text-lg font-semibold text-slate-900">{detail.subject}</h2>
              </div>
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg p-2 hover:bg-slate-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <div className="flex flex-wrap gap-2">
                {(["open", "in_progress", "resolved", "closed"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void updateStatus(detail.id, s)}
                    className={cn(
                      "rounded-lg px-3 py-1 text-xs font-semibold capitalize",
                      detail.status === s ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600",
                    )}
                  >
                    {s.replace("_", " ")}
                  </button>
                ))}
              </div>
              {detail.screenshotUrl ? (
                <img src={detail.screenshotUrl} alt="Attachment" className="max-h-48 rounded-xl border object-contain" />
              ) : null}
              <div className="space-y-3">
                {(detail.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "rounded-xl p-4 text-sm",
                      m.senderRole === "ADMIN" ? "bg-blue-50 text-blue-900" : "bg-slate-50 text-slate-800",
                    )}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">
                      {m.senderName || m.senderRole} · {formatDate(m.createdAt)}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
                    {m.attachmentUrl ? (
                      <img src={m.attachmentUrl} alt="" className="mt-3 max-h-40 rounded-lg border object-contain" />
                    ) : null}
                  </div>
                ))}
              </div>
              <textarea
                className="h-24 w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-300"
                placeholder="Reply to merchant/customer..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 border-t px-6 py-4">
              <button type="button" onClick={() => setDetail(null)} className="rounded-lg border px-4 py-2 text-sm font-semibold">
                Close
              </button>
              <button
                type="button"
                disabled={replying || !reply.trim()}
                onClick={() => void sendReply()}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {replying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Send reply
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCompose ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold">Compose broadcast</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {[
                { id: "all_users", label: "All users" },
                { id: "all_businesses", label: "All businesses" },
              ].map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setTarget(o.id)}
                  className={cn("rounded-lg border py-2 text-sm font-medium", target === o.id ? "border-blue-600 bg-blue-50" : "")}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <textarea
              className="mt-4 h-32 w-full rounded-xl border p-3 text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowCompose(false)} className="rounded-lg border px-4 py-2 text-sm">
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending}
                onClick={() => void handleBroadcast()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AlertTriangleIcon(props: React.SVGProps<SVGSVGElement>) {
  return <Clock {...props} />;
}
