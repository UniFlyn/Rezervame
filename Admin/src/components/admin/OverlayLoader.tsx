"use client";

import { AppLoader } from "@/components/admin/AppLoader";

/** Full-bleed overlay for tables and panels while data loads. */
export function OverlayLoader() {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 backdrop-blur-sm">
      <AppLoader variant="section" />
    </div>
  );
}
