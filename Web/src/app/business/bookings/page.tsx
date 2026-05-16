'use client';

import React, { useEffect, useState } from 'react';
import {
  Clock,
  Eye,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ChevronLeft,
  Calendar,
  DollarSign,
  User,
  Building2,
  Scissors,
  Search,
  Filter,
} from 'lucide-react';
import { apiDelete, apiGet, apiPatch } from '@/lib/api';
import { useBusinessStore } from '../../../store/businessStore';
import clsx from 'clsx';

/* ─── Status Config ─── */
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  Pending:   { label: "Pending",   bg: "bg-amber-50 border-amber-200",   text: "text-amber-700", icon: <Clock className="w-3 h-3" /> },
  Approved:  { label: "Approved",  bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700",  icon: <CheckCircle className="w-3 h-3" /> },
  Paid:      { label: "Paid",      bg: "bg-blue-50 border-blue-200",     text: "text-blue-700",  icon: <DollarSign className="w-3 h-3" /> },
  Completed: { label: "Completed", bg: "bg-cyan-50 border-cyan-200",   text: "text-cyan-700", icon: <CheckCircle className="w-3 h-3" /> },
  Cancelled: { label: "Cancelled", bg: "bg-slate-100 border-slate-200",  text: "text-slate-500", icon: <XCircle className="w-3 h-3" /> },
  Rejected:  { label: "Rejected",  bg: "bg-red-50 border-red-200",       text: "text-red-600",   icon: <XCircle className="w-3 h-3" /> },
  Rescheduled: { label: "Rescheduled", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: <Clock className="w-3 h-3" /> },
};

const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
  return (
    <span className={clsx("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors", s.bg, s.text)}>
      {s.icon} {s.label}
    </span>
  );
};

export default function BusinessBookingsPage() {
  const business = useBusinessStore((state) => state.business);
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
    if (!business) return;

    const fetchBookings = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          status: filterStatus,
          search: searchTerm,
        });
        const response = await apiGet<{ data: any[]; total: number; totalPages: number }>(`/business/${business.id}/bookings?${query.toString()}`, 'BUSINESS');
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
  }, [page, searchTerm, filterStatus, business]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterStatus]);

  async function updateStatus(bookingId: string, newStatus: string) {
    setUpdatingId(bookingId);
    try {
      const result = await apiPatch<any>(`/bookings/${bookingId}`, { status: newStatus }, 'BUSINESS');
      setBookingsData((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: result.status } : b)),
      );
      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev: any) => prev ? { ...prev, status: result.status } : null);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Booking Management</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Flat list of all your appointments. Use filters to find specific bookings.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none transition-all shadow-sm"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Rejected">Rejected</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Service</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date & Time</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Price</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}
              {bookingsData.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
                        {booking.customerName.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800 tracking-tight">{booking.customerName}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{booking.user?.email || 'Walk-in'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-bold text-slate-600 tracking-tight">{booking.service?.name || "—"}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{booking.staff?.name || 'Any Staff'}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-bold tracking-tight">{formatDate(booking.date)}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-slate-900 tracking-tighter">${Number(booking.price || 0).toFixed(2)}</p>
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={booking.status} />
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/10"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {bookingsData.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center border border-slate-100">
                        <AlertCircle className="w-8 h-8 text-slate-300" />
                      </div>
                      <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No bookings found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
             Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalItems)} of {totalItems} entries
           </p>
           <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2 bg-white border border-slate-200 rounded-xl disabled:opacity-50 hover:bg-slate-50 transition-all shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 p-10 text-white relative">
              <button
                onClick={() => setSelectedBooking(null)}
                className="absolute top-8 right-8 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">Booking Details</p>
              <h2 className="text-2xl font-black tracking-tighter uppercase">#{selectedBooking.id.slice(0, 8)}</h2>
              <div className="mt-4">
                <StatusBadge status={selectedBooking.status} />
              </div>
            </div>

            {/* Body */}
            <div className="p-10 space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Customer</label>
                   <p className="text-sm font-black text-slate-900">{selectedBooking.customerName}</p>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Service</label>
                   <p className="text-sm font-black text-slate-900">{selectedBooking.service?.name || '—'}</p>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Date & Time</label>
                   <p className="text-sm font-black text-slate-900">{formatDate(selectedBooking.date)}</p>
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Price</label>
                   <p className="text-sm font-black text-primary tracking-tighter">${Number(selectedBooking.price || 0).toFixed(2)}</p>
                </div>
              </div>

              {/* Status Flow */}
              <div className="pt-8 border-t border-slate-100 flex gap-2">
                {selectedBooking.status === 'Pending' && (
                  <>
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'Approved')}
                      className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(selectedBooking.id, 'Rejected')}
                      className="flex-1 bg-red-50 text-red-600 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition"
                    >
                      Reject
                    </button>
                  </>
                )}
                {(selectedBooking.status === 'Approved' || selectedBooking.status === 'Paid') && (
                  <button
                    onClick={() => updateStatus(selectedBooking.id, 'Completed')}
                    className="flex-1 bg-primary text-white font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                  >
                    Mark as Completed
                  </button>
                )}
                {selectedBooking.status !== 'Cancelled' && selectedBooking.status !== 'Completed' && (
                   <button
                    onClick={() => updateStatus(selectedBooking.id, 'Cancelled')}
                    className="flex-1 bg-slate-100 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronDown(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
