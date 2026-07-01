"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import clsx from "clsx";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CreditCard,
  Loader2,
  X,
} from "lucide-react";

import { Pagination } from "@/components/ui/pagination";
import { apiGet } from "@/lib/api";
import { BusinessFilterToolbar } from "../../../components/business/BusinessFilterToolbar";
import { useBusinessStore } from "../../../store/businessStore";
import { Transaction, useTransactionsStore } from "../../../store/transactionsStore";

const PAGE_SIZE = 10;

function transactionReference(tx: Transaction) {
  if (tx.bookingId) return tx.bookingId;
  if (tx.type === "Withdrawal") return tx.description || "Withdrawal request";
  return "No booking attached";
}

function transactionTone(tx: Transaction) {
  return tx.type === "Earning"
    ? {
        icon: <ArrowUpRight className="h-4 w-4" />,
        iconClass: "bg-emerald-50 text-emerald-600",
        labelClass: "text-emerald-600",
        amountClass: "text-emerald-600",
        sign: "+",
      }
    : {
        icon: <ArrowDownLeft className="h-4 w-4" />,
        iconClass: "bg-orange-50 text-orange-600",
        labelClass: "text-orange-600",
        amountClass: "text-[var(--rz-navy)]",
        sign: "-",
      };
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--rz-gray-100)] bg-[var(--rz-gray-050)] px-4 py-2">
      <select
        className="cursor-pointer bg-transparent text-[10px] font-black uppercase tracking-widest outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </select>
    </div>
  );
}

function TransactionCard({
  transaction,
  onOpen,
}: {
  transaction: Transaction;
  onOpen: (transaction: Transaction) => void;
}) {
  const tone = transactionTone(transaction);
  const reference = transactionReference(transaction);

  return (
    <button
      type="button"
      onClick={() => onOpen(transaction)}
      className="group grid gap-4 rounded-3xl border border-[var(--rz-gray-100)] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--rz-gray-200)] hover:shadow-xl hover:shadow-[color:rgba(231,234,239,0.7)] lg:grid-cols-[1.4fr_1.1fr_1fr_auto]"
    >
      <div className="min-w-0">
        <div className="mb-3 flex items-center gap-2">
          <span className={clsx("inline-flex h-9 w-9 items-center justify-center rounded-2xl", tone.iconClass)}>
            {tone.icon}
          </span>
          <span className={clsx("text-sm font-black", tone.labelClass)}>
            {transaction.type || "Transaction"}
          </span>
        </div>

        <p className="truncate font-mono text-xs font-bold text-[var(--rz-gray-500)]">{transaction.id}</p>
        <p className="mt-1 truncate font-mono text-[11px] font-bold text-[var(--rz-gray-500)]">{reference}</p>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Customer / staff</p>
        <p className="mt-2 truncate text-sm font-black text-[var(--rz-navy-800)]">
          {transaction.customerEmail || "No customer attached"}
        </p>
        <p className="mt-1 truncate text-xs font-bold text-[var(--rz-gray-500)]">
          {transaction.staffMember || "No staff assigned"}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Date</p>
        <div className="mt-2 flex items-center gap-2 text-sm font-bold text-[var(--rz-gray-700)]">
          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--rz-gray-300)]" />
          <span className="truncate">{new Date(transaction.date).toLocaleString()}</span>
        </div>
        <span className="mt-3 inline-flex rounded-full bg-[var(--rz-gray-050)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--rz-gray-600)]">
          {transaction.status}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 lg:min-w-[150px] lg:flex-col lg:items-end">
        <p className={clsx("text-2xl font-black", tone.amountClass)}>
          {tone.sign}${transaction.amount.toFixed(2)}
        </p>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-[var(--rz-navy)] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white transition group-hover:bg-primary">
          <CreditCard className="h-3.5 w-3.5" />
          Details
        </span>
      </div>
    </button>
  );
}

function EmptyTransactions() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-[var(--rz-gray-200)] bg-[var(--rz-gray-050)] p-8 text-center">
      <CreditCard className="h-10 w-10 text-[var(--rz-gray-300)]" />
      <p className="mt-4 text-sm font-black text-[var(--rz-gray-700)]">No transactions match these filters.</p>
      <p className="mt-1 max-w-md text-xs font-semibold text-[var(--rz-gray-500)]">
        Try a broader search, switch status, or clear type filters to see earnings and withdrawal activity.
      </p>
    </div>
  );
}

