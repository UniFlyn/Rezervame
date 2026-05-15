"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export type FilterOption = {
  label: string;
  value: string;
};

export type FilterGroup = {
  key: string;
  label?: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
};

type FilterToolbarProps = {
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filterGroups?: FilterGroup[];
};

export default function FilterToolbar({
  searchPlaceholder,
  searchValue,
  onSearchChange,
  filterGroups = [],
}: FilterToolbarProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="flex flex-col gap-3">
          {filterGroups.map((group) => (
            <div key={group.key} className="flex flex-wrap items-center gap-2">
              {group.label ? (
                <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {group.label}
                </span>
              ) : null}
              {group.options.map((option) => {
                const isSelected = group.value === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => group.onChange(option.value)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                      isSelected
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900",
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
