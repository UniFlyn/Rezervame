"use client";

import React, { useEffect, useState } from "react";
import {
  Clock,
  Eye,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  Calendar,
  DollarSign,
  User,
  Building2,
  Scissors,
} from "lucide-react";
import { apiDelete, apiGet, apiPatch } from "@/lib/api";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";
import TablePagination from "@/components/admin/TablePagination";

/* ─── Status Config ─── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  pending:   { label: "Pending",   bg: "bg-amber-50 border-amber-200",   text: "text-amber-700", icon: <Clock className="w-3 h-3" /> },
  approved:  { label: "Approved",  bg: "bg-blue-50 border-blue-200",     text: "text-blue-700",  icon: <CheckCircle className="w-3 h-3" /> },
  completed: { label: "Completed", bg: "bg-green-50 border-green-200",   text: "text-green-700", icon: <CheckCircle className="w-3 h-3" /> },
  cancelled: { label: "Cancelled", bg: "bg-slate-100 border-slate-200",  text: "text-slate-500", icon: <XCircle className="w-3 h-3" /> },
  rejected:  { label: "Rejected",  bg: "bg-red-50 border-red-200",       text: "text-red-600",   icon: <XCircle className="w-3 h-3" /> },
  confirmed: { label: "Confirmed", bg: "bg-blue-50 border-blue-200",     text: "text-blue-700",  icon: <CheckCircle className="w-3 h-3" /> },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border transition-colors", s.bg, s.text)}>
      {s.icon} {s.label}
    </span>
  );
};

/* ─── Action buttons config per status ─── */
function getActions(status: string): { label: string; newStatus: string; style: string; icon: React.ReactNode }[] {
  switch (status) {
    case "pending":
      return [
        { label: "Approve", newStatus: "Approved", style: "bg-green-600 hover:bg-green-700 text-white", icon: <CheckCircle className="w-3.5 h-3.5" /> },
        { label: "Reject",  newStatus: "Rejected", style: "bg-red-500 hover:bg-red-600 text-white",     icon: <XCircle className="w-3.5 h-3.5" /> },
      ];
    default:
      return [];
  }
}

