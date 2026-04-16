"use client";

import React, { useState } from "react";
import { 
  Clock,
  Eye,
  X
} from "lucide-react";
import bookingsData from "@/mock-data/admin-bookings.json";
import { formatDate, formatCurrency, cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    confirmed: "bg-green-100 text-green-700 hover:bg-green-200",
    pending: "bg-amber-100 text-amber-700 hover:bg-amber-200",
    cancelled: "bg-red-100 text-red-700 hover:bg-red-200",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full text-xs font-bold capitalize transition-colors", styles[status as keyof typeof styles])}>
      {status}
    </span>
  );
};

export default function BookingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState<(typeof bookingsData)[number] | null>(null);

  const filteredBookings = bookingsData.filter((booking) => {
    const normalized = searchTerm.toLowerCase();
    const matchesSearch =
      booking.id.toLowerCase().includes(normalized) ||
      booking.user.toLowerCase().includes(normalized) ||
      booking.email.toLowerCase().includes(normalized) ||
      booking.business.toLowerCase().includes(normalized);
    const matchesStatus = filterStatus === "all" || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Management</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor and manage all service appointments across the platform.</p>
      </div>

      <FilterToolbar
        searchPlaceholder="Search by booking id, customer, email, or business..."
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
              { label: "Confirmed", value: "confirmed" },
              { label: "Pending", value: "pending" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Booking ID</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer Email</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Business</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Date</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-bold text-blue-600 tracking-tight">{booking.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{booking.user}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{booking.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-600">{booking.business}</p>
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
                    <button
                      type="button"
                      onClick={() => setSelectedBooking(booking)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition shadow-sm border border-transparent hover:border-blue-100"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                    No bookings match the current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Booking Details</h2>
                <p className="text-xs text-slate-500">Reference: {selectedBooking.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-6">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Customer</p>
                <p className="text-sm font-semibold text-slate-900">{selectedBooking.user}</p>
                <p className="text-sm text-slate-600">{selectedBooking.email}</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Appointment</p>
                <p className="text-sm text-slate-700">Business: {selectedBooking.business}</p>
                <p className="text-sm text-slate-700">Date: {formatDate(selectedBooking.date)}</p>
                <p className="text-sm text-slate-700">Amount: {formatCurrency(selectedBooking.amount)}</p>
                <p className="mt-2">
                  <StatusBadge status={selectedBooking.status} />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
