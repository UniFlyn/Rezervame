'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/components/I18nProvider';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { dateLocaleFor, type AppLanguage } from '@/lib/locale';
import { 
  Calendar, Clock, X, CheckCircle2, ChevronLeft, 
  MapPin, Phone, CreditCard, Banknote, Shield,
  FileText, Download, Star, Loader2, Heart, Check
} from 'lucide-react';
import { toastError, toastSuccess, toastWarning } from '@/lib/toast';
import { computeBookingTotals } from '@/lib/bookingTotals';
import {
  aggregateGroupUiStatus,
  mapBookingItemUiStatus,
  resolveBookingPaymentMethod,
} from '@/lib/paymentMethod';
import {
  reservationStatusBadgeClass,
  reservationStatusLabel,
  type ReservationUiStatus,
} from '@/lib/reservationStatus';
import {
  canCustomerCancelBooking,
  policyMessageForBooking,
  normalizeCancellationPolicy,
} from "@/lib/cancellationPolicy";

const PLACEHOLDER_IMAGE_DATA_URI = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f1f5f9'/%3E%3Cpath d='M50 40c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10-4.5-10-10-10zm0 16c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6z' fill='%23cbd5e1'/%3E%3C/svg%3E";

interface Reservation {
  id: string;
  refNumber: string;
  venueName: string;
  serviceName: string;
  customerName: string;
  staffName?: string;
  date: string;
  time: string;
  price: string;
  totalPrice: number;
  status: ReservationUiStatus;
  paymentMethod?: string;
  img: string;
  taxAmount: number;
  taxPercentage: number;
  commissionAmount: number;
  commissionPercent: number;
  subtotal: number;
  address?: string;
  phone?: string;
  isReviewed?: boolean;
  businessId?: string;
  items: {
    id: string;
    name: string;
    price: string;
    customerName?: string;
    staffName?: string;
    status: ReservationUiStatus;
    paymentMethod?: string;
    isReviewed?: boolean;
    taxAmount?: number;
    canCancel?: boolean;
    rawStatus?: string;
    appointmentAt?: string;
  }[];
  cancellationAllowed?: boolean;
  cancellationHoursBefore?: number;
  cancellationPolicyMessage?: string;
  canCancelAny?: boolean;
  transactionId?: string | null;
}

function mapUserBookingGroup(
  group: any[],
  language: AppLanguage,
  commissionPercent: number,
): Reservation {
  if (!group || group.length === 0) {
    throw new Error("Empty booking group");
  }
  const b = group[0] || {};
  const d = new Date(b.date);
  
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

  const dateLocale = dateLocaleFor(language);
  const dateStr = Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(dateLocale, { year: "numeric", month: "long", day: "numeric" });
  const timeStr = Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString(dateLocale, { hour: "numeric", minute: "2-digit" });

  const totals = computeBookingTotals(
    group,
    Number(b.business?.taxPercentage || 0),
    commissionPercent,
  );
  const cancelPolicy = normalizeCancellationPolicy(b.business);
  
  const items = group.map((item) => {
    const status = mapBookingItemUiStatus({
      status: item?.status,
      transactionId: item?.transactionId,
      paymentMethod: item?.paymentMethod,
      transaction: item?.transaction,
    });
    const appointmentAt = item?.date ? new Date(item.date) : new Date(NaN);
    const canCancel =
      item?.canCancel === true ||
      canCustomerCancelBooking({
        status: String(item?.status || ""),
        appointmentAt,
        transactionId: item?.transactionId,
        business: b.business,
      }).allowed;

    return {
      id: item?.id || Math.random().toString(),
      name: item?.service?.name || "Service",
      price: Number(item?.price || 0).toFixed(2),
      customerName: item?.customer?.name || item?.customerName || "Customer",
      staffName: item?.staff?.name || item?.staffName,
      status,
      isReviewed: item?.isReviewed || false,
      canCancel,
      rawStatus: String(item?.status || ""),
      appointmentAt: item?.date,
    };
  });

  const mainStatus = aggregateGroupUiStatus(items.map((i) => i.status));
  const paymentMethod = resolveBookingPaymentMethod({
    paymentMethod: b.paymentMethod,
    transaction: b.transaction,
  });

  return {
    id: b.id || "unknown",
    refNumber,
    venueName: b.business?.name || "—",
    serviceName: group.length > 1 ? `${group.length} Services` : (b.service?.name || "—"),
    customerName: b.customer?.name || b.customerName || "Customer",
    staffName: b.staff?.name || b.staffName,
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
    isReviewed: items.every(i => i.isReviewed),
    address: b.business?.address || "",
    phone: b.business?.phone,
    items,
    businessId: b.businessId,
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
      language,
    ),
    canCancelAny: items.some((i) => i.canCancel),
    transactionId: b.transactionId ?? null,
  };
}