export default function BookingsPage() {
  const [bookingsData, setBookingsData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          status: filterStatus,
          search: searchTerm,
        });
        const response = await apiGet<{ data: any[]; total: number; totalPages: number }>(`/admin/bookings?${query.toString()}`);
        setBookingsData(response.data);
        setTotalItems(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        console.error("Failed to fetch bookings", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchBookings();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [page, searchTerm, filterStatus]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  /* ─── Update booking status ─── */
  async function updateStatus(bookingId: string, newStatus: string) {
    setUpdatingId(bookingId);
    try {
      const result = await apiPatch<any>(`/admin/bookings/${bookingId}/status`, { status: newStatus });
      // Update local state with new status
      setBookingsData((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: result.status } : b)),
      );
      // Also update the selected booking if it's open
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev: any) => prev ? { ...prev, status: result.status } : null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  async function deleteBooking(id: string) {
    if (!window.confirm("Delete this booking permanently?")) return;
    await apiDelete(`/admin/bookings/${id}`);
    setBookingsData((prev) => prev.filter((row) => row.id !== id));
    setTotalItems(prev => prev - 1);
  }

  /* ─── Stats ─── */
  // Note: These stats are now per page or we'd need another endpoint for total stats.
  // For now, let's keep it simple or fetch total stats if needed.
  const stats = {
    total: totalItems,
    pending: bookingsData.filter((b) => b.status === "pending").length,
    approved: bookingsData.filter((b) => b.status === "approved" || b.status === "confirmed").length,
  };

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Management</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor and manage all service appointments. Approve or reject bookings.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, color: "bg-slate-50 border-slate-200 text-slate-900" },
          { label: "Pending", value: stats.pending, color: "bg-amber-50 border-amber-200 text-amber-700" },
          { label: "Approved", value: stats.approved, color: "bg-blue-50 border-blue-200 text-blue-700" },
        ].map((s) => (
          <div key={s.label} className={cn("rounded-2xl border p-4 transition-all", s.color)}>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{s.label}</p>
            <p className="text-2xl font-black mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <FilterToolbar
        searchPlaceholder="Search by booking id, customer, email, service, or business..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterGroups={[
          {
            key: "booking-status",
            label: "Status",
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Approved", value: "approved" },
              { label: "Confirmed", value: "confirmed" },
              { label: "Rejected", value: "rejected" },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Business</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Service</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              )}
              {bookingsData.map((booking) => {
                const actions = getActions(booking.status);
                const isLoading = updatingId === booking.id;
                return (
                  <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">{booking.user}</p>
                        <p className="text-xs text-slate-400">{booking.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-slate-600">{booking.business}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-700">{booking.service || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-slate-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{formatDate(booking.date)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-900">{formatCurrency(booking.amount)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={booking.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {actions.map((action) => (
                          <button
                            key={action.newStatus}
                            type="button"
                            disabled={isLoading}
                            onClick={() => void updateStatus(booking.id, action.newStatus)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-sm",
                              action.style,
                              isLoading && "opacity-50 cursor-not-allowed",
                            )}
                          >
                            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : action.icon}
                            {action.label}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setSelectedBooking(booking)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition shadow-sm border border-transparent hover:border-blue-100"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bookingsData.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="text-sm text-slate-500">No bookings match the current filters.</p>
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
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* ─── Detail Modal ─── */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-8 py-6 text-white relative">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="absolute top-4 right-4 rounded-xl p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1">Booking Details</p>
              <h2 className="text-xl font-black">#{selectedBooking.id.slice(0, 8).toUpperCase()}</h2>
              <div className="mt-3">
                <StatusBadge status={selectedBooking.status} />
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Customer</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedBooking.user}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedBooking.email}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Business</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedBooking.business}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Appointment</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatDate(selectedBooking.date)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Amount</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{formatCurrency(selectedBooking.amount)}</p>
                </div>
              </div>

              {selectedBooking.service && (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Scissors className="w-4 h-4 text-slate-400" />
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Service</p>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{selectedBooking.service}</p>
                </div>
              )}

              {/* Status Flow Indicator */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-3">Booking Lifecycle</p>
                <div className="flex items-center gap-2 text-xs font-bold">
                  {["pending", "approved", "completed"].map((step, i) => {
                    const isCurrent = selectedBooking.status === step;
                    const isPast =
                      (step === "pending" && ["approved", "completed"].includes(selectedBooking.status)) ||
                      (step === "approved" && selectedBooking.status === "completed");
                    const isTerminal = ["cancelled", "rejected"].includes(selectedBooking.status);
                    return (
                      <React.Fragment key={step}>
                        {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                        <span
                          className={cn(
                            "px-3 py-1 rounded-lg capitalize transition-all",
                            isCurrent && "bg-blue-100 text-blue-700 ring-2 ring-blue-300",
                            isPast && "bg-green-100 text-green-700",
                            !isCurrent && !isPast && !isTerminal && "bg-slate-100 text-slate-400",
                            isTerminal && "bg-slate-100 text-slate-300",
                          )}
                        >
                          {step}
                        </span>
                      </React.Fragment>
                    );
                  })}
                  {["cancelled", "rejected"].includes(selectedBooking.status) && (
                    <>
                      <ChevronRight className="w-3 h-3 text-slate-300" />
                      <span className="px-3 py-1 rounded-lg bg-red-100 text-red-600 ring-2 ring-red-300 capitalize">
                        {selectedBooking.status}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {getActions(selectedBooking.status).length > 0 && (
                <div className="flex gap-3 pt-2">
                  {getActions(selectedBooking.status).map((action) => (
                    <button
                      key={action.newStatus}
                      type="button"
                      disabled={updatingId === selectedBooking.id}
                      onClick={() => void updateStatus(selectedBooking.id, action.newStatus)}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all shadow-md",
                        action.style,
                        updatingId === selectedBooking.id && "opacity-50 cursor-not-allowed",
                      )}
                    >
                      {updatingId === selectedBooking.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        action.icon
                      )}
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Delete */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    void deleteBooking(selectedBooking.id);
                    setSelectedBooking(null);
                  }}
                  className="text-[11px] font-bold text-red-500 hover:text-red-700 uppercase tracking-widest transition"
                >
                  Delete Booking Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
