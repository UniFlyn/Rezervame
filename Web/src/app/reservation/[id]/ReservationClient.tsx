'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { useI18n } from '@/components/I18nProvider';
import { apiGet, apiPost } from '@/lib/api';
import { 
  Calendar, Clock, X, CheckCircle2, ChevronLeft, 
  MapPin, Phone, CreditCard, Banknote, Shield,
  FileText, Download, Star, Loader2, Heart, Check
} from 'lucide-react';
import { toastError, toastSuccess } from '@/lib/toast';

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
  status: "pending" | "confirmed" | "completed" | "cancelled" | "paid" | "rescheduled";
  img: string;
  taxAmount: number;
  taxPercentage: number;
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
    status: "pending" | "confirmed" | "completed" | "cancelled" | "paid" | "rescheduled";
    isReviewed?: boolean;
    taxAmount?: number;
  }[];
}

function mapUserBookingGroup(group: any[], language: string): Reservation {
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

  const dateStr = Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString(language === "en" ? "en-US" : "es-PA", { year: "numeric", month: "long", day: "numeric" });
  const timeStr = Number.isNaN(d.getTime()) ? "—" : d.toLocaleTimeString(language === "en" ? "en-US" : "es-PA", { hour: "numeric", minute: "2-digit" });

  const subtotal = group.reduce((sum, item) => sum + Number(item?.price || 0), 0);
  const taxAmount = group.reduce((sum, item) => {
    const storedTax = Number(item?.taxAmount || 0);
    if (storedTax > 0) return sum + storedTax;
    const currentTax = (Number(item?.price || 0) * (b.business?.taxPercentage || 0)) / 100;
    return sum + currentTax;
  }, 0);
  const totalPrice = subtotal + taxAmount;
  
  const items = group.map(item => {
    const st = (item?.status || "").toLowerCase();
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
        id: item?.id || Math.random().toString(),
        name: item?.service?.name || "Service",
        price: Number(item?.price || 0).toFixed(2),
        customerName: item?.customer?.name || item?.customerName || "Customer",
        staffName: item?.staff?.name || item?.staffName,
        status,
        isReviewed: item?.isReviewed || false,
    };
  });

  const mainStatus: Reservation["status"] = items.every(i => i.status === "completed") 
    ? "completed" 
    : items.some(i => i.status === "cancelled") 
    ? "cancelled" 
    : items.every(i => i.status === "pending") 
    ? "pending" 
    : items.some(i => i.status === "rescheduled")
    ? "rescheduled"
    : items.some(i => i.status === "paid")
    ? "paid"
    : "confirmed";

  return {
    id: b.id || "unknown",
    refNumber,
    venueName: b.business?.name || "—",
    serviceName: group.length > 1 ? `${group.length} Services` : (b.service?.name || "—"),
    customerName: b.customer?.name || b.customerName || "Customer",
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
    isReviewed: items.every(i => i.isReviewed),
    address: b.business?.address || "",
    phone: b.business?.phone,
    items,
    businessId: b.businessId,
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
      const data = await apiGet(`/mobile/bookings/${id}/group`, "USER");
      if (Array.isArray(data) && data.length > 0) {
        setRes(mapUserBookingGroup(data, language));
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

  async function handlePayNow() {
    if (!res) return;
    setPayingLoading(true);
    try {
      await apiPost("/mobile/bookings/pay-group", {
        bookingIds: res.items.map(i => i.id),
        paymentMethod: "Online"
      }, "USER");
      setPaymentView("done");
      toastSuccess("Payment successful");
      loadGroup(); // Refresh data to show paid status
    } catch (e) {
      toastError("Payment failed", e instanceof Error ? e.message : "Try again.");
    } finally {
      setPayingLoading(false);
    }
  }

  async function handleCancelReservation(bookingId: string) {
    if (!confirm(language === "en" ? "Are you sure you want to cancel this service?" : "¿Estás seguro de que deseas cancelar este servicio?")) return;
    try {
      await apiPost(`/mobile/bookings/${bookingId}/cancel`, {}, "USER");
      toastSuccess("Service cancelled");
      loadGroup();
    } catch (e) {
      toastError("Cancellation failed", "Please try again later.");
    }
  }

  async function handleCancelAllInGroup(group: Reservation) {
    if (!confirm(language === "en" ? "Are you sure you want to cancel ALL services in this reservation?" : "¿Estás seguro de que deseas cancelar TODOS los servicios de esta reserva?")) return;
    try {
      await apiPost("/mobile/bookings/cancel-group", {
        bookingIds: group.items.map(i => i.id)
      }, "USER");
      toastSuccess("All services cancelled");
      loadGroup();
    } catch (e) {
      toastError("Cancellation failed", "Please try again later.");
    }
  }

  const handleMarkCompletedGroup = async () => {
    try {
      setPayingLoading(true);
      for (const item of res?.items || []) {
        await apiPost(`/mobile/bookings/${item.id}/complete`, {}, "USER");
      }
      toastSuccess(language === "en" ? "Appointment completed" : "Cita completada");
      loadGroup();
    } catch (err) {
      toastError(language === "en" ? "Error" : "Error", err instanceof Error ? err.message : "Failed to complete");
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
      toastSuccess(language === "en" ? "New time accepted" : "Nuevo horario aceptado");
      loadGroup();
    } catch (err) {
      toastError(language === "en" ? "Error" : "Error", err instanceof Error ? err.message : "Failed to accept");
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

      toastSuccess(language === "en" ? "Reviews Submitted" : "Reseñas enviadas");
      setIsRateModalOpen(false);
      loadGroup(); // Refresh
    } catch (err) {
      toastError(language === "en" ? "Error" : "Error", err instanceof Error ? err.message : "Could not submit review");
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
            {language === "en" ? "Back" : "Volver"}
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
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === "en" ? "Date & Time" : "Fecha y Hora"}</p>
                          <p className="font-black text-slate-800">{res.date} at {res.time}</p>
                       </div>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      res.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      res.status === 'paid' ? 'bg-cyan-50 text-cyan-600 border border-cyan-100' :
                      res.status === 'completed' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      res.status === 'rescheduled' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      res.status === 'pending' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {res.status === 'confirmed' ? (language === 'en' ? 'Awaiting Payment' : 'Esperando Pago') :
                       res.status === 'paid' ? (language === 'en' ? 'Paid' : 'Pagado') :
                       res.status === 'completed' ? (language === 'en' ? 'Completed' : 'Completado') :
                       res.status === 'rescheduled' ? (language === 'en' ? 'Rescheduled' : 'Reagendado') :
                       res.status === 'pending' ? (language === 'en' ? 'Pending' : 'Pendiente') :
                       res.status}
                    </div>
                 </div>

                 <div>
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{language === "en" ? "Service Details" : "Detalles del Servicio"}</h3>
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
                               {item.status === 'confirmed' && (
                                 <button 
                                   onClick={() => handleCancelReservation(item.id)}
                                   className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition"
                                 >
                                    {language === "en" ? "Cancel" : "Cancelar"}
                                 </button>
                               )}
                                 {item.status === 'completed' && item.isReviewed && (
                                   <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                      <CheckCircle2 size={12} />
                                      {language === "en" ? "Reviewed" : "Calificado"}
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
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">{language === "en" ? "Payment Summary" : "Resumen de Pago"}</h3>
                
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-400">{language === "en" ? "Subtotal" : "Subtotal"}</span>
                      <span className="text-sm font-black text-slate-600">${res.subtotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-slate-400">{language === "en" ? "Tax" : "Impuesto"}</span>
                      <span className="text-sm font-black text-slate-600">${res.taxAmount.toFixed(2)}</span>
                   </div>
                   <div className="pt-4 mt-4 border-t border-slate-100 flex justify-between items-center">
                      <span className="text-lg font-black text-slate-900">{language === "en" ? "Total" : "Total"}</span>
                      <span className="text-3xl font-black text-primary">${res.totalPrice.toFixed(2)}</span>
                   </div>
                </div>

                {paymentView === "none" && res.status === "confirmed" && (
                  <div className="mt-8 space-y-4">
                     <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                        <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest mb-1">{language === "en" ? "Approved" : "Aprobado"}</p>
                        <p className="text-emerald-700 text-[10px] font-medium">{language === "en" ? "Your booking is approved. Please pay online to confirm." : "Tu cita está aprobada. Por favor paga online para confirmar."}</p>
                     </div>
                     <button 
                       onClick={() => setPaymentView("select")}
                       className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all transform active:scale-95"
                     >
                       {language === "en" ? "Pay Online Now" : "Pagar Online Ahora"}
                     </button>
                  </div>
                )}

                {paymentView === "none" && res.status === "rescheduled" && (
                  <div className="mt-8 space-y-4">
                     <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                        <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">{language === "en" ? "Reschedule Proposed" : "Reagendamiento Propuesto"}</p>
                        <p className="text-amber-700 text-[10px] font-medium">{language === "en" ? "The venue has proposed a new time. Do you accept?" : "El establecimiento ha propuesto un nuevo horario. ¿Aceptas?"}</p>
                     </div>
                     <button 
                       onClick={handleAcceptReschedule}
                       disabled={payingLoading}
                       className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-2"
                     >
                       {payingLoading && <Loader2 className="animate-spin" size={16} />}
                       {language === "en" ? "Accept New Time" : "Aceptar Nuevo Horario"}
                     </button>
                  </div>
                )}

                {paymentView === "none" && res.status === "paid" && (
                   <div className="mt-8 space-y-4">
                      <div className="p-4 bg-cyan-50 border border-cyan-100 rounded-2xl">
                         <p className="text-[10px] font-black text-cyan-800 uppercase tracking-widest mb-1">{language === "en" ? "Payment Confirmed" : "Pago Confirmado"}</p>
                         <p className="text-cyan-700 text-[10px] font-medium">{language === "en" ? "Your appointment is ready. Mark as completed after the service." : "Tu cita está lista. Márcala como completada después del servicio."}</p>
                      </div>
                      <button 
                        onClick={handleMarkCompletedGroup}
                        disabled={payingLoading}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-2"
                      >
                        {payingLoading && <Loader2 className="animate-spin" size={16} />}
                        {language === "en" ? "Mark as Completed" : "Marcar como Completado"}
                      </button>
                   </div>
                 )}

                 {res.status === "completed" && !res.isReviewed && (
                   <div className="mt-8 space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                         <p className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">{language === "en" ? "Service Completed" : "Servicio Completado"}</p>
                         <p className="text-blue-700 text-[10px] font-medium text-center">{language === "en" ? "How was your experience today?" : "¿Cómo fue tu experiencia hoy?"}</p>
                      </div>
                      <button 
                        onClick={() => handleOpenRateModal(res.items[0]?.id || "")}
                        className="w-full bg-primary hover:bg-primary/90 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all transform active:scale-95"
                      >
                        {language === "en" ? "Rate Experience" : "Calificar Experiencia"}
                      </button>
                   </div>
                 )}

                {paymentView === "none" && res.status === "pending" && (
                   <div className="mt-8 p-4 bg-slate-50 border border-slate-100 rounded-2xl text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === "en" ? "Waiting for Venue" : "Esperando al Establecimiento"}</p>
                   </div>
                )}

                {paymentView === "select" && (
                   <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-4">
                      <div className="p-5 border-2 border-primary bg-primary/5 rounded-2xl flex flex-col items-center gap-2">
                         <CreditCard className="text-primary" size={24} />
                         <span className="text-[10px] font-black text-primary uppercase tracking-widest">{language === "en" ? "Card Payment" : "Pago con Tarjeta"}</span>
                      </div>
                      
                      <button 
                        onClick={handlePayNow}
                        disabled={payingLoading}
                        className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                         {payingLoading ? <Loader2 className="animate-spin" size={16} /> : <Shield size={16} />}
                         {payingLoading ? (language === "en" ? "Processing..." : "Procesando...") : (language === "en" ? "Confirm & Pay" : "Confirmar y Pagar")}
                      </button>

                      <div className="flex gap-4">
                      {res.status === 'confirmed' && (
                        <button 
                          onClick={() => handleCancelAllInGroup(res)}
                          className="flex-1 bg-red-50 text-red-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition border border-red-100"
                        >
                           {language === "en" ? "Cancel All" : "Cancelar Todo"}
                        </button>
                      )}
                      <button 
                        onClick={() => setPaymentView("none")}
                        className="flex-1 bg-white border-2 border-slate-100 text-slate-500 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-slate-50 transition"
                      >
                         {language === "en" ? "Back" : "Volver"}
                      </button>
                   </div>
                   </div>
                )}

                {paymentView === "done" && (
                   <div className="mt-8 p-6 bg-emerald-50 border border-emerald-100 rounded-3xl text-center animate-in zoom-in-95">
                      <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-3" />
                      <p className="font-black text-emerald-900 text-sm">{language === "en" ? "Paid Successfully!" : "¡Pago Exitoso!"}</p>
                      <button 
                        onClick={() => router.push("/profile?tab=invoices")}
                        className="mt-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest underline decoration-2 underline-offset-4"
                      >
                         {language === "en" ? "View Invoices" : "Ver Facturas"}
                      </button>
                   </div>
                )}
             </div>

             <div className="bg-slate-900 rounded-[40px] p-8 text-white shadow-xl shadow-slate-200">
                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-6">{language === "en" ? "Safety & Policy" : "Seguridad y Políticas"}</h3>
                <div className="space-y-6">
                   <div className="flex gap-4">
                      <Shield className="text-primary flex-shrink-0" size={20} />
                      <p className="text-xs font-medium text-white/80 leading-relaxed">
                         {language === "en" ? "Secure encrypted payments powered by Rezervame." : "Pagos seguros y encriptados por Rezervame."}
                      </p>
                   </div>
                   <div className="flex gap-4">
                      <Clock className="text-primary flex-shrink-0" size={20} />
                      <p className="text-xs font-medium text-white/80 leading-relaxed">
                         {language === "en" ? "Cancellations must be done 24h before." : "Cancelaciones deben hacerse 24h antes."}
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
              <h3 className="text-2xl font-black text-slate-900 mb-8">{language === "en" ? "Rate Experience" : "Califica tu experiencia"}</h3>
              <div className="space-y-10">
                 {/* Venue Rating */}
                 <div className="space-y-4">
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{language === "en" ? "Common Venue Rating" : "Calificación General del Local"}</label>
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
                   <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">{language === "en" ? "Individual Service Ratings" : "Calificaciones por Servicio"}</h4>
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
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language === "en" ? "Service Quality" : "Calidad del Servicio"}</p>
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
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{language === "en" ? "Staff Rating" : "Calificación del Personal"}</p>
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
                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{language === "en" ? "Review Comment (Common)" : "Comentario de la Reseña (Común)"}</label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder={language === "en" ? "Tell us more about your visit..." : "Cuéntanos más sobre tu visita..."}
                      className="w-full h-32 bg-slate-50 border-none rounded-3xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                    />
                 </div>

                 <button 
                   onClick={handleSubmitReview}
                   disabled={isSubmittingReview}
                   className="w-full bg-slate-900 text-white font-black py-5 rounded-[24px] text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-900/20 hover:bg-[#ff5a5f] transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
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
