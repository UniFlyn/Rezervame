"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  X,
  ChevronLeft,
  Star,
  Clock,
  Check,
  Info,
  Plus,
  CreditCard,
} from "lucide-react";
import { apiGet, apiPost } from "@/lib/api";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import { useI18n } from "@/components/I18nProvider";
import {
  DateSelector,
  TimeSlotSelector,
  RecipientPicker,
  RecipientBadge,
  PersonBookingGroup,
  Button as DSButton,
} from "@/ds";
import { parseAvailability } from "@/lib/staffAvailability";
import { useVenueBookingCartStore } from "@/store/venueBookingCartStore";
import {
  navigateToBookingConfirmation,
  type BookingConfirmationPayload,
} from "@/lib/bookingConfirmation";
import {
  normalizePublicPaymentConfig,
  customerFacingPaymentMethods,
  pickCustomerDefaultPaymentMethod,
} from "@/lib/paymentConfig";

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
  /** Late-cancellation fee as a % of the reservation total (business-configured: 50 or 100). */
  cancelFeePct?: number;
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Called after all bookings are created successfully, before navigation. */
  onBookingSuccess?: () => void;
  selectedServiceIds: string[];
  venueData: BookingModalVenueData;
  promotions?: Array<{ serviceId: string; discountPercent: number; label?: string | null }>;
  /** When set (from a staff "Ver disponibilidad" entry), bias service assignments to this pro. */
  preferredStaffId?: string;
}

type Step =
  | "BUILDER"
  | "STAFF_LIST"
  | "PROFESSIONAL_DETAIL"
  | "CHECKOUT_PREVIEW"
  | "SERVICE_PICKER";

type RecipientTarget = number | "all" | null;

