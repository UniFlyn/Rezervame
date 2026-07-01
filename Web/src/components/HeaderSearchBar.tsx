"use client";

import React from "react";
import { Search, MapPin } from "lucide-react";
import { useI18n } from "./I18nProvider";

type Props = {
  searchVal: string;
  locationVal: string;
  onSearchChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onSubmit: () => void;
  className?: string;
};

/** Rezervame 2.0 header search — flat white bar, no outer shadow. */
export function HeaderSearchBar({
  searchVal,
  locationVal,
  onSearchChange,
  onLocationChange,
  onSubmit,
  className = "",
}: Props) {
  const { t } = useI18n();

  return (
    <div
      className={`flex h-11 min-w-0 flex-1 max-w-2xl items-stretch overflow-hidden rounded-lg border border-[var(--rz-gray-200)] bg-white ${className}`}
    >
      <div className="flex min-w-0 flex-[1.4] items-center border-r border-[var(--rz-gray-200)] px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--rz-gray-500)]" strokeWidth={2} />
        <input
          type="text"
          value={searchVal}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          placeholder={t("searchPlaceholder")}
          className="h-full w-full min-w-0 bg-transparent text-sm font-medium text-[var(--rz-navy-800)] outline-none placeholder:text-[var(--rz-gray-500)]"
        />
      </div>
      <div className="hidden min-w-0 flex-1 items-center px-3 sm:flex">
        <MapPin className="mr-2 h-4 w-4 shrink-0 text-[var(--rz-gray-500)]" strokeWidth={2} />
        <input
          type="text"
          value={locationVal}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder={t("locationPlaceholder")}
          className="h-full w-full min-w-0 bg-transparent text-sm font-medium text-[var(--rz-navy-800)] outline-none placeholder:text-[var(--rz-gray-500)]"
        />
      </div>
      <button
        type="button"
        onClick={onSubmit}
        className="shrink-0 bg-[#ff5757] px-5 text-sm font-bold text-white transition hover:bg-[#e0454a]"
      >
        {t("searchBtn")}
      </button>
    </div>
  );
}
