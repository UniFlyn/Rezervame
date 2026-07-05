"use client";

import React from "react";
import { withPublicBasePath } from "@/lib/publicBasePath";

export type AppLoaderProps = {
  /** Short user-facing label only — never pass API URLs or env hints. */
  label?: string;
  variant?: "page" | "section" | "inline";
  className?: string;
};

const LOGO_SRC = withPublicBasePath("/ds/logos/rezervame-color.png");

export function AppLoader({ label, variant = "page", className = "" }: AppLoaderProps) {
  const rings = (
    <div
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 80,
        height: 80,
      }}
      aria-hidden
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: "2px solid color-mix(in srgb, var(--rz-coral) 15%, transparent)",
        }}
      />
      <span
        className="rz-loader-ring"
        style={{
          position: "absolute",
          inset: 4,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderTopColor: "var(--rz-coral)",
        }}
      />
      <span
        className="rz-loader-ring-reverse"
        style={{
          position: "absolute",
          inset: 12,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: "color-mix(in srgb, var(--rz-coral) 70%, transparent)",
        }}
      />
      <span
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 44,
          height: 44,
          overflow: "hidden",
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 8px 24px color-mix(in srgb, var(--rz-coral) 25%, transparent)",
          border: "2px solid #fff",
        }}
      >
        <img
          src={LOGO_SRC}
          alt=""
          width={44}
          height={44}
          style={{ width: 36, height: 36, objectFit: "contain" }}
          draggable={false}
        />
      </span>
    </div>
  );

  const labelEl = label ? (
    <p style={{ marginTop: 20, fontSize: 14, fontWeight: 600, letterSpacing: "0.02em", color: "var(--rz-gray-600)" }}>
      {label}
    </p>
  ) : null;

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
        <span className="rz-loader-ring" style={{ display: "inline-block", width: 20, height: 20, borderRadius: "50%", border: "2px solid var(--rz-gray-200)", borderTopColor: "var(--rz-coral)" }} />
        {label ? <span style={{ fontSize: 12, fontWeight: 600, color: "var(--rz-gray-500)" }}>{label}</span> : null}
      </span>
    );
  }

  const wrapStyle: React.CSSProperties =
    variant === "page"
      ? { minHeight: "50vh", width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px" }
      : { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 16px" };

  return (
    <div className={className} style={wrapStyle} role="status" aria-live="polite" aria-busy="true">
      {rings}
      {labelEl}
    </div>
  );
}

export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return <AppLoader label={label} variant="page" />;
}
