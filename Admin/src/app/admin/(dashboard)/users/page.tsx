"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Search,
  Filter,
  MoreVertical,
  History,
  Lock,
  Unlock,
  Mail,
  Trash2,
} from "lucide-react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import TablePagination from "@/components/admin/TablePagination";
import { OverlayLoader } from "@/components/admin/OverlayLoader";
import { toastError, toastSuccess } from "@/lib/toast";

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = (status || "active").toLowerCase();
  const styles = {
    active: "bg-green-100 text-green-700",
    blocked: "bg-red-100 text-red-700",
  };
  const style = styles[normalized as keyof typeof styles] || "bg-slate-100 text-slate-600";
  return (
    <span
      className={cn(
        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
        style,
      )}
    >
      {normalized}
    </span>
  );
};

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  gender?: string;
  age?: number;
  status: string;
  joinedDate: string;
  bookingsCount?: number;
  bookings?: unknown[];
  reviews?: unknown[];
  favorites?: unknown[];
};

export default function UsersPage() {
  const [usersData, setUsersData] = useState<UserRow[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [emailUser, setEmailUser] = useState<UserRow | null>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const pageSize = 10;

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(pageSize),
        search: searchTerm,
      });
      const response = await apiGet<{ data: UserRow[]; total: number; totalPages: number }>(
        `/admin/users?${query.toString()}`,
      );
      setUsersData(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Failed to fetch users", err);
      toastError("Could not load users", err instanceof Error ? err.message : "");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      void fetchUsers();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [page, searchTerm]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (!menuUserId) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      setMenuUserId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuUserId]);

  function updateUserInList(id: string, patch: Partial<UserRow>) {
    setUsersData((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
    setSelectedUser((prev) => (prev?.id === id ? { ...prev, ...patch } : prev));
  }

  async function toggleUserStatus(user: UserRow) {
    const next = (user.status || "active").toLowerCase() === "active" ? "blocked" : "active";
    const verb = next === "blocked" ? "block" : "unblock";
    if (!window.confirm(`${verb === "block" ? "Block" : "Unblock"} ${user.name}?`)) return;
    setBusyUserId(user.id);
    setMenuUserId(null);
    try {
      await apiPatch(`/admin/users/${user.id}/status`, { status: next });
      updateUserInList(user.id, { status: next });
      toastSuccess(next === "blocked" ? "User blocked" : "User unblocked");
    } catch (err) {
      toastError(`${verb} failed`, err instanceof Error ? err.message : "");
    } finally {
      setBusyUserId(null);
    }
  }

  async function deleteUser(user: UserRow) {
    if (!window.confirm(`Delete ${user.name} permanently? This cannot be undone.`)) return;
    setBusyUserId(user.id);
    setMenuUserId(null);
    try {
      await apiDelete(`/admin/users/${user.id}`);
      setUsersData((prev) => prev.filter((u) => u.id !== user.id));
      setTotalItems((prev) => Math.max(0, prev - 1));
      if (selectedUser?.id === user.id) setSelectedUser(null);
      toastSuccess("User deleted");
    } catch (err) {
      toastError("Delete failed", err instanceof Error ? err.message : "");
    } finally {
      setBusyUserId(null);
    }
  }

  async function sendEmailToUser() {
    if (!emailUser) return;
    const message = emailMessage.trim();
    if (!message) {
      toastError("Message required", "Enter a message for the user.");
      return;
    }
    setEmailSending(true);
    try {
      await apiPost(`/admin/users/${emailUser.id}/email`, {
        subject: emailSubject.trim() || undefined,
        message,
      });
      toastSuccess("Email sent", `Message delivered to ${emailUser.email}`);
      setEmailUser(null);
      setEmailSubject("");
      setEmailMessage("");
    } catch (err) {
      toastError("Email failed", err instanceof Error ? err.message : "");
    } finally {
      setEmailSending(false);
    }
  }

  function openEmailModal(user: UserRow) {
    setMenuUserId(null);
    setEmailUser(user);
    setEmailSubject("");
    setEmailMessage(`Hi ${user.name},\n\n`);
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">User Directory</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and monitor customer accounts and access.</p>
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
          <button
            type="button"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
            title="Filters"
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  User Profile
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                  Bookings
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
                  Joined Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 relative">
              {isLoading ? <OverlayLoader /> : null}
              {usersData.map((user) => {
                const isBlocked = (user.status || "active").toLowerCase() === "blocked";
                const busy = busyUserId === user.id;
                return (
                  <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div
                        className="flex items-center space-x-3 cursor-pointer"
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold border-2 border-white shadow-sm flex-shrink-0">
                          {user.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm hover:text-blue-600 transition">
                            {user.name}
                          </p>
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
                      <div className="relative flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => openEmailModal(user)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-40"
                          title="Email user"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setSelectedUser(user)}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition disabled:opacity-40"
                          title="View booking history"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        {isBlocked ? (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void toggleUserStatus(user)}
                            className="p-2 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition disabled:opacity-40"
                            title="Unblock user"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void toggleUserStatus(user)}
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40"
                            title="Block user"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        <div className="relative" ref={menuUserId === user.id ? menuRef : undefined}>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() =>
                              setMenuUserId((id) => (id === user.id ? null : user.id))
                            }
                            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition disabled:opacity-40"
                            title="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          {menuUserId === user.id ? (
                            <div className="absolute right-0 top-full z-30 mt-1 min-w-[180px] rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => {
                                  setMenuUserId(null);
                                  setSelectedUser(user);
                                }}
                              >
                                View details
                              </button>
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => openEmailModal(user)}
                              >
                                Send email
                              </button>
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                onClick={() => void toggleUserStatus(user)}
                              >
                                {isBlocked ? "Unblock user" : "Block user"}
                              </button>
                              <button
                                type="button"
                                className="w-full px-4 py-2 text-left text-sm font-semibold text-rose-600 hover:bg-rose-50"
                                onClick={() => void deleteUser(user)}
                              >
                                Delete user
                              </button>
                            </div>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void deleteUser(user)}
                          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition disabled:opacity-40"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {emailUser ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900">Email {emailUser.name}</h3>
            <p className="mt-1 text-sm text-slate-500">{emailUser.email}</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subject
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Message from Rezervame"
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Message
                </label>
                <textarea
                  rows={6}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  className="w-full resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setEmailUser(null);
                  setEmailSubject("");
                  setEmailMessage("");
                }}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={emailSending}
                onClick={() => void sendEmailToUser()}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {emailSending ? "Sending…" : "Send email"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-extrabold text-xl shadow-sm border border-blue-200">
                  {selectedUser.name[0]}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">{selectedUser.name}</h2>
                  <p className="text-sm text-slate-500 font-medium">{selectedUser.email}</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedUser.status} />
                  </div>
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

            <div className="flex-1 overflow-y-auto p-8 space-y-8">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                    📅 Bookings History ({selectedUser.bookings?.length || 0})
                  </h3>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden max-h-80 overflow-y-auto">
                    {!selectedUser.bookings || selectedUser.bookings.length === 0 ? (
                      <p className="text-sm font-medium text-slate-400 p-6 text-center">
                        No bookings found for this user.
                      </p>
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
                          {(selectedUser.bookings as Array<Record<string, string>>).map((b) => (
                            <tr key={b.id} className="hover:bg-slate-100/30">
                              <td className="px-4 py-3">
                                <p className="font-extrabold text-slate-800">{b.businessName}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{b.serviceName}</p>
                              </td>
                              <td className="px-4 py-3 text-center font-medium text-slate-500">
                                {formatDate(b.date)}
                              </td>
                              <td className="px-4 py-3 text-center text-emerald-600">${b.price}</td>
                              <td className="px-4 py-3 text-right">
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider",
                                    b.status === "completed" && "bg-green-100 text-green-700",
                                    b.status === "pending" && "bg-amber-100 text-amber-700",
                                    b.status === "cancelled" && "bg-red-100 text-red-700",
                                  )}
                                >
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

                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                    ⭐ Reviews & Ratings ({selectedUser.reviews?.length || 0})
                  </h3>
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 space-y-4 max-h-80 overflow-y-auto">
                    {!selectedUser.reviews || selectedUser.reviews.length === 0 ? (
                      <p className="text-sm font-medium text-slate-400 py-6 text-center">
                        No reviews submitted yet.
                      </p>
                    ) : (
                      (selectedUser.reviews as Array<Record<string, string | number>>).map((r) => (
                        <div
                          key={String(r.id)}
                          className="bg-white p-4 rounded-xl border border-slate-100 space-y-2 shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-extrabold text-slate-800">{r.businessName}</p>
                              <p className="text-[10px] text-slate-400 font-medium">
                                {r.serviceName} • with {r.staffName}
                              </p>
                            </div>
                            <div className="flex text-amber-400 text-xs font-extrabold">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <span key={i}>{i < Number(r.rating) ? "★" : "☆"}</span>
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            &quot;{r.comment}&quot;
                          </p>
                          <p className="text-[10px] text-slate-400 text-right font-medium">
                            {formatDate(String(r.date))}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  ❤️ Favorite Venues ({selectedUser.favorites?.length || 0})
                </h3>
                {!selectedUser.favorites || selectedUser.favorites.length === 0 ? (
                  <p className="text-xs font-medium text-slate-400 ml-1">No favorite venues added.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(selectedUser.favorites as Array<Record<string, string>>).map((f) => (
                      <span
                        key={f.id}
                        className="inline-flex items-center gap-1 rounded-xl bg-rose-50 border border-rose-100 px-3 py-1.5 text-xs font-bold text-rose-600"
                      >
                        ❤️ {f.businessName}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => openEmailModal(selectedUser)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                Email user
              </button>
              <button
                type="button"
                onClick={() => void toggleUserStatus(selectedUser)}
                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                {(selectedUser.status || "active").toLowerCase() === "blocked"
                  ? "Unblock"
                  : "Block"}
              </button>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm tracking-wider uppercase transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
