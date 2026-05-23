"use client";

import React, { useEffect, useState } from "react";
import { HelpCircle, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import FilterToolbar from "@/components/admin/FilterToolbar";
import TablePagination from "@/components/admin/TablePagination";

type FaqRow = {
  id: string;
  questionEn: string;
  questionEs: string;
  answerEn: string;
  answerEs: string;
  sortOrder: number;
  active: boolean;
};

type Draft = {
  questionEn: string;
  questionEs: string;
  answerEn: string;
  answerEs: string;
  sortOrder: string;
  active: boolean;
};

export default function CustomerFaqsPage() {
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [draftById, setDraftById] = useState<Record<string, Draft>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const [newQEn, setNewQEn] = useState("");
  const [newQEs, setNewQEs] = useState("");
  const [newAEn, setNewAEn] = useState("");
  const [newAEs, setNewAEs] = useState("");
  const [newSort, setNewSort] = useState("0");

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet<{ data: FaqRow[]; total: number; totalPages: number }>(
        `/admin/customer-service/faqs?page=${page}&limit=20&search=${encodeURIComponent(search)}`,
      );
      setFaqs(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      const next: Record<string, Draft> = {};
      (res.data || []).forEach((f) => {
        next[f.id] = {
          questionEn: f.questionEn,
          questionEs: f.questionEs,
          answerEn: f.answerEn,
          answerEs: f.answerEs,
          sortOrder: String(f.sortOrder),
          active: f.active,
        };
      });
      setDraftById(next);
    } catch (e) {
      toastError("Failed to load FAQs", String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  async function createFaq(e: React.FormEvent) {
    e.preventDefault();
    if (!newQEn.trim() || !newAEn.trim()) {
      toastError("Missing fields", "Question and answer (English) are required.");
      return;
    }
    try {
      await apiPost("/admin/customer-service/faqs", {
        questionEn: newQEn.trim(),
        questionEs: newQEs.trim() || newQEn.trim(),
        answerEn: newAEn.trim(),
        answerEs: newAEs.trim() || newAEn.trim(),
        sortOrder: Number(newSort) || 0,
        active: true,
      });
      toastSuccess("FAQ added");
      setNewQEn("");
      setNewQEs("");
      setNewAEn("");
      setNewAEs("");
      setNewSort("0");
      await load();
    } catch (e) {
      toastError("Create failed", String(e));
    }
  }

  async function saveFaq(id: string) {
    const d = draftById[id];
    if (!d) return;
    setSavingId(id);
    try {
      await apiPatch(`/admin/customer-service/faqs/${id}`, {
        questionEn: d.questionEn.trim(),
        questionEs: d.questionEs.trim(),
        answerEn: d.answerEn.trim(),
        answerEs: d.answerEs.trim(),
        sortOrder: Number(d.sortOrder) || 0,
        active: d.active,
      });
      toastSuccess("FAQ saved");
      await load();
    } catch (e) {
      toastError("Save failed", String(e));
    } finally {
      setSavingId(null);
    }
  }

  async function deleteFaq(id: string) {
    if (!window.confirm("Delete this FAQ?")) return;
    try {
      await apiDelete(`/admin/customer-service/faqs/${id}`);
      toastSuccess("FAQ deleted");
      await load();
    } catch (e) {
      toastError("Delete failed", String(e));
    }
  }

  function patchDraft(id: string, patch: Partial<Draft>) {
    setDraftById((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Customer service FAQs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Questions and answers shown on{" "}
          <span className="font-mono text-slate-700">/customer-service</span> (English & Spanish).
        </p>
      </div>

      <form
        onSubmit={createFaq}
        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-800">
          <Plus className="h-4 w-4" /> Add FAQ
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">Question (EN)</label>
            <input
              value={newQEn}
              onChange={(e) => setNewQEn(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              placeholder="How do I cancel a reservation?"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">Question (ES)</label>
            <input
              value={newQEs}
              onChange={(e) => setNewQEs(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold"
              placeholder="¿Cómo cancelo una reserva?"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400">Answer (EN)</label>
            <textarea
              value={newAEn}
              onChange={(e) => setNewAEn(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-black uppercase text-slate-400">Answer (ES)</label>
            <textarea
              value={newAEs}
              onChange={(e) => setNewAEs(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400">Sort order</label>
            <input
              type="number"
              value={newSort}
              onChange={(e) => setNewSort(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold"
            />
          </div>
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-slate-800"
        >
          Add FAQ
        </button>
      </form>

      <FilterToolbar
        searchPlaceholder="Search questions or answers..."
        searchValue={search}
        onSearchChange={setSearch}
      />

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <HelpCircle className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-4 text-sm font-semibold text-slate-500">No FAQs yet. Add one above.</p>
          </div>
        ) : (
          faqs.map((f) => {
            const d = draftById[f.id];
            if (!d) return null;
            return (
              <div key={f.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={d.active}
                      onChange={(e) => patchDraft(f.id, { active: e.target.checked })}
                      className="h-4 w-4 accent-blue-600"
                    />
                    Visible on customer service page
                  </label>
                  <span className="font-mono text-[10px] text-slate-400">{f.id.slice(0, 8)}…</span>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    value={d.questionEn}
                    onChange={(e) => patchDraft(f.id, { questionEn: e.target.value })}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold"
                    placeholder="Question EN"
                  />
                  <input
                    value={d.questionEs}
                    onChange={(e) => patchDraft(f.id, { questionEs: e.target.value })}
                    className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold"
                    placeholder="Question ES"
                  />
                  <textarea
                    value={d.answerEn}
                    onChange={(e) => patchDraft(f.id, { answerEn: e.target.value })}
                    rows={3}
                    className="md:col-span-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                    placeholder="Answer EN"
                  />
                  <textarea
                    value={d.answerEs}
                    onChange={(e) => patchDraft(f.id, { answerEs: e.target.value })}
                    rows={3}
                    className="md:col-span-1 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm"
                    placeholder="Answer ES"
                  />
                  <input
                    type="number"
                    value={d.sortOrder}
                    onChange={(e) => patchDraft(f.id, { sortOrder: e.target.value })}
                    className="w-32 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-bold"
                    placeholder="Order"
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => void deleteFaq(f.id)}
                    className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                  <button
                    type="button"
                    disabled={savingId === f.id}
                    onClick={() => void saveFaq(f.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {savingId === f.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={20}
        onPageChange={setPage}
      />
    </div>
  );
}
