"use client";
import React, { useState, useEffect, useMemo, Suspense, useRef } from "react";
import { useI18n } from "../../components/I18nProvider";
import { useAuth } from "../../components/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/lib/toast";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { venueCardImageSrc, businessListingImageSrc, type SearchVenueRow } from "@/lib/venueSearch";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { generateAndDownloadInvoicePDF } from "@/lib/invoicePdf";
import { 
  Trash2, Edit2, Shield, User as UserIcon, 
  Users, Calendar, Heart, Lock, CheckCircle, 
  X, Plus, Camera, LogOut, ChevronLeft, ChevronRight, Mail, Phone,
  MapPin, Star, Download, RefreshCcw, Clock, CreditCard, Banknote, CheckCircle2, FileText,
  Loader2, Check
} from "lucide-react";
import Link from "next/link";
import { Pagination } from "@/components/ui/pagination";

type Tab = "bookings" | "family" | "settings" | "favorites" | "invoices";

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
  status: "pending" | "confirmed" | "completed" | "cancelled" | "paid" | "rescheduled";
  img: string;
  taxAmount: number;
  taxPercentage: number;
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
    status: "pending" | "confirmed" | "completed" | "cancelled" | "paid" | "rescheduled";
    isReviewed?: boolean;
    transactionId?: string;
  }[];
  businessId: string;
  transactionId?: string;
  paymentMethod?: string;
}

function mapUserBookingGroup(
  group: any[],
  language: string,
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
  const timeStr = Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });

  const subtotal = group.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const taxAmount = group.reduce((sum, item) => {
    const storedTax = Number(item.taxAmount || 0);
    if (storedTax > 0) return sum + storedTax;
    // Fallback to business's current tax percentage if not stored
    const currentTax = (Number(item.price || 0) * (b.business?.taxPercentage || 0)) / 100;
    return sum + currentTax;
  }, 0);
  const totalPrice = subtotal + taxAmount;
  
  const items = group.map(item => {
    const st = (item.status || "").toLowerCase();
    let status: Reservation["status"] = "pending";
    if (st === "completed") status = "completed";
    else if (st === "cancelled" || st === "rejected") status = "cancelled";
    else if (st === "paid") status = "paid";
    else if (st === "rescheduled") status = "rescheduled";
    else if (st === "approved" || st === "confirmed") {
        if (item?.transactionId) status = "paid";
        else status = "confirmed";
    }
    else status = "pending";
    
    return {
        id: item.id,
        name: item.service?.name || "Service",
        price: Number(item.price || 0).toFixed(2),
        customerName: item.customer?.name || item.customerName,
        staffName: item.staff?.name || item.staffName,
        status,
        isReviewed: item.isReviewed || false,
        transactionId: item.transactionId,
    };
  });

  const activeItems = items.filter(i => i.status !== "cancelled");
  const mainStatus: Reservation["status"] =
    activeItems.length === 0
      ? "cancelled"
      : activeItems.every(i => i.status === "completed")
        ? "completed"
        : activeItems.some(i => i.status === "pending")
          ? "pending"
          : activeItems.some(i => i.status === "rescheduled")
            ? "rescheduled"
            : activeItems.some(i => i.status === "paid")
              ? "paid"
              : "confirmed";

  return {
    id: b.id,
    refNumber,
    venueName: b.business?.name || "—",
    serviceName: group.length > 1 ? `${group.length} Services` : (b.service?.name || "Service"),
    customerName: b.customer?.name || b.customerName,
    staffName: b.staff?.name || b.staffName,
    date: dateStr,
    time: timeStr,
    price: `$${totalPrice.toFixed(2)}`,
    totalPrice,
    status: mainStatus,
    img: b.service?.imageUrl || b.business?.bannerUrl || b.business?.logoUrl || PLACEHOLDER_IMAGE_DATA_URI,
    subtotal,
    taxAmount,
    taxPercentage: b.business?.taxPercentage || 0,
    address: b.business?.address || "",
    phone: b.business?.phone,
    isReviewed: items.every(i => i.isReviewed),
    items,
    businessId: b.businessId,
    transactionId: b.transactionId,
    paymentMethod: b.transaction?.paymentMethod,
  };
}

