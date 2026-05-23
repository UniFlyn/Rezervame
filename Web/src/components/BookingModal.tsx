"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  Clock,
  Check,
  Info,
  Plus,
  CreditCard,
  Wallet,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import { useI18n } from "@/components/I18nProvider";
import { parseAvailability } from "@/lib/staffAvailability";
import { useVenueBookingCartStore } from "@/store/venueBookingCartStore";
import {
  bookingConfirmationToSearchParams,
  saveBookingConfirmation,
  type BookingConfirmationPayload,
} from "@/lib/bookingConfirmation";
import { BookingConfirmationView } from "@/components/BookingConfirmationView";

type VenueServiceRow = {
  id: string;
  name: string;
  price: number;
  time: string;
  description?: string;
};

type VenueTeamRow = {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  img: string;
  /** When empty/omitted, staff can perform any service at this venue. */
  serviceIds?: string[];
  availability?: string;
};

export type BookingModalVenueData = {
  id: string;
  name?: string;
  services: VenueServiceRow[];
  team: VenueTeamRow[];
  schedule?: { day: string; hours: string }[];
  taxPercentage?: number;
  /** Platform commission % of subtotal (Admin → Default Commission). */
  commissionPercent?: number;
  /** @deprecated Alias for commissionPercent — was misused as a flat dollar fee. */
  serviceFee?: number;
  /** `automatic` = confirm and pay at checkout; `manual` = request then pay after approval. */
  appointmentApprovalMode?: 'manual' | 'automatic';
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after all bookings are created successfully, before navigation. */
  onBookingSuccess?: () => void;
  selectedServiceIds: string[];
  venueData: BookingModalVenueData;
  promotions?: Array<{ serviceId: string; discountPercent: number; label?: string | null }>;
}

