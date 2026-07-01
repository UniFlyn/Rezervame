"use client";
import React, { useState, useEffect, useMemo, useCallback, Suspense, useRef } from "react";
import { useI18n } from "../../components/I18nProvider";
import { useAuth } from "../../components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/lib/toast";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { venueCardImageSrc, businessListingImageSrc, type SearchVenueRow } from "@/lib/venueSearch";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { InvoiceTable, InvoiceCard, EmptyState, NotificationItem, Tabs, Avatar, Chip, Badge, Button, RecipientBadge, BusinessResultCard } from "@/ds";
import { generateAndDownloadInvoicePDF } from "@/lib/invoicePdf";
import { 
  Trash2, Edit2, Shield, User as UserIcon, 
  Users, Calendar, Heart, Lock, CheckCircle, 
  X, Plus, Camera, LogOut, ChevronLeft, ChevronRight, Mail, Phone,
  MapPin, Star, Download, RefreshCcw, Clock, CreditCard, Banknote, CheckCircle2, FileText,
  Loader2, Check, Search, Bell, ShieldCheck
} from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";
import { PageLoader } from "@/components/ui/AppLoader";
import { BrowserPushSettings } from "@/components/BrowserPushSettings";
import { bookingGroupKey, formatBookingTimeRange } from "@/lib/bookingGroup";
import { computeBookingTotals } from "@/lib/bookingTotals";
import {
  aggregateGroupUiStatus,
  mapBookingItemUiStatus,
  resolveBookingPaymentMethod,
} from "@/lib/paymentMethod";
import {
  loadBookingConfirmation,
  navigateToBookingConfirmation,
} from "@/lib/bookingConfirmation";
import {
  reservationStatusBadgeClass,
  reservationStatusLabel,
  reservationStatusBadgeTone,
  type ReservationUiStatus,
} from "@/lib/reservationStatus";
import {
  normalizePublicPaymentConfig,
  pickDefaultPaymentMethod,
  selectablePaymentMethods,
} from "@/lib/paymentConfig";
import {
  canCustomerCancelBooking,
  policyMessageForBooking,
  normalizeCancellationPolicy,
} from "@/lib/cancellationPolicy";

type Tab = "bookings" | "family" | "settings" | "favorites" | "invoices" | "notifications" | "payments";

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const NOTIF_FILTERS = [
  { id: "all" as const, en: "All", es: "Todas" },
  { id: "booking" as const, en: "Reservations", es: "Reservas" },
  { id: "payment" as const, en: "Payments", es: "Pagos" },
  { id: "review" as const, en: "Reviews", es: "Reseñas" },
  { id: "business" as const, en: "Businesses", es: "Negocios" },
];

const BOOKING_FILTERS = [
  { value: "todas" as const, labelEs: "Todas", labelEn: "All" },
  { value: "proximas" as const, labelEs: "Próximas", labelEn: "Upcoming" },
  { value: "completadas" as const, labelEs: "Completadas", labelEn: "Completed" },
  { value: "canceladas" as const, labelEs: "Canceladas", labelEn: "Cancelled" },
];

const UPCOMING_BOOKING_STATUSES = new Set<ReservationUiStatus>([
  "pending",
  "confirmed",
  "paid",
  "cash_at_venue",
  "rescheduled",
]);

function isUpcomingReservation(res: Reservation) {
  return UPCOMING_BOOKING_STATUSES.has(res.status);
}

function matchBookingFilter(res: Reservation, filter: (typeof BOOKING_FILTERS)[number]["value"]) {
  if (filter === "todas") return true;
  if (filter === "proximas") return isUpcomingReservation(res);
  if (filter === "completadas") return res.status === "completed";
  return res.status === "cancelled";
}

function matchBookingQuery(res: Reservation, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (res.venueName.toLowerCase().includes(q)) return true;
  if (res.serviceName.toLowerCase().includes(q)) return true;
  return res.items.some((s) => s.name.toLowerCase().includes(q));
}

function recipientBadgeFor(res: Reservation, language: string) {
  const prefix = language === "en" ? "Booking for" : "Reserva para";
  if (!res.customerName) return <RecipientBadge prefix={prefix} self />;
  const names = res.customerName.split(",").map((s) => s.trim()).filter(Boolean);
  if (names.length > 1) return <RecipientBadge prefix={prefix} name={`${names.length} ${language === "en" ? "people" : "personas"}`} />;
  return <RecipientBadge prefix={prefix} name={res.customerName} />;
}

function notifIconName(type: string): string {
  const t = String(type || "").toUpperCase();
  if (t.includes("BOOKING") || t.includes("RESERV")) return "calendar";
  if (t.includes("PAYMENT") || t.includes("REFUND") || t.includes("INVOICE")) return "creditCard";
  if (t.includes("REVIEW")) return "star";
  if (t.includes("OFFER") || t.includes("PROMOT") || t.includes("BUSINESS") || t.includes("FAVOR")) return "heart";
  return "bell";
}

function notifCategoryOf(type: string): "booking" | "payment" | "review" | "business" | "other" {
  const t = String(type || "").toUpperCase();
  if (t.includes("BOOKING") || t.includes("RESERV")) return "booking";
  if (t.includes("PAYMENT") || t.includes("REFUND") || t.includes("INVOICE")) return "payment";
  if (t.includes("REVIEW")) return "review";
  if (t.includes("OFFER") || t.includes("PROMOT") || t.includes("BUSINESS") || t.includes("FAVOR")) return "business";
  return "other";
}

function notifCategoryLabel(type: string, lang: string): string {
  const c = notifCategoryOf(type);
  const map: Record<string, [string, string]> = {
    booking: ["Reservation", "Reserva"],
    payment: ["Payment", "Pago"],
    review: ["Review", "Reseña"],
    business: ["Business", "Negocio"],
    other: ["Update", "Novedad"],
  };
  return lang === "en" ? map[c][0] : map[c][1];
}