function groupAndMapBookings(bookings: any[], language: string): Reservation[] {
  if (!Array.isArray(bookings)) return [];
  const groups: Record<string, any[]> = {};
  bookings.forEach((b) => {
    const key = `${b.businessId}_${b.date}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(b);
  });
  return Object.values(groups).map((g) => mapUserBookingGroup(g, language));
}

function ProfileContent() {
  const { language } = useI18n();
  const { isLoggedIn, isHydrated, user, logout, setIsLoginModalOpen, refreshUser, token } = useAuth() as any;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("bookings");
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
  const [favoritesList, setFavoritesList] = useState<unknown[]>([]);
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
  const [paymentView, setPaymentView] = useState<"none" | "select" | "card" | "done">("none");
  const [payMethod, setPayMethod] = useState<"card" | "cash">("card");
  const [payingLoading, setPayingLoading] = useState(false);
  const [paidInvoice, setPaidInvoice] = useState<{ id: string; refNumber: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const [recentlyPaidGroupId, setRecentlyPaidGroupId] = useState<string | null>(null);
  const [stripeCheckoutEnabled, setStripeCheckoutEnabled] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    void apiGet<{ stripeEnabled?: boolean }>("/public/payment-config")
      .then((cfg) => setStripeCheckoutEnabled(!!cfg.stripeEnabled))
      .catch(() => setStripeCheckoutEnabled(false));
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
    };
    if (avatarPreview) {
      payload.avatar = avatarPreview;
    }
    
    setIsUpdatingProfile(true);
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
    const confirmedItems = res.items.filter(i => i.status === "confirmed");
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
      const confirmedIds = res.items
        .filter((i) => i.status === "confirmed")
        .map((i) => i.id);

      if (confirmedIds.length === 0) {
        toastWarning(
          "Already processed",
          "These bookings are already completed."
        );
        setPayingLoading(false);
        return;
      }

      if (payMethod === "card" && stripeCheckoutEnabled) {
        const checkout = await apiPost<{ url: string }>(
          "/mobile/bookings/pay-group/stripe-checkout",
          { bookingIds: confirmedIds },
          "USER",
        );
        if (checkout?.url) {
          window.location.href = checkout.url;
          return;
        }
      }

      const method = payMethod === "card" ? "Card Payment" : "Cash Payment";
      await apiPost("/mobile/bookings/pay-group", {
        bookingIds: confirmedIds,
        paymentMethod: method,
        businessId: res.businessId,
      }, "USER");

      // Mark this group as recently paid - keeps it visible in upcoming with a PAID badge
      setRecentlyPaidGroupId(res.id);
      setPaidInvoice({ id: res.id, refNumber: res.refNumber });
      setPaymentView("done");
      // Delay refresh slightly so the user sees the success screen first
      setTimeout(() => setRefreshTrigger((prev) => prev + 1), 2000);
      toastSuccess(
        "Payment Successful!",
        "Invoice added to your history."
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
      paymentMethod: payMethod === "card" ? "Credit Card" : "Cash",
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
    if (isHydrated && !isLoggedIn) {
      setIsLoginModalOpen(true);
    }

    const tab = searchParams.get("tab") as Tab;
    if (tab && ["bookings", "family", "settings", "favorites", "invoices"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [isLoggedIn, isHydrated, setIsLoginModalOpen, searchParams]);

  // Combined data fetching (split slightly for clarity and pagination)
  useEffect(() => {
    if (!isLoggedIn) return;
    
    // Fetch bookings (paginated history)
    void (async () => {
      try {
        const response = await apiGet<{ ongoing: any[]; history: { data: any[]; total: number; totalPages: number } }>(
          `/mobile/bookings?page=${historyPage}&limit=10`,
          "USER",
        );
        setBookPayload({
          ongoing: Array.isArray(response?.ongoing) ? response.ongoing : [],
          history: Array.isArray(response?.history?.data) ? response.history.data : [],
        });
        setHistoryTotalPages(response?.history?.totalPages || 1);
        setHistoryTotal(response?.history?.total || 0);
      } catch (e) {
        setBookPayload({ ongoing: [], history: [] });
        toastError("Failed to load bookings", e instanceof Error ? e.message : "");
      }
    })();

    // Fetch invoices (paginated)
    void (async () => {
      try {
        const response = await apiGet<{ data: any[]; total: number; totalPages: number }>(
          `/mobile/invoices?page=${invoicesPage}&limit=10`, 
          "USER"
        );
        setInvoicesList(Array.isArray(response?.data) ? response.data : []);
        setInvoicesTotalPages(response?.totalPages || 1);
        setInvoicesTotal(response?.total || 0);
      } catch (e) {
        setInvoicesList([]);
        toastError("Failed to load invoices", e instanceof Error ? e.message : "");
      }
    })();

    // Fetch other lists (favorites, family)
    void (async () => {
      try {
        const fav = await apiGet<unknown[]>("/mobile/favorites", "USER");
        setFavoritesList(Array.isArray(fav) ? fav : []);
      } catch (e) {
        setFavoritesList([]);
      }
      
      try {
        const fam = await apiGet<Array<{ id: string; name: string; age: number | null; gender: string; email: string | null }>>(
          "/mobile/family-members",
          "USER",
        );
        setFamilyMembers(
          (Array.isArray(fam) ? fam : []).map((m) => ({
            id: m.id,
            name: m.name,
            age: m.age ?? 0,
            gender: m.gender,
            email: m.email,
          })),
        );
      } catch {
        setFamilyMembers([]);
      }
    })();
  }, [isLoggedIn, language, refreshTrigger, historyPage, invoicesPage]);

  const historyReservations = useMemo(
    () => groupAndMapBookings(bookPayload.history, language),
    [bookPayload.history, language],
  );

  const ongoingReservations = useMemo(
    () => groupAndMapBookings(bookPayload.ongoing, language),
    [bookPayload.ongoing, language],
  );

  // Derive which booking groups have been paid (have a Transaction) from invoice list
  const paidBookingIds = useMemo(() => {
    const ids = new Set<string>();
    (invoicesList as any[]).forEach((inv) => {
      if (inv.bookingId) ids.add(inv.bookingId);
    });
    return ids;
  }, [invoicesList]);

  const nextBooking = ongoingReservations[0] || null;

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
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <p className="max-w-md text-sm font-semibold text-slate-600">
          {language === "en"
            ? "Sign in to view your profile, bookings, and favorites."
            : "Inicia sesión para ver tu perfil, reservas y favoritos."}
        </p>
        <button
          type="button"
          onClick={() => setIsLoginModalOpen(true)}
          className="rounded-2xl bg-[#ff5a5f] px-8 py-3 text-sm font-black uppercase tracking-widest text-white shadow-lg hover:bg-[#e0484d]"
        >
          {"Sign in"}
        </button>
      </div>
    );
  }

  const menuItems = [
    { id: "bookings", label: "My Reservations", icon: <Calendar size={20} /> },
    { id: "invoices", label: "My Invoices", icon: <Download size={20} /> },
    { id: "family", label: "Family & Friends", icon: <Users size={20} /> },
    { id: "settings", label: "Profile & Settings", icon: <UserIcon size={20} /> },
    { id: "favorites", label: "My Favorites", icon: <Heart size={20} /> }
  ];

  return (
    <div className="bg-slate-50 flex h-screen overflow-hidden animate-in fade-in duration-700">
      {/* Sidebar */}
      <aside className="w-[320px] bg-white border-r border-slate-200 flex flex-col hidden lg:flex shadow-sm shrink-0">
        <div className="p-8 flex flex-col items-center border-b border-slate-50">
          <div className="relative group mb-4">
            <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-slate-100 shadow-sm bg-slate-100 flex items-center justify-center transform group-hover:rotate-3 transition-transform">
              <img 
                src={user?.avatar || PLACEHOLDER_IMAGE_DATA_URI} 
                alt={user?.name || "User Profile"} 
                className="w-full h-full object-cover"
                onError={(e) => { 
                  const target = e.target as HTMLImageElement;
                  target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=ff5a5f&color=fff&size=128&bold=true`; 
                }}
              />
            </div>
            <button className="absolute -bottom-1 -right-1 bg-[#ff5a5f] p-2 rounded-xl text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all transform hover:scale-110">
              <Camera size={14} />
            </button>
          </div>
          <h2 className="text-lg font-black text-slate-800">{user?.name}</h2>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{user?.phone?.trim() || "—"}</p>
        </div>

        <nav className="flex-1 p-6 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as Tab)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-2xl font-bold transition-all ${
                activeTab === item.id 
                ? "bg-[#ff5a5f] text-white shadow-lg shadow-[#ff5a5f]/20 transform -translate-y-0.5" 
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <span className={activeTab === item.id ? "text-white" : "text-slate-400"}>
                {item.icon}
              </span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <button 
            onClick={() => { logout(); router.push('/'); }}
            className="w-full flex items-center justify-center space-x-3 px-4 py-3.5 rounded-2xl font-black text-[#ff5a5f] hover:bg-red-50 transition-all text-[11px] uppercase tracking-widest"
          >
            <LogOut size={16} />
            <span>{"Log Out"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto custom-scrollbar bg-slate-50">
        <div className="max-w-[1000px] mx-auto w-full p-6 lg:p-12">
          
          {/* TAB: BOOKINGS */}
          {activeTab === "bookings" && (
            <div className="animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    {"My Reservations"}
                  </h1>
                  <p className="text-slate-400 font-bold text-sm">
                    {"Manage your appointments and download your invoices"}
                  </p>
                </div>
              </div>

              <div className="mb-12 space-y-6">
                <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">{"UPCOMING RESERVATIONS"}</h3>
                {ongoingReservations.length > 0 ? (
                  ongoingReservations.map((res) => (
                    <div key={res.id} className="bg-white border-2 border-slate-100 rounded-3xl p-6 md:p-8 text-slate-900 shadow-md flex flex-col md:flex-row justify-between items-center group cursor-pointer hover:shadow-lg transition-all relative overflow-hidden hover:border-[#ff5a5f]/20">
                      <div className="flex items-start gap-6 md:gap-8 relative z-10 w-full md:w-auto">
                        <div className="w-20 h-20 bg-[#ff5a5f]/10 rounded-2xl flex flex-col items-center justify-center font-black border border-[#ff5a5f]/25 shrink-0 overflow-hidden">
                          <img src={res.img} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-black text-xl md:text-2xl leading-tight text-slate-900">{res.serviceName}</h4>
                            <span className="text-[10px] font-black text-[#ff5a5f] bg-[#ff5a5f]/5 px-3 py-1 rounded-lg border border-[#ff5a5f]/20">#{res.refNumber}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-600 mt-1">{res.venueName} • {res.time}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-4">
                            {/* Status Badge */}
                            {res.status === "pending" && (
                              <span className="bg-amber-50 text-amber-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200 flex items-center gap-1.5">
                                <Clock size={11} /> Awaiting Approval
                              </span>
                            )}
                            {res.status === "confirmed" && (
                              <span className="bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-200 flex items-center gap-1.5">
                                <CheckCircle size={11} /> Confirmed
                              </span>
                            )}
                            {res.status === "paid" && (
                              <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-blue-200 flex items-center gap-1.5">
                                <CreditCard size={11} /> Paid
                              </span>
                            )}
                            {res.status === "rescheduled" && (
                              <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-200 flex items-center gap-1.5">
                                <RefreshCcw size={11} /> Rescheduled
                              </span>
                            )}
                            {res.customerName && (
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-slate-200">
                                {"For: "}
                              </span>
                            )}
                            {res.staffName && (
                              <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-slate-200">
                                {"Pro: "}
                              </span>
                            )}
                            {res.phone && (
                              <span className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wide"><Phone size={14} className="text-[#ff5a5f]" /> {res.phone}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right mt-6 md:mt-0 relative z-10 w-full md:w-auto shrink-0">
                        <div className="text-3xl md:text-4xl font-black text-slate-900 mb-3">{res.price}</div>
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedRes(res);
                            setIsResModalOpen(true);
                          }}
                          className="text-xs font-black uppercase tracking-widest bg-[#ff5a5f] text-white px-8 py-3 rounded-2xl hover:bg-[#e0484d] transition-colors shadow-md"
                        >
                          {"See Details"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-medium text-slate-500">{"No upcoming reservations."}</p>
                )}
              </div>

              <div ref={historyRef}>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">{"APPOINTMENT HISTORY"}</h3>
                <div className="space-y-6">
                  {historyReservations.length === 0 && (
                    <p className="text-sm text-slate-500">{"No past appointments yet."}</p>
                  )}
                  {historyReservations.map((res) => (
                    <div key={res.id} className="bg-white border border-slate-200 rounded-[40px] p-8 flex flex-col md:flex-row justify-between items-center hover:shadow-2xl hover:shadow-slate-200/50 transition duration-500 shadow-sm group">
                      <div className="flex items-center space-x-8">
                        <div className="w-20 h-20 rounded-[28px] overflow-hidden border-2 border-slate-50 relative shrink-0">
                           <img 
                             src={res.img} 
                             alt={res.venueName} 
                             className="w-full h-full object-cover group-hover:scale-110 transition duration-700" 
                           />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-slate-800 text-xl group-hover:text-[#ff5a5f] transition-colors">{res.venueName}</h4>
                            <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">#{res.refNumber}</span>
                          </div>
                          <p className="text-base font-bold text-slate-400 mt-1">{res.serviceName} • {res.date}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                             <div className="flex items-center gap-2">
                                {res.status === "completed" && (
                                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-green-200 flex items-center gap-1.5">
                                    <CheckCircle size={11} /> Completed
                                  </span>
                                )}
                                {res.status === "cancelled" && (
                                  <span className="bg-red-50 text-red-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-red-200 flex items-center gap-1.5">
                                    <X size={11} /> Cancelled
                                  </span>
                                )}
                                {(res.status === "confirmed" || res.status === "pending") && (
                                  <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border border-amber-200 flex items-center gap-1.5">
                                    <Clock size={11} /> {res.status === "pending" ? ("Pending") : ("Confirmed")}
                                  </span>
                                )}
                             </div>
                             {res.customerName && (
                                <span className="text-[9px] font-black text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                   {"For: "}
                                </span>
                             )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end mt-4 md:mt-0">
                         <div className="font-black text-slate-800 text-2xl mb-3">{res.price}</div>
                         <div className="flex flex-wrap justify-end gap-3">
                            <button 
                              onClick={() => { setSelectedRes(res); setIsResModalOpen(true); setPaymentView("none"); }} 
                              className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 bg-slate-50 px-4 py-2 rounded-xl transition"
                            >
                               {"Details"}
                            </button>
                            <button onClick={() => handleDownloadInvoice(res)} className="p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition">
                               <Download size={18} />
                            </button>
                             {res.status === "completed" && !res.isReviewed && (
                               <button 
                                 onClick={() => { setSelectedRes(res); setIsReviewModalOpen(true); }}
                                 className="text-[10px] font-black text-amber-600 uppercase tracking-widest hover:bg-amber-100 bg-amber-50 px-4 py-2 rounded-xl transition border border-amber-100"
                               >
                                  {"Rate"}
                               </button>
                             )}
                            <button 
                              onClick={() => { if (res.businessId) router.push(`/venue/${res.businessId}`); }}
                              className="text-xs font-black text-[#ff5a5f] uppercase tracking-widest hover:underline flex items-center gap-1 bg-[#ff5a5f]/5 px-6 py-3 rounded-2xl hover:bg-[#ff5a5f]/10 transition-all transform hover:-translate-y-1"
                            >
                                {"Re-book"}
                                <ChevronRight size={14} />
                            </button>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
                {historyTotalPages > 1 && (
                  <div className="mt-10">
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
            </div>
          )}

          {/* TAB: FAMILY */}
          {activeTab === "family" && (
            <div className="animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900">{"Family & Friends"}</h2>
                    <p className="text-slate-400 font-bold text-sm mt-1">
                      {"Manage appointments for your inner circle"}
                    </p>
                 </div>
                 <button 
                  onClick={() => { setEditingMember(null); setIsFamilyModalOpen(true); }}
                  className="bg-[#ff5a5f] text-white font-black px-6 py-3 rounded-2xl text-sm shadow-xl shadow-[#ff5a5f]/20 hover:bg-[#e0484d] transition flex items-center gap-2 transform hover:-translate-y-1"
                 >
                    <Plus size={18} /> Add Member
                 </button>
               </div>
               
               {familyMembers.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center py-32 bg-white rounded-[40px] border-2 border-dashed border-slate-200 text-center px-10">
                    <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
                       <Users size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3">{"No members added yet"}</h3>
                    <p className="text-slate-500 max-w-sm mb-10 font-medium leading-relaxed">
                      Add your children, partner, or friends to schedule services for them quickly.
                    </p>
                    <button 
                      onClick={() => setIsFamilyModalOpen(true)}
                      className="text-[#ff5a5f] font-black text-sm uppercase tracking-widest hover:underline"
                    >
                      {"Get started now"}
                    </button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm flex justify-between items-center group hover:shadow-xl hover:shadow-slate-200/50 transition duration-500">
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 bg-slate-100 rounded-[20px] flex items-center justify-center text-[#ff5a5f] font-black text-2xl border-2 border-white shadow-sm group-hover:bg-[#ff5a5f] group-hover:text-white transition-colors duration-500">
                             {member.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="font-black text-slate-800 text-lg group-hover:text-[#ff5a5f] transition-colors">{member.name}</h4>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
                                {member.age} años • {member.gender}
                                {member.email ? ` • ${member.email}` : ""}
                              </p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button 
                            onClick={() => { setEditingMember(member); setIsFamilyModalOpen(true); }}
                            className="p-3 text-slate-400 hover:text-[#ff5a5f] hover:bg-[#ff5a5f]/5 rounded-2xl transition-all"
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
                            className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
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
                    <h2 className="text-2xl font-black text-slate-900">{"Profile & Settings"}</h2>
                    <p className="text-slate-400 font-bold text-sm mt-1">{"Update your personal information"}</p>
                  </div>
                  <button type="submit" disabled={isUpdatingProfile} className="bg-slate-900 text-white font-black px-8 py-3 rounded-2xl text-sm shadow-xl hover:bg-slate-800 transition transform hover:-translate-y-1 disabled:opacity-50">
                    {isUpdatingProfile ? ("Saving...") : ("Save Changes")}
                  </button>
                </div>

                <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm space-y-10">
                  <div className="flex items-center gap-8 pb-10 border-b border-slate-100">
                     <div className="relative group" onClick={() => fileInputRef.current?.click()}>
                        <div className="w-24 h-24 rounded-[32px] overflow-hidden border-4 border-slate-50 shadow-lg">
                            <img 
                              src={avatarPreview || user?.avatar || PLACEHOLDER_IMAGE_DATA_URI} 
                              alt="User" 
                              className="w-full h-full object-cover" 
                              onError={(e) => { 
                                const target = e.target as HTMLImageElement;
                                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=ff5a5f&color=fff&size=128&bold=true`; 
                              }}
                            />
                        </div>
                        <div className="absolute inset-0 bg-black/40 rounded-[32px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 cursor-pointer">
                           <Camera className="text-white" size={24} />
                        </div>
                     </div>
                     <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />
                     <div>
                       <h3 className="font-black text-slate-800 text-xl">{user?.name}</h3>
                       <p className="text-slate-400 font-bold text-sm">
                         {"Member since November 2023"}
                       </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{"Full Name"}</label>
                        <div className="relative">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="text" name="name" defaultValue={user?.name} required className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold text-slate-800" />
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{"Phone"}</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                          <input type="text" name="phone" defaultValue={user?.phone ?? ""} className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold text-slate-800" />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{"Email Address"}</label>
                     <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="email" name="email" defaultValue={user?.email} required className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 pl-12 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold text-slate-800" />
                     </div>
                  </div>
                </div>
              </form>

              <form onSubmit={handleUpdatePassword} className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm mt-8">
                <div>
                  <div className="flex items-center gap-4 mb-10">
                     <div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg shadow-slate-200">
                        <Lock size={22} />
                     </div>
                     <div>
                        <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{"Change Password"}</h3>
                        <p className="text-slate-400 font-bold text-xs mt-1">
                          {"Protect your account with a secure password"}
                        </p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{"Current Password"}</label>
                      <input type="password" name="currentPassword" required placeholder="••••••••" className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{"New Password"}</label>
                      <input type="password" name="newPassword" required placeholder="••••••••" className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{"Confirm Password"}</label>
                      <input type="password" name="confirmPassword" required placeholder="••••••••" className="w-full border-2 border-slate-50 bg-slate-50/50 p-4 rounded-2xl focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all font-bold" />
                    </div>
                  </div>
                  
                  <div className="mt-10 flex justify-end">
                    <button type="submit" disabled={isUpdatingPassword} className="bg-[#ff5a5f] text-white font-black px-10 py-4 rounded-[20px] text-xs uppercase tracking-widest shadow-xl shadow-[#ff5a5f]/20 hover:bg-[#e0484d] transition transform hover:-translate-y-1 disabled:opacity-50">
                       {isUpdatingPassword ? ("Updating...") : ("Update Password")}
                    </button>
                  </div>
                </div>
              </form>

              <div className="bg-white rounded-[40px] p-10 border border-slate-200 shadow-sm">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-2">
                  {"Notifications"}
                </h3>
                <p className="text-slate-400 font-bold text-xs mb-6">
                  {language === "en"
                    ? "Booking updates are sent by email only."
                    : "Las actualizaciones de reservas se envían solo por correo electrónico."}
                </p>
                <label className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-5 py-4 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Mail className="text-[#ff5a5f]" size={20} />
                    <span className="text-sm font-bold text-slate-800">
                      {"Email notifications"}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-[#ff5a5f] focus:ring-[#ff5a5f]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB: FAVORITES */}
          {activeTab === "favorites" && (
            <div className="animate-in fade-in duration-500">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    {"My Favorite Places"}
                  </h1>
                  <p className="text-slate-400 font-bold text-sm">
                    {"Your preferred locations in one place"}
                  </p>
                </div>
                <div className="bg-white px-8 py-4 rounded-[28px] shadow-sm border border-slate-100 flex items-center gap-4">
                   <Heart className="text-[#ff5a5f]" size={24} fill="#ff5a5f" />
                   <span className="font-black text-slate-800 text-sm uppercase tracking-widest">{favoritesList.length} Places</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {favoritesList.length === 0 ? (
                  <p className="text-sm text-slate-500 col-span-full text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-slate-100 font-bold">
                    {"No favorites yet."}
                  </p>
                ) : (
                  favoritesList.map((biz: any) => {
                    const bId = biz.businessId;
                    const src = businessListingImageSrc(biz.business || biz);
                    return (
                      <div 
                        key={bId}
                        tabIndex={0}
                        onClick={() => router.push(`/venue/${bId}`)}
                        className="bg-white border border-slate-200 rounded-[48px] p-6 flex flex-col sm:flex-row gap-8 hover:shadow-2xl hover:shadow-slate-200/50 transition duration-700 cursor-pointer group shadow-sm relative overflow-hidden"
                      >
                        <div className="w-full sm:w-40 h-40 rounded-[32px] overflow-hidden flex-shrink-0 relative border-2 border-white shadow-xl bg-slate-100">
                           <img 
                             src={src} 
                             alt={biz.name} 
                             className="w-full h-full object-cover group-hover:scale-125 transition duration-1000" 
                           />
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (bId) handleRemoveFavorite(bId);
                            }}
                            className="absolute top-3 right-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl text-[#ff5a5f] shadow-lg transform hover:scale-110 transition border border-slate-100"
                          >
                             <Heart size={20} fill="#ff5a5f" />
                          </button>
                        </div>
                        <div className="flex flex-col justify-center py-2">
                           <h3 className="text-2xl font-black text-slate-900 group-hover:text-[#ff5a5f] transition-colors mb-2">{biz.name}</h3>
                           <div className="flex items-center gap-2 text-slate-400 font-bold text-sm mb-4">
                              <MapPin size={16} />
                              <span>{biz.locationLabel || "Location unavailable"}</span>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="flex items-center bg-[#ff5a5f]/5 px-4 py-2 rounded-2xl border border-[#ff5a5f]/10">
                                 <Star size={16} fill="#ff5a5f" className="text-[#ff5a5f] mr-2" />
                                 <span className="font-black text-[#ff5a5f] text-sm">{biz.rating || "4.8"}</span>
                              </div>
                              <button className="text-slate-400 hover:text-slate-900 transition-colors">
                                 <ChevronRight size={24} />
                              </button>
                           </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB: INVOICES */}
          {activeTab === "invoices" && (
            <div className="animate-in fade-in duration-500">
               <div className="flex justify-between items-center mb-10">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900">{"My Invoices"}</h2>
                    <p className="text-slate-400 font-bold text-sm mt-1">
                      {"Payment history and tax receipts"}
                    </p>
                 </div>
                 <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
                    <Download className="text-slate-400" size={20} />
                    <span className="font-black text-slate-800 text-xs uppercase tracking-widest">{invoicesList.length} total</span>
                 </div>
               </div>

               <div className="bg-white rounded-[48px] border border-slate-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] whitespace-nowrap">{"Invoice"}</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{"Venue"}</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{"Date"}</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">{"Amount"}</th>
                        <th className="px-6 py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {invoicesList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-bold italic">
                            {"No invoices yet."}
                          </td>
                        </tr>
                      ) : (
                        invoicesList.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 transition duration-300 group">
                            <td className="px-6 py-5 text-center whitespace-nowrap">
                               <span className="font-bold text-slate-800 text-sm">{inv.number || `INV-${String(inv.id || "").slice(0,6).toUpperCase()}`}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                               <span className="font-semibold text-slate-600 text-sm line-clamp-2">{inv.venueName || inv.business?.name || "Venue"}</span>
                            </td>
                            <td className="px-6 py-5 text-center whitespace-nowrap">
                               <span className="font-bold text-slate-400">
                                 {(() => {
                                   const raw = inv.issuedDate || inv.date || inv.createdAt;
                                   if (!raw) return "—";
                                   const d = new Date(raw);
                                   return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
                                 })()}
                               </span>
                            </td>
                            <td className="px-6 py-5 text-center whitespace-nowrap">
                               <span className="font-bold text-slate-900">${Number(inv.total || 0).toFixed(2)}</span>
                            </td>
                            <td className="px-6 py-5 text-center">
                               <button onClick={() => handleDownloadInvoice(inv)} className="bg-slate-900 text-white p-3 rounded-2xl shadow-lg hover:bg-slate-800 hover:scale-110 transition transform active:scale-95">
                                  <Download size={18} />
                               </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
               </div>
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
        </div>
      </main>

      {/* Reservation Detail Modal */}
      {isResModalOpen && selectedRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsResModalOpen(false)} />
          <div className="relative w-full max-w-5xl bg-white rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <button 
                onClick={() => setIsResModalOpen(false)} 
                className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition text-sm"
              >
                <ChevronLeft size={20} />
                {"Back"}
              </button>
              <div className="flex flex-col items-center">
                <h2 className="text-sm font-black text-slate-950 uppercase tracking-widest">{selectedRes.venueName}</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{selectedRes.refNumber}</span>
              </div>
              <button 
                onClick={() => setIsResModalOpen(false)} 
                className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-905 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Inner Content Scroller */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-50/50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT: Details */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white rounded-[32px] border border-slate-100 overflow-hidden shadow-sm">
                    <div className="h-52 relative">
                      <img src={selectedRes.img} className="w-full h-full object-cover" alt={selectedRes.venueName} />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                      <div className="absolute bottom-6 left-8 right-6">
                         <h3 className="text-2xl font-black text-white">{selectedRes.venueName}</h3>
                         <p className="text-white/80 font-bold text-xs flex items-center gap-2 mt-1.5">
                            <MapPin size={14} className="text-white/90" />
                            {selectedRes.address || "Location Label"}
                         </p>
                      </div>
                    </div>

                    <div className="p-8 space-y-8">
                       <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100/80">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#ff5a5f] shadow-sm border border-slate-100">
                                <Calendar size={22} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{"Date & Time"}</p>
                                <p className="font-black text-slate-800 text-sm">{selectedRes.date} at {selectedRes.time}</p>
                             </div>
                          </div>
                          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            selectedRes.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                            selectedRes.status === 'paid' ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' :
                            selectedRes.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                            selectedRes.status === 'rescheduled' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            selectedRes.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                            'bg-red-50 text-red-500 border border-red-100'
                          }`}>
                            {selectedRes.status === 'confirmed' ? ('Awaiting Payment') :
                             selectedRes.status === 'paid' ? ('Paid') :
                             selectedRes.status === 'completed' ? ('Completed') :
                             selectedRes.status === 'rescheduled' ? ('Rescheduled') :
                             selectedRes.status === 'pending' ? ('Pending') :
                             selectedRes.status === 'cancelled' ? ('Cancelled') :
                             selectedRes.status}
                          </div>
                       </div>

                       <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{"Service Details"}</h4>
                          <div className="space-y-3.5">
                             {selectedRes.items.map((item) => (
                               <div key={item.id} className="flex justify-between items-center p-5 rounded-2xl bg-white border border-slate-100 hover:border-[#ff5a5f]/20 transition-all shadow-sm">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-[#ff5a5f] font-black text-lg border border-slate-100 shrink-0">
                                        {item.name.charAt(0)}
                                     </div>
                                     <div>
                                        <h5 className="font-black text-slate-800 text-sm">{item.name}</h5>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                           {item.customerName || selectedRes.customerName || "Customer"} • {item.staffName || "Staff"}
                                        </p>
                                     </div>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0">
                                     <span className="font-black text-slate-900 text-sm">${item.price}</span>
                                     {item.status === 'confirmed' && (
                                       <button 
                                         onClick={() => handleCancelReservation(item.id)}
                                         className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-red-100 transition"
                                       >
                                          {"Cancel"}
                                       </button>
                                     )}
                                     {item.status === 'completed' && item.isReviewed && (
                                       <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                                          <CheckCircle2 size={12} />
                                          {"Reviewed"}
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
                   <div className="bg-white rounded-[32px] border border-slate-100 p-6 md:p-8 shadow-sm">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5">{"Payment Summary"}</h4>
                      
                      <div className="space-y-3.5">
                         <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">{"Subtotal"}</span>
                            <span className="font-black text-slate-700">${selectedRes.subtotal.toFixed(2)}</span>
                         </div>
                         <div className="flex justify-between items-center text-xs">
                            <span className="font-bold text-slate-400">{"Tax"}</span>
                            <span className="font-black text-slate-700">${selectedRes.taxAmount.toFixed(2)}</span>
                         </div>
                         <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex justify-between items-center">
                            <span className="text-sm font-black text-slate-900">{"Total"}</span>
                            <span className="text-2xl font-black text-[#ff5a5f]">${selectedRes.totalPrice.toFixed(2)}</span>
                         </div>
                      </div>

                      {paymentView === "none" && selectedRes.status === "confirmed" && (
                        <div className="mt-6 space-y-4">
                           <div className="p-4 bg-emerald-50/70 border border-emerald-100/80 rounded-2xl text-[10px] font-bold text-emerald-800">
                              <p className="font-black uppercase tracking-widest mb-1">{"Approved"}</p>
                              <p className="text-emerald-700/90 font-medium">{"Your booking is approved. Please pay online to confirm."}</p>
                           </div>
                           <button 
                             onClick={() => setPaymentView("select")}
                             className="w-full bg-[#ff5a5f] hover:bg-[#e0484d] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-[#ff5a5f]/15 transition-all transform active:scale-95"
                           >
                             {"Pay Online Now"}
                           </button>
                        </div>
                      )}

                      {paymentView === "none" && selectedRes.status === "rescheduled" && (
                        <div className="mt-6 space-y-4">
                           <div className="p-4 bg-amber-50/70 border border-amber-100/80 rounded-2xl text-[10px] font-bold text-amber-800">
                              <p className="font-black uppercase tracking-widest mb-1">{"Reschedule Proposed"}</p>
                              <p className="text-amber-700/90 font-medium">{"The venue has proposed a new time. Do you accept?"}</p>
                           </div>
                           <button 
                             onClick={handleAcceptReschedule}
                             disabled={payingLoading}
                             className="w-full bg-[#ff5a5f] hover:bg-[#e0484d] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-[#ff5a5f]/15 transition-all flex items-center justify-center gap-2"
                           >
                             {payingLoading && <Loader2 className="animate-spin text-white" size={14} />}
                             {"Accept New Time"}
                           </button>
                        </div>
                      )}

                      {paymentView === "none" && selectedRes.status === "paid" && (
                         <div className="mt-6 space-y-4">
                            <div className="p-4 bg-cyan-50/70 border border-cyan-100/80 rounded-2xl text-[10px] font-bold text-cyan-800">
                               <p className="font-black uppercase tracking-widest mb-1">{"Payment Confirmed"}</p>
                               <p className="text-cyan-700/90 font-medium">{"Your appointment is ready. Mark as completed after the service."}</p>
                            </div>
                            <button 
                              onClick={handleMarkCompletedGroup}
                              disabled={payingLoading}
                              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                              {payingLoading && <Loader2 className="animate-spin text-white" size={14} />}
                              {"Mark as Completed"}
                            </button>
                         </div>
                       )}

                       {selectedRes.status === "completed" && !selectedRes.isReviewed && (
                         <div className="mt-6 space-y-4">
                            <div className="p-4 bg-blue-50/70 border border-blue-100/80 rounded-2xl text-[10px] font-bold text-blue-800 text-center">
                               <p className="font-black uppercase tracking-widest mb-1">{"Service Completed"}</p>
                               <p className="text-blue-700/90 font-medium">{"How was your experience today?"}</p>
                            </div>
                            <button 
                              onClick={() => { setIsResModalOpen(false); setIsReviewModalOpen(true); }}
                              className="w-full bg-[#ff5a5f] hover:bg-[#e0484d] text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-[#ff5a5f]/15 transition-all transform active:scale-95"
                            >
                              {"Rate Experience"}
                            </button>
                         </div>
                       )}

                      {paymentView === "none" && selectedRes.status === "pending" && (
                         <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{"Waiting for Venue"}</p>
                         </div>
                      )}

                      {paymentView === "select" && (
                         <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                type="button"
                                onClick={() => setPayMethod("card")}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-colors ${
                                  payMethod === "card" ? "border-[#ff5a5f] bg-[#ff5a5f]/5" : "border-slate-100 hover:border-slate-200"
                                }`}
                              >
                                <CreditCard className="text-[#ff5a5f]" size={22} />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                  {"Card"}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setPayMethod("cash")}
                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1.5 transition-colors ${
                                  payMethod === "cash" ? "border-[#ff5a5f] bg-[#ff5a5f]/5" : "border-slate-100 hover:border-slate-200"
                                }`}
                              >
                                <Banknote className="text-[#ff5a5f]" size={22} />
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                                  {"Cash"}
                                </span>
                              </button>
                            </div>
                            
                            <button 
                              onClick={() => void handlePayNow(selectedRes)}
                              disabled={payingLoading}
                              className="w-full bg-slate-950 hover:bg-slate-900 text-white font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                               {payingLoading ? <Loader2 className="animate-spin text-white" size={14} /> : <Shield size={14} />}
                               {payingLoading ? ("Processing...") : ("Confirm & Pay")}
                            </button>

                            <div className="flex gap-3">
                              {selectedRes.status === 'confirmed' && (
                                <button 
                                  onClick={() => void handleCancelAllInGroup(selectedRes)}
                                  className="flex-1 bg-red-50 text-red-500 font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:bg-red-100 transition border border-red-100/80"
                                >
                                   {"Cancel All"}
                                </button>
                              )}
                              <button 
                                onClick={() => setPaymentView("none")}
                                className="flex-1 bg-white border border-slate-200 text-slate-500 font-black py-3 rounded-xl text-[9px] uppercase tracking-widest hover:bg-slate-50 transition"
                              >
                                 {"Back"}
                              </button>
                            </div>
                         </div>
                      )}

                      {paymentView === "done" && (
                         <div className="mt-6 p-5 bg-emerald-50 border border-emerald-100 rounded-2xl text-center animate-in zoom-in-95">
                            <CheckCircle className="text-emerald-500 mx-auto mb-2" size={28} />
                            <p className="font-black text-emerald-950 text-xs">{"Paid Successfully!"}</p>
                            <button 
                              onClick={() => { setIsResModalOpen(false); setActiveTab("invoices"); }}
                              className="mt-3.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest underline decoration-2 underline-offset-4"
                            >
                               {"View Invoices"}
                            </button>
                         </div>
                      )}
                   </div>

                   <div className="bg-slate-950 rounded-[32px] p-6 md:p-8 text-white shadow-xl shadow-slate-200/50">
                      <h4 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-5">{"Safety & Policy"}</h4>
                      <div className="space-y-5 text-[11px]">
                         <div className="flex gap-3.5">
                            <Shield className="text-[#ff5a5f] flex-shrink-0" size={18} />
                            <p className="font-medium text-white/80 leading-relaxed">
                               {"Secure encrypted payments powered by Rezervame."}
                            </p>
                         </div>
                         <div className="flex gap-3.5">
                            <Clock className="text-[#ff5a5f] flex-shrink-0" size={18} />
                            <p className="font-medium text-white/80 leading-relaxed">
                               {"Cancellations must be done 24h before."}
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
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setIsFamilyModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-2xl font-black text-slate-900">{editingMember ? ("Edit Member") : ("New Member")}</h3>
                <button onClick={() => setIsFamilyModalOpen(false)} className="p-3 text-slate-400 hover:text-slate-900 bg-slate-50 rounded-2xl transition"><X size={20} /></button>
             </div>
             
             <form onSubmit={handleAddFamily} className="space-y-8">
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wide ml-1">{"Full Name"}</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#ff5a5f] transition-colors">
                      <UserIcon size={18} />
                    </div>
                    <input name="name" type="text" defaultValue={editingMember?.name} required placeholder="e.g. John Doe" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-12 pr-4 font-bold text-slate-800 text-sm focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all placeholder:text-slate-400" />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wide ml-1">{"Age"}</label>
                    <input name="age" type="number" defaultValue={editingMember?.age} required placeholder="Years" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-800 text-sm focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all placeholder:text-slate-400" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-wide ml-1">Gender</label>
                    <select name="gender" defaultValue={editingMember?.gender || "Male"} className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-800 text-sm focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all appearance-none cursor-pointer">
                       <option value="Male">Male</option>
                       <option value="Female">Female</option>
                       <option value="Other">Other</option>
                    </select>
                 </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-500 uppercase tracking-wide ml-1">Email (optional)</label>
                  <input name="email" type="email" defaultValue={editingMember?.email ?? ""} placeholder="email@example.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 font-bold text-slate-800 text-sm focus:outline-none focus:border-[#ff5a5f] focus:bg-white transition-all placeholder:text-slate-400" />
               </div>
               <button type="submit" className="w-full bg-[#ff5a5f] text-white font-black py-4 rounded-2xl shadow-lg shadow-[#ff5a5f]/25 hover:bg-[#e0484d] transition-all text-xs uppercase tracking-widest mt-4">
                  {editingMember ? ("Save Changes") : ("Add Member")}
               </button>
             </form>
          </div>
        </div>
      )}
      
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl p-10 relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
              <button 
                onClick={() => setIsReviewModalOpen(false)} 
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                 <X size={24} />
              </button>

              <div className="text-center mb-10">
                 <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-amber-500/10">
                    <Star size={36} fill="currentColor" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    {"Rate Your Experience"}
                 </h2>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                    {selectedRes?.venueName}
                 </p>
              </div>

              <div className="space-y-10">
                 {/* Venue Rating */}
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-center">{"Common Venue Rating"}</label>
                    <div className="flex justify-center gap-3">
                       {[1,2,3,4,5].map((star) => (
                         <button key={star} onClick={() => setBusinessRating(star)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${businessRating >= star ? "bg-[#ff5a5f]/10 text-[#ff5a5f] shadow-sm" : "bg-slate-50 text-slate-300"}`}>
                           <Star size={24} fill={businessRating >= star ? "currentColor" : "none"} />
                         </button>
                       ))}
                    </div>
                 </div>

                 <div className="h-px bg-slate-100" />

                 {/* Individual Services */}
                 <div className="space-y-8">
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest text-center">{"Individual Service Ratings"}</h4>
                   {selectedRes?.items.filter(i => i.status === 'completed' && !i.isReviewed).map((item) => (
                     <div key={item.id} className="p-6 bg-slate-50 rounded-3xl space-y-6">
                        <div>
                           <p className="font-black text-slate-900 text-sm">{item.name}</p>
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.staffName}</p>
                        </div>

                        <div className="space-y-6">
                           <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{"Service Quality"}</p>
                              <div className="flex gap-2">
                                {[1,2,3,4,5].map((star) => (
                                  <button 
                                    key={star} 
                                    onClick={() => setServiceRatings(prev => ({ ...prev, [item.id]: star }))} 
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ (serviceRatings[item.id] || 5) >= star ? "bg-amber-100 text-amber-500 shadow-sm" : "bg-white text-slate-200 border border-slate-100"}`}
                                  >
                                    <Star size={18} fill={(serviceRatings[item.id] || 5) >= star ? "currentColor" : "none"} />
                                  </button>
                                ))}
                              </div>
                           </div>

                           <div className="space-y-3">
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{"Staff Rating"}</p>
                              <div className="flex gap-2">
                                {[1,2,3,4,5].map((star) => (
                                  <button 
                                    key={star} 
                                    onClick={() => setStaffRatings(prev => ({ ...prev, [item.id]: star }))} 
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${ (staffRatings[item.id] || 5) >= star ? "bg-cyan-100 text-cyan-600 shadow-sm" : "bg-white text-slate-200 border border-slate-100"}`}
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
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-center">Review comment (shared)</label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={"Tell us more about your visit..."}
                      className="w-full h-32 bg-slate-50 border-none rounded-3xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
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
                         "Review Submitted",
                         "Thank you for your feedback!"
                       );
                     } catch (err) {
                       toastError("Error", err instanceof Error ? err.message : "");
                     } finally {
                       setIsSubmittingReview(false);
                     }
                   }}
                   disabled={isSubmittingReview}
                   className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-[#ff5a5f] transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                 >
                    {isSubmittingReview ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} strokeWidth={3} />}
                    {isSubmittingReview ? ("Submitting...") : ("Submit All Ratings")}
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#ff5a5f] border-t-transparent rounded-full animate-spin"></div></div>}>
      <ProfileContent />
    </Suspense>
  );
}
