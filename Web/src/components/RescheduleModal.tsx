"use client";

import React, { useMemo, useState } from "react";
import { X } from "lucide-react";
import { DateSelector, TimeSlotSelector, Button as DSButton } from "@/ds";
import { useI18n } from "@/components/I18nProvider";
import { goToVenue } from "@/lib/goToVenue";

export type RescheduleReservation = {
  id: string;
  businessId?: string;
  businessName?: string;
  serviceIds: string[];
  dateISO?: string;
  timeLabel?: string;
};

type RescheduleModalProps = {
  open: boolean;
  reservation: RescheduleReservation | null;
  onClose: () => void;
};

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function RescheduleModal({ open, reservation, onClose }: RescheduleModalProps) {
  const { t } = useI18n();
  const [dateISO, setDateISO] = useState(() => toISODate(new Date()));
  const [time, setTime] = useState("10:30 AM");

  React.useEffect(() => {
    if (!open || !reservation) return;
    setDateISO(reservation.dateISO || toISODate(new Date()));
    setTime(reservation.timeLabel || "10:30 AM");
  }, [open, reservation]);

  const slotGroups = useMemo(
    () => [
      {
        label: t("rescheduleMorning"),
        slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM"],
      },
      {
        label: t("rescheduleAfternoon"),
        slots: ["12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"],
      },
      {
        label: t("rescheduleEvening"),
        slots: ["06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"],
      },
    ],
    [t],
  );

  if (!open || !reservation?.businessId) return null;

  const atVenue = reservation.businessName
    ? t("rescheduleAtVenue").replace("{name}", reservation.businessName)
    : "";

  const confirm = () => {
    onClose();
    goToVenue(reservation.businessId!, {
      rebook: "1",
      services: reservation.serviceIds.join(","),
      date: dateISO,
      time,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-lg rounded-[var(--radius-2xl)] bg-white p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeLabel")}
          className="absolute right-4 top-4 rounded-full p-2 text-[var(--rz-gray-500)] hover:bg-[var(--rz-gray-050)]"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-black text-[var(--rz-navy)]">{t("rescheduleTitle")}</h2>
        <p className="mt-2 text-sm font-medium text-[var(--rz-gray-500)]">
          {t("rescheduleSubtitle").replace("{atVenue}", atVenue)}
        </p>

        <div className="mt-6 space-y-6">
          <section>
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
              {t("rescheduleNewDate")}
            </h3>
            <DateSelector count={7} value={dateISO} onChange={setDateISO} />
          </section>
          <section>
            <h3 className="mb-3 text-[11px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">
              {t("rescheduleNewTime")}
            </h3>
            <TimeSlotSelector groups={slotGroups} value={time} onChange={setTime} columns={3} />
          </section>
        </div>

        <div className="mt-8 flex gap-3">
          <DSButton variant="outline" fullWidth onClick={onClose}>
            {t("cancelAppointment")}
          </DSButton>
          <DSButton variant="primary" fullWidth onClick={confirm}>
            {t("rescheduleContinue")}
          </DSButton>
        </div>
      </div>
    </div>
  );
}