type Step =
  | "SCHEDULE"
  | "SUMMARY"
  | "STAFF_LIST"
  | "PROFESSIONAL_DETAIL"
  | "CHECKOUT_PREVIEW"
  | "SERVICE_PICKER"
  | "CONFIRMATION";

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function generateSlotsForDay(schedule: { day: string; hours: string }[] | undefined, day: Date): string[] {
  const defaultSlots = [
    "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
    "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM",
    "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
  ];
  if (!schedule || schedule.length === 0) return defaultSlots;

  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = weekdays[day.getDay()];
  const matching = schedule.find(s => s.day.toLowerCase() === dayName.toLowerCase());
  if (!matching) return defaultSlots;

  const hoursStr = matching.hours.trim();
  if (hoursStr.toLowerCase() === "closed") {
    return [];
  }

  const parts = hoursStr.split("-");
  if (parts.length !== 2) return defaultSlots;

  const startRaw = parts[0].trim();
  const endRaw = parts[1].trim();

  const parseToMinutes = (t: string): number => {
    const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return 540; // Default 9:00 AM
    let h = parseInt(m[1], 10);
    const mins = parseInt(m[2], 10);
    const ampm = m[3].toUpperCase();
    if (ampm === "PM" && h !== 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + mins;
  };

  const startMins = parseToMinutes(startRaw);
  let endMins = parseToMinutes(endRaw);

  if (endMins <= startMins) {
    endMins = startMins + 540;
  }

  const slots: string[] = [];
  for (let mins = startMins; mins < endMins; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const formatted = `${String(displayHour).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
    slots.push(formatted);
  }

  return slots;
}

function addDays(base: Date, n: number): Date {
  const x = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function parseDurationMinutes(s: { time?: string }): number {
  const m = String(s.time || "").match(/(\d+)\s*min/i);
  if (m) return Math.max(15, parseInt(m[1], 10));
  return 60;
}

function combineDateAndTime(day: Date, timeStr: string): Date {
  const d = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const m = timeStr.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) {
    d.setHours(10, 30, 0, 0);
    return d;
  }
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  d.setHours(h, min, 0, 0);
  return d;
}

function isSameLocalDay(a: Date, b: Date): boolean {
  return startOfLocalDay(a).getTime() === startOfLocalDay(b).getTime();
}

/** When [day] is today, slots at or before the current clock time are not bookable. */
function isTimeSlotInPast(day: Date, timeStr: string, now: Date = new Date()): boolean {
  if (!isSameLocalDay(day, now)) return false;
  return combineDateAndTime(day, timeStr).getTime() <= now.getTime();
}

function filterBookableTimeSlots(slots: string[], day: Date, now: Date = new Date()): string[] {
  if (!isSameLocalDay(day, now)) return slots;
  return slots.filter((t) => !isTimeSlotInPast(day, t, now));
}

function formatTimeRange(start: Date, end: Date, locale: string): string {
  const o = { hour: "numeric" as const, minute: "2-digit" as const, hour12: true };
  return `${start.toLocaleTimeString(locale, o)} – ${end.toLocaleTimeString(locale, o)}`;
}

function staffOffersService(member: VenueTeamRow, serviceId: string): boolean {
  const ids = member.serviceIds;
  if (!ids || ids.length === 0) return true;
  return ids.includes(serviceId);
}

function staffAvailableOnDay(availabilityRaw: string | undefined, day: Date): boolean {
  const raw = (availabilityRaw || "").trim();
  if (!raw) return true;
  const { mode, weekly, dates } = parseAvailability(raw);
  const ymd = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  if (mode === "dates") {
    if (dates.length === 0) return true;
    return dates.includes(ymd);
  }
  if (weekly.length === 0) return true;
  return weekly.includes(day.getDay());
}

function pickStaffForService(serviceId: string, team: VenueTeamRow[], day: Date): string | undefined {
  if (!team.length) return undefined;
  const eligible = team.filter((p) => staffOffersService(p, serviceId));
  const pool = eligible.length ? eligible : team;
  const available = pool.filter((p) => staffAvailableOnDay(p.availability, day));
  const ranked = (available.length ? available : pool)
    .slice()
    .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));
  return ranked[0]?.id;
}

export const BookingModal = ({ isOpen, onClose, onBookingSuccess, selectedServiceIds, venueData, promotions }: BookingModalProps) => {
  const router = useRouter();
  const { t, language } = useI18n();
  const dateLocale = "en-US";
  const [step, setStep] = useState<Step>("SCHEDULE");
  const [confirmationData, setConfirmationData] = useState<BookingConfirmationPayload | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedTime, setSelectedTime] = useState<string>("10:30 AM");
  const [selectedProfForDetail, setSelectedProfForDetail] = useState<VenueTeamRow | null>(null);
  const [activeCartIndexForChange, setActiveCartIndexForChange] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [familyGuests, setFamilyGuests] = useState<Array<{ id: string; name: string }>>([]);
  /** map from cartIndex to memberId (`null` for user, string for family member) */
  const [serviceMemberMap, setServiceMemberMap] = useState<Record<number, string | null>>({});
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "VENUE">("ONLINE");
  const [checkoutPayTab, setCheckoutPayTab] = useState<"card" | "yappy" | "cash">("card");
  const [payMethods, setPayMethods] = useState<
    { id: "card" | "yappy" | "cash"; label: string; enabled: boolean }[]
  >([
    { id: "card", label: "Card", enabled: false },
    { id: "yappy", label: "Yappy", enabled: true },
    { id: "cash", label: "Cash", enabled: true },
  ]);
  const [timePeriod, setTimePeriod] = useState<"all" | "morning" | "afternoon" | "evening">("all");
  const [serviceSearch, setServiceSearch] = useState("");
  const [isPaid, setIsPaid] = useState(false);
  const prevOpenRef = useRef(false);

  const slotPeriod = (time: string): "morning" | "afternoon" | "evening" => {
    const m = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!m) return "morning";
    let h = parseInt(m[1], 10);
    const ap = m[3].toUpperCase();
    if (ap === "PM" && h !== 12) h += 12;
    if (ap === "AM" && h === 12) h = 0;
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  };

  const dayStrip = useMemo(() => {
    const start = addDays(startOfLocalDay(new Date()), dayOffset);
    return Array.from({ length: 8 }, (_, i) => addDays(start, i));
  }, [dayOffset]);

  useEffect(() => {
    if (!isOpen) {
      prevOpenRef.current = false;
      return;
    }
    const justOpened = !prevOpenRef.current;
    prevOpenRef.current = true;

    if (justOpened) {
      const defaultDay = addDays(startOfLocalDay(new Date()), 0);
      const initial: Record<number, string> = {};
      selectedServiceIds.forEach((sid, idx) => {
        const picked = pickStaffForService(sid, venueData.team, defaultDay);
        initial[idx] = picked ?? venueData.team[0]?.id ?? sid;
      });
      setAssignments(initial);
      setStep("SCHEDULE");
      setDayOffset(0);
      setSelectedDayIndex(0);
      setSelectedTime("10:30 AM");
      const initialMembers: Record<number, string | null> = {};
      selectedServiceIds.forEach((_, idx) => { initialMembers[idx] = null; });
      setServiceMemberMap(initialMembers);
      setPaymentMethod("ONLINE");
      setIsPaid(false);
      void apiGet<{ methods?: { id: string; label: string; enabled: boolean }[] }>("/public/payment-config")
        .then((cfg) => {
          if (cfg.methods?.length) {
            setPayMethods(
              cfg.methods.map((m) => ({
                id: m.id as "card" | "yappy" | "cash",
                label: m.label,
                enabled: m.enabled,
              })),
            );
            const first = cfg.methods.find((m) => m.enabled);
            if (first) setCheckoutPayTab(first.id as "card" | "yappy" | "cash");
          }
        })
        .catch(() => {});
      if (typeof window !== "undefined" && localStorage.getItem("rezervame_token")) {
        void apiGet<Array<{ id: string; name: string }>>("/mobile/family-members", "USER")
          .then((rows) => setFamilyGuests(Array.isArray(rows) ? rows : []))
          .catch(() => setFamilyGuests([]));
      } else {
        setFamilyGuests([]);
      }
      return;
    }

    const start = addDays(startOfLocalDay(new Date()), dayOffset);
    const day = addDays(start, selectedDayIndex);
    setAssignments((prev) => {
      const next: Record<number, string> = { ...prev };
      let changed = false;

      selectedServiceIds.forEach((sid, idx) => {
        if (next[idx] === undefined) {
          const picked = pickStaffForService(sid, venueData.team, day);
          if (picked) {
            next[idx] = picked;
            changed = true;
          }
        } else {
          const cur = next[idx];
          const curMember = venueData.team.find((m) => m.id === cur);
          const stillOk =
            curMember &&
            staffOffersService(curMember, sid) &&
            staffAvailableOnDay(curMember.availability, day);
          if (!stillOk) {
            const picked = pickStaffForService(sid, venueData.team, day);
            if (picked && picked !== cur) {
              next[idx] = picked;
              changed = true;
            }
          }
        }
      });

      // Cleanup indices that no longer exist
      Object.keys(next).forEach((key) => {
        const idx = parseInt(key);
        if (idx >= selectedServiceIds.length) {
          delete next[idx];
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [isOpen, dayOffset, selectedDayIndex, selectedServiceIds, venueData.team]);

  const getServicePrice = useCallback((svcId: string, basePrice: number) => {
    const promo = promotions?.find(p => p.serviceId === svcId);
    if (promo) {
      return basePrice * (1 - promo.discountPercent / 100);
    }
    return basePrice;
  }, [promotions]);

  const selectedServices = useMemo(
    () => selectedServiceIds.map((id, index) => {
      const svc = venueData.services.find(s => s.id === id);
      if (!svc) return null;
      const finalPrice = getServicePrice(id, svc.price);
      return { ...svc, finalPrice, cartIndex: index };
    }).filter(Boolean) as (VenueServiceRow & { finalPrice: number; cartIndex: number })[],
    [venueData.services, selectedServiceIds, getServicePrice],
  );

  const subtotal = useMemo(
    () => selectedServices.reduce((acc, s) => acc + s.finalPrice || 0, 0),
    [selectedServices],
  );

  const commissionPercent = useMemo(() => {
    const raw = venueData.commissionPercent ?? venueData.serviceFee ?? 15;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 15;
  }, [venueData.commissionPercent, venueData.serviceFee]);

  const taxAmount = useMemo(
    () => (subtotal * (Number(venueData.taxPercentage) || 0)) / 100,
    [subtotal, venueData.taxPercentage],
  );

  const serviceFee = useMemo(
    () => (subtotal * commissionPercent) / 100,
    [subtotal, commissionPercent],
  );

  const totalPrice = useMemo(
    () => subtotal + taxAmount + serviceFee,
    [subtotal, taxAmount, serviceFee],
  );

  const autoApproval = venueData.appointmentApprovalMode === 'automatic';

  const selectedDay = dayStrip[selectedDayIndex] ?? startOfLocalDay(new Date());

  useEffect(() => {
    const all = generateSlotsForDay(venueData.schedule, selectedDay);
    const bookable = filterBookableTimeSlots(all, selectedDay);
    if (bookable.length > 0 && (!bookable.includes(selectedTime) || isTimeSlotInPast(selectedDay, selectedTime))) {
      setSelectedTime(bookable[0]);
    }
  }, [selectedDay, venueData.schedule, selectedTime]);

  const slotStart = useMemo(
    () => combineDateAndTime(selectedDay, selectedTime),
    [selectedDay, selectedTime],
  );

  const serviceTimeRanges = useMemo(() => {
    let cursor = new Date(slotStart);
    return selectedServices.map((svc) => {
      const mins = parseDurationMinutes(svc);
      const start = new Date(cursor);
      const end = new Date(cursor.getTime() + mins * 60_000);
      cursor = end;
      return { svc, label: formatTimeRange(start, end, dateLocale) };
    });
  }, [selectedServices, slotStart, dateLocale]);

  const submitBookings = useCallback(async () => {
    const businessId = venueData?.id;
    if (!businessId) {
      toastError("Missing venue", "Could not determine this business.");
      return;
    }
    if (typeof window !== "undefined" && !localStorage.getItem("rezervame_token")) {
      toastWarning(
        "Sign in required",
        "Sign in with your customer account on the web app (same as the mobile app) to book.",
      );
      return;
    }
    if (selectedServices.length === 0) {
      toastWarning("No services", "Select at least one service.");
      return;
    }
    const start = combineDateAndTime(selectedDay, selectedTime);
    if (start.getTime() < Date.now() - 60_000) {
      toastWarning("Invalid time", "Choose a future date and time.");
      return;
    }
    setIsProcessing(true);
    try {
      const bookingGroupId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `grp_${Date.now()}`;
      const preferredPayment =
        checkoutPayTab === "card"
          ? "Card Payment"
          : checkoutPayTab === "yappy"
            ? "Yappy"
            : "Cash Payment";
      const bookingIds: string[] = [];
      let cursor = new Date(start);
      for (const svc of selectedServices) {
        const staffRaw = assignments[svc.cartIndex];
        const iso = cursor.toISOString();
        const body: {
          businessId: string;
          serviceId: string;
          date: string;
          staffId?: string;
          familyMemberId?: string;
          bookingGroupId: string;
          paymentMethod: string;
        } = {
          businessId,
          serviceId: svc.id,
          date: iso,
          bookingGroupId,
          paymentMethod: preferredPayment,
        };
        if (staffRaw && venueData.team.some((m) => m.id === staffRaw)) {
          body.staffId = staffRaw;
        }
        const memId = serviceMemberMap[svc.cartIndex];
        if (memId) {
          body.familyMemberId = memId;
        }

        const created = await apiPost<{ id: string }>("/mobile/bookings", body, "USER");
        if (created?.id) bookingIds.push(created.id);
        const mins = parseDurationMinutes(svc);
        cursor = new Date(cursor.getTime() + mins * 60_000);
      }

      const isCashCheckout = checkoutPayTab === "cash";
      const iso = start.toISOString();
      const serviceSummary = selectedServices.map((s) => s.name).join(", ");
      const staffNames = new Set<string>();
      for (const svc of selectedServices) {
        const staffId = assignments[svc.cartIndex];
        const member = venueData.team.find((m) => m.id === staffId);
        if (member?.name) staffNames.add(member.name);
      }
      const professionalSummary =
        staffNames.size > 0 ? Array.from(staffNames).join(", ") : "—";
      const bookingForNames = new Set<string>();
      for (const svc of selectedServices) {
        const memId = serviceMemberMap[svc.cartIndex];
        if (memId) {
          const fm = familyGuests.find((m) => m.id === memId);
          bookingForNames.add(fm?.name || (language === "en" ? "Family member" : "Familiar"));
        } else {
          bookingForNames.add(language === "en" ? "Myself" : "Yo");
        }
      }
      const bookingForSummary = Array.from(bookingForNames).join(", ");

      const confirmationPayload: BookingConfirmationPayload = {
        date: iso,
        venue: venueData?.name,
        service: serviceSummary,
        professional: professionalSummary,
        bookingFor: bookingForSummary,
        price: `$${totalPrice.toFixed(2)}`,
        bookingId: bookingIds[0],
        auto: autoApproval,
        cash: isCashCheckout,
        paid: autoApproval && !isCashCheckout,
      };

      if (autoApproval && bookingIds.length > 0 && !isCashCheckout) {
        const cardEnabled = payMethods.find((m) => m.id === "card")?.enabled;
        if (checkoutPayTab === "card" && cardEnabled) {
          const checkout = await apiPost<{ url: string }>(
            "/mobile/bookings/pay-group/stripe-checkout",
            { bookingIds },
            "USER",
          );
          if (checkout?.url) {
            saveBookingConfirmation(confirmationPayload);
            onBookingSuccess?.();
            onClose();
            window.location.href = checkout.url;
            return;
          }
        }
        await apiPost(
          "/mobile/bookings/pay-group",
          { bookingIds, paymentMethod: preferredPayment },
          "USER",
        );
      }

      saveBookingConfirmation(confirmationPayload);
      onBookingSuccess?.();
      setConfirmationData(confirmationPayload);
      setStep("CONFIRMATION");
      const sp = bookingConfirmationToSearchParams(confirmationPayload);
      window.history.replaceState(null, "", `/reservations/confirmation?${sp.toString()}`);
    } catch (e) {
      toastError(
        "Booking failed",
        e instanceof Error ? e.message : "Try again or check that you are signed in as a customer.",
      );
    } finally {
      setIsProcessing(false);
    }
  }, [
    assignments,
    onBookingSuccess,
    onClose,
    router,
    selectedDay,
    selectedServices,
    selectedTime,
    autoApproval,
    checkoutPayTab,
    payMethods,
    language,
    venueData.id,
    venueData.name,
    venueData.team,
    serviceMemberMap,
    familyGuests,
    totalPrice,
  ]);

  const monthTitle = useMemo(
    () =>
      new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric" }).format(dayStrip[0] ?? new Date()),
    [dateLocale, dayStrip],
  );

  const staffChoiceList = useMemo(() => {
    const sid = activeCartIndexForChange !== null ? selectedServiceIds[activeCartIndexForChange] : null;
    if (!sid) return venueData.team;
    const eligible = venueData.team.filter((p) => staffOffersService(p, sid));
    return eligible.length ? eligible : venueData.team;
  }, [activeCartIndexForChange, venueData.team, selectedServiceIds]);

  const staffListShowsEveryone = useMemo(() => {
    const sid = activeCartIndexForChange !== null ? selectedServiceIds[activeCartIndexForChange] : null;
    if (!sid) return false;
    const eligible = venueData.team.filter((p) => staffOffersService(p, sid));
    return eligible.length === 0 && venueData.team.length > 0;
  }, [activeCartIndexForChange, venueData.team, selectedServiceIds]);

  useEffect(() => {
    if (step !== "CONFIRMATION") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [step]);

  if (!isOpen && step !== "CONFIRMATION") return null;

  if (step === "CONFIRMATION" && confirmationData && typeof document !== "undefined") {
    return createPortal(
      <BookingConfirmationView
        data={confirmationData}
        onGoHome={() => {
          setConfirmationData(null);
          setStep("SCHEDULE");
          onClose();
          router.push("/");
        }}
      />,
      document.body,
    );
  }

  const handleCloseAttempt = () => {
    if (step === "CONFIRMATION") return;
    if (step !== "SCHEDULE") {
      setIsDiscardModalOpen(true);
    } else {
      onClose();
    }
  };

  const renderSchedule = () => {
    const allSlots = generateSlotsForDay(venueData.schedule, selectedDay);
    const slots = allSlots.filter((time) => {
      if (timePeriod === "all") return true;
      const p = slotPeriod(time);
      if (timePeriod === "morning") return p === "morning";
      if (timePeriod === "afternoon") return p === "afternoon";
      return p === "evening";
    });
    const bookableCount = filterBookableTimeSlots(allSlots, selectedDay).length;
    const periodLabels =
      language === "en"
        ? { all: "All", morning: "Morning", afternoon: "Afternoon", evening: "Evening" }
        : { all: "Todos", morning: "Mañana", afternoon: "Tarde", evening: "Noche" };
    return (
      <div className="flex flex-col items-center w-full">
        <h2 className="text-xl font-black text-slate-900 mb-6 capitalize">{monthTitle}</h2>

        {selectedServices.length > 0 ? (
          <div className="mb-6 w-full rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {"Selected services"}
            </p>
            {selectedServices.map((svc) => (
              <p key={svc.cartIndex} className="text-sm font-bold text-slate-900">
                {svc.name} · ${Number(svc.finalPrice).toFixed(2)}
              </p>
            ))}
            <button
              type="button"
              onClick={() => setStep("SERVICE_PICKER")}
              className="mt-3 text-xs font-bold text-[#ff5a5f] hover:underline"
            >
              + {t("bookingAddAnotherService") || "Agregar otro servicio"}
            </button>
          </div>
        ) : null}

        <div className="flex items-center gap-4 mb-10 w-full justify-center">
          <button
            type="button"
            disabled={dayOffset <= 0}
            onClick={() => {
              setDayOffset((d) => Math.max(0, d - 7));
              setSelectedDayIndex(0);
            }}
            className="p-2 text-slate-400 hover:text-slate-900 disabled:opacity-30"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
            {dayStrip.map((day, idx) => (
              <button
                type="button"
                key={day.toISOString()}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center justify-center min-w-[55px] h-[75px] rounded-2xl border-2 transition-all ${
                  selectedDayIndex === idx
                    ? "bg-[#ff5a5f] border-[#ff5a5f] text-white shadow-lg shadow-[#ff5a5f]/30"
                    : "border-slate-100 text-slate-400 hover:border-slate-200"
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {new Intl.DateTimeFormat(dateLocale, { weekday: "short" }).format(day)}
                </span>
                <span className="text-xl font-black mt-1">{day.getDate()}</span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setDayOffset((d) => d + 7);
              setSelectedDayIndex(0);
            }}
            className="p-2 text-slate-400 hover:text-slate-900"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="mb-4 flex w-full max-w-[400px] flex-wrap justify-center gap-2">
          {(["all", "morning", "afternoon", "evening"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setTimePeriod(p)}
              className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-wide transition ${
                timePeriod === p ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {slots.length === 0 ? (
          <div className="text-center py-6 mb-10 w-full bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400 m-0">
              {allSlots.length === 0
                ? ("Venue is closed on this day")
                : bookableCount === 0
                  ? ("No more times available today")
                  : ("No slots in this period")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 mb-10 w-full max-w-[400px] max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
            {slots.map((time) => {
              const past = isTimeSlotInPast(selectedDay, time);
              return (
                <button
                  type="button"
                  key={time}
                  disabled={past}
                  onClick={() => !past && setSelectedTime(time)}
                  className={`py-2.5 rounded-2xl border-2 text-[10px] font-black transition-all ${
                    past
                      ? "cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300 opacity-50"
                      : selectedTime === time
                        ? "border-[#ff5a5f] text-[#ff5a5f] bg-[#ff5a5f]/5 shadow-sm"
                        : "border-slate-100 text-slate-700 hover:border-slate-200 hover:bg-slate-50/50"
                  }`}
                >
                  {time}
                </button>
              );
            })}
          </div>
        )}

      <button
        type="button"
        onClick={() => setStep("SUMMARY")}
        className="w-full bg-[#ff5a5f] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5a5f]/20 hover:bg-[#e0484d] transition-all"
      >
        {t("bookingContinue")}
      </button>
    </div>
    );
  };

  const renderSummary = () => (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <button
        type="button"
        onClick={() => setStep("SCHEDULE")}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-4"
      >
        <ChevronLeft size={16} /> {t("bookingBack") || "Back"}
      </button>

      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-black text-slate-900 m-0">{t("bookingSummaryTitle")}</h2>
        <button
          type="button"
          onClick={() => {
            onClose();
            router.push("/profile?tab=family");
          }}
          className="rounded-full px-4 py-2 text-[10px] font-black border-2 border-dashed border-slate-300 bg-white text-slate-500 hover:border-[#ff5a5f] hover:text-[#ff5a5f] transition"
        >
          + {t("bookingAddFamilyMember") || "Add Family Member"}
        </button>
      </div>

      <div className="space-y-4 max-h-[min(42vh,340px)] overflow-y-auto overflow-x-visible pr-3 pt-2 custom-scrollbar">
        {serviceTimeRanges.map(({ svc, label }) => {
          const staffId = assignments[svc.cartIndex];
          const prof = venueData.team.find((m) => m.id === staffId);
          const memberIdForSvc = serviceMemberMap[svc.cartIndex];

          return (
            <div key={`${svc.id}-${svc.cartIndex}`} className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 animate-in slide-in-from-bottom">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="text-[12px] font-black text-slate-900 truncate tracking-tight">{svc.name}</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
                </div>
                <div className="flex items-center gap-2">
                   {svc.finalPrice < svc.price && (
                     <span className="text-[10px] font-bold text-slate-400 line-through tracking-tight">${Number(svc.price).toFixed(2)}</span>
                   )}
                   <span className="text-[12px] font-black text-[#ff5a5f]">${Number(svc.finalPrice).toFixed(2)}</span>
                   <button 
                     onClick={() => {
                        const storeApi = useVenueBookingCartStore.getState();
                        storeApi.removeService(venueData.id, svc.id);
                     }}
                     className="text-slate-300 hover:text-red-500 transition-colors p-1"
                   >
                     <X size={14} />
                   </button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="mb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-400">
                    {t("bookingProfessionalLabel").replace(/:$/, "")}
                  </p>
                  <button
                    type="button"
                    className="flex w-full min-w-0 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-left transition-colors hover:border-[#ff5a5f]/30"
                    onClick={() => {
                      setActiveCartIndexForChange(svc.cartIndex);
                      setStep("STAFF_LIST");
                    }}
                  >
                    <img src={prof?.img || ""} alt="" className="h-6 w-6 shrink-0 rounded-lg object-cover" />
                    <span className="min-w-0 truncate text-[10px] font-bold text-slate-800">
                      {prof?.name || t("all")}
                    </span>
                  </button>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor={`booking-for-${svc.cartIndex}`}
                    className="mb-1.5 block text-[9px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    {t("bookingForWhom")}
                  </label>
                  <select
                    id={`booking-for-${svc.cartIndex}`}
                    value={memberIdForSvc ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setServiceMemberMap((prev) => ({
                        ...prev,
                        [svc.cartIndex]: v === "" ? null : v,
                      }));
                    }}
                    className="w-full cursor-pointer appearance-none rounded-xl border border-slate-200 bg-white px-3 py-2 pr-8 text-[11px] font-bold text-slate-800 shadow-sm outline-none transition focus:border-[#ff5a5f] focus:ring-2 focus:ring-[#ff5a5f]/15"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
                      backgroundRepeat: "no-repeat",
                      backgroundPosition: "right 0.65rem center",
                    }}
                  >
                    <option value="">{t("bookingForMe")}</option>
                    {familyGuests.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => setStep("SERVICE_PICKER")}
        className="flex items-center gap-3 py-6 w-full text-slate-900 font-black text-xs uppercase tracking-widest border-t border-dashed border-slate-200 hover:text-[#ff5a5f] transition-colors group"
      >
        <Plus size={16} className="group-hover:scale-125 transition-transform" /> {t("bookingAddAnotherService") || "Add Another Service"}
      </button>

      <div className="pt-6 border-t border-slate-100">
        <div className="flex justify-between items-end mb-2 gap-4 flex-wrap">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Total: <span className="text-slate-900 font-black ml-1 text-sm">${totalPrice.toFixed(2)}</span>
            <p className="mt-1 font-semibold normal-case text-slate-500">
              {t("bookingPayAtVenue")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("CHECKOUT_PREVIEW")}
            className="bg-[#ff5a5f] text-white px-10 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5a5f]/20 hover:scale-105 active:scale-95 transition-all"
          >
            {t("bookingConfirm") || "Continue to Payment"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderProfessionalDetail = () => {
    if (!selectedProfForDetail) return null;
    const p = selectedProfForDetail;
    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <button
          type="button"
          onClick={() => setStep("SUMMARY")}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-8"
        >
          <ChevronLeft size={16} /> {t("bookingBackSummary")}
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <img
              src={p.img}
              alt=""
              className="w-32 h-32 rounded-[40px] object-cover border-4 border-white shadow-2xl"
            />
            <div className="absolute -bottom-2 -right-2 bg-green-500 w-8 h-8 rounded-2xl flex items-center justify-center text-white border-4 border-white shadow-lg">
              <Check size={16} strokeWidth={4} />
            </div>
          </div>

          <h3 className="text-2xl font-black text-slate-900 mb-1">{p.name}</h3>
          <p className="text-[#ff5a5f] text-[10px] font-black uppercase tracking-[0.2em] mb-6">{p.role}</p>

          <div className="flex gap-8 mb-10 pb-8 border-b border-slate-100 w-full justify-center">
            <div>
              <p className="text-lg font-black text-slate-900">{p.rating > 0 ? p.rating.toFixed(1) : "—"}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rating</p>
            </div>
            <div className="border-x border-slate-100 px-8">
              <p className="text-lg font-black text-slate-900">{p.reviews > 0 ? `${p.reviews}+` : "—"}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("reviews")}</p>
            </div>
            <div>
              <p className="text-lg font-black text-slate-900">—</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t("bookingExperienceYears")}</p>
            </div>
          </div>

          <div className="w-full text-left">
            <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6">
              {t("bookingCatalogHeading")}
            </h4>
            <div className="space-y-3">
              {venueData.services
                .filter((s) => staffOffersService(p, s.id))
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border-2 border-transparent hover:border-[#ff5a5f]/20 transition-all cursor-default"
                  >
                    <span className="font-bold text-slate-700 text-sm">{s.name}</span>
                    <Check size={16} className="text-[#ff5a5f]" />
                  </div>
                ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("SUMMARY")}
            className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-2xl mt-12 hover:bg-slate-800 transition-all"
          >
            {t("bookingBackSummary")}
          </button>
        </div>
      </div>
    );
  };

  const renderStaffList = () => {
    if (activeCartIndexForChange === null) return null;
    const sid = selectedServices[activeCartIndexForChange]?.id;
    const svc = venueData.services.find((s) => s.id === sid);
    const availableStaff = venueData.team.filter((m) => {
      const day = dayStrip[selectedDayIndex];
      return staffOffersService(m, sid) && staffAvailableOnDay(m.availability, day);
    });

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="mb-6">
          <button
            onClick={() => {
              setStep("SUMMARY");
              setActiveCartIndexForChange(null);
            }}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> {t("bookingBack")}
          </button>
          <h2 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">
            {t("bookingSelectProfessional")}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
            {svc?.name}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {availableStaff.length > 0 ? (
            availableStaff.map((member) => {
              return (
                <div
                  key={member.id}
                  onClick={() => {
                    setAssignments((prev) => ({ ...prev, [activeCartIndexForChange!]: member.id }));
                    setStep("SUMMARY");
                    setActiveCartIndexForChange(null);
                  }}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                    assignments[activeCartIndexForChange!] === member.id
                      ? "border-[#ff5a5f] bg-[#ff5a5f]/5 shadow-sm"
                      : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={member.img} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" />
                      <div className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm group-hover:text-[#ff5a5f] transition-colors">
                        {member.name}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-black text-slate-700">{member.rating > 0 ? member.rating : "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="p-3 text-slate-300 ml-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProfForDetail(member);
                      setStep("PROFESSIONAL_DETAIL");
                    }}
                  >
                    <Info size={20} />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-slate-400 text-sm font-bold p-4">No staff available for this slot.</p>
          )}
        </div>
      </div>
    );
  };

  const renderServicePicker = () => {
    const storeApi = useVenueBookingCartStore.getState();
    const handleAdd = (sid: string) => {
      if (selectedServiceIds.includes(sid)) {
        setStep("SCHEDULE");
        return;
      }
      storeApi.setCart(venueData.id, [...selectedServiceIds, sid]);
      setStep("SCHEDULE");
    };

    const q = serviceSearch.trim().toLowerCase();
    const filteredServices = venueData.services.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || (s.description || "").toLowerCase().includes(q),
    );

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setStep("SCHEDULE")}
            className="flex items-center gap-2 text-xs font-black text-slate-400 hover:text-slate-900 transition-colors uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> {t("bookingBack")}
          </button>
          <h2 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">
            {t("bookingAddAnotherService") || "Add Another Service"}
          </h2>
          <input
            type="search"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder={"Search services…"}
            className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:border-[#ff5a5f] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {filteredServices.map((s) => (
            <div
              key={s.id}
              onClick={() => handleAdd(s.id)}
              className="flex items-center justify-between p-5 rounded-3xl bg-slate-50 border-2 border-slate-100 hover:border-[#ff5a5f]/20 hover:bg-white transition-all cursor-pointer group"
            >
              <div>
                <h4 className="font-black text-slate-900 text-sm group-hover:text-[#ff5a5f] transition-colors">{s.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {s.time} • {getServicePrice(s.id, s.price) < s.price ? (
                    <>
                      <span className="line-through mr-1">${Number(s.price).toFixed(2)}</span>
                      <span className="text-[#ff5a5f] font-black">${Number(getServicePrice(s.id, s.price)).toFixed(2)}</span>
                    </>
                  ) : (
                    `$${Number(s.price).toFixed(2)}`
                  )}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border-2 border-[#ff5a5f] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#ff5a5f] hover:bg-[#ff5a5f] hover:text-white transition-all"
              >
                {selectedServiceIds.includes(s.id) ? ("Added") : ("Add")}
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderCheckoutPreview = () => (
    <div className="animate-in fade-in zoom-in-95 duration-500">
      <button
        type="button"
        onClick={() => setStep("SUMMARY")}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-900 font-black text-[10px] uppercase tracking-widest mb-8"
      >
        <ChevronLeft size={16} /> {t("bookingBackSummary") || "Back to Summary"}
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
          {t('checkoutPreview')}
        </h2>
        <p className="text-slate-400 font-bold text-sm">
          {"Review your booking details before submitting."}
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {payMethods.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={!tab.enabled}
            onClick={() => setCheckoutPayTab(tab.id)}
            className={`flex-1 rounded-xl border-2 py-3 text-[10px] font-black uppercase tracking-widest transition disabled:cursor-not-allowed disabled:opacity-40 ${
              checkoutPayTab === tab.id
                ? "border-[#ff5a5f] bg-[#ff5a5f]/5 text-[#ff5a5f]"
                : "border-slate-100 text-slate-400 hover:border-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {!autoApproval && checkoutPayTab === "yappy" ? (
        <p className="mb-4 text-center text-[10px] font-bold text-amber-700">
          You will pay via Yappy after the business confirms your booking.
        </p>
      ) : null}
      {!autoApproval && checkoutPayTab === "cash" ? (
        <p className="mb-4 text-center text-[10px] font-bold text-slate-500">
          Payment at the venue is collected after the business approves your booking.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
      <div className="bg-slate-50 rounded-[32px] border border-slate-100 p-6 sm:p-8 space-y-6">
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedServices.map((svc) => {
            const staffId = assignments[svc.cartIndex];
            const prof = venueData.team.find((m) => m.id === staffId);
            const memberId = serviceMemberMap[svc.cartIndex];
            const memberName = memberId ? familyGuests.find(g => g.id === memberId)?.name : t("bookingForMe");

            return (
              <div key={`${svc.id}-${svc.cartIndex}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100/60 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                  <img src={prof?.img || ""} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-[13px] font-black text-slate-900 truncate tracking-tight">{svc.name}</h4>
                    <div className="flex flex-col items-end">
                      {svc.finalPrice < svc.price && (
                        <span className="text-[9px] font-bold text-slate-400 line-through tracking-tight">${Number(svc.price).toFixed(2)}</span>
                      )}
                      <span className="text-[12px] font-black text-[#ff5a5f] ml-2">${Number(svc.finalPrice).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[9px] font-black text-[#ff5a5f] uppercase tracking-wider">{memberName}</p>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{prof?.name || t('anyStaff')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t-2 border-dashed border-slate-200 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{"Subtotal"}</span>
            <span className="text-sm font-black text-slate-600">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {`Service Fee (${commissionPercent}%)`}
            </span>
            <span className="text-sm font-black text-slate-600">${serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {`Tax (${Number(venueData.taxPercentage) || 0}%)`}
            </span>
            <span className="text-sm font-black text-slate-600">${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{t('totalToPay')}</span>
            <span className="text-2xl font-black text-[#ff5a5f]">${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
      {!autoApproval ? (
        <div className="bg-amber-50 rounded-[24px] border border-amber-200 p-6 flex items-start gap-4 h-fit">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-amber-900 uppercase tracking-wide mb-1">
              {"Awaiting Business Approval"}
            </p>
            <p className="text-[11px] font-medium text-amber-700 leading-relaxed">
              {language === "en"
                ? "Your booking will be sent as a request. Once the business approves, you can make payment from your reservations page."
                : "Tu reserva será enviada como solicitud. Una vez que el negocio la apruebe, podrás realizar el pago desde tu página de reservas."}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50 rounded-[24px] border border-emerald-200 p-6 flex items-start gap-4 h-fit">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
            <CreditCard size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-[11px] font-black text-emerald-900 uppercase tracking-wide mb-1">
              {"Instant confirmation"}
            </p>
            <p className="text-[11px] font-medium text-emerald-700 leading-relaxed">
              {language === "en"
                ? "This venue confirms bookings automatically. Complete payment below to secure your appointment."
                : "Este negocio confirma las reservas automáticamente. Completa el pago abajo para asegurar tu cita."}
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => void submitBookings()}
        disabled={isProcessing}
        className="w-full bg-[#ff5a5f] text-white font-black py-5 rounded-[24px] text-xs uppercase tracking-[0.2em] shadow-2xl shadow-[#ff5a5f]/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-60"
      >
        {isProcessing
          ? autoApproval
            ? ("Processing payment...")
            : ("Submitting...")
          : autoApproval
            ? (`Confirm & Pay $${totalPrice.toFixed(2)}`)
            : ("Submit Booking Request")}
      </button>
      </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-500">
        <div className="bg-white rounded-[28px] sm:rounded-[40px] w-full max-w-[min(920px,96vw)] max-h-[min(92dvh,900px)] shadow-2xl relative flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
          <button
            type="button"
            onClick={handleCloseAttempt}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 text-slate-400 hover:text-slate-900 transition p-2 bg-white/90 rounded-2xl border border-slate-100 shadow-sm"
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          <div className="overflow-y-auto flex-1 min-h-0 px-6 sm:px-10 pt-14 pb-8 sm:pb-10 custom-scrollbar">
            {step === "SCHEDULE" && renderSchedule()}
            {step === "SUMMARY" && renderSummary()}
            {step === "STAFF_LIST" && renderStaffList()}
            {step === "PROFESSIONAL_DETAIL" && renderProfessionalDetail()}
            {step === "CHECKOUT_PREVIEW" && renderCheckoutPreview()}
            {step === "SERVICE_PICKER" && renderServicePicker()}
          </div>
        </div>
      </div>

      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-[450px] w-full text-center shadow-3xl animate-in zoom-in-95 duration-300">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-slate-900 mb-4">{t("bookingDiscardTitle")}</h3>
              <p className="text-slate-400 font-bold leading-relaxed px-4">
                {t("bookingDiscardBody")}
              </p>
            </div>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setIsDiscardModalOpen(false)}
                className="w-full bg-[#ff5a5f] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5a5f]/20"
              >
                {t("bookingContinueBooking")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDiscardModalOpen(false);
                  onClose();
                }}
                className="w-full bg-white text-slate-900 font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.1em] border-2 border-slate-100 hover:bg-slate-50 transition-all"
              >
                {t("bookingDiscardConfirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