function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Local ISO date key ('YYYY-MM-DD') — the value contract for the DS DateSelector. */
function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseISODate(s: string): Date {
  const [y, m, d] = String(s).split("-").map((n) => parseInt(n, 10));
  return new Date(y, (m || 1) - 1, d || 1);
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

export const BookingModal = ({ isOpen, onClose, onBookingSuccess, selectedServiceIds, venueData, promotions, preferredStaffId }: BookingModalProps) => {
  const { t, language } = useI18n();
  const dateLocale = "en-US";
  const [step, setStep] = useState<Step>("BUILDER");
  const [recipientPickerFor, setRecipientPickerFor] = useState<RecipientTarget>(null);
  const [selectedDateISO, setSelectedDateISO] = useState<string>(() => toISODate(startOfLocalDay(new Date())));
  const [selectedTime, setSelectedTime] = useState<string>("10:30 AM");
  const [selectedProfForDetail, setSelectedProfForDetail] = useState<VenueTeamRow | null>(null);
  const [activeCartIndexForChange, setActiveCartIndexForChange] = useState<number | null>(null);
  const [assignments, setAssignments] = useState<Record<number, string>>({});
  const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [familyGuests, setFamilyGuests] = useState<Array<{ id: string; name: string }>>([]);
  /** map from cartIndex to memberId (`null` for user, string for family member) */
  const [serviceMemberMap, setServiceMemberMap] = useState<Record<number, string | null>>({});
  const [checkoutPayTab, setCheckoutPayTab] = useState<"wompi" | "yappy">("wompi");
  const [holdModalOpen, setHoldModalOpen] = useState(false);
  const [payMethods, setPayMethods] = useState<
    { id: "wompi" | "yappy"; label: string; enabled: boolean }[]
  >([
    { id: "wompi", label: "Card", enabled: true },
    { id: "yappy", label: "Yappy", enabled: true },
  ]);
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

  const selectedDay = useMemo(() => startOfLocalDay(parseISODate(selectedDateISO)), [selectedDateISO]);

  /** A venue day with zero generated slots is treated as closed (used to disable calendar days). */
  const isDayClosed = useCallback(
    (d: Date) => generateSlotsForDay(venueData.schedule, d).length === 0,
    [venueData.schedule],
  );

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
        const preferred = preferredStaffId
          ? venueData.team.find(
              (m) =>
                m.id === preferredStaffId &&
                staffOffersService(m, sid) &&
                staffAvailableOnDay(m.availability, defaultDay),
            )
          : undefined;
        const picked = preferred?.id ?? pickStaffForService(sid, venueData.team, defaultDay);
        initial[idx] = picked ?? venueData.team[0]?.id ?? sid;
      });
      setAssignments(initial);
      setStep("BUILDER");
      setRecipientPickerFor(null);
      setSelectedDateISO(toISODate(defaultDay));
      setSelectedTime("10:30 AM");
      const initialMembers: Record<number, string | null> = {};
      selectedServiceIds.forEach((_, idx) => { initialMembers[idx] = null; });
      setServiceMemberMap(initialMembers);
      setIsPaid(false);
      void apiGet<Record<string, unknown>>("/public/payment-config")
        .then((raw) => {
          const cfg = normalizePublicPaymentConfig(raw);
          // Spec §9: customer pays by card or Yappy only — never pay-at-venue.
          const online = customerFacingPaymentMethods(cfg.methods);
          if (online.length > 0) {
            setPayMethods(
              online.map((m) => ({
                id: m.id as "wompi" | "yappy",
                label: m.label,
                enabled: m.configured,
              })),
            );
          }
          setCheckoutPayTab(pickCustomerDefaultPaymentMethod(cfg.methods));
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

    const day = startOfLocalDay(parseISODate(selectedDateISO));
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
  }, [isOpen, selectedDateISO, selectedServiceIds, venueData.team, preferredStaffId]);

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

  const applyRecipient = useCallback(
    (target: RecipientTarget, memberId: string | null) => {
      if (target === null) return;
      setServiceMemberMap((prev) => {
        if (target === "all") {
          const next = { ...prev };
          selectedServiceIds.forEach((_, idx) => {
            next[idx] = memberId;
          });
          return next;
        }
        return { ...prev, [target]: memberId };
      });
    },
    [selectedServiceIds],
  );

  const handleAddRecipient = useCallback(
    async (person: { name: string; email?: string }, target: RecipientTarget) => {
      if (typeof window !== "undefined" && !localStorage.getItem("rezervame_token")) {
        toastWarning("Sign in required", "Sign in to save people to your account.");
        return;
      }
      try {
        const created = await apiPost<{ id?: string }>(
          "/mobile/family-members",
          { name: person.name, email: person.email || undefined },
          "USER",
        );
        const rows = await apiGet<Array<{ id: string; name: string }>>("/mobile/family-members", "USER");
        const list = Array.isArray(rows) ? rows : [];
        setFamilyGuests(list);
        const newId =
          created?.id || [...list].reverse().find((r) => r.name === person.name)?.id;
        if (newId) applyRecipient(target, newId);
        toastSuccess("Person added");
      } catch (e) {
        toastError("Could not add person", e instanceof Error ? e.message : "");
      }
    },
    [applyRecipient],
  );

  const recipientName = useCallback(
    (cartIndex: number): { name?: string; self: boolean } => {
      const memId = serviceMemberMap[cartIndex];
      if (!memId) return { self: true };
      const fm = familyGuests.find((g) => g.id === memId);
      return { name: fm?.name || (language === "en" ? "Family member" : "Familiar"), self: false };
    },
    [serviceMemberMap, familyGuests, language],
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

  /** Late-cancellation fee % (business-configured 50/100; default 50 per spec §10). */
  const cancelFeePct = useMemo(() => {
    const n = Number(venueData.cancelFeePct);
    return Number.isFinite(n) && n > 0 ? Math.min(100, n) : 50;
  }, [venueData.cancelFeePct]);

  const autoApproval = venueData.appointmentApprovalMode === 'automatic';

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
      const preferredPayment = checkoutPayTab === "yappy" ? "Yappy" : "Wompi";
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
        cash: false,
        paid: autoApproval,
      };

      onBookingSuccess?.();
      navigateToBookingConfirmation(confirmationPayload);
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

  if (!isOpen) return null;

  const handleCloseAttempt = () => {
    if (step !== "BUILDER") {
      setIsDiscardModalOpen(true);
    } else {
      onClose();
    }
  };

  const renderBuilder = () => {
    const allSlots = generateSlotsForDay(venueData.schedule, selectedDay);
    const bookableCount = filterBookableTimeSlots(allSlots, selectedDay).length;
    const hasBookable = bookableCount > 0;
    const canContinue = hasBookable && selectedServices.length > 0;
    const periodLabels =
      language === "en"
        ? { morning: "Morning", afternoon: "Afternoon", evening: "Evening" }
        : { morning: "Mañana", afternoon: "Tarde", evening: "Noche" };
    const buckets: Record<"morning" | "afternoon" | "evening", { time: string; disabled: boolean }[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    allSlots.forEach((time) => {
      buckets[slotPeriod(time)].push({ time, disabled: isTimeSlotInPast(selectedDay, time) });
    });
    const slotGroups = (["morning", "afternoon", "evening"] as const)
      .filter((p) => buckets[p].length > 0)
      .map((p) => ({ label: periodLabels[p], slots: buckets[p] }));
    const dateLabel = new Intl.DateTimeFormat(dateLocale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(selectedDay);
    const multi = selectedServices.length > 1;
    const sectionTitle = "mb-4 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--rz-gray-500)]";

    return (
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        {/* LEFT — builder */}
        <div className="min-w-0 space-y-9">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-[var(--rz-navy)]">
              {language === "en" ? "Your booking" : "Tu reserva"}
            </h1>
            {venueData.name ? (
              <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                {venueData.name}
              </p>
            ) : null}
          </div>

          {/* Services */}
          <section>
            <h2 className={sectionTitle}>{language === "en" ? "Services" : "Servicios"}</h2>
            <div className="space-y-3">
              {selectedServices.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-[var(--border-default)] bg-[var(--rz-gray-050)] p-6 text-center">
                  <p className="text-sm font-bold text-[var(--rz-gray-500)]">
                    {language === "en" ? "No services yet." : "Aún no hay servicios."}
                  </p>
                </div>
              ) : (
                selectedServices.map((svc) => {
                  const prof = venueData.team.find((m) => m.id === assignments[svc.cartIndex]);
                  const r = recipientName(svc.cartIndex);
                  return (
                    <div
                      key={`${svc.id}-${svc.cartIndex}`}
                      className="rounded-2xl border border-[var(--border-subtle)] bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="truncate text-sm font-black tracking-tight text-[var(--rz-navy)]">{svc.name}</h4>
                          {svc.time ? (
                            <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">{svc.time}</p>
                          ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                          {svc.finalPrice < svc.price && (
                            <span className="text-[11px] font-bold text-[var(--rz-gray-500)] line-through">${Number(svc.price).toFixed(2)}</span>
                          )}
                          <span className="text-sm font-black text-[var(--rz-coral)]">${Number(svc.finalPrice).toFixed(2)}</span>
                          <button
                            type="button"
                            aria-label="Remove"
                            onClick={() => useVenueBookingCartStore.getState().removeService(venueData.id, svc.id)}
                            className="p-1 text-[var(--rz-gray-300)] transition-colors hover:text-[var(--rz-coral)]"
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveCartIndexForChange(svc.cartIndex);
                            setStep("STAFF_LIST");
                          }}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--rz-gray-050)] px-2.5 py-1.5 text-left transition-colors hover:border-[var(--rz-coral)]"
                        >
                          {prof?.img ? (
                            <img src={prof.img} alt="" className="h-5 w-5 shrink-0 rounded-md object-cover" />
                          ) : null}
                          <span className="text-[11px] font-bold text-[var(--rz-navy)]">{prof?.name || t("all")}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-coral)]">
                            {language === "en" ? "Change" : "Cambiar"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setRecipientPickerFor(svc.cartIndex)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--rz-gray-050)] px-2.5 py-1.5 transition-colors hover:border-[var(--rz-coral)]"
                        >
                          <RecipientBadge name={r.self ? undefined : r.name} self={r.self} size="sm" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--rz-coral)]">
                            {language === "en" ? "Change" : "Cambiar"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
              <button
                type="button"
                onClick={() => setStep("SERVICE_PICKER")}
                className="inline-flex items-center gap-2 text-[13px] font-bold text-[var(--rz-coral)] hover:underline"
              >
                <Plus size={16} /> {t("bookingAddAnotherService") || "Agregar otro servicio"}
              </button>
              <button
                type="button"
                onClick={() => setRecipientPickerFor("all")}
                className="text-[13px] font-semibold text-[var(--rz-gray-500)] underline-offset-2 hover:text-[var(--rz-navy)] hover:underline"
              >
                {language === "en" ? "Book for someone else" : "Reservar para otra persona"}
              </button>
            </div>
          </section>

          {/* Date */}
          <section>
            <h2 className={sectionTitle}>{language === "en" ? "Select the date" : "Selecciona la fecha"}</h2>
            <DateSelector
              count={7}
              value={selectedDateISO}
              onChange={(iso: string) => setSelectedDateISO(iso)}
              isDateDisabled={isDayClosed}
            />
          </section>

          {/* Time */}
          <section>
            <h2 className={sectionTitle}>{language === "en" ? "Select the time" : "Selecciona la hora"}</h2>
            {slotGroups.length === 0 || !hasBookable ? (
              <div className="rounded-2xl border-2 border-dashed border-[var(--border-default)] bg-[var(--rz-gray-050)] py-6 text-center">
                <p className="m-0 text-sm font-bold uppercase tracking-widest text-[var(--rz-gray-500)]">
                  {allSlots.length === 0
                    ? language === "en" ? "Venue is closed on this day" : "El negocio está cerrado este día"
                    : language === "en" ? "No more times available today" : "No hay más horarios disponibles hoy"}
                </p>
              </div>
            ) : (
              <TimeSlotSelector
                groups={slotGroups}
                value={selectedTime}
                onChange={(time: string) => setSelectedTime(time)}
                columns={4}
              />
            )}
          </section>

          {/* Sequence */}
          {multi ? (
            <section>
              <h2 className={sectionTitle}>{language === "en" ? "Your sequence" : "Tu secuencia"}</h2>
              <div className="space-y-2">
                {serviceTimeRanges.map(({ svc, label }) => {
                  const prof = venueData.team.find((m) => m.id === assignments[svc.cartIndex]);
                  return (
                    <div
                      key={`seq-${svc.id}-${svc.cartIndex}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--rz-gray-050)] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-[var(--rz-navy)]">{svc.name}</p>
                        {prof?.name ? (
                          <p className="text-[11px] font-semibold text-[var(--rz-gray-500)]">{prof.name}</p>
                        ) : null}
                      </div>
                      <span className="shrink-0 text-[12px] font-bold text-[var(--rz-gray-600)]">{label}</span>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        {/* RIGHT — sticky summary */}
        <div className="lg:sticky lg:top-4">
          <div className="rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-white p-5 shadow-[var(--shadow-card)]">
            <p className="mb-3 text-[11px] font-black uppercase tracking-[0.12em] text-[var(--rz-coral)]">
              {language === "en" ? "Your booking" : "Tu reserva"}
            </p>

            {(() => {
              // Group-by-person (spec §8): only when more than one distinct recipient
              // is involved. Otherwise keep the flat list. Display-only — the
              // multi-service sequencing engine is untouched.
              const groupsOrder: string[] = [];
              const groups: Record<
                string,
                { key: string; name: string; self: boolean; rows: typeof serviceTimeRanges }
              > = {};
              serviceTimeRanges.forEach((entry) => {
                const memId = serviceMemberMap[entry.svc.cartIndex];
                const key = memId || "self";
                if (!groups[key]) {
                  const r = recipientName(entry.svc.cartIndex);
                  groups[key] = {
                    key,
                    name: r.self ? (language === "en" ? "For me · Your account" : "Para mí · Tu cuenta") : (r.name || ""),
                    self: r.self,
                    rows: [],
                  };
                  groupsOrder.push(key);
                }
                groups[key].rows.push(entry);
              });
              const multiRecipient = groupsOrder.length > 1;

              if (multiRecipient) {
                return (
                  <div className="space-y-3">
                    {groupsOrder.map((key) => {
                      const g = groups[key];
                      return (
                        <PersonBookingGroup
                          key={`grp-${key}`}
                          name={g.name}
                          self={g.self}
                          services={g.rows.map(({ svc, label }) => {
                            const prof = venueData.team.find((m) => m.id === assignments[svc.cartIndex]);
                            return {
                              name: svc.name,
                              meta: [prof?.name, label].filter(Boolean).join(" · "),
                              price: `$${Number(svc.finalPrice).toFixed(2)}`,
                            };
                          })}
                        />
                      );
                    })}
                  </div>
                );
              }

              return (
                <div className="space-y-2">
                  {serviceTimeRanges.map(({ svc, label }) => {
                    const prof = venueData.team.find((m) => m.id === assignments[svc.cartIndex]);
                    const r = recipientName(svc.cartIndex);
                    return (
                      <div key={`sum-${svc.id}-${svc.cartIndex}`} className="rounded-xl bg-[var(--rz-gray-050)] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-bold text-[var(--rz-navy)]">{svc.name}</p>
                            <div className="mt-1"><RecipientBadge name={r.self ? undefined : r.name} self={r.self} size="sm" /></div>
                            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--rz-gray-600)]">
                              {prof?.name ? <span>{prof.name}</span> : null}
                              <span>{label}</span>
                            </div>
                          </div>
                          <span className="shrink-0 text-[13px] font-black text-[var(--rz-navy)]">${Number(svc.finalPrice).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="my-4 h-px bg-[var(--border-subtle)]" />

            <div className="space-y-1.5 text-[13px]">
              <div className="flex justify-between">
                <span className="text-[var(--rz-gray-500)]">{language === "en" ? "Subtotal" : "Subtotal"}</span>
                <span className="font-semibold text-[var(--rz-navy)]">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--rz-gray-500)]">
                  {language === "en" ? `Service fee (${commissionPercent}%)` : `Cargo por servicio (${commissionPercent}%)`}
                </span>
                <span className="font-semibold text-[var(--rz-navy)]">${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--rz-gray-500)]">
                  {language === "en" ? `Tax (${Number(venueData.taxPercentage) || 0}%)` : `Impuesto (${Number(venueData.taxPercentage) || 0}%)`}
                </span>
                <span className="font-semibold text-[var(--rz-navy)]">${taxAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="my-4 h-px bg-[var(--border-subtle)]" />

            <div className="flex items-baseline justify-between">
              <span className="text-[15px] font-black text-[var(--rz-navy)]">Total</span>
              <span className="text-2xl font-black text-[var(--rz-coral)]">${totalPrice.toFixed(2)}</span>
            </div>

            <div className="mt-3 space-y-1 rounded-xl bg-[var(--rz-gray-050)] p-3">
              <div className="flex items-start gap-2">
                <Check size={14} className="mt-0.5 shrink-0 text-emerald-600" />
                <p className="text-[12px] font-semibold text-[var(--rz-gray-600)]">
                  {language === "en"
                    ? "Free cancellation up to 60 min before."
                    : "Cancelación gratuita hasta 60 min antes."}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0 text-[var(--rz-gray-400)]" />
                <p className="text-[12px] font-semibold text-[var(--rz-gray-500)]">
                  {language === "en"
                    ? `Late-cancellation fee · up to ${cancelFeePct}% of total`
                    : `Cargo por cancelación · hasta ${cancelFeePct}% del total`}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <DSButton
                variant="primary"
                fullWidth
                size="lg"
                leftIcon="check"
                disabled={!canContinue}
                onClick={() => setHoldModalOpen(true)}
              >
                {t("bookingContinue") || (language === "en" ? "Continue" : "Continuar")}
              </DSButton>
            </div>
            <p className="mt-3 text-center text-[12px] leading-relaxed text-[var(--rz-gray-500)]">
              {language === "en"
                ? "You'll pay securely online. Funds are held until your service is completed."
                : "Pagas de forma segura en línea. Los fondos se retienen hasta completar tu servicio."}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderProfessionalDetail = () => {
    if (!selectedProfForDetail) return null;
    const p = selectedProfForDetail;
    return (
      <div className="animate-in slide-in-from-right-8 duration-500">
        <button
          type="button"
          onClick={() => setStep("STAFF_LIST")}
          className="flex items-center gap-2 text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)] font-black text-[10px] uppercase tracking-widest mb-8"
        >
          <ChevronLeft size={16} /> {t("bookingBack")}
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

          <h3 className="text-2xl font-black text-[var(--rz-navy)] mb-1">{p.name}</h3>
          <p className="text-[#ff5757] text-[10px] font-black uppercase tracking-[0.2em] mb-6">{p.role}</p>

          <div className="flex gap-8 mb-10 pb-8 border-b border-[var(--border-subtle)] w-full justify-center">
            <div>
              <p className="text-lg font-black text-[var(--rz-navy)]">{p.rating > 0 ? p.rating.toFixed(1) : "—"}</p>
              <p className="text-[9px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest">Rating</p>
            </div>
            <div className="border-x border-[var(--border-subtle)] px-8">
              <p className="text-lg font-black text-[var(--rz-navy)]">{p.reviews > 0 ? `${p.reviews}+` : "—"}</p>
              <p className="text-[9px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest">{t("reviews")}</p>
            </div>
            <div>
              <p className="text-lg font-black text-[var(--rz-navy)]">—</p>
              <p className="text-[9px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest">{t("bookingExperienceYears")}</p>
            </div>
          </div>

          <div className="w-full text-left">
            <h4 className="text-[10px] font-black text-[var(--rz-navy)] uppercase tracking-[0.2em] mb-6">
              {t("bookingCatalogHeading")}
            </h4>
            <div className="space-y-3">
              {venueData.services
                .filter((s) => staffOffersService(p, s.id))
                .map((s) => (
                  <div
                    key={s.id}
                    className="flex justify-between items-center p-4 rounded-2xl bg-[var(--rz-gray-050)] border-2 border-transparent hover:border-[#ff5757]/20 transition-all cursor-default"
                  >
                    <span className="font-bold text-[var(--rz-gray-700)] text-sm">{s.name}</span>
                    <Check size={16} className="text-[#ff5757]" />
                  </div>
                ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setStep("STAFF_LIST")}
            className="w-full bg-[var(--rz-navy)] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-2xl mt-12 hover:bg-[var(--rz-navy-800)] transition-all"
          >
            {t("bookingBack")}
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
      return staffOffersService(m, sid) && staffAvailableOnDay(m.availability, selectedDay);
    });

    return (
      <div className="animate-in slide-in-from-right duration-300">
        <div className="mb-6">
          <button
            onClick={() => {
              setStep("BUILDER");
              setActiveCartIndexForChange(null);
            }}
            className="flex items-center gap-2 text-xs font-black text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)] transition-colors uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> {t("bookingBack")}
          </button>
          <h2 className="text-2xl font-black text-[var(--rz-navy)] mt-4 tracking-tight">
            {t("bookingSelectProfessional")}
          </h2>
          <p className="text-xs font-bold text-[var(--rz-gray-500)] uppercase tracking-widest mt-1">
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
                    setStep("BUILDER");
                    setActiveCartIndexForChange(null);
                  }}
                  className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                    assignments[activeCartIndexForChange!] === member.id
                      ? "border-[#ff5757] bg-[#ff5757]/5 shadow-sm"
                      : "border-[var(--border-subtle)] bg-white hover:border-[var(--border-default)]"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img src={member.img} alt="" className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm" />
                      <div className="absolute -top-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <p className="font-black text-[var(--rz-navy)] text-sm group-hover:text-[#ff5757] transition-colors">
                        {member.name}
                      </p>
                      <p className="text-[10px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest">{member.role}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star size={10} className="fill-amber-400 text-amber-400" />
                        <span className="text-[10px] font-black text-[var(--rz-gray-700)]">{member.rating > 0 ? member.rating : "—"}</span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="p-3 text-[var(--rz-gray-300)] ml-auto"
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
            <p className="text-[var(--rz-gray-500)] text-sm font-bold p-4">No staff available for this slot.</p>
          )}
        </div>
      </div>
    );
  };

  const renderServicePicker = () => {
    const storeApi = useVenueBookingCartStore.getState();
    const handleAdd = (sid: string) => {
      if (selectedServiceIds.includes(sid)) {
        setStep("BUILDER");
        return;
      }
      storeApi.setCart(venueData.id, [...selectedServiceIds, sid]);
      setStep("BUILDER");
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
            onClick={() => setStep("BUILDER")}
            className="flex items-center gap-2 text-xs font-black text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)] transition-colors uppercase tracking-widest"
          >
            <ChevronLeft size={16} /> {t("bookingBack")}
          </button>
          <h2 className="text-2xl font-black text-[var(--rz-navy)] mt-4 tracking-tight">
            {t("bookingAddAnotherService") || "Add Another Service"}
          </h2>
          <input
            type="search"
            value={serviceSearch}
            onChange={(e) => setServiceSearch(e.target.value)}
            placeholder={"Search services…"}
            className="mt-4 w-full rounded-xl border border-[var(--border-default)] px-4 py-3 text-sm font-medium focus:border-[#ff5757] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
          {filteredServices.map((s) => (
            <div
              key={s.id}
              onClick={() => handleAdd(s.id)}
              className="flex items-center justify-between p-5 rounded-3xl bg-[var(--rz-gray-050)] border-2 border-[var(--border-subtle)] hover:border-[#ff5757]/20 hover:bg-white transition-all cursor-pointer group"
            >
              <div>
                <h4 className="font-black text-[var(--rz-navy)] text-sm group-hover:text-[#ff5757] transition-colors">{s.name}</h4>
                <p className="text-[10px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest mt-1">
                  {s.time} • {getServicePrice(s.id, s.price) < s.price ? (
                    <>
                      <span className="line-through mr-1">${Number(s.price).toFixed(2)}</span>
                      <span className="text-[#ff5757] font-black">${Number(getServicePrice(s.id, s.price)).toFixed(2)}</span>
                    </>
                  ) : (
                    `$${Number(s.price).toFixed(2)}`
                  )}
                </p>
              </div>
              <button
                type="button"
                className="rounded-xl border-2 border-[#ff5757] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#ff5757] hover:bg-[#ff5757] hover:text-white transition-all"
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
        onClick={() => setStep("BUILDER")}
        className="flex items-center gap-2 text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)] font-black text-[10px] uppercase tracking-widest mb-8"
      >
        <ChevronLeft size={16} /> {t("bookingBack") || "Back"}
      </button>

      <div className="mb-6">
        <h2 className="text-2xl font-black text-[var(--rz-navy)] mb-2 uppercase tracking-tight">
          {t('checkoutPreview')}
        </h2>
        <p className="text-[var(--rz-gray-500)] font-bold text-sm">
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
                ? "border-[#ff5757] bg-[#ff5757]/5 text-[#ff5757]"
                : "border-[var(--border-subtle)] text-[var(--rz-gray-500)] hover:border-[var(--border-default)]"
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
      {autoApproval && checkoutPayTab === "wompi" ? (
        <p className="mb-4 text-center text-[10px] font-bold text-amber-700">
          Card payment will be available here soon.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
      <div className="bg-[var(--rz-gray-050)] rounded-[32px] border border-[var(--border-subtle)] p-6 sm:p-8 space-y-6">
        <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
          {selectedServices.map((svc) => {
            const staffId = assignments[svc.cartIndex];
            const prof = venueData.team.find((m) => m.id === staffId);
            const memberId = serviceMemberMap[svc.cartIndex];
            const memberName = memberId ? familyGuests.find(g => g.id === memberId)?.name : t("bookingForMe");

            return (
              <div key={`${svc.id}-${svc.cartIndex}`} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-[var(--border-subtle)] shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="w-12 h-12 rounded-xl bg-[var(--rz-gray-100)] overflow-hidden shrink-0 border border-[var(--border-subtle)]">
                  <img src={prof?.img || ""} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-[13px] font-black text-[var(--rz-navy)] truncate tracking-tight">{svc.name}</h4>
                    <div className="flex flex-col items-end">
                      {svc.finalPrice < svc.price && (
                        <span className="text-[9px] font-bold text-[var(--rz-gray-500)] line-through tracking-tight">${Number(svc.price).toFixed(2)}</span>
                      )}
                      <span className="text-[12px] font-black text-[#ff5757] ml-2">${Number(svc.finalPrice).toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[9px] font-black text-[#ff5757] uppercase tracking-wider">{memberName}</p>
                    <span className="w-1 h-1 rounded-full bg-[var(--rz-gray-300)]" />
                    <p className="text-[9px] font-bold text-[var(--rz-gray-500)] uppercase tracking-wider">{prof?.name || t('anyStaff')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t-2 border-dashed border-[var(--border-default)] space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--rz-gray-500)] uppercase tracking-widest">{"Subtotal"}</span>
            <span className="text-sm font-black text-[var(--rz-gray-600)]">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-[var(--rz-gray-500)] uppercase tracking-widest">
              {`Service Fee (${commissionPercent}%)`}
            </span>
            <span className="text-sm font-black text-[var(--rz-gray-600)]">${serviceFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pb-2">
            <span className="text-xs font-bold text-[var(--rz-gray-500)] uppercase tracking-widest">
              {`Tax (${Number(venueData.taxPercentage) || 0}%)`}
            </span>
            <span className="text-sm font-black text-[var(--rz-gray-600)]">${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[var(--border-subtle)]">
            <span className="text-xs font-black text-[var(--rz-navy)] uppercase tracking-widest">{t('totalToPay')}</span>
            <span className="text-2xl font-black text-[#ff5757]">${totalPrice.toFixed(2)}</span>
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

      <DSButton
        variant="primary"
        fullWidth
        size="lg"
        leftIcon={autoApproval ? "lock" : "check"}
        loading={isProcessing}
        onClick={() => void submitBookings()}
      >
        {isProcessing
          ? autoApproval
            ? language === "en" ? "Processing payment…" : "Procesando pago…"
            : language === "en" ? "Submitting…" : "Enviando…"
          : autoApproval
            ? `${language === "en" ? "Confirm & pay" : "Confirmar y pagar"} $${totalPrice.toFixed(2)}`
            : language === "en" ? "Submit booking request" : "Enviar solicitud de reserva"}
      </DSButton>
      <p className="mt-3 text-center text-[11px] font-medium leading-relaxed text-[var(--rz-gray-500)]">
        {language === "en"
          ? "A temporary hold is placed for the amount. Funds are released to the business only after your service is completed."
          : "Se realiza una retención temporal por el monto. Los fondos se liberan al negocio solo después de completar tu servicio."}
      </p>
      </div>
      </div>
    </div>
  );

  const topBack = () => {
    if (step !== "BUILDER") {
      setStep("BUILDER");
      setActiveCartIndexForChange(null);
    } else {
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] overflow-y-auto bg-[var(--rz-gray-050)] animate-in fade-in duration-300 custom-scrollbar">
        <div className="sticky top-0 z-20 border-b border-[var(--border-subtle)] bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1140px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={topBack}
              className="inline-flex items-center gap-2 text-sm font-bold text-[var(--rz-gray-500)] transition hover:text-[var(--rz-navy)]"
            >
              <ChevronLeft size={18} /> {language === "en" ? "Back" : "Volver"}
            </button>
            <span className="min-w-0 flex-1 truncate text-center text-sm font-black text-[var(--rz-navy)]">
              {venueData.name || ""}
            </span>
            <button
              type="button"
              onClick={handleCloseAttempt}
              aria-label="Close"
              className="p-2 text-[var(--rz-gray-500)] transition hover:text-[var(--rz-navy)]"
            >
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        <div className={`mx-auto px-4 py-6 sm:px-6 sm:py-10 ${step === "BUILDER" ? "max-w-[1140px]" : "max-w-[760px]"}`}>
          {step === "BUILDER" && renderBuilder()}
          {step === "STAFF_LIST" && renderStaffList()}
          {step === "PROFESSIONAL_DETAIL" && renderProfessionalDetail()}
          {step === "CHECKOUT_PREVIEW" && renderCheckoutPreview()}
          {step === "SERVICE_PICKER" && renderServicePicker()}
        </div>
      </div>

      <RecipientPicker
        open={recipientPickerFor !== null}
        onClose={() => setRecipientPickerFor(null)}
        people={familyGuests as unknown as { id: string; name: string }[]}
        value={
          recipientPickerFor === "all" || recipientPickerFor === null
            ? "self"
            : serviceMemberMap[recipientPickerFor] ?? "self"
        }
        onChange={(v: string) => applyRecipient(recipientPickerFor, v === "self" ? null : v)}
        onAddPerson={(p: { name: string; email?: string }) => void handleAddRecipient(p, recipientPickerFor)}
        selfName={language === "en" ? "For me" : "Para mí"}
        selfSubtitle={language === "en" ? "Your account" : "Tu cuenta"}
        title={language === "en" ? "Who is this booking for?" : "¿Para quién es esta reserva?"}
        subtitle={language === "en" ? "Book for yourself, family or a friend." : "Reserva para ti, un familiar o un amigo."}
      />


      {holdModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-[460px] rounded-[32px] bg-white p-8 shadow-3xl animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--rz-coral)]/10">
              <Info size={26} className="text-[var(--rz-coral)]" />
            </div>
            <h3 className="text-center text-xl font-black text-[var(--rz-navy)]">
              {language === "en" ? "How payment works" : "Cómo funciona el pago"}
            </h3>
            <p className="mt-3 text-center text-[13px] font-medium leading-relaxed text-[var(--rz-gray-600)]">
              {language === "en"
                ? "We place a temporary hold on your payment method for the reservation amount. The business is paid only after your service is completed. You can cancel for free up to 60 minutes before your appointment."
                : "Realizamos una retención temporal en tu método de pago por el monto de la reserva. El negocio recibe el pago solo después de completar tu servicio. Puedes cancelar gratis hasta 60 minutos antes de tu cita."}
            </p>
            <div className="mt-4 flex items-baseline justify-between rounded-xl bg-[var(--rz-gray-050)] px-4 py-3">
              <span className="text-[12px] font-black uppercase tracking-widest text-[var(--rz-gray-500)]">Total</span>
              <span className="text-lg font-black text-[var(--rz-coral)]">${totalPrice.toFixed(2)}</span>
            </div>
            <div className="mt-6 space-y-3">
              <DSButton
                variant="primary"
                fullWidth
                size="lg"
                leftIcon="check"
                onClick={() => {
                  setHoldModalOpen(false);
                  setStep("CHECKOUT_PREVIEW");
                }}
              >
                {language === "en" ? "Got it, continue" : "Entendido, continuar"}
              </DSButton>
              <button
                type="button"
                onClick={() => setHoldModalOpen(false)}
                className="w-full rounded-2xl border-2 border-[var(--border-subtle)] bg-white py-3 text-[11px] font-black uppercase tracking-[0.1em] text-[var(--rz-navy)] transition-all hover:bg-[var(--rz-gray-050)]"
              >
                {language === "en" ? "Back" : "Volver"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isDiscardModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-xl p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[40px] p-10 max-w-[450px] w-full text-center shadow-3xl animate-in zoom-in-95 duration-300">
            <div className="mb-8">
              <h3 className="text-2xl font-black text-[var(--rz-navy)] mb-4">{t("bookingDiscardTitle")}</h3>
              <p className="text-[var(--rz-gray-500)] font-bold leading-relaxed px-4">
                {t("bookingDiscardBody")}
              </p>
            </div>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => setIsDiscardModalOpen(false)}
                className="w-full bg-[#ff5757] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#ff5757]/20"
              >
                {t("bookingContinueBooking")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDiscardModalOpen(false);
                  onClose();
                }}
                className="w-full bg-white text-[var(--rz-navy)] font-black py-4 rounded-2xl text-[11px] uppercase tracking-[0.1em] border-2 border-[var(--border-subtle)] hover:bg-[var(--rz-gray-050)] transition-all"
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
