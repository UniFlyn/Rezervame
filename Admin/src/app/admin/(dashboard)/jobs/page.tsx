"use client";

import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Edit2,
  Loader2,
  MapPin,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { toastError, toastSuccess } from "@/lib/toast";
import FilterToolbar from "@/components/admin/FilterToolbar";
import TablePagination from "@/components/admin/TablePagination";
import { TableLoader } from "@/components/admin/TableLoader";
import { cn } from "@/lib/utils";

type JobRow = {
  id: string;
  title: string;
  location: string;
  description: string;
  applyUrl: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
};

type JobDraft = {
  title: string;
  location: string;
  description: string;
  applyUrl: string;
  sortOrder: string;
  active: boolean;
};

const emptyDraft = (): JobDraft => ({
  title: "",
  location: "",
  description: "",
  applyUrl: "",
  sortOrder: "0",
  active: true,
});

export default function JobsAdminPage() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [draftById, setDraftById] = useState<Record<string, JobDraft>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<JobDraft>(emptyDraft());
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await apiGet<{ data: JobRow[]; total: number; totalPages: number }>(
        `/admin/jobs?page=${page}&limit=20&search=${encodeURIComponent(search)}`,
      );
      setJobs(res.data || []);
      setTotal(res.total || 0);
      setTotalPages(res.totalPages || 1);
      const next: Record<string, JobDraft> = {};
      (res.data || []).forEach((j) => {
        next[j.id] = {
          title: j.title,
          location: j.location,
          description: j.description,
          applyUrl: j.applyUrl || "",
          sortOrder: String(j.sortOrder),
          active: j.active,
        };
      });
      setDraftById(next);
    } catch (e) {
      toastError("Failed to load jobs", String(e));
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

  function openCreate() {
    setEditingId(null);
    setForm(emptyDraft());
    setModalOpen(true);
  }

  function openEdit(job: JobRow) {
    setEditingId(job.id);
    setForm({
      title: job.title,
      location: job.location,
      description: job.description,
      applyUrl: job.applyUrl || "",
      sortOrder: String(job.sortOrder),
      active: job.active,
    });
    setModalOpen(true);
  }

  async function submitModal(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim() || !form.location.trim() || !form.description.trim()) {
      toastError("Missing fields", "Title, location, and description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        location: form.location.trim(),
        description: form.description.trim(),
        applyUrl: form.applyUrl.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      };
      if (editingId) {
        await apiPatch(`/admin/jobs/${editingId}`, payload);
        toastSuccess("Job updated");
      } else {
        await apiPost("/admin/jobs", payload);
        toastSuccess("Job added");
      }
      setModalOpen(false);
      await load();
    } catch (err) {
      toastError(editingId ? "Update failed" : "Create failed", String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function saveInline(id: string) {
    const d = draftById[id];
    if (!d) return;
    setSavingId(id);
    try {
      await apiPatch(`/admin/jobs/${id}`, {
        title: d.title.trim(),
        location: d.location.trim(),
        description: d.description.trim(),
        applyUrl: d.applyUrl.trim() || null,
        sortOrder: Number(d.sortOrder) || 0,
        active: d.active,
      });
      toastSuccess("Saved");
      await load();
    } catch (e) {
      toastError("Save failed", String(e));
    } finally {
      setSavingId(null);
    }
  }

  async function removeJob(id: string) {
    if (!window.confirm("Delete this job posting?")) return;
    try {
      await apiDelete(`/admin/jobs/${id}`);
      toastSuccess("Job deleted");
      await load();
    } catch (e) {
      toastError("Delete failed", String(e));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Briefcase className="w-7 h-7 text-blue-600" />
            Careers / Jobs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage open positions shown in the mobile app Join the Team screen.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-semibold text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add position
        </button>
      </div>

      <FilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search jobs…"
      />

      {loading ? (
        <TableLoader />
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
          No job postings yet. Add one to show it in the app.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const d = draftById[job.id];
            if (!d) return null;
            return (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <MapPin className="w-3.5 h-3.5" />
                    Sort: {job.sortOrder}
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded-full font-medium",
                        job.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      {job.active ? "Active" : "Hidden"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(job)}
                      className="p-2 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-50"
                      title="Edit in modal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeJob(job.id)}
                      className="p-2 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Title</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      value={d.title}
                      onChange={(e) =>
                        setDraftById((prev) => ({
                          ...prev,
                          [job.id]: { ...d, title: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Location</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      value={d.location}
                      onChange={(e) =>
                        setDraftById((prev) => ({
                          ...prev,
                          [job.id]: { ...d, location: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Description</span>
                  <textarea
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[80px]"
                    value={d.description}
                    onChange={(e) =>
                      setDraftById((prev) => ({
                        ...prev,
                        [job.id]: { ...d, description: e.target.value },
                      }))
                    }
                  />
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <label className="block text-sm md:col-span-2">
                    <span className="font-medium text-slate-700">Apply URL (optional)</span>
                    <input
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="https://… or mailto:…"
                      value={d.applyUrl}
                      onChange={(e) =>
                        setDraftById((prev) => ({
                          ...prev,
                          [job.id]: { ...d, applyUrl: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="font-medium text-slate-700">Sort order</span>
                    <input
                      type="number"
                      className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                      value={d.sortOrder}
                      onChange={(e) =>
                        setDraftById((prev) => ({
                          ...prev,
                          [job.id]: { ...d, sortOrder: e.target.value },
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={d.active}
                    onChange={(e) =>
                      setDraftById((prev) => ({
                        ...prev,
                        [job.id]: { ...d, active: e.target.checked },
                      }))
                    }
                  />
                  Visible in app
                </label>
                <button
                  type="button"
                  disabled={savingId === job.id}
                  onClick={() => void saveInline(job.id)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {savingId === job.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save changes
                </button>
              </div>
            );
          })}
        </div>
      )}

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={20}
        onPageChange={setPage}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingId ? "Edit position" : "New position"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitModal} className="p-5 space-y-4">
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Title *</span>
                <input
                  required
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Location *</span>
                <input
                  required
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Description *</span>
                <textarea
                  required
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm min-h-[100px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="font-medium text-slate-700">Apply URL (optional)</span>
                <input
                  className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="https://forms.google.com/…"
                  value={form.applyUrl}
                  onChange={(e) => setForm((f) => ({ ...f, applyUrl: e.target.value }))}
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Sort order</span>
                  <input
                    type="number"
                    className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    value={form.sortOrder}
                    onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 pt-7">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  />
                  Active in app
                </label>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