function TransactionDetail({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const tone = transactionTone(transaction);

  const rows = [
    ["Booking ID", transaction.bookingId || "—"],
    ["Customer (email)", transaction.customerEmail || "—"],
    ["Staff", transaction.staffMember || "—"],
    ["Date", new Date(transaction.date).toLocaleString()],
    ["Type", transaction.type || "—"],
    ["Status", transaction.status || "—"],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#023047]/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[32px] border border-[var(--rz-gray-100)] bg-white p-8 shadow-2xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-xl font-black uppercase tracking-tight text-[var(--rz-navy)]">Transaction details</h3>
            <p className="mt-1 truncate font-mono text-xs text-[var(--rz-gray-500)]">{transaction.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-[var(--rz-gray-050)] p-2 text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)]"
            aria-label="Close transaction details"
          >
            <X size={20} />
          </button>
        </div>

        <dl className="space-y-4 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-[var(--rz-gray-050)] pb-3">
              <dt className="font-black uppercase tracking-widest text-[var(--rz-gray-500)]">{label}</dt>
              <dd className="text-right font-bold text-[var(--rz-gray-700)]">{value}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 pt-2">
            <dt className="font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Amount</dt>
            <dd className={clsx("text-lg font-black", tone.amountClass)}>
              {tone.sign}${transaction.amount.toFixed(2)}
            </dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onClose}
          className="mt-8 w-full rounded-2xl bg-[var(--rz-navy)] py-4 text-[10px] font-black uppercase tracking-widest text-white hover:bg-primary"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function TransactionsPage() {
  const transactions = useTransactionsStore((state) => state.transactions);
  const hydrateTransactions = useTransactionsStore((state) => state.hydrate);
  const business = useBusinessStore((state) => state.business);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Earning" | "Withdrawal">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState<Transaction | null>(null);

  const [paginatedTransactions, setPaginatedTransactions] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!business) return;

    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        search,
        type: typeFilter,
        status: statusFilter,
      });

      const response = await apiGet<{ data: Transaction[]; total: number; totalPages: number }>(
        `/business/${business.id}/transactions?${query.toString()}`,
        "BUSINESS",
      );

      setPaginatedTransactions(response.data);
      setTotalItems(response.total);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Failed to fetch transactions", err);
    } finally {
      setIsLoading(false);
    }
  }, [business, page, search, typeFilter, statusFilter]);

  useEffect(() => {
    void hydrateTransactions();
  }, [hydrateTransactions]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTransactions();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [fetchTransactions]);

  useEffect(() => {
    setPage(1);
  }, [search, typeFilter, statusFilter]);

  const statuses = useMemo(
    () => ["all", ...Array.from(new Set(transactions.map((transaction) => transaction.status)))],
    [transactions],
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h2 className="text-3xl font-black uppercase tracking-tight text-gray-900">Transactions</h2>
        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          Payments, earnings and withdrawals
        </p>
      </div>

      <BusinessFilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by tx id, booking id, email, staff..."
      >
        <FilterSelect
          value={typeFilter}
          onChange={(value) => setTypeFilter(value as "all" | "Earning" | "Withdrawal")}
        >
          <option value="all">All types</option>
          <option value="Earning">Earning</option>
          <option value="Withdrawal">Withdrawal</option>
        </FilterSelect>

        <FilterSelect value={statusFilter} onChange={setStatusFilter}>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status === "all" ? "All statuses" : status}
            </option>
          ))}
        </FilterSelect>
      </BusinessFilterToolbar>

      <div className="relative min-h-[400px] overflow-hidden rounded-[32px] border border-[var(--rz-gray-100)] bg-white shadow-xl shadow-[color:rgba(231,234,239,0.5)]">
        {isLoading ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--rz-gray-500)]" />
          </div>
        ) : null}

        <div className="grid gap-3 p-4 sm:p-5">
          {paginatedTransactions.map((transaction) => (
            <TransactionCard key={transaction.id} transaction={transaction} onOpen={setDetail} />
          ))}

          {!isLoading && paginatedTransactions.length === 0 ? <EmptyTransactions /> : null}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />
      </div>

      {detail ? <TransactionDetail transaction={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}
