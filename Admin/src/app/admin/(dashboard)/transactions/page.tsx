"use client";

import React, { useEffect, useMemo, useState } from "react";
import { 
  Download, 
  CheckCircle2,
  Clock,
  XCircle,
  X,
  Trash2,
  Loader2,
  TrendingUp
} from "lucide-react";
import { apiDelete, apiGet } from "@/lib/api";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";
import TablePagination from "@/components/admin/TablePagination";

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    completed: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    failed: "bg-rose-100 text-rose-700",
    approved: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", styles[status as keyof typeof styles])}>
      {status}
    </span>
  );
};

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      try {
        const query = new URLSearchParams({
          page: String(page),
          limit: String(pageSize),
          search: searchTerm,
          status: statusFilter,
        });
        const response = await apiGet<{ data: any[]; total: number; totalPages: number }>(`/admin/transactions?${query.toString()}`);
        setTransactions(response.data);
        setTotalItems(response.total);
        setTotalPages(response.totalPages);
      } catch (err) {
        console.error("Failed to fetch transactions", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [page, searchTerm, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  async function deleteTransaction(id: string) {
    if (!window.confirm("Delete this transaction permanently?")) return;
    await apiDelete(`/admin/transactions/${id}`);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setTotalItems(prev => prev - 1);
  }

  const statusKpis = useMemo(() => {
    const total = transactions.length;
    const completed = transactions.filter((tx) => tx.status === "completed").length;
    const pending = transactions.filter((tx) => tx.status === "pending").length;
    const failed = transactions.filter((tx) => tx.status === "failed").length;
    return [
      {
        label: "Completed",
        value: completed,
        icon: CheckCircle2,
        tone: "text-emerald-600 bg-emerald-50 border-emerald-200",
      },
      {
        label: "Pending",
        value: pending,
        icon: Clock,
        tone: "text-amber-600 bg-amber-50 border-amber-200",
      },
      {
        label: "Failed",
        value: failed,
        icon: XCircle,
        tone: "text-rose-600 bg-rose-50 border-rose-200",
      },
      {
        label: "Total",
        value: total,
        icon: TrendingUp,
        tone: "text-blue-600 bg-blue-50 border-blue-200",
      },
    ];
  }, [transactions]);

  return (
    <div className="space-y-8 animate-in slide-in-from-top-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Transactions</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor all platform payments and revenue flow.</p>
        </div>
        <button className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-200 transition shadow-sm border border-slate-200">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {statusKpis.map((item) => (
          <div key={item.label} className={cn("rounded-2xl border p-4", item.tone)}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide">{item.label}</p>
              <item.icon className="h-4 w-4" />
            </div>
            <p className="mt-2 text-2xl font-semibold">{item.value}</p>
          </div>
        ))}
      </div>

      <FilterToolbar
        searchPlaceholder="Search by transaction id or business..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterGroups={[
          {
            key: "transaction-status",
            label: "Status",
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: "All", value: "all" },
              { label: "Completed", value: "completed" },
              { label: "Pending", value: "pending" },
              { label: "Failed", value: "failed" },
            ],
          },
        ]}
      />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/30 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Transaction ID</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Business</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                </div>
              )}
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-xs font-bold text-slate-600">{tx.id}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{tx.business}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className={cn("text-sm font-bold", tx.status === 'completed' ? "text-slate-900" : "text-slate-400")}>
                      {formatCurrency(tx.amount)}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                    {formatDate(tx.date)}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedTransaction(tx)}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteTransaction(tx.id)}
                      className="ml-3 inline-flex items-center text-xs font-bold text-rose-600 hover:underline"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && !isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    No transactions found for current filters.
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

      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Transaction Details</h2>
                <p className="text-xs text-slate-500">Transaction: {selectedTransaction.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 p-6">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-sm text-slate-700">Business: {selectedTransaction.business}</p>
                <p className="text-sm text-slate-700">Date: {formatDate(selectedTransaction.date)}</p>
                <p className="text-sm text-slate-700">Amount: {formatCurrency(selectedTransaction.amount)}</p>
                <p className="mt-2">
                  <StatusBadge status={selectedTransaction.status} />
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

