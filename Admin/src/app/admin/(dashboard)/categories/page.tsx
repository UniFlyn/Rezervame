"use client";

import React, { useEffect, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import TablePagination from "@/components/admin/TablePagination";
import FilterToolbar from "@/components/admin/FilterToolbar";

type CategoryRow = {
  id: string;
  key: string;
  labelEn: string;
  labelEs: string;
  imageUrl?: string | null;
  active: boolean;
  sortOrder: number;
};

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Unable to read image"));
    reader.readAsDataURL(file);
  });
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [draftById, setDraftById] = useState<
    Record<string, { labelEn: string; sortOrder: string; active: boolean; imageUrl: string }>
  >({});

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const limit = 20;

  async function loadCategories() {
    const res = await apiGet<{ data: CategoryRow[]; total: number; totalPages: number }>(
      `/admin/categories?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    );
    setCategories(res.data || []);
    setTotal(res.total || 0);
    setTotalPages(res.totalPages || 1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCategories();
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search]);

  useEffect(() => {
    const next: Record<string, { labelEn: string; sortOrder: string; active: boolean; imageUrl: string }> = {};
    categories.forEach((c) => {
      next[c.id] = {
        labelEn: c.labelEn,
        sortOrder: String(c.sortOrder),
        active: c.active,
        imageUrl: c.imageUrl || "",
      };
    });
    setDraftById(next);
  }, [categories]);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const label = newEn.trim();
    if (!newKey.trim() || !label) return;
    await apiPost("/admin/categories", {
      key: newKey.trim(),
      labelEn: label,
      labelEs: label,
      imageUrl: newImageUrl || null,
      active: true,
      sortOrder: Number(newSortOrder) || 0,
    });
    setNewKey("");
    setNewEn("");
    setNewSortOrder("0");
    setNewImageUrl("");
    await loadCategories();
  }

  async function updateCategory(id: string) {
    const d = draftById[id];
    if (!d) return;
    const label = d.labelEn.trim();
    await apiPatch(`/admin/categories/${id}`, {
      labelEn: label,
      labelEs: label,
      imageUrl: d.imageUrl.trim() || null,
      sortOrder: Number(d.sortOrder) || 0,
      active: d.active,
    });
    await loadCategories();
  }

  async function removeCategory(id: string) {
    if (!window.confirm("Delete this category?")) return;
    await apiDelete(`/admin/categories/${id}`);
    await loadCategories();
  }

  function patchDraft(
    id: string,
    patch: Partial<{ labelEn: string; sortOrder: string; active: boolean; imageUrl: string }>,
  ) {
    setDraftById((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Categories</h1>
          <p className="text-slate-500 text-sm mt-1">Add, edit, delete and manage category images.</p>
        </div>
      </div>

      <FilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search categories..." />

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <form onSubmit={createCategory} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="key" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="Label" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={newSortOrder} onChange={(e) => setNewSortOrder(e.target.value)} type="number" placeholder="Sort order" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <label className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 inline-flex items-center justify-center gap-2 cursor-pointer">
            <ImagePlus className="h-4 w-4" />
            Upload image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                void readFileAsDataUrl(file).then(setNewImageUrl);
              }}
            />
          </label>
          <button className="rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wide">Add Category</button>
        </form>
        {newImageUrl ? <img src={newImageUrl} alt="new-category-preview" className="mt-3 h-20 w-20 rounded-lg object-cover border border-slate-200" /> : null}
      </div>

      <div className="space-y-3">
        {categories.map((c) => {
          const d = draftById[c.id];
          if (!d) return null;
          return (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-center">
                <div className="text-sm font-black text-slate-900">{c.key}</div>
                <input value={d.labelEn} onChange={(e) => patchDraft(c.id, { labelEn: e.target.value })} placeholder="Label" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold md:col-span-2" />
                <input value={d.sortOrder} onChange={(e) => patchDraft(c.id, { sortOrder: e.target.value })} type="number" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold" />
                <label className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 inline-flex items-center justify-center gap-2 cursor-pointer">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      void readFileAsDataUrl(file).then((img) => patchDraft(c.id, { imageUrl: img }));
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => patchDraft(c.id, { active: !d.active })}
                  className={`rounded-lg px-3 py-2 text-xs font-black uppercase ${d.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}
                >
                  {d.active ? "Active" : "Inactive"}
                </button>
                <button type="button" onClick={() => void updateCategory(c.id)} className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1">
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
                <button type="button" onClick={() => void removeCategory(c.id)} className="rounded-lg border border-rose-200 text-rose-700 px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
              {d.imageUrl ? <img src={d.imageUrl} alt={`${c.key}-preview`} className="mt-3 h-20 w-20 rounded-lg object-cover border border-slate-200" /> : null}
            </div>
          );
        })}
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        totalItems={total}
        pageSize={limit}
        onPageChange={setPage}
      />
    </div>
  );
}
