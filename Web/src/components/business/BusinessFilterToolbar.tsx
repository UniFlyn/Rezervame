'use client';

import { Search } from 'lucide-react';
import clsx from 'clsx';

type Props = {
  searchPlaceholder?: string;
  searchValue: string;
  onSearchChange: (v: string) => void;
  children?: React.ReactNode;
  className?: string;
};

/**
 * Shared search + filter row for Business Panel (transactions, staff, reviews, etc.).
 */
export function BusinessFilterToolbar({
  searchPlaceholder = 'Buscar…',
  searchValue,
  onSearchChange,
  children,
  className,
}: Props) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-4 rounded-[32px] border border-slate-100 bg-white p-4 shadow-xl shadow-slate-200/50 md:flex-row md:flex-wrap md:items-center',
        className,
      )}
    >
      <div className="relative min-w-[200px] flex-1 md:max-w-sm">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-2xl border border-slate-100 bg-slate-50 py-2.5 pl-11 pr-4 text-[10px] font-black uppercase tracking-widest text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </div>
  );
}
