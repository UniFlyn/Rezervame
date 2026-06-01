"use client";

import React from "react";
import {
  AlertCircle,
  Inbox,
  RefreshCw,
  Search,
  WifiOff,
  type LucideIcon,
} from "lucide-react";

export type StatePanelVariant = "error" | "empty" | "offline";

export type StatePanelAction = {
  label: string;
  onClick: () => void;
  primary?: boolean;
  icon?: LucideIcon;
};

type StatePanelProps = {
  variant?: StatePanelVariant;
  title: string;
  description?: string;
  actions?: StatePanelAction[];
  className?: string;
};

const VARIANT_STYLES: Record<
  StatePanelVariant,
  { Icon: LucideIcon; ring: string; iconWrap: string; iconColor: string; accent: string }
> = {
  error: {
    Icon: AlertCircle,
    ring: "ring-rose-100/80",
    iconWrap: "bg-gradient-to-br from-rose-50 to-white",
    iconColor: "text-rose-500",
    accent: "from-rose-500/5",
  },
  empty: {
    Icon: Search,
    ring: "ring-slate-100",
    iconWrap: "bg-gradient-to-br from-slate-50 to-white",
    iconColor: "text-slate-400",
    accent: "from-slate-400/5",
  },
  offline: {
    Icon: WifiOff,
    ring: "ring-amber-100/80",
    iconWrap: "bg-gradient-to-br from-amber-50 to-white",
    iconColor: "text-amber-500",
    accent: "from-amber-500/8",
  },
};

export function StatePanel({
  variant = "empty",
  title,
  description,
  actions,
  className = "",
}: StatePanelProps) {
  const style = VARIANT_STYLES[variant];
  const Icon = style.Icon;

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border border-slate-100 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14 ${className}`}
      role="status"
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${style.accent} to-transparent`}
        aria-hidden
      />
      <div className="relative z-10 flex flex-col items-center">
        <div
          className={`mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-2xl ring-[10px] ${style.ring} ${style.iconWrap} shadow-inner`}
        >
          <Icon className={`h-9 w-9 ${style.iconColor}`} strokeWidth={1.75} aria-hidden />
        </div>
        <h3 className="max-w-md text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
          {title}
        </h3>
        {description ? (
          <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-slate-500">
            {description}
          </p>
        ) : null}
        {actions && actions.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {actions.map((action) => {
              const ActionIcon = action.icon ?? (action.primary ? RefreshCw : undefined);
              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className={
                    action.primary
                      ? "inline-flex items-center gap-2 rounded-xl bg-[#ff5a5f] px-6 py-3 text-sm font-bold text-white shadow-md shadow-[#ff5a5f]/20 transition hover:bg-[#e0484d]"
                      : "inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                  }
                >
                  {ActionIcon ? <ActionIcon className="h-4 w-4" aria-hidden /> : null}
                  {action.label}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Pick offline vs generic error styling from a user-facing message. */
export function statePanelVariantForMessage(message: string): StatePanelVariant {
  if (
    /connection|network|server|reach|timed out|offline|fetch/i.test(message)
  ) {
    return "offline";
  }
  return "error";
}
