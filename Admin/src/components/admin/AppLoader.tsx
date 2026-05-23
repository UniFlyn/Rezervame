"use client";

import React from "react";

export type AppLoaderProps = {
  label?: string;
  variant?: "page" | "section" | "inline";
  className?: string;
};

export function AppLoader({ label, variant = "page", className = "" }: AppLoaderProps) {
  const rings = (
    <div className="relative flex h-16 w-16 items-center justify-center" aria-hidden>
      <span className="absolute inset-0 rounded-full border-2 border-blue-600/15" />
      <span className="absolute inset-1 rounded-full border-2 border-transparent border-t-blue-600 animate-spin [animation-duration:1.1s]" />
      <span className="absolute inset-3 rounded-full border-2 border-transparent border-b-blue-400/70 animate-spin [animation-duration:1.6s] [animation-direction:reverse]" />
      <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-600/25">
        <span className="text-[9px] font-black tracking-tighter text-white">A</span>
      </span>
    </div>
  );

  const labelEl = label ? (
    <p className="mt-5 text-sm font-semibold tracking-wide text-slate-600 animate-pulse">{label}</p>
  ) : null;

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
        <span className="relative h-5 w-5">
          <span className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 animate-spin" />
        </span>
        {label ? <span className="text-xs font-semibold text-slate-500">{label}</span> : null}
      </span>
    );
  }

  const wrap =
    variant === "page"
      ? "min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 px-6"
      : "flex flex-col items-center justify-center py-16";

  return (
    <div className={`${wrap} ${className}`} role="status" aria-live="polite" aria-busy="true">
      {rings}
      {labelEl}
    </div>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return <AppLoader label={label} variant="page" />;
}
