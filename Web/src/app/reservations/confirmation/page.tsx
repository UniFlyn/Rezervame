"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Calendar, MapPin, Home, List, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";

import { useI18n } from "@/components/I18nProvider";

function formatWhen(iso: string | null, locale: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function ConfirmationInner() {
  const { language } = useI18n();
  const sp = useSearchParams();
  const dateLocale = language === "en" ? "en-US" : "es-PA";
  const when = formatWhen(sp.get("date"), dateLocale);
  const venue = sp.get("venue")?.trim() || "—";

  return (
    <main className="flex-1 flex items-center justify-center py-10 sm:py-14 px-4 sm:px-8 bg-slate-50 min-h-[70vh] animate-in fade-in duration-1000">
      <div className="max-w-[540px] w-full max-h-[85vh] overflow-y-auto bg-white rounded-[36px] sm:rounded-[44px] shadow-2xl p-8 sm:p-12 text-center relative overflow-hidden border border-slate-100 custom-scrollbar">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#ff5a5f]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>

        <div className="mb-8 flex justify-center relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-green-50 rounded-full flex items-center justify-center animate-in zoom-in duration-700 delay-300 shadow-inner p-5">
            <CheckCircle size={48} className="text-green-500" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2 bg-[#ff5a5f] p-3 rounded-2xl text-white shadow-xl animate-bounce">
            <Zap size={20} fill="white" />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight leading-tight">
          {language === "en" ? "Booking" : "Reserva"} <span className="text-[#ff5a5f]">{language === "en" ? "Submitted" : "Enviada"}</span>!
        </h1>
        <p className="text-slate-500 text-base font-bold mb-10 max-w-md mx-auto leading-snug px-2">
          {language === "en" 
            ? "Your booking request has been sent to the business. You\'ll be notified once they approve it."
            : "Tu solicitud de reserva ha sido enviada al negocio. Te notificaremos cuando la aprueben."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 hover:border-[#ff5a5f]/30 transition-colors group">
            <div className="flex items-center gap-4 text-slate-700">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-[#ff5a5f]">
                <Calendar size={20} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === "en" ? "Date & Time" : "Fecha y Hora"}</p>
                <span className="font-black text-slate-800 block truncate">{when}</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 hover:border-[#ff5a5f]/30 transition-colors group">
            <div className="flex items-center gap-4 text-slate-700">
              <div className="p-3 bg-white rounded-2xl shadow-sm text-[#ff5a5f]">
                <MapPin size={20} />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === "en" ? "Location" : "Ubicación"}</p>
                <span className="font-black text-slate-800 truncate block max-w-[180px]">{venue}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-5 justify-center">
          <Link
            href="/"
            className="flex-1 bg-slate-900 text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-slate-800 transition transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-slate-200"
          >
            <Home size={18} />
            {language === "en" ? "Go to Home" : "Ir al Inicio"}
          </Link>
          <Link
            href="/profile?tab=bookings"
            className="flex-1 bg-[#ff5a5f] text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-[#e0484d] transition transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-[#ff5a5f]/20"
          >
            <List size={18} />
            {language === "en" ? "View Details" : "Ver Detalles"}
            <ChevronRight size={16} />
          </Link>
        </div>

        <p className="mt-12 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          Rezérvame Premium Experience
        </p>
      </div>
    </main>
  );
}

export default function BookingConfirmationPage() {
  const { language } = useI18n();
  return (
    <Suspense
      fallback={
        <main className="flex-1 flex min-h-[50vh] items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600">
          {language === "en" ? "Loading..." : "Cargando..."}
        </main>
      }
    >
      <ConfirmationInner />
    </Suspense>
  );
}
