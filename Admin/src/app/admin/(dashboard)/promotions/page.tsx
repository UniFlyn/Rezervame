"use client";

import React, { useEffect, useState } from "react";
import {
  Tag,
  Trash2,
  Plus,
  X,
  Loader2,
  AlertCircle,
  Percent,
  Calendar,
  Building2,
  Scissors,
} from "lucide-react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { cn } from "@/lib/utils";
import TablePagination from "@/components/admin/TablePagination";

interface Promo {
  id: string;
  businessId: string;
  businessName: string;
  serviceId: string;
  serviceName: string;
  servicePrice: number;
  discountPercent: number;
  discountedPrice: number;
  label: string | null;
  active: boolean;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

interface BizSvc {
  id: string;
  name: string;
  services: Array<{ id: string; name: string; price: number; category: string }>;
}

export default function PromotionsPage() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [bizServices, setBizServices] = useState<BizSvc[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [selectedBiz, setSelectedBiz] = useState("");
  const [selectedSvc, setSelectedSvc] = useState("");
  const [discount, setDiscount] = useState(10);
  const [label, setLabel] = useState("");
  const [endsAt, setEndsAt] = useState("");

  useEffect(() => {
    void apiGet<{ data: Promo[]; total: number; totalPages: number }>(`/admin/promotions?page=${page}&limit=${itemsPerPage}`).then((res) => {
      setPromos(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    });
  }, [page]);

  useEffect(() => {
    void apiGet<BizSvc[]>("/admin/businesses-services").then(setBizServices);
  }, []);

  const selectedBizObj = bizServices.find((b) => b.id === selectedBiz);

  async function handleCreate() {
    if (!selectedBiz || !selectedSvc || discount <= 0) return;
    setCreating(true);
    try {
      await apiPost<any>("/admin/promotions", {
        businessId: selectedBiz,
        serviceId: selectedSvc,
        discountPercent: discount,
        label: label.trim() || undefined,
        endsAt: endsAt || undefined,
      });
      // Refresh
      const fresh = await apiGet<{ data: Promo[]; total: number; totalPages: number }>(`/admin/promotions?page=${page}&limit=${itemsPerPage}`);
      setPromos(fresh.data);
      setTotal(fresh.total);
      setTotalPages(fresh.totalPages);
      setShowCreate(false);
      setSelectedBiz("");
      setSelectedSvc("");
      setDiscount(10);
      setLabel("");
      setEndsAt("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remove this promotion?")) return;
    await apiDelete(`/admin/promotions/${id}`);
    setPromos((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Promotions</h1>
          <p className="text-slate-500 text-sm mt-1">
            Create promotional discounts for services. Active promotions appear on the venue page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition shadow-lg"
        >
          <Plus className="w-4 h-4" /> New Promotion
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{total}</p>
        </div>
        <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">Active</p>
          <p className="text-2xl font-black text-green-700 mt-1">{promos.filter((p) => p.active).length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Businesses</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{new Set(promos.map((p) => p.businessId)).size}</p>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Business</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Service</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Discount</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Price</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Label</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Ends</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {promos.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{p.businessName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-700">{p.serviceName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-bold">
                      <Percent className="w-3 h-3" />
                      {p.discountPercent}% OFF
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-black text-rose-600">${p.discountedPrice}</span>
                      <span className="text-xs font-bold text-slate-400 line-through">${p.servicePrice}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-bold text-slate-500">{p.label || "—"}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-slate-400">
                      {p.endsAt ? new Date(p.endsAt).toLocaleDateString() : "No expiry"}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => void handleDelete(p.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {promos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Tag className="w-8 h-8 text-slate-300" />
                      <p className="text-sm text-slate-500">No promotions yet. Create one to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={total}
          pageSize={itemsPerPage}
          onPageChange={setPage}
        />
      </div>

      {/* ─── Create Promotion Modal ─── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-white relative">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="absolute top-4 right-4 rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">New Promotion</p>
              <h2 className="text-xl font-black">Create Discount Offer</h2>
            </div>

            <div className="p-8 space-y-5">
              {/* Business Select */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                  <Building2 className="w-3 h-3 inline mr-1" /> Business
                </label>
                <select
                  value={selectedBiz}
                  onChange={(e) => {
                    setSelectedBiz(e.target.value);
                    setSelectedSvc("");
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition"
                >
                  <option value="">Select business...</option>
                  {bizServices.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.services.length} services)
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Select */}
              {selectedBizObj && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                    <Scissors className="w-3 h-3 inline mr-1" /> Service
                  </label>
                  <select
                    value={selectedSvc}
                    onChange={(e) => setSelectedSvc(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition"
                  >
                    <option value="">Select service...</option>
                    {selectedBizObj.services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — ${s.price}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Discount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                    <Percent className="w-3 h-3 inline mr-1" /> Discount %
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={90}
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                    <Calendar className="w-3 h-3 inline mr-1" /> End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={endsAt}
                    onChange={(e) => setEndsAt(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition"
                  />
                </div>
              </div>

              {/* Label */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">
                  <Tag className="w-3 h-3 inline mr-1" /> Label (optional)
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder='e.g. "Summer Sale", "Early Bird"'
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition placeholder:text-slate-300"
                />
              </div>

              {/* Preview */}
              {selectedSvc && selectedBizObj && (() => {
                const svc = selectedBizObj.services.find((s) => s.id === selectedSvc);
                if (!svc) return null;
                const discounted = svc.price * (1 - discount / 100);
                return (
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Preview</p>
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-black px-3 py-1.5 rounded-full">
                        {label || `${discount}% OFF`}
                      </div>
                      <span className="text-lg font-black text-rose-600">${discounted.toFixed(2)}</span>
                      <span className="text-sm font-bold text-slate-400 line-through">${svc.price}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Submit */}
              <button
                type="button"
                disabled={!selectedBiz || !selectedSvc || discount <= 0 || creating}
                onClick={() => void handleCreate()}
                className={cn(
                  "w-full py-4 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg",
                  "bg-slate-900 text-white hover:bg-slate-800",
                  (creating || !selectedBiz || !selectedSvc) && "opacity-50 cursor-not-allowed",
                )}
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  "Create Promotion"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
