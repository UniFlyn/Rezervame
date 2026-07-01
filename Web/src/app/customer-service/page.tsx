"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { useAuth } from "@/components/AuthProvider";
import { apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import { useI18n } from "@/components/I18nProvider";
import {
  HelpCircle,
  Loader2,
  LogIn,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  UserPlus,
} from "lucide-react";
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
  { value: "booking", label: "Bookings & reservations" },
  { value: "payment", label: "Payments & refunds" },
  { value: "account", label: "Account & profile" },
  { value: "technical", label: "Technical issue" },
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

function AuthGate({
  onSignIn,
  onSignUp,
}: {
  onSignIn: () => void;
  onSignUp: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="mx-auto max-w-lg rounded-[32px] border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] p-10 text-center shadow-sm">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff5757]/10 text-[#ff5757]">
        <MessageSquare size={32} />
      </div>
      <h2 className="text-xl font-black uppercase tracking-tight text-[var(--rz-navy)]">
        {t("customerServiceSignInTitle") || "Sign in to get support"}
      </h2>
      <p className="mt-3 text-sm font-bold leading-relaxed text-[var(--rz-gray-500)]">
        {t("customerServiceSignInBody") ||
          "Create a free account or sign in to open support tickets, attach screenshots, and track replies from our team."}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--rz-navy)] px-8 py-4 text-[11px] font-black uppercase tracking-widest text-white hover:bg-[var(--rz-navy-800)]"
        >
          <LogIn size={16} />
          {t("authSignIn") || "Sign in"}
        </button>
        <button
          type="button"
          onClick={onSignUp}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-[#ff5757] bg-white px-8 py-4 text-[11px] font-black uppercase tracking-widest text-[#ff5757] hover:bg-[#ff5757]/5"
        >
          <UserPlus size={16} />
          {t("authSignUp") || "Sign up"}
        </button>
      </div>
    </div>
  );
}

