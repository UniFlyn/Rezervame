"use client";

import React, { useEffect, useState } from "react";
import { 
  CheckCircle2,
  AlertCircle,
  X,
  Loader2
} from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import { formatCurrency, formatDate, formatMerchantNumericId, cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";
import TablePagination from "@/components/admin/TablePagination";
import { BusinessRecordDetail } from "@/components/admin/BusinessRecordDetail";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
    suspended: "bg-rose-100 text-rose-700 border border-rose-200",
    rejected: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  const key = (status || "").toLowerCase() as keyof typeof styles;
  const cls = styles[key] ?? "bg-slate-100 text-slate-600 border border-slate-200";
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", cls)}>
      {status || "unknown"}
    </span>
  );
};

const statusLabel = (value?: string | null) => {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "Unknown";
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function norm(s: unknown) {
  return String(s ?? "").toLowerCase();
}

export default function BusinessesPage() {
  const [businessesData, setBusinessesData] = useState<any[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [suspendTarget, setSuspendTarget] = useState<any | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [reactivateTarget, setReactivateTarget] = useState<any | null>(null);
  const [reactivateNote, setReactivateNote] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;
  const [zoomDocument, setZoomDocument] = useState<{ title: string; image: string } | null>(null);
  const [documentActionKey, setDocumentActionKey] = useState<string | null>(null);

  async function loadBusinesses() {
    setLoadState("loading");
    setLoadError(null);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: searchTerm,
        status: filterStatus,
      });
      const response = await apiGet<{ data: any[]; total: number; totalPages: number }>(`/admin/businesses?${query.toString()}`);
      setBusinessesData(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
      setLoadState("ready");
    } catch (e) {
      setBusinessesData([]);
      setLoadState("error");
      const msg = e instanceof Error ? e.message : "Failed to load businesses";
      setLoadError(msg);
      toastError("Could not load businesses", msg);
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      void loadBusinesses();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [page, searchTerm, filterStatus]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  async function refreshBusinesses() {
    void loadBusinesses();
  }

  async function openBusinessRecord(business: { id: string }) {
    setSelectedBusiness(business);
    setDetailLoading(true);
    try {
      const full = await apiGet<any>(`/admin/businesses/${business.id}`);
      setSelectedBusiness(full);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load business details";
      toastError("Could not load record", msg);
      setSelectedBusiness(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function approveBusiness(id: string) {
    try {
      await apiPatch(`/admin/businesses/${id}/status`, { status: "active" });
      await refreshBusinesses();
      toastSuccess("Business approved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toastError("Approve failed", msg);
      throw e;
    }
  }

  async function reactivateBusiness(id: string, note?: string) {
    try {
      await apiPatch(`/admin/businesses/${id}/status`, {
        status: "active",
        ...(note?.trim() ? { reason: note.trim() } : {}),
      });
      await refreshBusinesses();
      toastSuccess("Business re-activated");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toastError("Re-activate failed", msg);
      throw e;
    }
  }

  async function rejectBusiness(id: string, reason: string) {
    try {
      await apiPatch(`/admin/businesses/${id}/status`, { status: "rejected", reason });
      await refreshBusinesses();
      toastSuccess("Business rejected");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toastError("Reject failed", msg);
      throw e;
    }
  }

  async function suspendBusiness(id: string, reason: string) {
    try {
      await apiPatch(`/admin/businesses/${id}/status`, { status: "suspended", reason });
      await refreshBusinesses();
      toastSuccess("Business suspended");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toastError("Suspend failed", msg);
      throw e;
    }
  }

  async function deleteBusiness(id: string) {
    const ok = window.confirm("Delete this business permanently?");
    if (!ok) return;
    try {
      await apiDelete(`/admin/businesses/${id}`);
      await refreshBusinesses();
      toastSuccess("Business deleted");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toastError("Delete failed", msg);
      throw e;
    }
  }

  async function setDocumentVerification(
    businessId: string,
    document: "id" | "license" | "insurance",
    approved: boolean,
  ) {
    const key = `${businessId}-${document}`;
    setDocumentActionKey(key);
    try {
      await apiPatch(`/admin/businesses/${businessId}/documents`, { document, approved });
      // Refresh current page
      await loadBusinesses();
      
      // Update selected business if open
      if (selectedBusiness && selectedBusiness.id === businessId) {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          search: searchTerm,
          status: filterStatus,
        });
        const response = await apiGet<{ data: any[] }>(`/admin/businesses?${query.toString()}`);
        const updated = response.data.find(b => b.id === businessId);
        if (updated) setSelectedBusiness(updated);
      }
      
      toastSuccess(approved ? "Document approved" : "Document unapproved");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      toastError("Document update failed", msg);
      throw e;
    } finally {
      setDocumentActionKey(null);
    }
  }

  const pagedBusinesses = businessesData;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merchant Registry</h1>
          <p className="text-slate-500 text-sm mt-1">Review, approve, and manage all platform service providers.</p>
        </div>
      </div>

      {loadState === "loading" ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center text-sm text-slate-600">
          Loading businesses…
        </div>
      ) : null}

      {loadState === "error" ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 px-6 py-8 text-center">
          <AlertCircle className="h-8 w-8 text-rose-600" aria-hidden />
          <p className="text-sm font-medium text-rose-900">Could not load the merchant list</p>
          {loadError ? <p className="max-w-lg text-xs text-rose-800/90 break-words">{loadError}</p> : null}
          <button
            type="button"
            onClick={() => void loadBusinesses()}
            className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-800"
          >
            Retry
          </button>
        </div>
      ) : null}

      {loadState === "ready" ? (
        <>
      <FilterToolbar
        searchPlaceholder="Search by business, owner, tax id, merchant ID…"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterGroups={[
          {
            key: "business-status",
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { label: "All", value: "all" },
              { label: "Active", value: "active" },
              { label: "Pending", value: "pending" },
              { label: "Suspended", value: "suspended" },
              { label: "Rejected", value: "rejected" },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Business</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Merchant ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tax ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Categories</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Revenue (LTD)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 relative">
              {businessesData.map((business, index) => (
                <tr key={business.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{(page - 1) * pageSize + index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 text-sm">{business.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{business.address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono tabular-nums tracking-wide text-slate-700">{formatMerchantNumericId(business.merchantNumber)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-slate-700">{business.taxId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700">{business.owner}</p>
                    <p className="text-xs text-slate-500">{business.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {(business.categoryKeys || []).length > 0 ? (
                        (business.categoryKeys || []).slice(0, 3).map((key: string) => (
                          <span
                            key={key}
                            className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600"
                          >
                            {key}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400">No categories</span>
                      )}
                      {(business.categoryKeys || []).length > 3 ? (
                        <span className="text-[10px] font-semibold text-slate-500">
                          +{(business.categoryKeys || []).length - 3}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={business.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(business.revenue)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {business.status === "suspended" || business.status === "rejected" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReactivateTarget(business);
                            setReactivateNote("");
                          }}
                          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Re-activate
                        </button>
                      ) : (
                        <button 
                          type="button"
                          onClick={() => void approveBusiness(business.id)}
                          className="rounded-lg border border-emerald-200 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setSuspendTarget(business);
                          setSuspendReason("");
                        }}
                        className="rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                      >
                        Suspend
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejectTarget(business);
                          setRejectReason("");
                        }}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Reject
                      </button>
                      <button 
                        type="button"
                        onClick={() => void deleteBusiness(business.id)}
                        className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                      >
                        Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => void openBusinessRecord(business)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                      >
                        View Record
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {businessesData.length === 0 && loadState === "ready" ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-sm text-slate-500">
                    No businesses found for current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <TablePagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>
        </>
      ) : null}

      {selectedBusiness ? (
        <BusinessRecordDetail
          business={detailLoading ? null : selectedBusiness}
          loading={detailLoading}
          onClose={() => setSelectedBusiness(null)}
        >
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Verification</p>
                <div className="space-y-2 mb-4">
                  {[
                    { key: "ID verified", ok: selectedBusiness.documents?.id_verified },
                    { key: "License verified", ok: selectedBusiness.documents?.license_verified },
                    { key: "Insurance verified", ok: selectedBusiness.documents?.insurance_verified },
                  ].map((doc) => (
                    <div key={doc.key} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-sm text-slate-700">{doc.key}</span>
                      {doc.ok ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                  ))}
                </div>
                {selectedBusiness.rejectionReason ? (
                  <div className="rounded-lg border border-rose-100 bg-rose-50 p-3 mb-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-rose-600 mb-1">
                      {selectedBusiness.status === "suspended" ? "Suspension reason" : "Rejection reason"}
                    </p>
                    <p className="text-sm text-rose-700">{selectedBusiness.rejectionReason}</p>
                  </div>
                ) : null}
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Uploaded Documents</p>
                <div className="grid gap-4 md:grid-cols-3">
                  {(
                    [
                      {
                        title: "ID Copy",
                        image: selectedBusiness.idDocumentImage,
                        key: "id" as const,
                        verified: Boolean(selectedBusiness.documents?.id_verified),
                      },
                      {
                        title: "License Copy",
                        image: selectedBusiness.licenseDocumentImage,
                        key: "license" as const,
                        verified: Boolean(selectedBusiness.documents?.license_verified),
                      },
                      {
                        title: "Insurance Copy",
                        image: selectedBusiness.insuranceDocumentImage,
                        key: "insurance" as const,
                        verified: Boolean(selectedBusiness.documents?.insurance_verified),
                      },
                    ] as const
                  ).map((doc) => {
                    const busy = documentActionKey === `${selectedBusiness.id}-${doc.key}`;
                    return (
                      <div key={doc.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <p className="text-[11px] font-semibold text-slate-700">{doc.title}</p>
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wide",
                                doc.verified ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700",
                              )}
                            >
                              {doc.verified ? "Approved" : "Not verified"}
                            </span>
                            {doc.image ? (
                              <a
                                href={doc.image}
                                download={`${selectedBusiness.name || "business"}-${doc.title.toLowerCase().replace(/\s+/g, "-")}.png`}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              >
                                Download
                              </a>
                            ) : null}
                          </div>
                        </div>
                        {doc.image ? (
                          <button
                            type="button"
                            onClick={() => setZoomDocument({ title: doc.title, image: doc.image as string })}
                            className="w-full text-left"
                          >
                            <img
                              src={doc.image}
                              alt={doc.title}
                              className="h-32 w-full rounded-md object-cover border border-slate-200 transition hover:opacity-90"
                            />
                          </button>
                        ) : (
                          <div className="h-32 w-full rounded-md border border-dashed border-slate-200 bg-white flex items-center justify-center text-xs text-slate-400">
                            Not uploaded
                          </div>
                        )}
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void setDocumentVerification(selectedBusiness.id, doc.key, true)}
                            className="flex-1 rounded-lg border border-emerald-200 bg-white py-2 text-[10px] font-bold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void setDocumentVerification(selectedBusiness.id, doc.key, false)}
                            className="flex-1 rounded-lg border border-rose-200 bg-white py-2 text-[10px] font-bold uppercase tracking-wide text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">Status History</p>
                <div className="space-y-3">
                  {(selectedBusiness.statusHistory || []).length > 0 ? (
                    (selectedBusiness.statusHistory || []).map((item: any) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-slate-800">
                            {statusLabel(item.fromStatus)} {"->"} {statusLabel(item.toStatus)}
                          </p>
                          <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">
                          By: {item.actorName || "System"} {item.actorRole ? `(${item.actorRole})` : ""}
                        </p>
                        {item.reason ? <p className="mt-1 text-sm text-slate-700">{item.reason}</p> : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No status history yet.</p>
                  )}
                </div>
              </div>
            </div>
        </BusinessRecordDetail>
      ) : null}

      {zoomDocument ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">{zoomDocument.title}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={zoomDocument.image}
                  download={`${zoomDocument.title.toLowerCase().replace(/\s+/g, "-")}.png`}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setZoomDocument(null)}
                  className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4">
              <img
                src={zoomDocument.image}
                alt={zoomDocument.title}
                className="max-h-[75vh] w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
              />
            </div>
          </div>
        </div>
      ) : null}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Reject Business</h3>
            <p className="text-sm text-slate-600">
              Business: <span className="font-semibold">{rejectTarget.name}</span>
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason..."
              className="w-full min-h-28 rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-rose-200"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toastWarning("Reason required", "Enter a rejection reason before confirming.");
                    return;
                  }
                  void (async () => {
                    try {
                      await rejectBusiness(rejectTarget.id, rejectReason.trim());
                      setRejectTarget(null);
                      setRejectReason("");
                      setSelectedBusiness(null);
                    } catch {
                      /* toasted */
                    }
                  })();
                }}
                className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
                disabled={!rejectReason.trim()}
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
      {suspendTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Suspend Business</h3>
            <p className="text-sm text-slate-600">
              Business: <span className="font-semibold">{suspendTarget.name}</span>
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Enter suspension reason..."
              className="w-full min-h-28 rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-amber-200"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSuspendTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!suspendReason.trim()) {
                    toastWarning("Reason required", "Enter a suspension reason before confirming.");
                    return;
                  }
                  void (async () => {
                    try {
                      await suspendBusiness(suspendTarget.id, suspendReason.trim());
                      setSuspendTarget(null);
                      setSuspendReason("");
                      setSelectedBusiness(null);
                    } catch {
                      /* toasted */
                    }
                  })();
                }}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-50"
                disabled={!suspendReason.trim()}
              >
                Confirm Suspend
              </button>
            </div>
          </div>
        </div>
      )}
      {reactivateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Re-activate Business</h3>
            <p className="text-sm text-slate-600">
              Business: <span className="font-semibold">{reactivateTarget.name}</span>
            </p>
            <textarea
              value={reactivateNote}
              onChange={(e) => setReactivateNote(e.target.value)}
              placeholder="Optional note for re-activation..."
              className="w-full min-h-24 rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-200"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReactivateTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void (async () => {
                    try {
                      await reactivateBusiness(reactivateTarget.id, reactivateNote);
                      setReactivateTarget(null);
                      setReactivateNote("");
                      setSelectedBusiness(null);
                    } catch {
                      /* toasted */
                    }
                  })();
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Confirm Re-activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
