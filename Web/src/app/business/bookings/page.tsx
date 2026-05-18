'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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
  Menu,
  LayoutDashboard,
  Settings,
  Users,
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
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [confirmApprovalBooking, setConfirmApprovalBooking] = useState<any | null>(null);

  useEffect(() => {
    if (!business) return;
    const fetchStaff = async () => {
      try {
        const res = await apiGet<{ data: any[] }>(`/business/${business.id}/staff?limit=100`, 'BUSINESS');
        setStaffList(res.data || []);
      } catch (err) {
        console.error("Failed to fetch staff", err);
      }
    };
    fetchStaff();
  }, [business]);

  const handleUpdateStatus = async (bookingId: string, newStatus: string, updatedStaffId?: string | null) => {
    if (!business) return;
    setUpdatingId(bookingId);
    try {
      const payload: any = { status: newStatus };
      if (updatedStaffId !== undefined) {
        payload.staffId = updatedStaffId;
      }
      await apiPatch(`/bookings/${bookingId}`, payload, 'BUSINESS');
      
      setBookingsData(prev => prev.map(b => {
        if (b.id === bookingId) {
          const matchingStaff = staffList.find(s => s.id === updatedStaffId);
          return { 
            ...b, 
            status: newStatus,
            staffId: updatedStaffId !== undefined ? updatedStaffId : b.staffId,
            staff: matchingStaff ? { id: updatedStaffId, name: matchingStaff.name } : b.staff
          };
        }
        return b;
      }));

      if (selectedBooking?.id === bookingId) {
        setSelectedBooking((prev: any) => {
          const matchingStaff = staffList.find(s => s.id === updatedStaffId);
          return {
            ...prev,
            status: newStatus,
            staffId: updatedStaffId !== undefined ? updatedStaffId : prev.staffId,
            staff: matchingStaff ? { id: updatedStaffId, name: matchingStaff.name } : prev.staff
          };
        });
      }
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

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
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl uppercase">
            Booking Management
          </h1>
          <p className="mt-0.5 text-sm text-slate-500 font-medium">
            Flat list of all your appointments. Use filters to find specific bookings.
          </p>
        </div>
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
                  <td className="px-8 py-5">
                    <div className="flex items-center justify-end gap-2">
                      {booking.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => setConfirmApprovalBooking(booking)}
                            disabled={updatingId === booking.id}
                            className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-sm shadow-green-200 disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, 'Rejected')}
                            disabled={updatingId === booking.id}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-sm shadow-red-200 disabled:opacity-50"
                          >
                            {updatingId === booking.id ? '...' : 'Reject'}
                          </button>
                        </>
                      )}
                      {booking.status === 'Paid' && (
                        <button
                          onClick={() => handleUpdateStatus(booking.id, 'Completed')}
                          disabled={updatingId === booking.id}
                          className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white text-[10px] font-black uppercase rounded-lg transition-all shadow-sm shadow-cyan-200 disabled:opacity-50"
                        >
                          {updatingId === booking.id ? '...' : 'Complete'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(booking)}
                        className="p-3 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/10"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
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
                <div className="col-span-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Professional (Reassign if needed)</label>
                   {selectedBooking.status === 'Pending' ? (
                     <div className="relative">
                       <select
                         value={selectedBooking.staffId || ""}
                         onChange={(e) => {
                           const newStaffId = e.target.value || null;
                           const chosenStaff = staffList.find(s => s.id === newStaffId);
                           setSelectedBooking((prev: any) => ({
                             ...prev,
                             staffId: newStaffId,
                             staff: chosenStaff ? { id: newStaffId, name: chosenStaff.name } : null
                           }));
                           setBookingsData(prev => prev.map(b => 
                             b.id === selectedBooking.id 
                               ? { ...b, staffId: newStaffId, staff: chosenStaff ? { id: newStaffId, name: chosenStaff.name } : null } 
                               : b
                           ));
                         }}
                         className="w-full pl-4 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none transition-all shadow-sm"
                       >
                         <option value="">Any Staff (No specific staff)</option>
                         {staffList.map((s) => (
                           <option key={s.id} value={s.id}>{s.name} ({s.role || "Professional"})</option>
                         ))}
                       </select>
                       <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                     </div>
                   ) : (
                     <p className="text-sm font-black text-slate-900">{selectedBooking.staff?.name || 'Any Staff'}</p>
                   )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedBooking.status === 'Pending' && (
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setConfirmApprovalBooking(selectedBooking)}
                    disabled={updatingId === selectedBooking.id}
                    className="flex-1 py-4 bg-green-600 hover:bg-green-700 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-xl shadow-green-200 disabled:opacity-50"
                  >
                    {updatingId === selectedBooking.id ? 'Updating...' : 'Approve Booking'}
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'Rejected')}
                    disabled={updatingId === selectedBooking.id}
                    className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-xl shadow-red-200 disabled:opacity-50"
                  >
                    {updatingId === selectedBooking.id ? 'Updating...' : 'Reject Booking'}
                  </button>
                </div>
              )}
              {selectedBooking.status === 'Paid' && (
                <div className="flex pt-4">
                  <button
                    onClick={() => handleUpdateStatus(selectedBooking.id, 'Completed')}
                    disabled={updatingId === selectedBooking.id}
                    className="flex-1 py-4 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-xl shadow-cyan-200 disabled:opacity-50"
                  >
                    {updatingId === selectedBooking.id ? 'Updating...' : 'Mark as Completed'}
                  </button>
                </div>
              )}

              <div className="pt-8 border-t border-slate-100">
                <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Business Management Portal
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmApprovalBooking && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-[40px] shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300 overflow-hidden">
            {/* Upper banner */}
            <div className="bg-emerald-600 p-8 text-white text-center relative">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight">Confirm Booking Approval</h3>
              <p className="text-xs text-emerald-100 mt-1">Please review the details below before approving.</p>
            </div>

            {/* Details panel */}
            <div className="p-8 space-y-6">
              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 text-xs font-bold text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-widest text-[9px]">Customer</span>
                  <span className="text-slate-900 font-black">{confirmApprovalBooking.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-widest text-[9px]">Service</span>
                  <span className="text-slate-900 font-black">{confirmApprovalBooking.service?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-widest text-[9px]">Assigned Staff</span>
                  <span className="text-primary font-black">{confirmApprovalBooking.staff?.name || "Any Staff"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 uppercase tracking-widest text-[9px]">Date & Time</span>
                  <span className="text-slate-900 font-black">{formatDate(confirmApprovalBooking.date)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200/60 pt-3">
                  <span className="text-slate-400 uppercase tracking-widest text-[9px]">Total price</span>
                  <span className="text-slate-900 font-black text-sm">${Number(confirmApprovalBooking.price || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmApprovalBooking(null)}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black uppercase rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await handleUpdateStatus(
                      confirmApprovalBooking.id, 
                      'Approved', 
                      confirmApprovalBooking.staffId
                    );
                    setConfirmApprovalBooking(null);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase rounded-2xl transition-all shadow-xl shadow-emerald-200"
                >
                  Yes, Approve
                </button>
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