function notifRelativeTime(dateStr: string, lang: string): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (lang === "en") {
    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} h ago`;
    return `${diffDays} d ago`;
  }
  if (diffMins < 1) return "Ahora";
  if (diffMins < 60) return `Hace ${diffMins} min`;
  if (diffHours < 24) return `Hace ${diffHours} h`;
  return `Hace ${diffDays} d`;
}

interface FamilyMember {
  id: string;
  name: string;
  age: number;
  gender: string;
  email?: string | null;
}

interface Reservation {
  id: string;
  refNumber: string;
  venueName: string;
  serviceName: string;
  customerName?: string;
  staffName?: string;
  date: string;
  time: string;
  price: string;
  totalPrice: number;
  status: ReservationUiStatus;
  img: string;
  taxAmount: number;
  taxPercentage: number;
  commissionAmount: number;
  commissionPercent: number;
  subtotal: number;
  address?: string;
  isReviewed?: boolean;
  phone?: string;
  isPaid?: boolean;
  items: { 
    id: string; 
    name: string; 
    price: string; 
    customerName?: string; 
    staffName?: string;
    status: ReservationUiStatus;
    isReviewed?: boolean;
    transactionId?: string;
    canCancel?: boolean;
    rawStatus?: string;
    appointmentAt?: string;
  }[];
  businessId: string;
  transactionId?: string;
  paymentMethod?: string;
  cancellationAllowed?: boolean;
  cancellationHoursBefore?: number;
  cancellationPolicyMessage?: string;
  canCancelAny?: boolean;
}

function mapUserBookingGroup(
  group: any[],
  language: string,
  commissionPercent: number,
): Reservation {
  const b = group[0];
  const d = new Date(b.date);
  
  // Deterministic 5-digit reference number from the first booking ID
  let refNumber = "00000";
  if (b.id) {
    const hashStr = String(b.id);
    let hash = 0;
    for (let i = 0; i < hashStr.length; i++) {
        hash = ((hash << 5) - hash) + hashStr.charCodeAt(i);
        hash |= 0; 
    }
    refNumber = String(Math.abs(hash % 90000) + 10000);
  }

  const dateStr = Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  const timeStr = formatBookingTimeRange(
    group.map((row) => row.date as string | Date),
    "en-US",
  );

  const totals = computeBookingTotals(
    group,
    Number(b.business?.taxPercentage || 0),
    commissionPercent,
  );
  const cancelPolicy = normalizeCancellationPolicy(b.business);
  const lang = language === "es" ? "es" : "en";
  
  const items = group.map((item) => {
    const status = mapBookingItemUiStatus({
      status: item.status,
      transactionId: item.transactionId,
      paymentMethod: item.paymentMethod,
      transaction: item.transaction,
    });

    const forName =
      item.familyMember?.name?.trim() ||
      (typeof item.customerName === "string" ? item.customerName.trim() : "") ||
      undefined;
    const proName =
      item.staff?.name?.trim() ||
      (typeof item.staffName === "string" ? item.staffName.trim() : "") ||
      undefined;

    const appointmentAt = item.date ? new Date(item.date) : new Date(NaN);
    const canCancel =
      item.canCancel === true ||
      canCustomerCancelBooking({
        status: String(item.status || ""),
        appointmentAt,
        transactionId: item.transactionId,
        business: b.business,
      }).allowed;

    return {
        id: item.id,
        name: item.service?.name || "Service",
        price: Number(item.price || 0).toFixed(2),
        customerName: forName,
        staffName: proName,
        status,
        isReviewed: item.isReviewed || false,
        transactionId: item.transactionId,
        canCancel,
        rawStatus: String(item.status || ""),
        appointmentAt: item.date,
    };
  });

  const mainStatus = aggregateGroupUiStatus(items.map((i) => i.status));
  const paymentMethod = resolveBookingPaymentMethod({
    paymentMethod: b.paymentMethod,
    transaction: b.transaction,
  });

  const forNames = Array.from(
    new Set(
      items.map((i) => i.customerName).filter((n): n is string => Boolean(n && n.trim())),
    ),
  );
  const proNames = Array.from(
    new Set(
      items.map((i) => i.staffName).filter((n): n is string => Boolean(n && n.trim())),
    ),
  );

  return {
    id: b.id,
    refNumber,
    venueName: b.business?.name || "—",
    serviceName: group.length > 1 ? `${group.length} Services` : (b.service?.name || "Service"),
    customerName: forNames.length > 0 ? forNames.join(", ") : undefined,
    staffName: proNames.length > 0 ? proNames.join(", ") : undefined,
    date: dateStr,
    time: timeStr,
    price: `$${totals.totalPrice.toFixed(2)}`,
    totalPrice: totals.totalPrice,
    status: mainStatus,
    img: b.service?.imageUrl || b.business?.bannerUrl || b.business?.logoUrl || PLACEHOLDER_IMAGE_DATA_URI,
    subtotal: totals.subtotal,
    taxAmount: totals.taxAmount,
    taxPercentage: totals.taxPercentage,
    commissionAmount: totals.commissionAmount,
    commissionPercent: totals.commissionPercent,
    address: b.business?.address || "",
    phone: b.business?.phone,
    isReviewed: items.every(i => i.isReviewed),
    items,
    businessId: b.businessId,
    transactionId: b.transactionId,
    paymentMethod,
    cancellationAllowed: cancelPolicy.allowed,
    cancellationHoursBefore: cancelPolicy.hoursBefore,
    cancellationPolicyMessage: policyMessageForBooking(
      {
        status: String(b.status || ""),
        appointmentAt: d,
        transactionId: b.transactionId,
        business: b.business,
      },
      lang,
    ),
    canCancelAny: items.some((i) => i.canCancel),
  };
}

function groupAndMapBookings(
  bookings: any[],
  language: string,
  commissionPercent: number,
): Reservation[] {
  if (!Array.isArray(bookings)) return [];
  const groups: Record<string, any[]> = {};
  bookings.forEach((b) => {
    const key = bookingGroupKey(b);
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });
  return Object.values(groups)
    .map((g) => ({
      res: mapUserBookingGroup(g, language, commissionPercent),
      sortTime: new Date(g[0]?.date ?? 0).getTime(),
    }))
    .sort((a, b) => b.sortTime - a.sortTime)
    .map((row) => row.res);
}

function ProfileContent() {
  const { language, setLanguage, t } = useI18n();
  const { isLoggedIn, isHydrated, user, logout, setIsLoginModalOpen, refreshUser, token } = useAuth() as any;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
  const [bookingFilter, setBookingFilter] = useState<(typeof BOOKING_FILTERS)[number]["value"]>("todas");
  const [bookingQuery, setBookingQuery] = useState("");
  const [notifList, setNotifList] = useState<NotificationRow[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifFilter, setNotifFilter] = useState<"all" | "booking" | "payment" | "review" | "business">("all");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [isResModalOpen, setIsResModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [businessRating, setBusinessRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [serviceRatings, setServiceRatings] = useState<Record<string, number>>({});
  const [staffRatings, setStaffRatings] = useState<Record<string, number>>({});
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (isReviewModalOpen && selectedRes) {
      setBusinessRating(5);
      setReviewComment("");
      const initialService: Record<string, number> = {};
      const initialStaff: Record<string, number> = {};
      selectedRes.items.forEach(item => {
        if (item.status === 'completed' && !item.isReviewed) {
          initialService[item.id] = 5;
          initialStaff[item.id] = 5;
        }
      });
      setServiceRatings(initialService);
      setStaffRatings(initialStaff);
    }
  }, [isReviewModalOpen, selectedRes]);

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [linkedGoogle, setLinkedGoogle] = useState(true);
  const [linkedFacebook, setLinkedFacebook] = useState(false);
  const [linkedInstagram, setLinkedInstagram] = useState(false);
  const [bookPayload, setBookPayload] = useState<{ ongoing: unknown[]; history: unknown[] }>({
    ongoing: [],
    history: [],
  });
  const [profileDataReady, setProfileDataReady] = useState(false);
  const [favoritesList, setFavoritesList] = useState<unknown[]>([]);
  const [favoritesSearch, setFavoritesSearch] = useState("");
  const [favoritesChip, setFavoritesChip] = useState<"all" | "hair" | "facial" | "wax">("all");
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [favoritesTotalPages, setFavoritesTotalPages] = useState(1);
  const [favoritesTotal, setFavoritesTotal] = useState(0);
  const [invoicesList, setInvoicesList] = useState<unknown[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Custom confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
  }>({
    open: false, title: "", message: "", onConfirm: () => {},
  });
  const showConfirm = (opts: Omit<typeof confirmDialog, "open">) =>
    setConfirmDialog({ ...opts, open: true });
  const closeConfirm = () =>
    setConfirmDialog((p) => ({ ...p, open: false }));

  // Payment flow state
  const [paymentView, setPaymentView] = useState<"none" | "review" | "done">("none");
  const [payMethod, setPayMethod] = useState<"wompi" | "yappy" | "pay_at_venue">("pay_at_venue");
  const [payingLoading, setPayingLoading] = useState(false);
  const [isSavingFamilyMember, setIsSavingFamilyMember] = useState(false);
  const [paidInvoice, setPaidInvoice] = useState<{ id: string; refNumber: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const [recentlyPaidGroupId, setRecentlyPaidGroupId] = useState<string | null>(null);
  const [defaultCommission, setDefaultCommission] = useState(15);
  const [paymentMethods, setPaymentMethods] = useState<
    { id: string; label: string; enabled: boolean; configured?: boolean }[]
  >([
    { id: "wompi", label: "Card", enabled: false, configured: false },
    { id: "yappy", label: "Yappy", enabled: false, configured: false },
    { id: "pay_at_venue", label: "Pay by visit", enabled: true, configured: true },
  ]);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    void apiGet<Record<string, unknown>>("/public/payment-config")
      .then((raw) => {
        const cfg = normalizePublicPaymentConfig(raw);
        setDefaultCommission(cfg.defaultCommission);
        const selectable = selectablePaymentMethods(cfg.methods);
        const visible = cfg.methods.filter((m) => m.enabled);
        if (visible.length > 0) {
          setPaymentMethods(visible);
          setPayMethod(pickDefaultPaymentMethod(cfg.methods));
        } else if (selectable.length > 0) {
          setPaymentMethods(selectable);
          setPayMethod(pickDefaultPaymentMethod(cfg.methods));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      toastSuccess("Payment received", "Your card payment was processed successfully.");
      setRefreshTrigger((prev) => prev + 1);
      router.replace("/profile");
    } else if (payment === "cancelled") {
      toastWarning("Payment cancelled", "You can complete payment when ready.");
      router.replace("/profile");
    }
  }, [searchParams, router]);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);







  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload: any = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      email: formData.get("email"),
      gender: formData.get("gender"),
    };
    if (avatarPreview) {
      payload.avatar = avatarPreview;
    }
    
    setIsUpdatingProfile(true);
    setIsSavingFamilyMember(true);
    try {
      await apiPatch("/auth/user-session", payload, "USER");
      await refreshUser();
      toastSuccess("Profile updated successfully!");
    } catch (err: any) {
      toastError(err.message || ("Failed to update profile."));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");
    
    if (newPassword !== confirmPassword) {
      toastWarning("Passwords do not match.");
      return;
    }

    const { fetchSecurityPolicy, passwordLengthMessage, passwordTooShort } = await import(
      "@/lib/securityPolicy"
    );
    const policy = await fetchSecurityPolicy();
    if (passwordTooShort(String(newPassword), policy.minPasswordLength)) {
      toastWarning("Password too short", passwordLengthMessage(policy.minPasswordLength));
      return;
    }
    
    setIsUpdatingPassword(true);
    try {
      await apiPatch("/auth/user-password", { currentPassword, newPassword }, "USER");
      toastSuccess("Password updated successfully!");
      e.currentTarget.reset();
    } catch (err: any) {
      toastError(err.message || ("Failed to update password. Check your current password."));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const doCancelReservation = async (id: string) => {
    try {
      await apiPatch(`/mobile/bookings/${id}/cancel`, {}, "USER");
      toastSuccess(
        "Cancelled",
        "Reservation cancelled."
      );
      setIsResModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toastError(
        "Could not cancel",
        err instanceof Error ? err.message : ""
      );
    }
  };

  const handleCancelReservation = (id: string) => {
    showConfirm({
      title: "Cancel Reservation",
      message: "Are you sure you want to cancel this service? This action cannot be undone.",
      confirmLabel: "Yes, Cancel",
      cancelLabel: "Keep It",
      variant: "danger",
      onConfirm: () => { closeConfirm(); void doCancelReservation(id); },
    });
  };

  const handleCancelAllInGroup = async (res: typeof selectedRes) => {
    if (!res) return;
    const confirmedItems = res.items.filter((i) => i.canCancel);
    showConfirm({
      title: "Cancel All Services",
      message: language === "en"
        ? `This will cancel all ${confirmedItems.length} service(s) in this booking. No individual confirmations will be asked.`
        : `Se cancelarán los ${confirmedItems.length} servicio(s) de esta reserva. No se pedirán confirmaciones individuales.`,
      confirmLabel: "Cancel All",
      cancelLabel: "Go Back",
      variant: "danger",
      onConfirm: async () => {
        closeConfirm();
        try {
          const ids = confirmedItems.map((i) => i.id);
          await apiPost("/mobile/bookings/cancel-group", { bookingIds: ids }, "USER");
          toastSuccess("All cancelled", `${ids.length} service(s) cancelled.`);
          setIsResModalOpen(false);
          setPaymentView("none");
          setRefreshTrigger((prev) => prev + 1);
        } catch (err) {
          toastError(
            "Cancellation failed",
            err instanceof Error ? err.message : "Could not cancel all services.",
          );
        }
      },
    });
  };

  const handlePayNow = async (res: typeof selectedRes) => {
    if (!res) return;
    setPayingLoading(true);
    try {
      const payableIds = res.items
        .filter((i) => i.status === "confirmed" || i.status === "rescheduled")
        .map((i) => i.id);

      if (payableIds.length === 0) {
        toastWarning(
          "Already processed",
          "There are no services awaiting payment in this reservation.",
        );
        setPayingLoading(false);
        return;
      }

      const method =
        payMethod === "wompi"
          ? "Wompi"
          : payMethod === "yappy"
            ? "Yappy"
            : "Pay by visit";

      if (payMethod !== "pay_at_venue") {
        toastWarning(
          "Card & Yappy",
          "Online payment is not available yet. Choose pay by visit or try again later.",
        );
        setPayingLoading(false);
        return;
      }

      const paidUiStatus = "cash_at_venue";
      setRecentlyPaidGroupId(res.id);
      setPaidInvoice({ id: res.id, refNumber: res.refNumber });
      setSelectedRes({
        ...res,
        status: paidUiStatus,
        paymentMethod: method,
        items: res.items.map((i) =>
          payableIds.includes(i.id) ? { ...i, status: paidUiStatus } : i,
        ),
      });
      setPaymentView("done");
      setRefreshTrigger((prev) => prev + 1);
      toastSuccess(
        payMethod === "pay_at_venue" ? "Booking confirmed" : "Payment Successful!",
        payMethod === "pay_at_venue"
          ? `Please bring $${res.totalPrice.toFixed(2)} when you visit for your appointment.`
          : "Invoice added to your history.",
      );
    } catch (err) {
      toastError(
        "Payment failed",
        err instanceof Error ? err.message : ""
      );
    } finally {
      setPayingLoading(false);
    }
  };

  const handleMarkCompletedGroup = async () => {
    if (!selectedRes) return;
    try {
      setPayingLoading(true);
      for (const item of selectedRes.items) {
        await apiPost(`/mobile/bookings/${item.id}/complete`, {}, "USER");
      }
      toastSuccess("Appointment completed");
      setIsResModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toastError("Error", err instanceof Error ? err.message : "Failed to complete");
    } finally {
      setPayingLoading(false);
    }
  };

  const handleAcceptReschedule = async () => {
    if (!selectedRes) return;
    try {
      setPayingLoading(true);
      for (const item of selectedRes.items) {
        await apiPost(`/mobile/bookings/${item.id}/accept-reschedule`, {}, "USER");
      }
      toastSuccess("New time accepted");
      setIsResModalOpen(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      toastError("Error", err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setPayingLoading(false);
    }
  };

  const handleDownloadInvoiceForRes = (res: typeof selectedRes) => {
    if (!res) return;
    generateAndDownloadInvoicePDF({
      invoiceNumber: `INV-${res.refNumber}`,
      refNumber: res.refNumber,
      date: res.date,
      customerName: res.customerName || user?.name || "Customer",
      customerEmail: user?.email,
      venueName: res.venueName,
      venueAddress: res.address,
      venuePhone: res.phone,
      items: res.items.map(i => ({
        name: i.name,
        quantity: 1,
        price: parseFloat(i.price),
        staffName: i.staffName,
      })),
      subtotal: res.subtotal,
      taxAmount: res.taxAmount,
      taxPercentage: res.taxPercentage,
      total: res.totalPrice,
      paymentMethod: res.paymentMethod || (payMethod === "wompi" ? "Wompi" : payMethod === "yappy" ? "Yappy" : "Pay by visit"),
      paymentStatus: paymentView === "done" ? "paid" : "pending",
    });
  };

  const handleRemoveFavorite = async (businessId: string) => {
    try {
      await apiDelete(`/mobile/favorites/${businessId}`, "USER");
      setFavoritesList((prev) => prev.filter((biz: any) => (biz as any).businessId !== businessId));
      toastSuccess(
        "Removed",
        "Removed from favorites."
      );
    } catch (err) {
      toastError(
        "Could not remove",
        err instanceof Error ? err.message : ""
      );
    }
  };

  const handleDownloadInvoice = (inv: any) => {
    const rawDate = inv.issuedDate || inv.date || inv.createdAt;
    const dateStr = rawDate
      ? new Date(rawDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    generateAndDownloadInvoicePDF({
      invoiceNumber: inv.number || `INV-${String(inv.id || "").slice(0,6).toUpperCase()}`,
      refNumber: String(inv.id || "").slice(0,8),
      date: dateStr,
      customerName: user?.name || "Customer",
      customerEmail: user?.email,
      venueName: inv.venueName || inv.business?.name || "Venue",
      venueAddress: inv.locationLine || inv.business?.address,
      items: Array.isArray(inv.lines) && inv.lines.length > 0
        ? inv.lines.map((l: any) => ({ 
            name: l.title || "Service", 
            quantity: 1, 
            price: Number(l.amount || 0),
            staffName: l.professional || "—"
          }))
        : [{ name: "Services", quantity: 1, price: Number(inv.subtotal || inv.total || 0) }],
      subtotal: Number(inv.subtotal || 0),
      taxAmount: Number(inv.taxAmount || 0),
      taxPercentage: inv.taxPercentage ?? 7,
      total: Number(inv.total || 0),
      paymentMethod: inv.paymentMethod || "Online",
      paymentStatus: "paid",
    });
  };

  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);

  const [invoicesPage, setInvoicesPage] = useState(1);
  const [invoicesTotalPages, setInvoicesTotalPages] = useState(1);
  const [invoicesTotal, setInvoicesTotal] = useState(0);

  useEffect(() => {
    const tab = searchParams.get("tab") as Tab;
    if (tab && ["bookings", "family", "settings", "favorites", "invoices", "notifications", "payments"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isHydrated || !isLoggedIn) return;
    let alive = true;
    setNotifLoading(true);
    apiGet<NotificationRow[]>("/notifications", "USER")
      .then((d) => { if (alive) setNotifList(Array.isArray(d) ? d : []); })
      .catch(() => { if (alive) setNotifList([]); })
      .finally(() => { if (alive) setNotifLoading(false); });
    return () => { alive = false; };
  }, [isHydrated, isLoggedIn, refreshTrigger]);

  const markAllNotifRead = async () => {
    setNotifList((prev) => prev.map((n) => ({ ...n, read: true })));
    await apiPatch("/notifications/read-all", {}, "USER").catch(() => null);
  };

  const openNotif = async (n: NotificationRow) => {
    if (!n.read) {
      setNotifList((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      await apiPatch(`/notifications/${n.id}/read`, {}, "USER").catch(() => null);
    }
    const cat = notifCategoryOf(n.type);
    if (cat === "payment") setActiveTab("invoices");
    else setActiveTab("bookings");
  };

  useEffect(() => {
    if (searchParams.get("payment") !== "success") return;
    const stored = loadBookingConfirmation();
    if (stored) {
      navigateToBookingConfirmation({ ...stored, paid: true, auto: true });
      return;
    }
    navigateToBookingConfirmation({
      date: new Date().toISOString(),
      service: "—",
      professional: "—",
      bookingFor: "Myself",
      price: "",
      paid: true,
      auto: true,
    });
  }, [searchParams]);

  // Load profile data only after auth session is restored (avoids empty-state flash on refresh).
  useEffect(() => {
    if (!isHydrated) return;

    if (!isLoggedIn) {
      setProfileDataReady(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const [bookingsRes, invoicesRes, favRes, famRes] = await Promise.all([
          apiGet<{ ongoing: any[]; history: { data: any[]; total: number; totalPages: number } }>(
            `/mobile/bookings?page=${historyPage}&limit=10`,
            "USER",
          ),
          apiGet<{ data: any[]; total: number; totalPages: number }>(
            `/mobile/invoices?page=${invoicesPage}&limit=10`,
            "USER",
          ),
          apiGet<{ data: unknown[]; total: number; totalPages: number }>(
            `/mobile/favorites?page=${favoritesPage}&limit=12&search=${encodeURIComponent(favoritesSearch.trim())}${
              favoritesChip !== "all" ? `&category=${favoritesChip}` : ""
            }`,
            "USER",
          ).catch(() => ({ data: [], total: 0, totalPages: 1 })),
          apiGet<Array<{ id: string; name: string; age: number | null; gender: string; email: string | null }>>(
            "/mobile/family-members",
            "USER",
          ).catch(() => []),
        ]);

        if (cancelled) return;

        setBookPayload({
          ongoing: Array.isArray(bookingsRes?.ongoing) ? bookingsRes.ongoing : [],
          history: Array.isArray(bookingsRes?.history?.data) ? bookingsRes.history.data : [],
        });
        setHistoryTotalPages(bookingsRes?.history?.totalPages || 1);
        setHistoryTotal(bookingsRes?.history?.total || 0);

        setInvoicesList(Array.isArray(invoicesRes?.data) ? invoicesRes.data : []);
        setInvoicesTotalPages(invoicesRes?.totalPages || 1);
        setInvoicesTotal(invoicesRes?.total || 0);

        const favRows = Array.isArray(favRes)
          ? favRes
          : Array.isArray((favRes as { data?: unknown[] })?.data)
            ? (favRes as { data: unknown[] }).data
            : [];
        setFavoritesList(favRows);
        setFavoritesTotalPages(
          Array.isArray(favRes) ? 1 : (favRes as { totalPages?: number })?.totalPages || 1,
        );
        setFavoritesTotal(
          Array.isArray(favRes) ? favRows.length : (favRes as { total?: number })?.total || favRows.length,
        );

        setFamilyMembers(
          (Array.isArray(famRes) ? famRes : []).map((m) => ({
            id: m.id,
            name: m.name,
            age: m.age ?? 0,
            gender: m.gender,
            email: m.email,
          })),
        );
      } catch (e) {
        if (!cancelled) {
          setBookPayload({ ongoing: [], history: [] });
          toastError("Failed to load profile", e instanceof Error ? e.message : "");
        }
      } finally {
        if (!cancelled) setProfileDataReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, isLoggedIn, language, refreshTrigger, historyPage, invoicesPage, favoritesPage, favoritesSearch, favoritesChip]);

  useEffect(() => {
    setFavoritesPage(1);
  }, [favoritesSearch, favoritesChip]);

  const historyReservations = useMemo(
    () => groupAndMapBookings(bookPayload.history, language, defaultCommission),
    [bookPayload.history, language, defaultCommission],
  );

  const ongoingReservations = useMemo(
    () => groupAndMapBookings(bookPayload.ongoing, language, defaultCommission),
    [bookPayload.ongoing, language, defaultCommission],
  );

  const filteredFavorites = favoritesList as Array<{
    name?: string;
    locationLabel?: string;
    categoryKey?: string;
    businessId?: string;
    business?: { businessId?: string };
  }>;

  // Derive which booking groups have been paid (have a Transaction) from invoice list
  const paidBookingIds = useMemo(() => {
    const ids = new Set<string>();
    (invoicesList as any[]).forEach((inv) => {
      if (inv.bookingId) ids.add(inv.bookingId);
    });
    return ids;
  }, [invoicesList]);

  const menuItems = useMemo(
    () => [
      { id: "bookings" as const, label: t("myReservationsMenu") },
      { id: "invoices" as const, label: t("invoicesMenu") },
      { id: "favorites" as const, label: t("favoritesMenu") },
      { id: "family" as const, label: t("familyFriends") },
      { id: "payments" as const, label: language === "en" ? "Payment methods" : "Métodos de pago" },
      { id: "notifications" as const, label: language === "en" ? "Notifications" : "Notificaciones" },
      { id: "settings" as const, label: t("profileSettings") },
    ],
    [t, language],
  );

  const allReservations = useMemo(() => {
    const seen = new Set<string>();
    const merged: Reservation[] = [];
    for (const res of [...ongoingReservations, ...historyReservations]) {
      if (seen.has(res.id)) continue;
      seen.add(res.id);
      merged.push(res);
    }
    return merged;
  }, [ongoingReservations, historyReservations]);

  const filteredReservations = useMemo(() => {
    return allReservations.filter(
      (res) => matchBookingFilter(res, bookingFilter) && matchBookingQuery(res, bookingQuery),
    );
  }, [allReservations, bookingFilter, bookingQuery]);

  const bookingFilterCount = useCallback(
    (filter: (typeof BOOKING_FILTERS)[number]["value"]) =>
      allReservations.filter((res) => matchBookingFilter(res, filter)).length,
    [allReservations],
  );

  const nextBooking = ongoingReservations[0] || null;

  // Account header stats (spec: Reservas totales · Próximas citas · Favoritos)
  const notifUnreadCount = notifList.filter((n) => !n.read).length;
  const totalReservationsCount = historyTotal + ongoingReservations.length;
  const profileStats = [
    {
      icon: <CheckCircle2 size={19} />,
      value: totalReservationsCount,
      label: language === "en" ? "Total reservations" : "Reservas totales",
    },
    {
      icon: <Calendar size={19} />,
      value: ongoingReservations.length,
      label: language === "en" ? "Upcoming appointments" : "Próximas citas",
    },
    {
      icon: <Heart size={19} />,
      value: favoritesTotal,
      label: language === "en" ? "Favorites" : "Favoritos",
    },
  ];

  // Tab items for the DS segmented Tabs (with unread badge on Notifications).
  const tabItems = menuItems.map((item) => ({
    value: item.id,
    label:
      item.id === "notifications" && notifUnreadCount > 0 ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          {item.label}
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 18,
              height: 18,
              padding: "0 5px",
              borderRadius: 999,
              background: "var(--rz-coral)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {notifUnreadCount}
          </span>
        </span>
      ) : (
        item.label
      ),
  }));

  const handleAddFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const name = String(formData.get("name") || "").trim();
    const age = parseInt(String(formData.get("age") || "0"), 10) || 0;
    const gender = String(formData.get("gender") || "").trim();
    const emailRaw = String(formData.get("email") || "").trim();

    if (!name) {
      toastWarning(
        "Name required",
        "Enter a name for this family member.",
      );
      return;
    }
    try {
      if (editingMember) {
        await apiPatch(
          `/mobile/family-members/${editingMember.id}`,
          { name, age: age || undefined, gender, email: emailRaw || null },
          "USER",
        );
      } else {
        await apiPost(
          "/mobile/family-members",
          { name, age: age || undefined, gender, email: emailRaw || undefined },
          "USER",
        );
      }
      setRefreshTrigger(prev => prev + 1);
      setIsFamilyModalOpen(false);
      setEditingMember(null);
      toastSuccess("Family member saved");
    } catch (err) {
      toastError(
        "Could not save",
        err instanceof Error ? err.message : "",
      );
    } finally {
      setIsSavingFamilyMember(false);
    }
  };

  if (!isHydrated) {
    return <PageLoader label={language === "en" ? "Loading your profile…" : "Cargando tu perfil…"} />;
  }

  if (isLoggedIn && !profileDataReady) {
    return <PageLoader label={language === "en" ? "Loading your reservations…" : "Cargando tus reservas…"} />;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="max-w-md text-sm font-semibold text-[var(--rz-gray-600)]">{t("favoritesSignIn")}</p>
        <button
          type="button"
          onClick={() => setIsLoginModalOpen(true)}
          className="rounded-2xl bg-[#ff5757] px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:bg-[#d83b3b]"
        >
          {t("authSignIn")}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--rz-gray-050)] animate-in fade-in duration-700">
      <div className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10">
        {/* Profile header */}
        <div className="mb-6 rounded-3xl border border-[var(--border-subtle)] bg-white p-5 shadow-sm lg:p-7">
          <div className="flex flex-wrap items-center gap-5">
            <Avatar src={user?.avatar} name={user?.name || "User"} size={76} ring />
            <div className="min-w-[200px] flex-1">
              <h1 className="text-2xl font-black leading-tight text-[var(--rz-navy)] lg:text-3xl">{user?.name}</h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1.5">
                {user?.email ? (
                  <span className="inline-flex items-center gap-1.5 text-[13.5px] text-[var(--rz-gray-500)]">
                    <Mail size={14} /> {user.email}
                  </span>
                ) : null}
                {user?.phone?.trim() ? (
                  <span className="inline-flex items-center gap-1.5 text-[13.5px] text-[var(--rz-gray-500)]">
                    <Phone size={14} /> {user.phone}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {profileStats.map((s, i) => (
              <div key={i} className="flex min-w-[140px] flex-1 items-center gap-3 rounded-2xl bg-[var(--rz-gray-050)] px-4 py-3">
                <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-white text-[var(--rz-coral)]">
                  {s.icon}
                </span>
                <div>
                  <div className="text-xl font-black leading-none text-[var(--rz-navy)]">{s.value}</div>
                  <div className="mt-1 text-xs text-[var(--rz-gray-500)]">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 overflow-x-auto pb-1">
          <div className="min-w-max">
            <Tabs value={activeTab} onChange={(v: string) => setActiveTab(v as Tab)} items={tabItems} />
          </div>
        </div>

        {/* Content */}
        <div className="w-full">
          
          {/* TAB: BOOKINGS — spec: filter chips + search + DS reservation cards (no extra sections) */}
          {activeTab === "bookings" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-[18px] flex flex-wrap items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                  {BOOKING_FILTERS.map((f) => (
                    <Chip
                      key={f.value}
                      active={bookingFilter === f.value}
                      count={bookingFilterCount(f.value)}
                      onClick={() => setBookingFilter(f.value)}
                    >
                      {language === "en" ? f.labelEn : f.labelEs}
                    </Chip>
                  ))}
                </div>
                <div className="min-w-[min(100%,300px)] flex-[0_1_340px]">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--rz-gray-400)]" size={16} />
                    <input
                      type="search"
                      value={bookingQuery}
                      onChange={(e) => setBookingQuery(e.target.value)}
                      placeholder={language === "en" ? "Search by business or service" : "Buscar por negocio o servicio"}
                      className="w-full rounded-xl border border-[var(--border-subtle)] bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-[var(--rz-navy)] outline-none focus:border-[var(--rz-coral)]"
                    />
                  </div>
                </div>
              </div>

              {filteredReservations.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-white px-6 py-12 text-center">
                  <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--rz-gray-100)] text-[var(--rz-gray-400)]">
                    <Calendar size={26} />
                  </div>
                  <h4 className="text-[17px] font-bold text-[var(--rz-navy)]">
                    {language === "en" ? "No reservations here" : "No hay reservas aquí"}
                  </h4>
                  <p className="mt-1.5 text-sm text-[var(--rz-gray-500)]">
                    {language === "en" ? "Try another filter or search term." : "Prueba con otro filtro o término de búsqueda."}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  {filteredReservations.map((res) => {
                    const serviceLine = res.items.map((s) => s.name).join(" · ") || res.serviceName;
                    const openDetails = () => {
                      setSelectedRes(res);
                      setPaymentView("none");
                      setIsResModalOpen(true);
                    };
                    return (
                      <div
                        key={res.id}
                        className="overflow-hidden rounded-2xl border border-[var(--border-subtle)] bg-white shadow-sm"
                      >
                        <div className="flex flex-wrap gap-4 p-4">
                          <div className="h-[92px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-[var(--rz-gray-100)]">
                            <img src={res.img} alt="" className="h-full w-full object-cover" />
                          </div>
                          <div className="min-w-[200px] flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h4 className="text-[17px] font-bold leading-tight text-[var(--rz-navy)]">{res.venueName}</h4>
                                <p className="mt-1 text-[13.5px] leading-snug text-[var(--rz-gray-600)]">{serviceLine}</p>
                              </div>
                              <Badge tone={reservationStatusBadgeTone(res.status)} dot>
                                {reservationStatusLabel(res.status, language)}
                              </Badge>
                            </div>
                            <div className="mt-2.5 flex flex-wrap items-center gap-4">
                              <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--rz-gray-500)]">
                                <Calendar size={14} /> {res.date} · {res.time}
                              </span>
                              <span className="text-[13px] font-bold text-[var(--rz-navy)]">{res.price}</span>
                            </div>
                            <div className="mt-2">{recipientBadgeFor(res, language)}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 border-t border-[var(--border-subtle)] px-4 py-3">
                          <Button variant="primary" size="sm" onClick={openDetails}>
                            {language === "en" ? "View details" : "Ver detalles"}
                          </Button>
                          {(res.status === "completed" || res.status === "cancelled") && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (res.businessId) router.push(`/venue/${res.businessId}`);
                              }}
                            >
                              {language === "en" ? "Book again" : "Reservar de nuevo"}
                            </Button>
                          )}
                          {res.status === "completed" && !res.isReviewed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRes(res);
                                setIsReviewModalOpen(true);
                              }}
                            >
                              {language === "en" ? "Rate" : "Calificar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {historyTotalPages > 1 && bookingFilter !== "proximas" && (
                <div className="mt-8" ref={historyRef}>
                  <Pagination
                    page={historyPage}
                    totalPages={historyTotalPages}
                    totalItems={historyTotal}
                    pageSize={10}
                    onPageChange={setHistoryPage}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: FAMILY */}
          {activeTab === "family" && (
            <div className="animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-black text-[var(--rz-navy)]">{language === "en" ? "Family & Friends" : "Familia y amigos"}</h2>
                    <p className="text-[var(--rz-gray-500)] font-bold text-sm mt-1">
                      {language === "en"
                        ? "Manage the people you can book for."
                        : "Administra a las personas para las que puedes reservar."}
                    </p>
                 </div>
                 <button 
                  onClick={() => { setEditingMember(null); setIsFamilyModalOpen(true); }}
                  className="bg-[#ff5757] text-white font-black px-6 py-3 rounded-2xl text-sm shadow-xl shadow-[#ff5757]/20 hover:bg-[#d83b3b] transition flex items-center gap-2 transform hover:-translate-y-1"
                 >
                    <Plus size={18} /> {language === "en" ? "Add Member" : "Agregar persona"}
                 </button>
               </div>
               
               {familyMembers.length === 0 ? (
                 <EmptyState
                   icon="users"
                   title={language === "en" ? "No members added yet" : "Aún no has agregado personas"}
                   message={
                     language === "en"
                       ? "Add your children, partner, or friends to schedule services for them quickly."
                       : "Agrega a tus hijos, pareja o amigos para reservarles servicios rápidamente."
                   }
                   actionLabel={language === "en" ? "Get started now" : "Comenzar ahora"}
                   onAction={() => setIsFamilyModalOpen(true)}
                 />
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="bg-white p-6 rounded-[32px] border border-[var(--border-default)] shadow-sm flex justify-between items-center group hover:shadow-xl hover:shadow-[color:rgba(231,234,239,0.5)] transition duration-500">
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 bg-[var(--rz-gray-100)] rounded-[20px] flex items-center justify-center text-[#ff5757] font-black text-2xl border-2 border-white shadow-sm group-hover:bg-[#ff5757] group-hover:text-white transition-colors duration-500">
                             {member.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-black text-[var(--rz-navy)] text-lg group-hover:text-[#ff5757] transition-colors">{member.name}</h4>
                              <p className="text-xs font-bold text-[var(--rz-gray-500)] mt-1 uppercase tracking-widest">
                                {member.age} {language === "es" ? "años" : "years"} • {member.gender}
                                {member.email ? ` • ${member.email}` : ""}
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                            onClick={() => { setEditingMember(member); setIsFamilyModalOpen(true); }}
                            className="p-3 text-[var(--rz-gray-500)] hover:text-[#ff5757] hover:bg-[#ff5757]/5 rounded-2xl transition-all"
                           >
                              <Edit2 size={18} />
                           </button>
                           <button 
                            type="button"
                            onClick={() => {
                              void (async () => {
                                try {
                                  await apiDelete(`/mobile/family-members/${member.id}`, "USER");
                                  setRefreshTrigger(prev => prev + 1);
                                  toastSuccess(
                                    "Removed",
                                    "Family member removed.",
                                  );
                                } catch (err) {
                                  toastError(
                                    "Could not remove",
                                    err instanceof Error ? err.message : "",
                                  );
                                }
                              })();
                            }}
                            className="p-3 text-[var(--rz-gray-500)] hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                           >
                              <Trash2 size={18} />
                           </button>
                        </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          )}

          {/* TAB: SETTINGS */}
          {activeTab === "settings" && (
            <div className="animate-in fade-in duration-500 space-y-8">
              <form onSubmit={handleUpdateProfile}>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-[var(--rz-navy)]">{t("profileSettings")}</h2>
                    <p className="text-[var(--rz-gray-500)] font-bold text-sm mt-1">{t("profileUpdatePersonal")}</p>
                  </div>
                  <button type="submit" disabled={isUpdatingProfile} className="bg-[var(--rz-navy)] text-white font-black px-8 py-3 rounded-2xl text-sm shadow-xl hover:bg-[var(--rz-navy-800)] transition transform hover:-translate-y-1 disabled:opacity-50">
                    {isUpdatingProfile ? t("profileSaving") : t("profileSaveChanges")}
                  </button>
                </div>

                <div className="bg-white rounded-[40px] p-10 border border-[var(--border-default)] shadow-sm space-y-10">
                  <div className="flex items-center gap-8 pb-10 border-b border-[var(--border-subtle)]">
                     <div className="relative group" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-[var(--border-subtle)] shadow-lg">
                            <img 
                              src={avatarPreview || user?.avatar || PLACEHOLDER_IMAGE_DATA_URI} 
                              alt="User" 
                              className="w-full h-full object-cover" 
                              onError={(e) => { 
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=ff5757&color=fff&size=128&bold=true`; 
                              }}
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer">
                           <Camera className="text-white" size={24} />
                        </div>
                     </div>
                     <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
                     <div>
                       <h3 className="font-black text-[var(--rz-navy)] text-xl">{user?.name}</h3>
                       <p className="text-[var(--rz-gray-500)] font-bold text-sm">
                         {t("profileMemberSince")}
                       </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1">{t("fullName")}</label>
                        <div className="relative">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--rz-gray-300)]" size={18} />
                          <input type="text" name="name" defaultValue={user?.name} required className="w-full border-2 border-[var(--border-subtle)] bg-[var(--rz-gray-050)] p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all font-bold text-[var(--rz-navy)]" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1">{t("phoneNumber")}</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--rz-gray-300)]" size={18} />
                          <input type="text" name="phone" defaultValue={user?.phone ?? ""} className="w-full border-2 border-[var(--border-subtle)] bg-[var(--rz-gray-050)] p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all font-bold text-[var(--rz-navy)]" />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1">{t("email")}</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--rz-gray-300)]" size={18} />
                           <input type="email" name="email" defaultValue={user?.email} required className="w-full border-2 border-[var(--border-subtle)] bg-[var(--rz-gray-050)] p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all font-bold text-[var(--rz-navy)]" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1">{t("genderLabel")}</label>
                        <select
                          name="gender"
                          defaultValue={
                            user?.gender?.toLowerCase() === "male"
                              ? "male"
                              : user?.gender?.toLowerCase() === "other"
                                ? "other"
                                : user?.gender?.toLowerCase() === "female"
                                  ? "female"
                                  : ""
                          }
                          className="w-full border-2 border-[var(--border-subtle)] bg-[var(--rz-gray-050)] p-4 rounded-2xl focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all font-bold text-[var(--rz-navy)] appearance-none cursor-pointer"
                        >
                          <option value="">{t("profilePreferNotSay")}</option>
                          <option value="male">{t("profileGenderMale")}</option>
                          <option value="female">{t("profileGenderFemale")}</option>
                          <option value="other">{t("profileGenderOther")}</option>
                        </select>
                     </div>
                  </div>
                </div>
              </form>

              <form onSubmit={handleUpdatePassword} className="bg-white rounded-[40px] p-10 border border-[var(--border-default)] shadow-sm mt-8">
                <div>
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-3 bg-[var(--rz-navy)] text-white rounded-2xl shadow-lg shadow-[color:var(--rz-gray-200)]">
                        <Lock size={22} />
                     </div>
                     <div>
                        <h3 className="font-black text-[var(--rz-navy)] uppercase tracking-widest text-sm">{t("changePassword")}</h3>
                        <p className="text-[var(--rz-gray-500)] font-bold text-xs mt-1">
                          {t("profileProtectPassword")}
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1">{t("currPass")}</label>
                      <input type="password" name="currentPassword" required placeholder="••••••••" className="w-full border-2 border-[var(--border-subtle)] bg-[var(--rz-gray-050)] p-4 rounded-2xl focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1">{t("newPass")}</label>
                      <input type="password" name="newPassword" required placeholder="••••••••" className="w-full border-2 border-[var(--border-subtle)] bg-[var(--rz-gray-050)] p-4 rounded-2xl focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest ml-1">{t("confPass")}</label>
                      <input type="password" name="confirmPassword" required placeholder="••••••••" className="w-full border-2 border-[var(--border-subtle)] bg-[var(--rz-gray-050)] p-4 rounded-2xl focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all font-bold" />
                    </div>
                  </div>
                  
                  <div className="mt-10 flex justify-end">
                    <button type="submit" disabled={isUpdatingPassword} className="bg-[#ff5757] text-white font-black px-10 py-4 rounded-[20px] text-xs uppercase tracking-widest shadow-xl shadow-[#ff5757]/20 hover:bg-[#d83b3b] transition transform hover:-translate-y-1 disabled:opacity-50">
                       {isUpdatingPassword ? t("profileUpdatingPassword") : t("profileUpdatePasswordBtn")}
                    </button>
                  </div>
                </div>
              </form>

              <div className="bg-white rounded-[40px] p-10 border border-[var(--border-default)] shadow-sm">
                <h3 className="font-black text-[var(--rz-navy)] uppercase tracking-widest text-sm mb-2">
                  {t("language")}
                </h3>
                <p className="text-[var(--rz-gray-500)] font-bold text-xs mb-6">
                  {t("selectLanguageDescription")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`rounded-2xl border-2 px-5 py-4 text-left transition ${
                      language === "en"
                        ? "border-[#ff5757] bg-[#ff5757]/5"
                        : "border-[var(--border-subtle)] bg-[var(--rz-gray-050)] hover:border-[var(--border-default)]"
                    }`}
                  >
                    <p className="text-sm font-black text-[var(--rz-navy)]">English</p>
                    <p className="text-xs font-bold text-[var(--rz-gray-500)] mt-1">United States</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("es")}
                    className={`rounded-2xl border-2 px-5 py-4 text-left transition ${
                      language === "es"
                        ? "border-[#ff5757] bg-[#ff5757]/5"
                        : "border-[var(--border-subtle)] bg-[var(--rz-gray-050)] hover:border-[var(--border-default)]"
                    }`}
                  >
                    <p className="text-sm font-black text-[var(--rz-navy)]">Español</p>
                    <p className="text-xs font-bold text-[var(--rz-gray-500)] mt-1">Latinoamérica</p>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[40px] p-10 border border-[var(--border-default)] shadow-sm">
                <h3 className="font-black text-[var(--rz-navy)] uppercase tracking-widest text-sm mb-2">
                  {t("notifications")}
                </h3>
                <p className="text-[var(--rz-gray-500)] font-bold text-xs mb-6">
                  {t("notificationsSub")}
                </p>
                <div className="mb-6">
                  <BrowserPushSettings language={language} />
                </div>
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--rz-gray-050)] px-5 py-4 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Mail className="text-[#ff5757]" size={20} />
                    <span className="text-sm font-bold text-[var(--rz-navy)]">
                      {t("profileEmailNotifications")}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="h-5 w-5 rounded border-[var(--border-default)] text-[#ff5757] focus:ring-[#ff5757]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB: FAVORITES — spec: BusinessResultCard grid only */}
          {activeTab === "favorites" && (
            <div className="animate-in fade-in duration-500">
              {favoritesList.length === 0 ? (
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-white">
                  <EmptyState
                    icon="heart"
                    title={language === "en" ? "No favorite businesses yet." : "Aún no tienes negocios favoritos."}
                    message={
                      language === "en"
                        ? "Save the businesses you love to book faster next time."
                        : "Guarda los negocios que más te gustan para reservar más rápido la próxima vez."
                    }
                    actionLabel={language === "en" ? "Explore businesses" : "Explorar negocios"}
                    onAction={() => router.push("/search")}
                  />
                </div>
              ) : (
                <div
                  className="grid gap-4"
                  style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
                >
                  {favoritesList.map((biz: any) => {
                    const bId = biz.businessId || biz.business?.businessId;
                    const src = businessListingImageSrc(biz.business || biz);
                    return (
                      <BusinessResultCard
                        key={bId}
                        image={src}
                        name={biz.name || biz.business?.name || "—"}
                        rating={biz.rating ?? biz.business?.rating}
                        reviews={biz.reviewCount ?? biz.business?.reviewCount}
                        category={biz.categoryKey || biz.business?.categoryKey}
                        location={biz.locationLabel || biz.business?.address}
                        services={biz.services || []}
                        favorite
                        onFavorite={() => bId && handleRemoveFavorite(bId)}
                        onClick={() => bId && router.push(`/venue/${bId}`)}
                        onReserve={() => bId && router.push(`/venue/${bId}`)}
                        ctaLabel={language === "en" ? "Book" : "Reservar"}
                      />
                    );
                  })}
                </div>
              )}
              {favoritesTotalPages > 1 && (
                <div className="mt-8">
                  <Pagination
                    page={favoritesPage}
                    totalPages={favoritesTotalPages}
                    totalItems={favoritesTotal}
                    pageSize={12}
                    onPageChange={setFavoritesPage}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB: INVOICES */}
          {activeTab === "invoices" && (
            <div className="animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-10">
                 <div>
                    <h2 className="text-3xl font-black text-[var(--rz-navy)]">{language === "en" ? "My Invoices" : "Mis facturas"}</h2>
                    <p className="text-[var(--rz-gray-500)] font-bold text-sm mt-1">
                      {language === "en" ? "Payment history and tax receipts" : "Historial de pagos y recibos"}
                    </p>
                 </div>
                 <div className="p-4 bg-white rounded-3xl border border-[var(--border-subtle)] shadow-sm flex items-center gap-3">
                    <Download className="text-[var(--rz-gray-500)]" size={20} />
                    <span className="font-black text-[var(--rz-navy)] text-xs uppercase tracking-widest">{invoicesList.length} total</span>
                 </div>
               </div>

               {invoicesList.length === 0 ? (
                 <EmptyState
                   icon="download"
                   title={language === "en" ? "No invoices yet" : "Aún no hay facturas"}
                   message={
                     language === "en"
                       ? "Your paid bookings will appear here as downloadable receipts."
                       : "Tus reservas pagadas aparecerán aquí como recibos descargables."
                   }
                 />
               ) : (
                 (() => {
                   const fmtDate = (raw: unknown): string => {
                     if (!raw) return "—";
                     const d = new Date(raw as string);
                     return isNaN(d.getTime())
                       ? "—"
                       : d.toLocaleDateString(language === "en" ? "en-US" : "es-ES", { year: "numeric", month: "short", day: "numeric" });
                   };
                   const mapStatus = (s: unknown): "paid" | "pending" | "cancelled" | "refunded" => {
                     const v = String(s || "").toLowerCase();
                     if (v.includes("pend")) return "pending";
                     if (v.includes("cancel")) return "cancelled";
                     if (v.includes("refund") || v.includes("reembol")) return "refunded";
                     return "paid";
                   };
                   const rows = (invoicesList as any[]).map((inv) => ({
                     id: inv.number || `INV-${String(inv.id || "").slice(0, 6).toUpperCase()}`,
                     date: fmtDate(inv.issuedDate || inv.date || inv.createdAt),
                     business: inv.venueName || inv.business?.name || "Venue",
                     amount: Number(inv.total || 0).toFixed(2),
                     status: mapStatus(inv.status),
                     _raw: inv,
                   }));
                   const download = (row: any) => {
                     const inv = (invoicesList as any[]).find(
                       (i) => (i.number || `INV-${String(i.id || "").slice(0, 6).toUpperCase()}`) === row.id,
                     );
                     if (inv) handleDownloadInvoice(inv);
                   };
                   const columns =
                     language === "en"
                       ? ["Invoice", "Date", "Business", "Amount", "Status", "Actions"]
                       : ["Factura", "Fecha", "Negocio", "Importe", "Estado", "Acciones"];
                   return (
                     <>
                       <div className="hidden md:block">
                         <InvoiceTable rows={rows} columns={columns} onDownload={download} />
                       </div>
                       <div className="space-y-3 md:hidden">
                         {rows.map((row) => (
                           <InvoiceCard key={row.id} invoice={row} onDownload={() => download(row)} />
                         ))}
                       </div>
                     </>
                   );
                 })()
               )}
               {invoicesTotalPages > 1 && (
                 <div className="mt-10">
                   <Pagination 
                     page={invoicesPage} 
                     totalPages={invoicesTotalPages} 
                     totalItems={invoicesTotal} 
                     pageSize={10} 
                     onPageChange={setInvoicesPage} 
                   />
                 </div>
               )}
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="animate-in fade-in duration-500">
              <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-black text-[var(--rz-navy)]">
                    {language === "en" ? "Notifications" : "Notificaciones"}
                  </h2>
                  <p className="text-[var(--rz-gray-500)] font-bold text-sm mt-1">
                    {language === "en"
                      ? "Your recent updates and alerts"
                      : "Tus actualizaciones y alertas recientes"}
                  </p>
                </div>
                {notifList.some((n) => !n.read) && (
                  <button
                    onClick={markAllNotifRead}
                    className="text-sm font-black text-[var(--rz-coral)] hover:underline"
                  >
                    {language === "en" ? "Mark all as read" : "Marcar todas como leídas"}
                  </button>
                )}
              </div>

              <div className="flex gap-2 mb-6 flex-wrap">
                {NOTIF_FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setNotifFilter(f.id)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition ${
                      notifFilter === f.id
                        ? "bg-[var(--rz-navy)] text-white"
                        : "bg-white text-[var(--rz-gray-500)] border border-[var(--border-subtle)] hover:text-[var(--rz-navy)]"
                    }`}
                  >
                    {language === "en" ? f.en : f.es}
                  </button>
                ))}
              </div>

              {notifLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="animate-spin text-[var(--rz-coral)]" size={28} />
                </div>
              ) : (() => {
                const filtered = notifList.filter(
                  (n) => notifFilter === "all" || notifCategoryOf(n.type) === notifFilter,
                );
                if (filtered.length === 0) {
                  return (
                    <EmptyState
                      icon="bell"
                      title={language === "en" ? "No notifications" : "Sin notificaciones"}
                      message={
                        language === "en"
                          ? "Updates about your reservations, payments and reviews will appear here."
                          : "Aquí aparecerán las novedades sobre tus reservas, pagos y reseñas."
                      }
                    />
                  );
                }
                return (
                  <div className="bg-white rounded-3xl border border-[var(--border-subtle)] overflow-hidden shadow-sm">
                    {filtered.map((n, i) => (
                      <NotificationItem
                        key={n.id}
                        variant="full"
                        icon={notifIconName(n.type)}
                        title={n.title}
                        message={n.body}
                        time={notifRelativeTime(n.createdAt, language)}
                        categoryLabel={notifCategoryLabel(n.type, language)}
                        unread={!n.read}
                        divider={i > 0}
                        actionLabel={language === "en" ? "View" : "Ver"}
                        onClick={() => openNotif(n)}
                      />
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {activeTab === "payments" && (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-[var(--rz-navy)]">
                  {language === "en" ? "Payment methods" : "Métodos de pago"}
                </h2>
                <p className="text-[var(--rz-gray-500)] font-bold text-sm mt-1">
                  {language === "en"
                    ? "How you pay for reservations on Rezervame"
                    : "Cómo pagas tus reservas en Rezervame"}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="bg-white rounded-3xl border border-[var(--border-subtle)] shadow-sm p-6 flex items-center gap-4">
                  <span className="flex-none w-14 h-14 rounded-2xl bg-[var(--rz-coral-050)] text-[var(--rz-coral)] flex items-center justify-center">
                    <CreditCard size={26} />
                  </span>
                  <div>
                    <h3 className="font-black text-[var(--rz-navy)] text-lg">
                      {language === "en" ? "Card" : "Tarjeta"}
                    </h3>
                    <p className="text-[var(--rz-gray-500)] font-bold text-sm mt-0.5">
                      {language === "en"
                        ? "A temporary hold is placed; charged after your service."
                        : "Se realiza una retención temporal; se cobra tras tu servicio."}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl border border-[var(--border-subtle)] shadow-sm p-6 flex items-center gap-4">
                  <span className="flex-none w-14 h-14 rounded-2xl bg-white border border-[var(--border-subtle)] flex items-center justify-center overflow-hidden">
                    <img src="/ds/logos/yappy-color.png" alt="Yappy" className="w-9 h-9 object-contain" />
                  </span>
                  <div>
                    <h3 className="font-black text-[var(--rz-navy)] text-lg">Yappy</h3>
                    <p className="text-[var(--rz-gray-500)] font-bold text-sm mt-0.5">
                      {language === "en"
                        ? "Protected by Rezervame until your service is completed."
                        : "Protegido por Rezervame hasta completar tu servicio."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[var(--rz-coral-050)] rounded-3xl p-6 flex items-start gap-4">
                <span className="flex-none w-11 h-11 rounded-full bg-white text-[var(--rz-coral)] flex items-center justify-center shadow-sm">
                  <ShieldCheck size={22} />
                </span>
                <div>
                  <h4 className="font-black text-[var(--rz-navy)] text-sm uppercase tracking-widest mb-1">
                    {language === "en" ? "Secure by design" : "Seguro por diseño"}
                  </h4>
                  <p className="text-[var(--rz-gray-600)] font-medium text-sm leading-relaxed">
                    {language === "en"
                      ? "For your security, Rezervame does not store your card. You enter your payment details securely at checkout each time, and funds are only released to the business once your service is completed."
                      : "Por tu seguridad, Rezervame no guarda tu tarjeta. Ingresas tus datos de pago de forma segura al momento de pagar, y los fondos solo se liberan al negocio cuando se completa tu servicio."}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reservation Detail Modal */}
      {isResModalOpen && selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[rgba(1,29,44,0.6)] backdrop-blur-sm" onClick={() => setIsResModalOpen(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-8 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between bg-white shrink-0">
              <button 
                onClick={() => setIsResModalOpen(false)} 
                className="flex items-center gap-2 text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)] font-bold transition text-sm"
              >
                <ChevronLeft size={20} />
                {language === "en" ? "Back" : "Atrás"}
              </button>
              <div className="flex flex-col items-center">
                <h2 className="text-sm font-black text-[var(--rz-navy)] uppercase tracking-widest">{selectedRes.venueName}</h2>
                <span className="text-[10px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest mt-0.5">#{selectedRes.refNumber}</span>
              </div>
              <button 
                onClick={() => setIsResModalOpen(false)} 
                className="p-2.5 bg-[var(--rz-gray-050)] text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)] hover:bg-[var(--rz-gray-100)] rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inner Content Scroller */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[var(--rz-gray-050)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[32px] border border-[var(--border-subtle)] overflow-hidden shadow-sm">
                    <div className="h-52 relative">
                      <img src={selectedRes.img} className="w-full h-full object-cover" alt={selectedRes.venueName} />
                      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(1,29,44,0.8)] to-transparent" />
                      <div className="absolute bottom-6 left-8 right-6">
                         <h3 className="text-2xl font-black text-white">{selectedRes.venueName}</h3>
                         <p className="text-white/80 font-bold text-xs flex items-center gap-2 mt-1.5">
                            <MapPin size={14} className="text-white/90" />
                            {selectedRes.address || "Location Label"}
                         </p>
                      </div>
                    </div>

                    <div className="p-8 space-y-8">
                       <div className="flex items-center justify-between p-5 bg-[var(--rz-gray-050)] rounded-2xl border border-[var(--border-subtle)]">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#ff5757] shadow-sm border border-[var(--border-subtle)]">
                                <Calendar size={22} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest">{language === "en" ? "Date & Time" : "Fecha y hora"}</p>
                                <p className="font-black text-[var(--rz-navy)] text-sm">{selectedRes.date} at {selectedRes.time}</p>
                             </div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${reservationStatusBadgeClass(selectedRes.status)}`}>
                            {reservationStatusLabel(selectedRes.status, language)}
                          </div>
                       </div>

                       <div>
                          <h4 className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-[0.2em] mb-4">{language === "en" ? "Service Details" : "Detalles del servicio"}</h4>
                          <div className="space-y-3.5">
                             {selectedRes.items.map((item) => (
                               <div key={item.id} className="flex justify-between items-center p-5 rounded-2xl bg-white border border-[var(--border-subtle)] hover:border-[#ff5757]/20 transition-all shadow-sm">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-[var(--rz-gray-050)] rounded-2xl flex items-center justify-center text-[#ff5757] font-black text-lg border border-[var(--border-subtle)] shrink-0">
                                        {item.name.charAt(0)}
                                     </div>
                                     <div>
                                        <h5 className="font-black text-[var(--rz-navy)] text-sm">{item.name}</h5>
                                        <p className="text-[9px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest mt-1">
                                           {item.customerName || selectedRes.customerName || "Customer"} • {item.staffName || "Staff"}
                                        </p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                     <span className="font-black text-[var(--rz-navy)] text-sm">${item.price}</span>
                                     {item.status === 'paid' && (
                                       <span className="text-[9px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-1">
                                         <CreditCard size={12} />
                                         {language === "en" ? "Paid" : "Pagado"}
                                       </span>
                                     )}
                                     {item.status === 'cash_at_venue' && (
                                       <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
                                         <Banknote size={12} />
                                         {language === "en" ? "Pay at Venue" : "Pagar en el local"}
                                       </span>
                                     )}
                                     {item.canCancel && (
                                       <button 
                                         onClick={() => handleCancelReservation(item.id)}
                                         className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition"
                                       >
                                          {language === "en" ? "Cancel" : "Cancelar"}
                                       </button>
                                     )}
                                     {item.status === 'completed' && item.isReviewed && (
                                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                          <CheckCircle2 size={12} />
                                          {language === "en" ? "Reviewed" : "Reseñado"}
                                       </span>
                                     )}
                                  </div>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Summary & Payment */}
                <div className="space-y-6">
                   <div className="bg-white rounded-[32px] border border-[var(--border-subtle)] p-6 md:p-8 shadow-sm">
                      <h4 className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-[0.2em] mb-5">{language === "en" ? "Payment Summary" : "Resumen de pago"}</h4>
                      
                      <div className="space-y-3.5">
                         <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-[var(--rz-gray-500)]">{language === "en" ? "Services" : "Servicios"}</span>
                            <span className="font-black text-[var(--rz-gray-700)]">${selectedRes.subtotal.toFixed(2)}</span>
                         </div>
                         {selectedRes.commissionAmount > 0 && (
                           <div className="flex justify-between items-center text-xs">
                              <span className="font-bold text-[var(--rz-gray-500)]">
                                {`Service fee (${selectedRes.commissionPercent}%)`}
                              </span>
                              <span className="font-black text-[var(--rz-gray-700)]">${selectedRes.commissionAmount.toFixed(2)}</span>
                           </div>
                         )}
                         <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-[var(--rz-gray-500)]">
                              {selectedRes.taxPercentage > 0
                                ? `Tax (${selectedRes.taxPercentage}%)`
                                : "Tax"}
                            </span>
                            <span className="font-black text-[var(--rz-gray-700)]">${selectedRes.taxAmount.toFixed(2)}</span>
                         </div>
                         <div className="pt-3.5 mt-3.5 border-t border-[var(--border-subtle)] flex justify-between items-center">
                            <span className="text-sm font-black text-[var(--rz-navy)]">{language === "en" ? "Total" : "Total"}</span>
                            <span className="text-2xl font-black text-[#ff5757]">${selectedRes.totalPrice.toFixed(2)}</span>
                         </div>
                      </div>

                      {paymentView === "none" && selectedRes.status === "confirmed" && (
                        <div className="mt-6 space-y-4">
                           <div className="p-4 bg-emerald-50/70 border border-emerald-100/80 rounded-2xl text-[10px] font-bold text-emerald-800">
                              <p className="font-black uppercase tracking-widest mb-1">{language === "en" ? "Approved" : "Aprobada"}</p>
                              <p className="text-emerald-700/90 font-medium">{language === "en" ? "Your booking is approved. Please pay online to confirm." : "Tu reserva fue aprobada. Paga en línea para confirmar."}</p>
                           </div>
                           <button 
                             type="button"
                             onClick={() => setPaymentView("review")}
                             className="w-full bg-[#ff5757] hover:bg-[#d83b3b] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-[#ff5757]/15 transition-all transform active:scale-95"
                           >
                             {language === "en" ? "Review & Pay" : "Revisar y pagar"}
                           </button>
                        </div>
                      )}

                      {paymentView === "none" && selectedRes.status === "rescheduled" && (
                        <div className="mt-6 space-y-4">
                           <div className="p-4 bg-amber-50/70 border border-amber-100/80 rounded-2xl text-[10px] font-bold text-amber-800">
                              <p className="font-black uppercase tracking-widest mb-1">{language === "en" ? "Reschedule Proposed" : "Reagenda propuesta"}</p>
                              <p className="text-amber-700/90 font-medium">{language === "en" ? "The venue has proposed a new time. Do you accept?" : "El negocio propuso un nuevo horario. ¿Lo aceptas?"}</p>
                           </div>
                           <button 
                             onClick={handleAcceptReschedule}
                             disabled={payingLoading}
                             className="w-full bg-[#ff5757] hover:bg-[#d83b3b] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-[#ff5757]/15 transition-all flex items-center justify-center gap-2"
                           >
                             {payingLoading && <Loader2 className="animate-spin text-white" size={14} />}
                             {language === "en" ? "Accept New Time" : "Aceptar nuevo horario"}
                           </button>
                        </div>
                      )}

                      {paymentView === "none" && selectedRes.status === "paid" && (
                         <div className="mt-6 space-y-4">
                            <div className="p-4 bg-cyan-50/70 border border-cyan-100/80 rounded-2xl text-[10px] font-bold text-cyan-800">
                               <p className="font-black uppercase tracking-widest mb-1">{language === "en" ? "Payment Confirmed" : "Pago confirmado"}</p>
                               <p className="text-cyan-700/90 font-medium">{language === "en" ? "Your appointment is ready. Mark as completed after the service." : "Tu cita está lista. Márcala como completada después del servicio."}</p>
                            </div>
                            <button 
                              onClick={handleMarkCompletedGroup}
                              disabled={payingLoading}
                              className="w-full bg-[var(--rz-navy-900)] hover:bg-[var(--rz-navy)] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                              {payingLoading && <Loader2 className="animate-spin text-white" size={14} />}
                              {language === "en" ? "Mark as Completed" : "Marcar como completada"}
                            </button>
                         </div>
                       )}

                      {paymentView === "none" && selectedRes.status === "cash_at_venue" && (
                         <div className="mt-6 space-y-4">
                            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[10px] font-bold text-amber-900">
                               <p className="font-black uppercase tracking-widest mb-1">{language === "en" ? "Pay at the venue" : "Paga en el local"}</p>
                               <p className="text-amber-800/90 font-medium leading-relaxed">
                                 {`Your booking is confirmed. Please bring $${selectedRes.totalPrice.toFixed(2)} in cash when you arrive.`}
                               </p>
                               <p className="text-amber-700/90 font-medium mt-2">
                                  {language === "en" ? "The venue will confirm your cash payment when you complete the service." : "El negocio confirmará tu pago en efectivo cuando completes el servicio."}
                               </p>
                            </div>
                         </div>
                       )}

                       {selectedRes.status === "completed" && !selectedRes.isReviewed && (
                         <div className="mt-6 space-y-4">
                            <div className="p-4 bg-blue-50/70 border border-blue-100/80 rounded-2xl text-[10px] font-bold text-blue-800 text-center">
                               <p className="font-black uppercase tracking-widest mb-1">{language === "en" ? "Service Completed" : "Servicio completado"}</p>
                               <p className="text-blue-700/90 font-medium">{language === "en" ? "How was your experience today?" : "¿Cómo estuvo tu experiencia hoy?"}</p>
                            </div>
                            <button 
                              onClick={() => { setIsResModalOpen(false); setIsReviewModalOpen(true); }}
                              className="w-full bg-[#ff5757] hover:bg-[#d83b3b] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-[#ff5757]/15 transition-all transform active:scale-95"
                            >
                              {language === "en" ? "Rate Experience" : "Calificar experiencia"}
                            </button>
                         </div>
                       )}

                      {paymentView === "none" && selectedRes.status === "pending" && (
                         <div className="mt-6 space-y-4">
                            <div className="p-4 bg-[var(--rz-gray-050)] border border-[var(--border-subtle)] rounded-2xl text-center">
                               <p className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest">{language === "en" ? "Waiting for Venue" : "Esperando al negocio"}</p>
                               <p className="text-[var(--rz-gray-500)] text-[10px] font-medium mt-2">{language === "en" ? "You can cancel anytime before the venue accepts." : "Puedes cancelar en cualquier momento antes de que el negocio acepte."}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleCancelAllInGroup(selectedRes)}
                              className="w-full bg-red-50 text-red-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition border border-red-100"
                            >
                               {language === "en" ? "Cancel Reservation" : "Cancelar reserva"}
                            </button>
                         </div>
                      )}

                      {paymentView === "review" && (
                         <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--rz-gray-050)] p-4 text-[10px] font-bold text-[var(--rz-gray-600)]">
                              <p className="font-black uppercase tracking-widest text-[var(--rz-navy)] mb-2">{language === "en" ? "Payment details" : "Detalles de pago"}</p>
                              <p>{selectedRes.items.length} {language === "en" ? "service(s)" : "servicio(s)"} · {selectedRes.venueName}</p>
                              <p className="mt-1 text-[var(--rz-gray-500)]">{selectedRes.date} · {selectedRes.time}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                              {paymentMethods.map((m) => (
                                <button
                                  key={m.id}
                                  type="button"
                                  disabled={!m.configured}
                                  onClick={() => setPayMethod(m.id as "wompi" | "yappy" | "pay_at_venue")}
                                  className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                                    payMethod === m.id ? "border-[#ff5757] bg-[#ff5757]/5" : "border-[var(--border-subtle)] hover:border-[var(--border-default)]"
                                  }`}
                                >
                                  {m.id === "wompi" || m.id === "card" ? (
                                    <CreditCard className="text-[#ff5757]" size={22} />
                                  ) : m.id === "yappy" ? (
                                    <Shield className="text-[#ff5757]" size={22} />
                                  ) : (
                                    <Banknote className="text-[#ff5757]" size={22} />
                                  )}
                                  <span className="text-[10px] font-black text-[var(--rz-gray-700)] uppercase tracking-widest">
                                    {m.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                            {payMethod === "yappy" ? (
                              <p className="text-[10px] font-bold text-amber-700 text-center">
                                Complete transfer in the Yappy app, then confirm payment here.
                              </p>
                            ) : null}
                            
                            <button 
                              type="button"
                              onClick={() => void handlePayNow(selectedRes)}
                              disabled={payingLoading}
                              className="w-full bg-[var(--rz-navy-900)] hover:bg-[var(--rz-navy)] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                               {payingLoading ? <Loader2 className="animate-spin text-white" size={14} /> : <Shield size={14} />}
                               {payingLoading ? (language === "en" ? "Processing..." : "Procesando...") : (language === "en" ? `Pay $${selectedRes.totalPrice.toFixed(2)}` : `Pagar $${selectedRes.totalPrice.toFixed(2)}`)}
                            </button>

                            <div className="flex gap-3">
                              {selectedRes.canCancelAny && (
                                <button 
                                  onClick={() => void handleCancelAllInGroup(selectedRes)}
                                  className="flex-1 bg-red-50 text-red-500 font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:bg-red-100 transition border border-red-100/80"
                                >
                                   {language === "en" ? "Cancel All" : "Cancelar todo"}
                                </button>
                              )}
                              <button 
                                onClick={() => setPaymentView("none")}
                                className="flex-1 bg-white border border-[var(--border-default)] text-[var(--rz-gray-500)] font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:bg-[var(--rz-gray-050)] transition"
                              >
                                 {language === "en" ? "Back" : "Atrás"}
                              </button>
                            </div>
                         </div>
                      )}

                      {paymentView === "done" && (
                         <div className="mt-6 space-y-4 animate-in zoom-in-95">
                            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5 text-center">
                              <CheckCircle className="text-emerald-500 mx-auto mb-2" size={28} />
                              <p className="font-black text-emerald-950 text-sm uppercase tracking-wide">{language === "en" ? "Payment confirmed" : "Pago confirmado"}</p>
                              <p className="mt-2 text-[11px] font-bold text-emerald-800">
                                {`$${selectedRes.totalPrice.toFixed(2)} paid · Ref #${paidInvoice?.refNumber ?? selectedRes.refNumber}`}
                              </p>
                              <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                                {language === "en" ? "All services in this reservation are now marked as paid." : "Todos los servicios de esta reserva están marcados como pagados."}
                              </p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => { setIsResModalOpen(false); setPaymentView("none"); setActiveTab("invoices"); }}
                              className="w-full text-[10px] font-black text-emerald-700 uppercase tracking-widest underline decoration-2 underline-offset-4"
                            >
                               {language === "en" ? "View invoice" : "Ver factura"}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setIsResModalOpen(false);
                                setPaymentView("none");
                                setRefreshTrigger((p) => p + 1);
                              }}
                              className="w-full bg-[var(--rz-navy-900)] text-white font-black py-3 rounded-xl text-[10px] uppercase tracking-widest"
                            >
                              {language === "en" ? "Done" : "Listo"}
                            </button>
                         </div>
                      )}
                   </div>

                   <div className="bg-[var(--rz-navy-900)] rounded-[32px] p-6 md:p-8 text-white shadow-xl shadow-[color:rgba(231,234,239,0.5)]">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-5">{language === "en" ? "Safety & Policy" : "Seguridad y políticas"}</h4>
                      <div className="space-y-5 text-[11px]">
                         {selectedRes.status === 'cash_at_venue' ? (
                           <div className="flex gap-3.5">
                              <Banknote className="text-[#ff5757] flex-shrink-0" size={18} />
                              <p className="font-medium text-white/80 leading-relaxed">
                                 {language === "en" ? "Cash payment is collected at the venue when you arrive for your appointment." : "El pago en efectivo se realiza en el local cuando llegas a tu cita."}
                              </p>
                           </div>
                         ) : (
                           <div className="flex gap-3.5">
                              <Shield className="text-[#ff5757] flex-shrink-0" size={18} />
                              <p className="font-medium text-white/80 leading-relaxed">
                                 {language === "en" ? "Secure encrypted payments powered by Rezervame." : "Pagos seguros y cifrados con tecnología de Rezervame."}
                              </p>
                           </div>
                         )}
                         <div className="flex gap-3.5">
                            <Clock className="text-[#ff5757] flex-shrink-0" size={18} />
                            <p className="font-medium text-white/80 leading-relaxed">
                               {selectedRes.cancellationPolicyMessage ||
                                 policyMessageForBooking(
                                   {
                                     status: selectedRes.status,
                                     appointmentAt: selectedRes.items[0]?.appointmentAt ?? selectedRes.date,
                                     transactionId: selectedRes.transactionId,
                                     business: {
                                       cancellationAllowed: selectedRes.cancellationAllowed,
                                       cancellationHoursBefore: selectedRes.cancellationHoursBefore,
                                     },
                                   },
                                   language === "es" ? "es" : "en",
                                 )}
                            </p>
                         </div>
                      </div>
                   </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}


       {/* Beautiful Confirm Dialog */}
       <ConfirmDialog
         open={confirmDialog.open}
         title={confirmDialog.title}
         message={confirmDialog.message}
         confirmLabel={confirmDialog.confirmLabel}
         cancelLabel={confirmDialog.cancelLabel}
         variant={confirmDialog.variant}
         onConfirm={confirmDialog.onConfirm}
         onCancel={closeConfirm}
       />

      {/* Family Member Modal */}
      {isFamilyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[rgba(2,48,71,0.8)] backdrop-blur-md animate-in fade-in duration-500" onClick={() => setIsFamilyModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-[var(--rz-navy)]">{editingMember ? (language === "en" ? "Edit Member" : "Editar miembro") : (language === "en" ? "New Member" : "Nuevo miembro")}</h3>
                <button onClick={() => setIsFamilyModalOpen(false)} className="p-3 text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)] bg-[var(--rz-gray-050)] rounded-2xl transition"><X size={20} /></button>
             </div>
             
             <form onSubmit={handleAddFamily} className="space-y-8">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-wide ml-1">{language === "en" ? "Full Name" : "Nombre completo"}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--rz-gray-300)] group-focus-within:text-[#ff5757] transition-colors">
                      <UserIcon size={18} />
                    </div>
                    <input name="name" type="text" defaultValue={editingMember?.name} required placeholder="e.g. John Doe" className="w-full bg-[var(--rz-gray-050)] border border-[var(--border-default)] rounded-xl py-3 pl-12 pr-4 font-bold text-[var(--rz-navy)] text-sm focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all placeholder:text-[var(--rz-gray-500)]" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-wide ml-1">{language === "en" ? "Age" : "Edad"}</label>
                    <input name="age" type="number" defaultValue={editingMember?.age} required placeholder={language === "en" ? "Years" : "Años"} className="w-full bg-[var(--rz-gray-050)] border border-[var(--border-default)] rounded-xl py-3 px-4 font-bold text-[var(--rz-navy)] text-sm focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all placeholder:text-[var(--rz-gray-500)]" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-wide ml-1">Gender</label>
                    <select name="gender" defaultValue={editingMember?.gender || "Male"} className="w-full bg-[var(--rz-gray-050)] border border-[var(--border-default)] rounded-xl py-3 px-4 font-bold text-[var(--rz-navy)] text-sm focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all appearance-none cursor-pointer">
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                       <option value="Other">Other</option>
                    </select>
                 </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-wide ml-1">Email (optional)</label>
                  <input name="email" type="email" defaultValue={editingMember?.email ?? ""} placeholder="email@example.com" className="w-full bg-[var(--rz-gray-050)] border border-[var(--border-default)] rounded-xl py-3 px-4 font-bold text-[var(--rz-navy)] text-sm focus:outline-none focus:border-[#ff5757] focus:bg-white transition-all placeholder:text-[var(--rz-gray-500)]" />
               </div>
              <button type="submit" disabled={isSavingFamilyMember} className="w-full bg-[#ff5757] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#ff5757]/25 hover:bg-[#d83b3b] transition-all text-xs uppercase tracking-widest mt-4 disabled:opacity-60 flex items-center justify-center gap-2">
                 {isSavingFamilyMember ? <Loader2 className="animate-spin" size={16} /> : null}
                 {isSavingFamilyMember ? (language === "en" ? "Saving..." : "Guardando...") : (editingMember ? (language === "en" ? "Save Changes" : "Guardar cambios") : (language === "en" ? "Add Member" : "Agregar persona"))}
               </button>
             </form>
          </div>
        </div>
      )}
      
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(2,48,71,0.6)] p-4 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setIsReviewModalOpen(false)} 
                className="absolute top-6 right-6 p-2 text-[var(--rz-gray-500)] hover:text-[var(--rz-navy)] transition-colors"
              >
                 <X size={24} />
              </button>

              <div className="text-center mb-10">
                 <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/10">
                    <Star size={36} fill="currentColor" />
                 </div>
                 <h2 className="text-2xl font-black text-[var(--rz-navy)] mb-2 uppercase tracking-tight">
                    {language === "en" ? "Rate Your Experience" : "Califica tu experiencia"}
                 </h2>
                 <p className="text-[var(--rz-gray-500)] font-bold text-xs uppercase tracking-widest">
                    {selectedRes?.venueName}
                 </p>
              </div>

              <div className="space-y-10">
                 {/* Venue Rating */}
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest block text-center">{language === "en" ? "Common Venue Rating" : "Calificación general del negocio"}</label>
                    <div className="flex justify-center gap-3">
                       {[1,2,3,4,5].map((star) => (
                         <button key={star} onClick={() => setBusinessRating(star)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${businessRating >= star ? "bg-[#ff5757]/10 text-[#ff5757] shadow-sm" : "bg-[var(--rz-gray-050)] text-[var(--rz-gray-300)]"}`}>
                           <Star size={24} fill={businessRating >= star ? "currentColor" : "none"} />
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="h-px bg-[var(--rz-gray-100)]" />

                 {/* Individual Services */}
                 <div className="space-y-8">
                   <h4 className="text-xs font-black text-[var(--rz-gray-500)] uppercase tracking-widest text-center">{language === "en" ? "Individual Service Ratings" : "Calificaciones por servicio"}</h4>
                   {selectedRes?.items.filter(i => i.status === 'completed' && !i.isReviewed).map((item) => (
                     <div key={item.id} className="p-6 bg-[var(--rz-gray-050)] rounded-3xl space-y-6">
                        <div>
                           <p className="font-black text-[var(--rz-navy)] text-sm">{item.name}</p>
                           <p className="text-[10px] font-bold text-[var(--rz-gray-500)] uppercase tracking-widest mt-1">{item.staffName}</p>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-3">
                              <p className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest">{language === "en" ? "Service Quality" : "Calidad del servicio"}</p>
                              <div className="flex gap-2">
                                {[1,2,3,4,5].map((star) => (
                                  <button 
                                    key={star} 
                                    onClick={() => setServiceRatings(prev => ({ ...prev, [item.id]: star }))} 
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ (serviceRatings[item.id] || 5) >= star ? "bg-amber-100 text-amber-500 shadow-sm" : "bg-white text-[var(--rz-gray-200)] border border-[var(--border-subtle)]"}`}
                                  >
                                    <Star size={18} fill={(serviceRatings[item.id] || 5) >= star ? "currentColor" : "none"} />
                                  </button>
                                ))}
                              </div>
                           </div>

                           <div className="space-y-3">
                              <p className="text-[10px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest">{language === "en" ? "Staff Rating" : "Calificación del personal"}</p>
                              <div className="flex gap-2">
                                {[1,2,3,4,5].map((star) => (
                                  <button 
                                    key={star} 
                                    onClick={() => setStaffRatings(prev => ({ ...prev, [item.id]: star }))} 
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ (staffRatings[item.id] || 5) >= star ? "bg-cyan-100 text-cyan-600 shadow-sm" : "bg-white text-[var(--rz-gray-200)] border border-[var(--border-subtle)]"}`}
                                  >
                                    <Star size={18} fill={(staffRatings[item.id] || 5) >= star ? "currentColor" : "none"} />
                                  </button>
                                ))}
                              </div>
                           </div>
                        </div>
                     </div>
                   ))}
                 </div>

                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-[var(--rz-gray-500)] uppercase tracking-widest block text-center">{language === "en" ? "Review comment (shared)" : "Comentario de la reseña (compartido)"}</label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={language === "en" ? "Tell us more about your visit..." : "Cuéntanos más sobre tu visita..."}
                      className="w-full h-32 bg-[var(--rz-gray-050)] border-none rounded-3xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                 </div>

                 <button 
                   onClick={async () => {
                     if (!selectedRes) return;
                     setIsSubmittingReview(true);
                     try {
                       const services = Object.keys(serviceRatings).map(id => ({
                         bookingId: id,
                         serviceRating: serviceRatings[id],
                         staffRating: staffRatings[id],
                       }));

                       await apiPost("/mobile/reviews/group", {
                         businessRating,
                         comment: reviewComment,
                         services,
                       }, "USER");

                       setIsReviewModalOpen(false);
                       setRefreshTrigger(prev => prev + 1);
                       toastSuccess(
                        language === "en" ? "Review Submitted" : "Reseña enviada",
                        language === "en" ? "Thank you for your feedback!" : "¡Gracias por tu opinión!"
                      );
                     } catch (err) {
                       toastError("Error", err instanceof Error ? err.message : "");
                     } finally {
                       setIsSubmittingReview(false);
                     }
                   }}
                   disabled={isSubmittingReview}
                   className="w-full bg-[var(--rz-navy)] text-white font-black py-5 rounded-[24px] text-sm uppercase tracking-[0.2em] shadow-2xl shadow-[color:rgba(2,48,71,0.2)] hover:bg-[#ff5757] transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSubmittingReview ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
                    {isSubmittingReview ? (language === "en" ? "Submitting..." : "Enviando...") : (language === "en" ? "Submit All Ratings" : "Enviar todas las calificaciones")}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  return (
    <Suspense fallback={<PageLoader label="Loading your profile…" />}>
      <ProfileContent />
    </Suspense>
  );
}
