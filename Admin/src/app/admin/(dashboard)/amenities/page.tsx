"use client";

import React, { useEffect, useState } from "react";
import { ImagePlus, Save, Trash2 } from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

type AmenityRow = {
  id: string;
  key: string;
  labelEn: string;
  labelEs: string;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
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

export default function AmenitiesPage() {
  const [rows, setRows] = useState<AmenityRow[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newEn, setNewEn] = useState("");
  const [newDescEn, setNewDescEn] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [draftById, setDraftById] = useState<
    Record<
      string,
      {
        labelEn: string;
        descriptionEn: string;
        sortOrder: string;
        active: boolean;
        imageUrl: string;
      }
    >
  >({});

  async function loadRows() {
    const data = await apiGet<AmenityRow[]>("/admin/amenities");
    setRows(data);
  }

  useEffect(() => {
    void loadRows();
  }, []);

  useEffect(() => {
    const next: Record<
      string,
      {
        labelEn: string;
        descriptionEn: string;
        sortOrder: string;
        active: boolean;
        imageUrl: string;
      }
    > = {};
    rows.forEach((c) => {
      next[c.id] = {
        labelEn: c.labelEn,
        descriptionEn: c.descriptionEn || "",
        sortOrder: String(c.sortOrder),
        active: c.active,
        imageUrl: c.imageUrl || "",
      };
    });
    setDraftById(next);
  }, [rows]);

  async function createAmenity(e: React.FormEvent) {
    e.preventDefault();
    const label = newEn.trim();
    if (!newKey.trim() || !label) return;
    const desc = newDescEn.trim() || null;
    await apiPost("/admin/amenities", {
      key: newKey.trim(),
      labelEn: label,
      labelEs: label,
      descriptionEn: desc,
      descriptionEs: desc,
      imageUrl: newImageUrl || null,
      active: true,
      sortOrder: Number(newSortOrder) || 0,
    });
    setNewKey("");
    setNewEn("");
    setNewDescEn("");
    setNewSortOrder("0");
    setNewImageUrl("");
    await loadRows();
  }

  async function updateAmenity(id: string) {
    const d = draftById[id];
    if (!d) return;
    const label = d.labelEn.trim();
    const desc = d.descriptionEn.trim() || null;
    await apiPatch(`/admin/amenities/${id}`, {
      labelEn: label,
      labelEs: label,
      descriptionEn: desc,
      descriptionEs: desc,
      imageUrl: d.imageUrl.trim() || null,
      sortOrder: Number(d.sortOrder) || 0,
      active: d.active,
    });
    await loadRows();
  }

  async function removeAmenity(id: string) {
    if (!window.confirm("Delete this amenity? Businesses referencing this key will keep the key until edited.")) return;
    await apiDelete(`/admin/amenities/${id}`);
    await loadRows();
  }

  function patchDraft(
    id: string,
    patch: Partial<{
      labelEn: string;
      descriptionEn: string;
      sortOrder: string;
      active: boolean;
      imageUrl: string;
    }>,
  ) {
    setDraftById((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Amenities</h1>
        <p className="text-slate-500 text-sm mt-1">Add, edit, or remove amenities. Businesses pick from this list in their panel.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <form onSubmit={createAmenity} className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <input value={newKey} onChange={(e) => setNewKey(e.target.value)} placeholder="key (e.g. wifi)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={newEn} onChange={(e) => setNewEn(e.target.value)} placeholder="Label" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <input value={newDescEn} onChange={(e) => setNewDescEn(e.target.value)} placeholder="Description (optional)" className="rounded-xl border border-slate-200 px-3 py-2 text-sm md:col-span-2" />
          <input value={newSortOrder} onChange={(e) => setNewSortOrder(e.target.value)} type="number" placeholder="Sort" className="rounded-xl border border-slate-200 px-3 py-2 text-sm" />
          <label className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 inline-flex items-center justify-center gap-2 cursor-pointer">
            <ImagePlus className="h-4 w-4" />
            Image
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
          <button className="rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wide">Add amenity</button>
        </form>
        {newImageUrl ? <img src={newImageUrl} alt="new-amenity-preview" className="mt-3 h-20 w-20 rounded-lg object-cover border border-slate-200" /> : null}
      </div>

      <div className="space-y-3">
        {rows.map((c) => {
          const d = draftById[c.id];
          if (!d) return null;
          return (
            <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-1 md:grid-cols-8 gap-3 items-center">
                <div className="text-sm font-black text-slate-900">{c.key}</div>
                <input value={d.labelEn} onChange={(e) => patchDraft(c.id, { labelEn: e.target.value })} placeholder="Label" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold md:col-span-2" />
                <input value={d.descriptionEn} onChange={(e) => patchDraft(c.id, { descriptionEn: e.target.value })} placeholder="Description" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold md:col-span-2" />
                <input value={d.sortOrder} onChange={(e) => patchDraft(c.id, { sortOrder: e.target.value })} type="number" className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold" />
                <label className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 inline-flex items-center justify-center gap-2 cursor-pointer">
                  <ImagePlus className="h-3.5 w-3.5" />
                  Img
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
                <button type="button" onClick={() => void updateAmenity(c.id)} className="rounded-lg border border-blue-200 text-blue-700 px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1">
                  <Save className="h-3.5 w-3.5" /> Save
                </button>
                <button type="button" onClick={() => void removeAmenity(c.id)} className="rounded-lg border border-rose-200 text-rose-700 px-3 py-2 text-xs font-bold inline-flex items-center justify-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
              {d.imageUrl ? <img src={d.imageUrl} alt={`${c.key}-preview`} className="mt-3 h-20 w-20 rounded-lg object-cover border border-slate-200" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
