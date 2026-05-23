"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useBusinessStore } from "../../../store/businessStore";
import { apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { HelpCircle, Loader2, MessageSquare, Paperclip, Plus, Send } from "lucide-react";
import { clsx } from "clsx";

type Ticket = {
  id: string;
  ticketRef: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessage: string | null;
  screenshotUrl?: string | null;
  messages?: Array<{
    id: string;
    body: string;
    senderRole: string;
    senderName: string | null;
    attachmentUrl: string | null;
    createdAt: string;
  }>;
};

const CATEGORIES = [
  { value: "technical", label: "Technical issue" },
  { value: "billing", label: "Billing & payouts" },
  { value: "account", label: "Account & profile" },
  { value: "booking", label: "Bookings & calendar" },
  { value: "other", label: "Other" },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export default function BusinessSupportPage() {
  const business = useBusinessStore((s) => s.business);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technical");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const loadTickets = useCallback(async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const rows = await apiGet<Ticket[]>(`/business/${business.id}/support/tickets`, "BUSINESS");
      setTickets(rows);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [business?.id]);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function openTicket(id: string) {
    if (!business?.id) return;
    try {
      const row = await apiGet<Ticket>(`/business/${business.id}/support/tickets/${id}`, "BUSINESS");
      setSelected(row);
      setReply("");
    } catch (e) {
      toastError("Could not load ticket", String(e));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!business?.id) return;
    if (subject.trim().length < 3 || message.trim().length < 8) {
      toastError("Invalid form", "Subject (3+) and message (8+) required.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(
        `/business/${business.id}/support/tickets`,
        { subject: subject.trim(), message: message.trim(), category, screenshotUrl: screenshot },
        "BUSINESS",
      );
      toastSuccess("Ticket created", "Our team will respond by email when configured.");
      setShowNew(false);
      setSubject("");
      setMessage("");
      setScreenshot(null);
      await loadTickets();
    } catch (e) {
      toastError("Could not create ticket", String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply() {
    if (!business?.id || !selected || !reply.trim()) return;
    setSubmitting(true);
    try {
      await apiPost(
        `/business/${business.id}/support/tickets/${selected.id}/reply`,
        { message: reply.trim() },
        "BUSINESS",
      );
      toastSuccess("Reply sent");
      setReply("");
      await openTicket(selected.id);
      await loadTickets();
    } catch (e) {
      toastError("Reply failed", String(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function onPickScreenshot(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toastError("Invalid file", "Please upload an image screenshot.");
      return;
    }
    if (file.size > 1_200_000) {
      toastError("File too large", "Max 1.2MB for screenshots.");
      return;
    }
    try {
      setScreenshot(await readFileAsDataUrl(file));
    } catch {
      toastError("Upload failed", "Could not read image.");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">Support</h1>
          <p className="mt-1 text-sm font-bold text-slate-500">
            Open a ticket with optional screenshot. Admins manage requests at Admin → Notifications.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#ff5a5f] px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg"
        >
          <Plus className="h-4 w-4" /> New ticket
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Your tickets</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-4 text-sm font-bold text-slate-500">No tickets yet. Create one to get help.</p>
            </div>
          ) : (
            tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => void openTicket(t.id)}
                className={clsx(
                  "w-full rounded-2xl border p-4 text-left transition",
                  selected?.id === t.id ? "border-[#ff5a5f] bg-[#ff5a5f]/5" : "border-slate-100 bg-white hover:border-slate-200",
                )}
              >
                <p className="font-mono text-[10px] font-bold text-slate-500">{t.ticketRef}</p>
                <p className="mt-1 text-sm font-black text-slate-900">{t.subject}</p>
                <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                  {t.status.replace("_", " ")}
                </span>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2 min-h-[400px] rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          {selected ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-slate-100 pb-4">
                <p className="font-mono text-xs font-bold text-slate-500">{selected.ticketRef}</p>
                <h3 className="text-lg font-black text-slate-900">{selected.subject}</h3>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto py-4 max-h-[360px]">
                {(selected.messages ?? []).map((m) => (
                  <div
                    key={m.id}
                    className={clsx(
                      "rounded-2xl p-4 text-sm",
                      m.senderRole === "ADMIN" ? "bg-blue-50 text-blue-900" : "bg-slate-50",
                    )}
                  >
                    <p className="text-[10px] font-black uppercase opacity-60">{m.senderName || m.senderRole}</p>
                    <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
                    {m.attachmentUrl ? (
                      <img src={m.attachmentUrl} alt="" className="mt-3 max-h-40 rounded-lg border object-contain" />
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                <textarea
                  className="flex-1 rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-[#ff5a5f]"
                  placeholder="Add a reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={2}
                />
                <button
                  type="button"
                  disabled={submitting || !reply.trim()}
                  onClick={() => void handleReply()}
                  className="self-end rounded-xl bg-slate-900 px-4 py-3 text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
              <HelpCircle className="h-12 w-12" />
              <p className="mt-4 text-sm font-bold">Select a ticket or create a new one</p>
            </div>
          )}
        </div>
      </div>

      {showNew ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <form onSubmit={handleCreate} className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl">
            <h2 className="text-xl font-black uppercase text-slate-900">New support ticket</h2>
            <div className="mt-6 space-y-4">
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <textarea
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the issue (min 8 characters)"
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              />
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => void onPickScreenshot(e.target.files?.[0] ?? null)} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-3 text-xs font-black uppercase text-slate-600"
              >
                <Paperclip className="h-4 w-4" />
                {screenshot ? "Screenshot attached" : "Attach screenshot"}
              </button>
              {screenshot ? <img src={screenshot} alt="Preview" className="max-h-32 rounded-xl border object-contain" /> : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowNew(false)} className="rounded-xl border px-4 py-2 text-sm font-bold">
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#ff5a5f] px-6 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Submit ticket"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
