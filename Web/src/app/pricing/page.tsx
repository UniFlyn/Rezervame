"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { Zap, Shield, Star, Users } from "lucide-react";

export default function PricingPage() {
  return (
    <StaticPageLayout 
      title="Planes y Precios" 
      subtitle="Soluciones flexibles para negocios de todos los tamaños. Elige el plan que mejor se adapte a ti."
      breadcrumb="Pricing"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
        <div className="p-10 bg-slate-50 rounded-[40px] border border-slate-100 flex flex-col items-center text-center">
           <Zap className="w-12 h-12 text-slate-400 mb-6" />
           <h3 className="text-2xl font-black uppercase mb-2">Plan Básico</h3>
           <p className="text-4xl font-black text-slate-900 mb-6">$0<span className="text-lg text-slate-400">/Mes</span></p>
           <ul className="text-left w-full space-y-4 mb-10">
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-green-500 w-5 h-5" /> Hasta 50 reservas/mes</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-green-500 w-5 h-5" /> Perfil de negocio básico</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-green-500 w-5 h-5" /> Soporte por email</li>
           </ul>
           <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all">Empezar Gratis</button>
        </div>

        <div className="p-10 bg-white rounded-[40px] border-4 border-[#ff5a5f] flex flex-col items-center text-center relative shadow-2xl shadow-[#ff5a5f]/10">
           <div className="absolute -top-5 bg-[#ff5a5f] text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">Recomendado</div>
           <Star className="w-12 h-12 text-[#ff5a5f] mb-6" />
           <h3 className="text-2xl font-black uppercase mb-2">Plan Premium</h3>
           <p className="text-4xl font-black text-slate-900 mb-6">$29<span className="text-lg text-slate-400">/Mes</span></p>
           <ul className="text-left w-full space-y-4 mb-10">
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-[#ff5a5f] w-5 h-5" /> Reservas ilimitadas</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-[#ff5a5f] w-5 h-5" /> Marketing y Promociones</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-[#ff5a5f] w-5 h-5" /> Analíticas avanzadas</li>
              <li className="flex items-center gap-3 font-bold text-slate-500"><CheckIcon className="text-[#ff5a5f] w-5 h-5" /> Soporte prioritario 24/7</li>
           </ul>
           <button className="w-full py-4 bg-[#ff5a5f] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#e0454a] transition-all shadow-xl shadow-[#ff5a5f]/30">Activar Premium</button>
        </div>
      </div>
    </StaticPageLayout>
  );
}

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);
