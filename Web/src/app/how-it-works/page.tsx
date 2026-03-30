"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Search, Calendar, CheckCircle } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <StaticPageLayout 
      title="Cómo Funciona" 
      subtitle="Descubre lo fácil que es reservar tus servicios favoritos en segundos."
      breadcrumb="How It Works"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
        <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
           <div className="w-16 h-16 bg-[#ff5a5f] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#ff5a5f]/20">
              <Search size={32} />
           </div>
           <h3 className="text-xl font-black mb-4 uppercase">1. Explora</h3>
           <p className="text-sm font-bold text-slate-500">Busca por categoría, ubicación o calificación para encontrar el lugar perfecto.</p>
        </div>
        <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
           <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar size={32} />
           </div>
           <h3 className="text-xl font-black mb-4 uppercase">2. Reserva</h3>
           <p className="text-sm font-bold text-slate-500">Elige tu servicio, fecha, hora y profesional favorito en tiempo real.</p>
        </div>
        <div className="text-center p-8 bg-slate-50 rounded-3xl border border-slate-100">
           <div className="w-16 h-16 bg-green-500 text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-100">
              <CheckCircle size={32} />
           </div>
           <h3 className="text-xl font-black mb-4 uppercase">3. Disfruta</h3>
           <p className="text-sm font-bold text-slate-500">Recibe recordatorios y disfruta de una experiencia premium sin esperas.</p>
        </div>
      </div>

      <div className="mt-20">
        <h2>Beneficios para ti</h2>
        <ul>
          <li><strong>Disponibilidad Real:</strong> Olvida las llamadas, ve los huecos libres al instante.</li>
          <li><strong>Recordatorios:</strong> Te avisamos para que nunca pierdas una cita.</li>
          <li><strong>Pagos Seguros:</strong> Paga en el local o a través de la app con total seguridad.</li>
        </ul>
      </div>
    </StaticPageLayout>
  );
}
