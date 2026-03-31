"use client";

import React, { useState } from "react";
import { 
  Search, 
  Calendar, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock,
  ChevronRight,
  Eye
} from "lucide-react";
import bookingsData from "@/mock-data/admin-bookings.json";
import { formatDate, formatCurrency, cn } from "@/lib/utils";

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
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredBookings = bookingsData.filter(booking => 
    filterStatus === "all" || booking.status === filterStatus
  );

  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Booking Management</h1>
        <p className="text-slate-500 text-sm mt-1">Monitor and manage all service appointments across the platform.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
          {["all", "confirmed", "pending", "cancelled"].map((status) => (
            <button 
              key={status}
              onClick={() => setFilterStatus(status)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                filterStatus === status 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "text-slate-500 hover:bg-slate-50"
              )}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition shadow-sm w-full md:w-auto">
            <Calendar className="w-4 h-4" />
            Pick Date Range
          </button>
          <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition shadow-sm">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Booking ID</th>
                <th className="px-6 py-5 text-xs font-bold text-slate-400 uppercase tracking-widest">Customer</th>
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
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition shadow-sm border border-transparent hover:border-blue-100">
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
