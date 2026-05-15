"use client";
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useBookingsStore, Booking } from '../../../store/bookingsStore';
import { useServicesStore } from '../../../store/servicesStore';
import { useStaffStore, Staff } from '../../../store/staffStore';
import { useBusinessStore } from '../../../store/businessStore';
import { Eye, X, Mail, Phone, Search, Loader2 } from 'lucide-react';
import { apiGet } from '@/lib/api';
import type { PanelCustomerRow } from '@/lib/business-panel-types';
import { Pagination } from '@/components/ui/pagination';

export default function UsersPage() {
  const business = useBusinessStore((state) => state.business);
  const bookings = useBookingsStore((state) => state.bookings);
  const services = useServicesStore((state) => state.services);
  const staffMembers = useStaffStore((state) => state.staff);

  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: ['panel-customers', business?.id, page, debouncedSearch],
    enabled: Boolean(business?.id),
    queryFn: () => {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: debouncedSearch,
      });
      return apiGet<{ data: PanelCustomerRow[]; total: number; totalPages: number }>(
        `/business/${business!.id}/panel/customers?${query.toString()}`,
        'BUSINESS'
      );
    },
  });

  const customers = data?.data ?? [];
  const totalItems = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const selectedCustomer = customers.find((c) => c.userId === selectedCustomerId);
  const selectedUserBookings = bookings.filter((b) => b.userId === selectedCustomerId);

  const getServiceName = (id: string | null) =>
    id ? services.find((s) => s.id === id)?.name || '—' : '—';
  const getStaffName = (id: string | null) =>
    id ? staffMembers.find((s: Staff) => s.id === id)?.name || '—' : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 uppercase">Customers</h2>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
          />
        </div>
      </div>

      {error instanceof Error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error.message}
          <button
            type="button"
            onClick={() => void refetch()}
            className="ml-4 font-bold underline"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-gray-100 overflow-hidden relative min-h-[400px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-8 py-5">Customer</th>
              <th className="px-8 py-5 text-center">Total bookings</th>
              <th className="px-8 py-5 text-center">Total spent</th>
              <th className="px-8 py-5 text-center">Last visit</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm font-bold">
            {!isLoading && customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                      <Search size={32} />
                    </div>
                    <p className="text-slate-400 uppercase tracking-widest text-[10px] font-black">No customers found</p>
                  </div>
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.userId} className="hover:bg-primary/5 transition-all group">
                  <td className="px-8 py-6 text-slate-800 flex items-center space-x-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black transition-all group-hover:bg-primary hover:scale-110">
                      {customer.name.charAt(0)}
                    </div>
                    <div>
                      <span className="block">{customer.name}</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                        {customer.email}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center text-slate-600">
                    <span className="bg-slate-100 px-3 py-1 rounded-full">{customer.bookingsCount}</span>
                  </td>
                  <td className="px-8 py-6 text-center text-emerald-600 font-black">${customer.totalSpent.toFixed(0)}</td>
                  <td className="px-8 py-6 text-center text-slate-400 font-medium">
                    {new Date(customer.lastVisit).toLocaleDateString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.userId)}
                      className="bg-slate-50 hover:bg-primary hover:text-white p-3 rounded-2xl transition-all shadow-sm group-hover:shadow-md"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setPage}
        />
      </div>

      {selectedCustomerId && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md cursor-default border-0 w-full"
            aria-label="Close"
            onClick={() => setSelectedCustomerId(null)}
          />
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-primary/5">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-primary text-white rounded-3xl flex items-center justify-center text-3xl font-black shadow-lg shadow-primary/20">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                    {selectedCustomer.name}
                  </h3>
                  <p className="text-[10px] font-bold uppercase text-slate-500 mt-2">
                    Member since {new Date(selectedCustomer.memberSince).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary shadow-sm hover:shadow-md transition-all border-0"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</p>
                  <div className="flex items-center space-x-3 text-slate-800 font-bold">
                    <Mail size={16} className="text-primary" />
                    <span className="text-sm">{selectedCustomer.email}</span>
                  </div>
                  <div className="flex items-center space-x-3 text-slate-800 font-bold">
                    <Phone size={16} className="text-primary" />
                    <span className="text-sm">{selectedCustomer.phone ?? '—'}</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bookings</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-slate-900">{selectedCustomer.bookingsCount}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">At your business</span>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-3xl space-y-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total spent</p>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-black text-emerald-600">${selectedCustomer.totalSpent.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight">Booking history</h4>
                </div>

                <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-xl shadow-slate-200/20">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-8 py-5 text-center">Date</th>
                        <th className="px-8 py-5">Service</th>
                        <th className="px-8 py-5">Staff</th>
                        <th className="px-8 py-5 text-center">Status</th>
                        <th className="px-8 py-5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                      {selectedUserBookings.map((b: Booking) => (
                        <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-8 py-5 text-center">
                            <span className="text-slate-800 font-black block">
                              {new Date(b.date).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                              {new Date(b.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-8 py-5 font-black text-slate-900">{getServiceName(b.serviceId)}</td>
                          <td className="px-8 py-5 font-bold text-slate-600">{getStaffName(b.staffId)}</td>
                          <td className="px-8 py-5 text-center">
                            <span
                              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                b.status === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : b.status === 'Completed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : b.status === 'Pending'
                                      ? 'bg-amber-50 text-amber-600'
                                      : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-slate-900">${b.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomerId(null)}
                className="px-8 py-4 bg-slate-900 hover:bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg border-0"
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
