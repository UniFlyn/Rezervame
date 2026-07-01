"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { useI18n } from "@/components/I18nProvider";
import { BookingConfirmationView } from "@/components/BookingConfirmationView";
import {
  clearBookingConfirmation,
  loadBookingConfirmation,
  type BookingConfirmationPayload,
} from "@/lib/bookingConfirmation";

function mergeFromUrl(
  sp: URLSearchParams,
  stored: BookingConfirmationPayload | null,
): BookingConfirmationPayload & { cancelled?: boolean } {
  const cancelled = sp.get("payment") === "cancelled";
  return {
    date: sp.get("date") || stored?.date || new Date().toISOString(),
    venue: sp.get("venue")?.trim() || stored?.venue,
    service: sp.get("service")?.trim() || stored?.service || "—",
    professional: sp.get("professional")?.trim() || stored?.professional || "—",
    bookingFor: sp.get("bookingFor")?.trim() || stored?.bookingFor || "",
    price: sp.get("price")?.trim() || stored?.price || "",
    bookingId: sp.get("bookingId")?.trim() || stored?.bookingId,
    auto: sp.get("auto") === "1" || stored?.auto === true,
    cash: sp.get("cash") === "1" || stored?.cash === true,
    paid: sp.get("paid") === "1" || stored?.paid === true,
    cancelled,
  };
}

function ConfirmationInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [data, setData] = useState<(BookingConfirmationPayload & { cancelled?: boolean }) | null>(
    null,
  );

  useEffect(() => {
    const stored = loadBookingConfirmation();
    setData(mergeFromUrl(sp, stored));
    if (stored) clearBookingConfirmation();
  }, [sp]);

  if (!data) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-white text-sm font-semibold text-[var(--rz-gray-600)]">
        Loading…
      </div>
    );
  }

  return (
    <BookingConfirmationView
      data={data}
      onGoHome={() => router.push("/")}
    />
  );
}

export default function BookingConfirmationPage() {
  const { language } = useI18n();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-white text-sm font-semibold text-[var(--rz-gray-600)]">
          {language === "en" ? "Loading..." : "Cargando..."}
        </div>
      }
    >
      <ConfirmationInner />
    </Suspense>
  );
}
