"use client";

import React, { useEffect, useState } from "react";
import { 
  Search, 
  Filter, 
  MoreVertical, 
  ShieldAlert, 
  ShieldCheck, 
  History,
  Lock,
  Unlock,
  Mail,
  Trash2,
  Loader2
} from "lucide-react";
import { apiDelete, apiGet } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import TablePagination from "@/components/admin/TablePagination";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    active: "bg-green-100 text-green-700",
    blocked: "bg-red-100 text-red-700",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status as keyof typeof styles])}>
      {status}
    </span>
  );
};

export default function UsersPage() {
  const [usersData, setUsersData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const pageSize = 10;

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          search: searchTerm,
        });
        const response = await apiGet<{ data: any[]; total: number; totalPages: number }>(`/admin/users?${query.toString()}`);
        setUsersData(response.data);
        setTotalItems(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [page, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  async function deleteUser(id: string) {
    if (!window.confirm("Delete this user permanently?")) return;
    await apiDelete(`/admin/users/${id}`);
    setUsersData((prev) => prev.filter((u) => u.id !== id));
    setTotalItems(prev => prev - 1);
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and monitor customer accounts and access.</p>
        </div>
        <div className="flex items-center gap-2">
            <button className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-200 transition">Export CSV</button>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-sm">Notify All</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">User Profile</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Bookings</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">Joined Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              )}
              {usersData.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setSelectedUser(user)}>
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm flex-shrink-0">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm hover:text-blue-600 transition">{user.name}</p>
                        <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2 py-1 rounded-md border border-blue-100">
                      {user.bookingsCount || 0} Bookings
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 text-center font-medium">
                    {formatDate(user.joinedDate)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Message User">
                        <Mail className="w-4 h-4" />
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setSelectedUser(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" 
                        title="View Detailed History"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {user.status === 'active' ? (
                        <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Block User">
                          <Lock className="w-4 h-4" />
                        </button>
                      ) : (
                        <button className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition" title="Unblock User">
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {selectedUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-extrabold text-xl shadow-sm border border-blue-200">
                  {selectedUser.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedUser.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">{selectedUser.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* User Bio Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{selectedUser.phone || "Not provided"}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Gender & Age</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">
                    {selectedUser.gender ? `${selectedUser.gender}, ` : ""}
                    {selectedUser.age ? `${selectedUser.age} years` : "N/A"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Address</p>
                  <p className="text-sm font-bold text-slate-800 mt-1 truncate" title={selectedUser.address}>
                    {selectedUser.address || "Not provided"}
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Joined Date</p>
                  <p className="text-sm font-bold text-slate-800 mt-1">{formatDate(selectedUser.joinedDate)}</p>
                </div>
              </div>

              {/* Tabs Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Bookings List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                      📅 Bookings History ({selectedUser.bookings?.length || 0})
                    </h3>
                  </div>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
                    {(!selectedUser.bookings || selectedUser.bookings.length === 0) ? (
                      <p className="text-sm font-medium text-slate-400 p-6 text-center">No bookings found for this user.</p>
                    ) : (
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-500 font-bold">
                            <th className="px-4 py-3">Venue & Service</th>
                            <th className="px-4 py-3 text-center">Date</th>
                            <th className="px-4 py-3 text-center">Price</th>
                            <th className="px-4 py-3 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-bold text-slate-700">
                          {selectedUser.bookings.map((b: any) => (
                            <tr key={b.id} className="hover:bg-slate-100/30">
                              <td className="px-4 py-3">
                                <p className="font-extrabold text-slate-800">{b.businessName}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{b.serviceName}</p>
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-slate-500">{formatDate(b.date)}</td>
                              <td className="px-4 py-3 text-center text-emerald-600">${b.price}</td>
                              <td className="px-4 py-3 text-right">
                                <span className={cn("px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider",
                                  b.status === 'completed' && "bg-green-100 text-green-700",
                                  b.status === 'pending' && "bg-amber-100 text-amber-700",
                                  b.status === 'cancelled' && "bg-red-100 text-red-700"
                                )}>
                                  {b.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Ratings & Reviews */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                    ⭐ Reviews & Ratings ({selectedUser.reviews?.length || 0})
                  </h3>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4 max-h-80 overflow-y-auto">
                    {(!selectedUser.reviews || selectedUser.reviews.length === 0) ? (
                      <p className="text-sm font-medium text-slate-400 py-6 text-center">No reviews submitted yet.</p>
                    ) : (
                      selectedUser.reviews.map((r: any) => (
                        <div key={r.id} className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">{r.businessName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{r.serviceName} • with {r.staffName}</p>
                            </div>
                            <div className="flex text-amber-400 text-xs font-extrabold">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i}>{i < r.rating ? "★" : "☆"}</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">"{r.comment}"</p>
                          <p className="text-[10px] text-slate-400 text-right font-medium">{formatDate(r.date)}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Favorite Venues */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  ❤️ Favorite Venues ({selectedUser.favorites?.length || 0})
                </h3>
                {(!selectedUser.favorites || selectedUser.favorites.length === 0) ? (
                  <p className="text-xs font-medium text-slate-400 ml-1">No favorite venues added.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.favorites.map((f: any) => (
                      <span key={f.id} className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs font-bold text-rose-600">
                        ❤️ {f.businessName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-colors"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
