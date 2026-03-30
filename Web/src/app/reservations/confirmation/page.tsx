"use client";
import React from "react";
import { CheckCircle, Calendar, MapPin, Clock, Home, List, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";

export default function BookingConfirmationPage() {
  return (
    <main className="flex-1 flex items-center justify-center py-24 px-8 bg-slate-50 min-h-[80vh] animate-in fade-in duration-1000">
      <div className="max-w-[650px] w-full bg-white rounded-[56px] shadow-2xl p-12 sm:p-20 text-center relative overflow-hidden border border-slate-100">
        
        {/* Background Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#ff5a5f]/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>

        <div className="mb-10 flex justify-center relative">
          <div className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center animate-in zoom-in duration-700 delay-300 shadow-inner">
            <CheckCircle size={56} className="text-green-500" strokeWidth={1.5} />
          </div>
          <div className="absolute -top-2 -right-2 bg-[#ff5a5f] p-3 rounded-2xl text-white shadow-xl animate-bounce">
             <Zap size={20} fill="white" />
          </div>
        </div>
        
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter leading-none">
          ¡Reserva <span className="text-[#ff5a5f]">Exitosa</span>!
        </h1>
        <p className="text-slate-500 text-lg font-bold mb-14 max-w-md mx-auto leading-relaxed">
          Tu cita ha sido programada. Prepárate para una experiencia de primer nivel.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16">
           <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 hover:border-[#ff5a5f]/30 transition-colors group">
              <div className="flex items-center gap-4 text-slate-700">
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-[#ff5a5f]">
                    <Calendar size={20} />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha y Hora</p>
                    <span className="font-black text-slate-800">15 Abr • 10:30 AM</span>
                 </div>
              </div>
           </div>
           
           <div className="bg-slate-50 rounded-[32px] p-6 border border-slate-100 hover:border-[#ff5a5f]/30 transition-colors group">
              <div className="flex items-center gap-4 text-slate-700">
                 <div className="p-3 bg-white rounded-2xl shadow-sm text-[#ff5a5f]">
                    <MapPin size={20} />
                 </div>
                 <div className="text-left">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                    <span className="font-black text-slate-800 truncate block max-w-[150px]">The Grooming Room</span>
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
             Ir al Inicio
           </Link>
           <Link 
             href="/profile?tab=bookings"
             className="flex-1 bg-[#ff5a5f] text-white px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-[#e0484d] transition transform hover:-translate-y-1 active:scale-95 shadow-xl shadow-[#ff5a5f]/20"
           >
             <List size={18} />
             Ver Detalles
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
