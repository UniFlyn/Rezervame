"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { useI18n } from "@/components/I18nProvider";
import { dateLocaleFor } from "@/lib/locale";
import type { BookingConfirmationPayload } from "@/lib/bookingConfirmation";

function formatDateLine(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimeLine(iso: string | null | undefined, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-0.5">
      <span className="shrink-0 text-sm font-medium text-[var(--rz-gray-500)]">{label}</span>
      <span className="break-words text-right text-sm font-bold text-[var(--rz-navy)]">{value}</span>
    </div>
  );
}

export type BookingConfirmationViewProps = {
  data: BookingConfirmationPayload & { cancelled?: boolean };
  onGoHome?: () => void;
  detailsHref?: string;
};

export function BookingConfirmationView({
  data,
  onGoHome,
  detailsHref: detailsHrefProp,
}: BookingConfirmationViewProps) {
  const { language } = useI18n();
  const dateLocale = dateLocaleFor(language);

  const paid = data.paid === true;
  const autoApproval = data.auto === true;
  const isCash = data.cash === true;
  const cancelled = data.cancelled === true;

  const bookingFor = data.bookingFor || (language === "en" ? "Myself" : "Yo");

  const { title, subtitle } = useMemo(() => {
    if (cancelled) {
      return {
        title: language === "en" ? "Payment cancelled" : "Pago cancelado",
        subtitle:
          language === "en"
            ? "Your booking was created but payment was not completed. You can pay from your reservations."
            : "Tu reserva fue creada pero el pago no se completó. Puedes pagar desde tus reservas.",
      };
    }
    if (autoApproval && isCash) {
      return {
        title: language === "en" ? "Booking Confirmed!" : "¡Reserva confirmada!",
        subtitle:
          language === "en"
            ? `Your appointment is confirmed. Please bring ${data.price || "payment"} in cash to the venue.`
            : `Tu cita está confirmada. Lleva ${data.price || "el pago"} en efectivo al local.`,
      };
    }
    if (autoApproval && paid) {
      return {
        title: language === "en" ? "Booking Confirmed!" : "¡Reserva confirmada!",
        subtitle:
          language === "en"
            ? "Your appointment is confirmed and payment was recorded."
            : "Tu cita está confirmada y el pago fue registrado.",
      };
    }
    if (autoApproval) {
      return {
        title: language === "en" ? "Booking Confirmed!" : "¡Reserva confirmada!",
        subtitle:
          language === "en"
            ? "Your appointment is confirmed."
            : "Tu cita está confirmada.",
      };
    }
    return {
      title: language === "en" ? "Booking Submitted!" : "¡Reserva enviada!",
      subtitle:
        language === "en"
          ? "Your booking request has been sent. The business will review and confirm shortly."
          : "Tu solicitud de reserva ha sido enviada. El negocio la revisará y confirmará pronto.",
    };
  }, [autoApproval, cancelled, isCash, paid, data.price, language]);

  const dateLine = formatDateLine(data.date, dateLocale);
  const timeLine = formatTimeLine(data.date, dateLocale);

  const detailsHref =
    detailsHrefProp ||
    (data.bookingId
      ? `/reservation/${encodeURIComponent(data.bookingId)}`
      : "/profile?tab=bookings");

  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <div className="flex flex-1 flex-col items-center px-7 pb-6 pt-12 sm:px-8 sm:pt-16">
        <div className="w-full max-w-md">
          <div className="mb-7 flex justify-center">
            <div className="relative flex h-[120px] w-[120px] items-center justify-center">
              <div
                className="absolute inset-2 rounded-full bg-[rgba(255,87,87,0.2)] blur-lg"
                aria-hidden
              />
              <div className="relative flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[var(--rz-coral)] shadow-[0_8px_24px_rgba(255,87,87,0.35)]">
                <Check className="text-white" size={44} strokeWidth={3} />
              </div>
            </div>
          </div>

          <h1 className="mb-3 text-center text-[26px] font-extrabold leading-tight tracking-tight text-[var(--rz-navy)]">
            {title}
          </h1>
          <p className="mb-9 text-center text-[15px] font-medium leading-relaxed text-[var(--rz-gray-500)]">
            {subtitle}
          </p>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--rz-gray-050)] px-5 py-[22px]">
            <div className="space-y-[18px]">
              <DetailRow
                label={language === "en" ? "Beautician" : "Profesional"}
                value={data.professional || "—"}
              />
              <div className="h-px bg-[var(--border-subtle)]" />
              <DetailRow
                label={language === "en" ? "Service" : "Servicio"}
                value={data.service || "—"}
              />
              <div className="h-px bg-[var(--border-subtle)]" />
              <DetailRow label={language === "en" ? "Date" : "Fecha"} value={dateLine} />
              <div className="h-px bg-[var(--border-subtle)]" />
              <DetailRow label={language === "en" ? "Time" : "Hora"} value={timeLine} />
              <div className="h-px bg-[var(--border-subtle)]" />
              <DetailRow
                label={language === "en" ? "Book for" : "Reservar para"}
                value={bookingFor}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 px-7 pb-10 pt-2 sm:px-8">
        <div className="mx-auto flex w-full max-w-md flex-col gap-1">
          {onGoHome ? (
            <button
              type="button"
              onClick={onGoHome}
              className="h-14 w-full rounded-xl bg-[var(--rz-coral)] text-[15px] font-extrabold text-white shadow-[0_6px_20px_rgba(255,87,87,0.3)] transition hover:bg-[var(--action-primary-hover)]"
            >
              {language === "en" ? "Go to home" : "Ir al inicio"}
            </button>
          ) : (
            <Link
              href="/"
              className="flex h-14 w-full items-center justify-center rounded-xl bg-[var(--rz-coral)] text-[15px] font-extrabold text-white shadow-[0_6px_20px_rgba(255,87,87,0.3)] transition hover:bg-[var(--action-primary-hover)]"
            >
              {language === "en" ? "Go to home" : "Ir al inicio"}
            </Link>
          )}
          <Link
            href={detailsHref}
            className="flex h-[52px] w-full items-center justify-center text-[15px] font-extrabold text-[var(--rz-navy)] hover:text-[var(--rz-coral)]"
          >
            {language === "en" ? "View booking details" : "Ver detalles de la reserva"}
          </Link>
        </div>
      </div>
    </div>
  );
}