export default function ReservationClient() {
  const params = useParams();
  const [id, setId] = useState(params.id);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split('/');
      if (parts.length >= 3 && parts[1] === 'reservation' && parts[2] !== 'default') {
        setId(parts[2]);
      }
    }
  }, []);
  const router = useRouter();
  const { language } = useI18n();
  const { isLoggedIn, isHydrated } = useAuth() as any;
  const [loading, setLoading] = useState(true);
  const [res, setRes] = useState<Reservation | null>(null);
  const [defaultCommission, setDefaultCommission] = useState(15);
  const [paymentView, setPaymentView] = useState<"none" | "select" | "done">("none");
  const [payingLoading, setPayingLoading] = useState(false);

  // For Rating
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [staffRating, setStaffRating] = useState(5);
  const [businessRating, setBusinessRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [serviceRatings, setServiceRatings] = useState<Record<string, number>>({});
  const [staffRatings, setStaffRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isHydrated && !isLoggedIn) {
      router.push("/");
      return;
    }
    if (isHydrated && isLoggedIn && id) {
      loadGroup();
    }
  }, [isHydrated, isLoggedIn, id]);

  async function loadGroup() {
    setLoading(true);
    try {
      if (id === 'default') {
        setLoading(false);
        return;
      }
      let commissionPct = defaultCommission;
      try {
        const cfg = await apiGet<{ defaultCommission?: number }>("/public/payment-config");
        if (typeof cfg?.defaultCommission === "number") {
          commissionPct = cfg.defaultCommission;
          setDefaultCommission(cfg.defaultCommission);
        }
      } catch {
        /* use cached default */
      }
      const data = await apiGet(`/mobile/bookings/${id}/group`, "USER");
      if (Array.isArray(data) && data.length > 0) {
        setRes(mapUserBookingGroup(data, language, commissionPct));
      } else {
        toastError("Not found", "Reservation not found.");
        router.push("/profile?tab=bookings");
      }
    } catch (e) {
      console.error("Failed to load reservation:", e);
      toastError("Error", e instanceof Error ? e.message : "Could not load reservation details.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePayNow(payAtVenue = false) {
    if (!res) return;
    setPayingLoading(true);
    try {
      const bookingIds = res.items
        .filter((i) => i.status === "confirmed" || i.status === "rescheduled")
        .map((i) => i.id);
      if (bookingIds.length === 0) {
        toastWarning("Already processed", "No services awaiting payment.");
        return;
      }
      if (!payAtVenue) {
        toastWarning(
          "Card & Yappy",
          "Online payment is not available yet. Choose pay by visit or try again later.",
        );
        return;
      }
      setPaymentView("done");
      toastSuccess(
        "Pay by visit",
        "Bring payment to your appointment. The venue will confirm when you arrive.",
      );
      loadGroup();
    } catch (e) {
      toastError("Payment failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setPayingLoading(false);
    }
  }

  async function handleCancelReservation(bookingId: string) {
    if (!confirm("Are you sure you want to cancel this service?")) return;
    try {
      await apiPatch(`/mobile/bookings/${bookingId}/cancel`, {}, "USER");
      toastSuccess("Service cancelled");
      loadGroup();
    } catch (e) {
      toastError("Cancellation failed", e instanceof Error ? e.message : "Please try again later.");
    }
  }

  async function handleCancelAllInGroup(group: Reservation) {
    const ids = group.items.filter((i) => i.canCancel).map((i) => i.id);
    if (ids.length === 0) return;
    if (!confirm("Are you sure you want to cancel ALL services in this reservation?")) return;
    try {
      await apiPost("/mobile/bookings/cancel-group", { bookingIds: ids }, "USER");
      toastSuccess("All services cancelled");
      loadGroup();
    } catch (e) {
      toastError("Cancellation failed", e instanceof Error ? e.message : "Please try again later.");
    }
  }

  const handleMarkCompletedGroup = async () => {
    try {
      setPayingLoading(true);
      for (const item of res?.items || []) {
        await apiPost(`/mobile/bookings/${item.id}/complete`, {}, "USER");
      }
      toastSuccess("Appointment completed");
      loadGroup();
    } catch (err) {
      toastError("Error", err instanceof Error ? err.message : "Failed to complete");
    } finally {
      setPayingLoading(false);
    }
  };

  const handleAcceptReschedule = async () => {
    try {
      setPayingLoading(true);
      for (const item of res?.items || []) {
        await apiPost(`/mobile/bookings/${item.id}/accept-reschedule`, {}, "USER");
      }
      toastSuccess("New time accepted");
      loadGroup();
    } catch (err) {
      toastError("Error", err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setPayingLoading(false);
    }
  };

  const handleOpenRateModal = (bookingId: string) => {
    setRatingBookingId(bookingId);
    setStaffRating(5);
    setBusinessRating(5);
    setReviewComment("");
    
    // Initialize grouped ratings
    const initialService: Record<string, number> = {};
    const initialStaff: Record<string, number> = {};
    res?.items.forEach(item => {
      if (item.status === 'completed' && !item.isReviewed) {
        initialService[item.id] = 5;
        initialStaff[item.id] = 5;
      }
    });
    setServiceRatings(initialService);
    setStaffRatings(initialStaff);
    
    setIsRateModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!res) return;
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

      toastSuccess("Reviews Submitted");
      setIsRateModalOpen(false);
      loadGroup(); // Refresh
    } catch (err) {
      toastError("Error", err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (!res) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-bold transition">
            <ChevronLeft size={20} />
            {"Back"}
          </button>
          <div className="flex flex-col items-center">
             <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest">{res.venueName}</h1>
             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">#{res.refNumber}</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT: Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
              <div className="h-56 relative">
                <img src={res.img} className="w-full h-full object-cover" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-6 left-8">
                   <h2 className="text-2xl font-black text-white">{res.venueName}</h2>
                   <p className="text-white/80 font-bold text-sm flex items-center gap-2 mt-1">
                      <MapPin size={14} />
                      {res.address}
                   </p>
                </div>
              </div>

              <div className="p-10 space-y-8">
                 <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm">
                          <Calendar size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{"Date & Time"}</p>
                          <p className="font-black text-slate-800">{res.date} at {res.time}</p>
                       </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${reservationStatusBadgeClass(res.status)}`}>
                      {reservationStatusLabel(res.status, language)}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{"Service Details"}</h3>
                    <div className="space-y-4">
                       {res.items.map((item) => (
                         <div key={item.id} className="flex justify-between items-center p-6 rounded-3xl bg-white border border-slate-100 hover:border-primary/20 transition-all shadow-sm">
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-primary font-black text-lg border border-slate-100">
                                  {item.name.charAt(0)}
                               </div>
                               <div>
                                  <h4 className="font-black text-slate-800">{item.name}</h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                     {item.customerName} • {item.staffName || "Staff"}
                                  </p>
                               </div>
                            </div>
                            <div className="flex items-center gap-6">
                               <span className="font-black text-slate-900">${item.price}</span>
                               {item.status === 'paid' && (
                                 <span className="text-[10px] font-black text-cyan-600 uppercase tracking-widest flex items-center gap-1">
                                   <CreditCard size={12} />
                                   {"Paid"}
                                 </span>
                               )}
                               {item.status === 'cash_at_venue' && (
                                 <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
                                   <Banknote size={12} />
                                   {"Pay at Venue"}
                                 </span>
                               )}
                               {item.canCancel && (
                                 <button 
                                   onClick={() => handleCancelReservation(item.id)}
                                   className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition"
                                 >
                                    {"Cancel"}
                                 </button>
                               )}
                                 {item.status === 'completed' && item.isReviewed && (
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
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
             <div className="bg-white rounded-[40px] border border-slate-200 p-8 shadow-sm">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{"Payment Summary"}</h3>
                
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-400">{"Services"}</span>
                      <span className="text-sm font-black text-slate-600">${res.subtotal.toFixed(2)}</span>
                   </div>
                   {res.commissionAmount > 0 && (
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-slate-400">
                          {`Service fee (${res.commissionPercent}%)`}
                        </span>
                        <span className="text-sm font-black text-slate-600">${res.commissionAmount.toFixed(2)}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-400">
                        {res.taxPercentage > 0
                          ? `Tax (${res.taxPercentage}%)`
                          : "Tax"}
                      </span>
                      <span className="text-sm font-black text-slate-600">${res.taxAmount.toFixed(2)}</span>
                   </div>
                   <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-lg font-black text-slate-900">{"Total"}</span>
                      <span className="text-3xl font-black text-primary">${res.totalPrice.toFixed(2)}</span>
                   </div>
                </div>

                {paymentView === "none" && res.status === "confirmed" && (
                  <div className="mt-8 space-y-4">
                     <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">{"Approved"}</p>
                        <p className="text-emerald-700 text-[10px] font-medium">{"Your booking is approved. Please pay online to confirm."}</p>
                     </div>
                     <button 
                       onClick={() => setPaymentView("select")}
                       className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all transform active:scale-95"
                     >
                       {"Pay Online Now"}
                     </button>
                  </div>
                )}

                {paymentView === "none" && res.status === "rescheduled" && (
                  <div className="mt-8 space-y-4">
                     <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">{"Reschedule Proposed"}</p>
                        <p className="text-amber-700 text-[10px] font-medium">{"The venue has proposed a new time. Do you accept?"}</p>
                     </div>
                     <button 
                       onClick={handleAcceptReschedule}
                       disabled={payingLoading}
                       className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                     >
                       {payingLoading && <Loader2 className="animate-spin" size={16} />}
                       {"Accept New Time"}
                     </button>
                  </div>
                )}

                {paymentView === "none" && res.status === "paid" && (
                   <div className="mt-8 space-y-4">
                      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl">
                         <p className="text-[10px] font-black text-cyan-800 uppercase tracking-widest mb-1">{"Payment Confirmed"}</p>
                         <p className="text-cyan-700 text-[10px] font-medium">{"Your appointment is ready. Mark as completed after the service."}</p>
                      </div>
                      <button 
                        onClick={handleMarkCompletedGroup}
                        disabled={payingLoading}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        {payingLoading && <Loader2 className="animate-spin" size={16} />}
                        {"Mark as Completed"}
                      </button>
                   </div>
                 )}

                {paymentView === "none" && res.status === "cash_at_venue" && (
                   <div className="mt-8 space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                         <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">{"Pay at the venue"}</p>
                         <p className="text-amber-800 text-[10px] font-medium leading-relaxed">
                           {`Your booking is confirmed. Please bring $${res.totalPrice.toFixed(2)} in cash when you arrive.`}
                         </p>
                         <p className="text-amber-700/90 text-[10px] font-medium mt-2">
                           {"The venue will confirm your cash payment when you complete the service."}
                         </p>
                      </div>
                   </div>
                 )}

                 {res.status === "completed" && !res.isReviewed && (
                   <div className="mt-8 space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                         <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">{"Service Completed"}</p>
                         <p className="text-blue-700 text-[10px] font-medium text-center">{"How was your experience today?"}</p>
                      </div>
                      <button 
                        onClick={() => handleOpenRateModal(res.items[0]?.id || "")}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all transform active:scale-95"
                      >
                        {"Rate Experience"}
                      </button>
                   </div>
                 )}

                {paymentView === "none" && res.status === "pending" && res.canCancelAny && (
                   <div className="mt-8 space-y-4">
                      <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{"Waiting for Venue"}</p>
                         <p className="text-slate-500 text-[10px] font-medium mt-2">{res.cancellationPolicyMessage}</p>
                      </div>
                      <button
                        onClick={() => handleCancelAllInGroup(res)}
                        className="w-full bg-red-50 text-red-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition border border-red-100"
                      >
                         {"Cancel Reservation"}
                      </button>
                   </div>
                )}

                {paymentView === "select" && (
                   <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
      <p className="text-[10px] font-bold text-slate-500 text-center">
        Online payment is not available yet. Choose pay by visit to confirm how you will pay.
      </p>
                      <div className="p-5 border-2 border-primary bg-primary/5 rounded-2xl flex flex-col items-center gap-2">
                         <Banknote className="text-primary" size={24} />
                         <span className="text-[10px] font-black text-primary uppercase tracking-widest">{"Pay by visit"}</span>
                      </div>
                      
                      <button 
                        onClick={() => void handlePayNow(true)}
                        disabled={payingLoading}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                         {payingLoading ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
                         {payingLoading ? ("Processing...") : ("Confirm & Pay")}
                      </button>

                      <div className="flex gap-4">
                      {res.canCancelAny && (
                        <button 
                          onClick={() => handleCancelAllInGroup(res)}
                          className="flex-1 bg-red-50 text-red-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition border border-red-100"
                        >
                           {"Cancel All"}
                        </button>
                      )}
                      <button 
                        onClick={() => setPaymentView("none")}
                        className="flex-1 bg-white border-2 border-slate-100 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition"
                      >
                         {"Back"}
                      </button>
                   </div>
                   </div>
                )}

                {paymentView === "done" && (
                   <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center animate-in zoom-in-95">
                      <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                      <p className="font-black text-emerald-900 text-sm">{"Paid Successfully!"}</p>
                      <button 
                        onClick={() => router.push("/profile?tab=invoices")}
                        className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest underline decoration-2 underline-offset-4"
                      >
                         {"View Invoices"}
                      </button>
                   </div>
                )}
             </div>

             <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-xl shadow-slate-200">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">{"Safety & Policy"}</h3>
                <div className="space-y-6">
                   {res.status !== 'cash_at_venue' ? (
                     <div className="flex gap-4">
                        <Shield className="text-primary flex-shrink-0" size={20} />
                        <p className="text-xs font-medium text-white/80 leading-relaxed">
                           {"Secure encrypted payments powered by Rezervame."}
                        </p>
                     </div>
                   ) : (
                     <div className="flex gap-4">
                        <Banknote className="text-primary flex-shrink-0" size={20} />
                        <p className="text-xs font-medium text-white/80 leading-relaxed">
                           {"Pay when you visit. The venue confirms payment after your appointment."}
                        </p>
                     </div>
                   )}
                   <div className="flex gap-4">
                      <Clock className="text-primary flex-shrink-0" size={20} />
                      <p className="text-xs font-medium text-white/80 leading-relaxed">
                         {res.cancellationPolicyMessage ||
                           policyMessageForBooking(
                             {
                               status: res.status,
                               appointmentAt: res.items[0]?.appointmentAt ?? res.date,
                               transactionId: res.transactionId,
                               business: {
                                 cancellationAllowed: res.cancellationAllowed,
                                 cancellationHoursBefore: res.cancellationHoursBefore,
                               },
                             },
                             language,
                           )}
                      </p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </main>

      {/* Rate Modal (Reused) */}
      {isRateModalOpen && (
         <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => setIsRateModalOpen(false)} />
           <div className="relative w-full max-w-lg bg-white rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <h3 className="text-2xl font-black text-slate-900 mb-8">{"Rate Experience"}</h3>
              <div className="space-y-10">
                 {/* Venue Rating */}
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{"Common Venue Rating"}</label>
                    <div className="flex gap-3">
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
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{"Individual Service Ratings"}</h4>
                   {res?.items.filter(i => i.status === 'completed' && !i.isReviewed).map((item) => (
                     <div key={item.id} className="p-6 bg-slate-50 rounded-3xl space-y-6">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="font-black text-slate-900 text-sm">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.staffName}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
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
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Review comment (shared)</label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={"Tell us more about your visit..."}
                      className="w-full h-32 bg-slate-50 border-none rounded-3xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                 </div>

                 <button 
                   onClick={handleSubmitReview}
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
