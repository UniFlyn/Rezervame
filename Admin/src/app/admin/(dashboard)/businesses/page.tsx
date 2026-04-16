"use client";

import React, { useState } from "react";
import { 
  CheckCircle2,
  AlertCircle,
  MapPin,
  X
} from "lucide-react";
import businessesData from "@/mock-data/admin-businesses.json";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    pending: "bg-amber-100 text-amber-700 border border-amber-200",
    suspended: "bg-rose-100 text-rose-700 border border-rose-200",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", styles[status as keyof typeof styles])}>
      {status}
    </span>
  );
};

export default function BusinessesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBusiness, setSelectedBusiness] = useState<(typeof businessesData)[number] | null>(null);

  const filteredBusinesses = businessesData.filter(business => {
    const normalized = searchTerm.toLowerCase();
    const matchesSearch =
      business.name.toLowerCase().includes(normalized) ||
      business.owner.toLowerCase().includes(normalized) ||
      business.email.toLowerCase().includes(normalized) ||
      business.id.toLowerCase().includes(normalized) ||
      business.taxId.toLowerCase().includes(normalized);
    const matchesStatus = filterStatus === "all" || business.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Merchant Registry</h1>
          <p className="text-slate-500 text-sm mt-1">Review, approve, and manage all platform service providers.</p>
        </div>
      </div>

      <FilterToolbar
        searchPlaceholder="Search by business, owner, tax id, business id..."
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
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Business ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tax ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">Owner</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-center">Revenue (LTD)</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBusinesses.map((business, index) => (
                <tr key={business.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">{index + 1}</td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 text-sm">{business.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{business.address}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-slate-700">{business.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-mono text-slate-700">{business.taxId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-slate-700">{business.owner}</p>
                    <p className="text-xs text-slate-500">{business.email}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <StatusBadge status={business.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <p className="text-sm font-semibold text-slate-900">{formatCurrency(business.revenue)}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      type="button"
                      onClick={() => setSelectedBusiness(business)}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                    >
                      View Record
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                    No businesses found for current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBusiness && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Business Record</h2>
                <p className="text-xs text-slate-500">Business ID: {selectedBusiness.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBusiness(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Business Profile</p>
                <p className="text-lg font-semibold text-slate-900">{selectedBusiness.name}</p>
                <p className="text-sm text-slate-700">{selectedBusiness.description}</p>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>{selectedBusiness.address}</span>
                </div>
                <p className="text-sm text-slate-700">Owner: {selectedBusiness.owner}</p>
                <p className="text-sm text-slate-700">Phone: {selectedBusiness.phone}</p>
                <p className="text-sm text-slate-700">Email: {selectedBusiness.email}</p>
              </div>

              <div className="space-y-3 rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verification</p>
                <p className="text-sm text-slate-700">Tax ID: {selectedBusiness.taxId}</p>
                <p className="text-sm text-slate-700">Joined: {formatDate(selectedBusiness.joinedDate)}</p>
                <p className="text-sm text-slate-700">Revenue: {formatCurrency(selectedBusiness.revenue)}</p>
                <div className="space-y-2 pt-2">
                  {[
                    { key: "ID verified", ok: selectedBusiness.documents.id_verified },
                    { key: "License verified", ok: selectedBusiness.documents.license_verified },
                    { key: "Insurance verified", ok: selectedBusiness.documents.insurance_verified },
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
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedBusiness(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
