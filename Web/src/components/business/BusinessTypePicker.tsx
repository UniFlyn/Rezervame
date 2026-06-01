"use client";

import React from "react";
import { PARTNER_BUSINESS_TYPES, partnerTypeTileImage } from "@/lib/partnerBusinessTypes";

type Lang = "en" | "es";

export function BusinessTypePicker({
  lang,
  selectedId,
  onSelect,
  showFeatures = false,
  compact = false,
  t,
}: {
  lang: Lang;
  selectedId: string;
  onSelect: (id: string, categoryKeys: string[]) => void;
  showFeatures?: boolean;
  compact?: boolean;
  t: (key: string) => string;
}) {
  return (
    <div
      className={
        compact
          ? "grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4"
          : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2"
      }
    >
      {PARTNER_BUSINESS_TYPES.map((type) => {
        const active = selectedId === type.id;
        const title = t(`${type.labelKey}Title`);
        const desc = t(`${type.labelKey}Desc`);
        const img = partnerTypeTileImage(type);
        if (compact) {
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id, type.categoryKeys)}
              className={`overflow-hidden rounded-xl border text-left transition-all ${
                active
                  ? "border-[#ff5a5f] bg-[#ff5a5f]/5 ring-2 ring-[#ff5a5f]/20"
                  : "border-slate-200 bg-white hover:border-[#ff5a5f]/40"
              }`}
            >
              <div className="relative h-14 w-full bg-slate-200">
                <img src={img} alt="" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <span className="absolute bottom-1 left-2 text-lg">{type.emoji}</span>
              </div>
              <p className="px-2 py-2 text-[11px] font-bold leading-tight text-slate-800">{title}</p>
            </button>
          );
        }
        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id, type.categoryKeys)}
            className={`overflow-hidden rounded-[28px] border-2 text-left transition-all ${
              active
                ? "border-[#ff5a5f] bg-[#ff5a5f]/5 shadow-lg shadow-[#ff5a5f]/10"
                : "border-slate-100 bg-slate-50/80 hover:border-[#ff5a5f]/40 hover:bg-white"
            }`}
          >
            <div className="relative h-28 w-full bg-slate-200">
              <img src={img} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-2 left-3 text-2xl">{type.emoji}</span>
            </div>
            <div className="p-5">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-900">{title}</h3>
              <p className="mt-2 text-xs font-medium leading-relaxed text-slate-600">{desc}</p>
              {showFeatures ? (
                <ul className="mt-3 space-y-1.5">
                  {(["F1", "F2", "F3"] as const).map((n) => (
                    <li
                      key={n}
                      className="flex items-start gap-2 text-[11px] font-bold text-slate-500"
                    >
                      <span className="text-[#ff5a5f]">✓</span>
                      {t(`${type.labelKey}${n}`)}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