export default function CustomerServicePage() {
  const { t } = useI18n();
  const { isLoggedIn, isHydrated, setIsLoginModalOpen, setPendingAfterLogin } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("booking");
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [faqs, setFaqs] = useState<
    Array<{ id: string; questionEn: string; questionEs: string; answerEn: string; answerEs: string }>
  >([]);
  const [faqsLoading, setFaqsLoading] = useState(true);

  const loadTickets = useCallback(async () => {
    if (!isLoggedIn) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await apiGet<Ticket[]>("/support/tickets", "USER");
      setTickets(rows);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isHydrated) return;
    void loadTickets();
  }, [isHydrated, isLoggedIn, loadTickets]);

  useEffect(() => {
    void apiGet<
      Array<{ id: string; questionEn: string; questionEs: string; answerEn: string; answerEs: string }>
    >("/public/customer-service/faqs")
      .then(setFaqs)
      .catch(() => setFaqs([]))
      .finally(() => setFaqsLoading(false));
  }, []);

  const openLogin = (after?: () => void) => {
    if (after) {
      setPendingAfterLogin(() => {
        after();
        void loadTickets();
      });
    } else {
      setPendingAfterLogin(() => {
        void loadTickets();
      });
    }
    setIsLoginModalOpen(true);
  };

  async function openTicket(id: string) {
    try {
      const row = await apiGet<Ticket>(`/support/tickets/${id}`, "USER");
      setSelected(row);
      setReply("");
    } catch (e) {
      toastError("Could not load ticket", String(e));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      openLogin(() => setShowNew(true));
      return;
    }
    if (subject.trim().length < 3 || message.trim().length < 8) {
      toastError("Invalid form", "Subject (3+ characters) and message (8+ characters) required.");
      return;
    }
    setSubmitting(true);
    try {
      await apiPost(
        "/support/tickets",
        {
          subject: subject.trim(),
          message: message.trim(),
          category,
          screenshotUrl: screenshot,
        },
        "USER",
      );
      toastSuccess("Ticket created", "We will respond by email when available.");
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
    if (!selected || !reply.trim()) return;
    setSubmitting(true);
    try {
      await apiPost(`/support/tickets/${selected.id}/reply`, { message: reply.trim() }, "USER");
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

  const ticketPanel = !isHydrated ? (
    <div className="flex justify-center py-16">
      <Loader2 className="h-10 w-10 animate-spin text-[var(--rz-gray-300)]" />
    </div>
  ) : !isLoggedIn ? (
    <AuthGate onSignIn={() => openLogin()} onSignUp={() => openLogin()} />
  ) : (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Your tickets</h2>
          <button
            type="button"
            onClick={() => {
              if (!isLoggedIn) {
                openLogin(() => setShowNew(true));
              } else {
                setShowNew(true);
              }
            }}
            className="inline-flex items-center gap-1 rounded-xl bg-[#ff5757] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--rz-gray-500)]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[var(--rz-gray-200)] bg-[var(--rz-gray-050)] p-8 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-[var(--rz-gray-300)]" />
            <p className="mt-4 text-sm font-bold text-[var(--rz-gray-500)]">No tickets yet. Create one to get help.</p>
          </div>
        ) : (
          tickets.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => void openTicket(t.id)}
              className={clsx(
                "w-full rounded-2xl border p-4 text-left transition",
                selected?.id === t.id ? "border-[#ff5757] bg-[#ff5757]/5" : "border-[var(--rz-gray-100)] bg-white hover:border-[var(--rz-gray-200)]",
              )}
            >
              <p className="font-mono text-[10px] font-bold text-[var(--rz-gray-500)]">{t.ticketRef}</p>
              <p className="mt-1 text-sm font-black text-[var(--rz-navy)]">{t.subject}</p>
              <span className="mt-2 inline-block rounded-full bg-[var(--rz-gray-100)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--rz-gray-600)]">
                {t.status.replace("_", " ")}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="min-h-[420px] rounded-3xl border border-[var(--rz-gray-100)] bg-white p-6 shadow-sm lg:col-span-2">
        {selected ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-[var(--rz-gray-100)] pb-4">
              <p className="font-mono text-xs font-bold text-[var(--rz-gray-500)]">{selected.ticketRef}</p>
              <h3 className="text-lg font-black text-[var(--rz-navy)]">{selected.subject}</h3>
              <p className="mt-1 text-[10px] font-bold uppercase text-[var(--rz-gray-500)]">{selected.category}</p>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto py-4 max-h-[320px]">
              {(selected.messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className={clsx(
                    "rounded-2xl p-4 text-sm",
                    m.senderRole === "ADMIN" ? "bg-blue-50 text-blue-900" : "bg-[var(--rz-gray-050)] text-[var(--rz-navy-800)]",
                  )}
                >
                  <p className="text-[10px] font-black uppercase opacity-60">
                    {m.senderName || m.senderRole}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap">{m.body}</p>
                  {m.attachmentUrl ? (
                    <img src={m.attachmentUrl} alt="" className="mt-3 max-h-40 rounded-lg border object-contain" />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="flex gap-2 border-t border-[var(--rz-gray-100)] pt-4">
              <textarea
                className="flex-1 rounded-xl border border-[var(--rz-gray-200)] p-3 text-sm outline-none focus:border-[#ff5757]"
                placeholder="Add a reply..."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
              />
              <button
                type="button"
                disabled={submitting || !reply.trim()}
                onClick={() => void handleReply()}
                className="self-end rounded-xl bg-[var(--rz-navy)] px-4 py-3 text-white disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-[var(--rz-gray-500)]">
            <HelpCircle className="h-12 w-12" />
            <p className="mt-4 text-sm font-bold">Select a ticket or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <StaticPageLayout
        title={t("footerSupport") || "Customer Service"}
        subtitle={
          t("customerServiceSubtitle") ||
          "Open a support ticket with screenshots. Sign in or create an account to get started."
        }
        breadcrumb="Customer Service"
      >
        <div className="mb-10">{ticketPanel}</div>

        <h2 className="text-2xl font-black uppercase tracking-tight text-[var(--rz-navy)] mb-6">
          {t("customerServiceFaq") || "Frequently asked questions"}
        </h2>
        {faqsLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--rz-gray-300)]" />
          </div>
        ) : faqs.length === 0 ? (
          <p className="text-sm font-bold text-[var(--rz-gray-500)]">
            No FAQs published yet. Check back soon.
          </p>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.id}
                className="group cursor-pointer rounded-2xl border border-[var(--rz-gray-100)] bg-white p-6 hover:border-[#ff5757] [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between gap-4 font-black uppercase tracking-tight text-[var(--rz-navy-800)]">
                  <span>{faq.questionEn || faq.questionEs}</span>
                  <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </summary>
                <p className="mt-4 font-bold leading-relaxed text-[var(--rz-gray-500)] whitespace-pre-wrap">
                  {faq.answerEn || faq.answerEs}
                </p>
              </details>
            ))}
          </div>
        )}
      </StaticPageLayout>

      {showNew && isLoggedIn ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#023047]/50 p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl"
          >
            <h2 className="text-xl font-black uppercase text-[var(--rz-navy)]">New support ticket</h2>
            <p className="mt-1 text-sm font-bold text-[var(--rz-gray-500)]">
              Describe your issue and attach a screenshot if helpful.
            </p>
            <div className="mt-6 space-y-4">
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="w-full rounded-xl border border-[var(--rz-gray-200)] px-4 py-3 text-sm font-bold"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-[var(--rz-gray-200)] px-4 py-3 text-sm font-bold"
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
                placeholder="Describe your issue (min 8 characters)"
                rows={5}
                className="w-full rounded-xl border border-[var(--rz-gray-200)] px-4 py-3 text-sm"
              />
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onPickScreenshot(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--rz-gray-300)] py-3 text-xs font-black uppercase text-[var(--rz-gray-600)]"
              >
                <Paperclip className="h-4 w-4" />
                {screenshot ? "Screenshot attached" : "Attach screenshot"}
              </button>
              {screenshot ? (
                <img src={screenshot} alt="Preview" className="max-h-32 rounded-xl border object-contain" />
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowNew(false)}
                className="rounded-xl border px-4 py-2 text-sm font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#ff5757] px-6 py-2 text-xs font-black uppercase text-white disabled:opacity-50"
              >
                {submitting ? "Sending..." : "Submit ticket"}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {showNew && !isLoggedIn && isHydrated ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#023047]/50 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <p className="text-sm font-bold text-[var(--rz-gray-600)]">Sign in or sign up to create a support ticket.</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowNew(false);
                  openLogin(() => setShowNew(true));
                }}
                className="rounded-xl bg-[var(--rz-navy)] px-6 py-3 text-xs font-black uppercase text-white"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
