"use client";

import React, { useMemo, useState } from "react";
import { 
  Download, 
  CheckCircle2,
  Clock,
  XCircle,
  X
} from "lucide-react";
import financeData from "@/mock-data/admin-finance.json";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import FilterToolbar from "@/components/admin/FilterToolbar";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState<(typeof financeData.transactions)[number] | null>(null);
  const { transactions } = financeData;

  const filteredTransactions = useMemo(
    () =>
      transactions.filter((transaction) => {
        const normalized = searchTerm.toLowerCase();
        const matchesSearch =
          transaction.id.toLowerCase().includes(normalized) ||
          transaction.business.toLowerCase().includes(normalized);
        const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [searchTerm, statusFilter, transactions],
  );

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
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map((tx) => (
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
                  </td>
                </tr>
              ))}
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-500">
                    No transactions found for current filters.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
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

function TrendingUp(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
