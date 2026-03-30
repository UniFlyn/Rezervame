"use client";
import React from "react";
import { StaticPageLayout } from "../../../components/StaticPageLayout";
import { HelpCircle, BookOpen, Wrench } from "lucide-react";

export default function BusinessSupportPage() {
  return (
    <StaticPageLayout 
      title="Soporte para Negocios" 
      subtitle="Todo lo que necesitas para gestionar tu local con éxito en REZERVAME."
      breadcrumb="Business Support"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-[#ff5a5f] transition-all">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl text-[#ff5a5f]">
              <HelpCircle size={32} />
           </div>
           <h3 className="text-lg font-black uppercase mb-4">Preguntas Frecuentes</h3>
           <p className="text-sm font-bold text-slate-500">Respuestas rápidas a las dudas más comunes de nuestros socios.</p>
        </div>
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-slate-900 transition-all">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl text-slate-900">
              <BookOpen size={32} />
           </div>
           <h3 className="text-lg font-black uppercase mb-4">Guía de Uso</h3>
           <p className="text-sm font-bold text-slate-500">Tutoriales paso a paso para configurar tu perfil y servicios.</p>
        </div>
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col items-center text-center group hover:border-blue-500 transition-all">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-xl text-blue-500">
              <Wrench size={32} />
           </div>
           <h3 className="text-lg font-black uppercase mb-4">Soporte Técnico</h3>
           <p className="text-sm font-bold text-slate-500">¿Problemas con la plataforma? Nuestro equipo técnico te ayuda.</p>
        </div>
      </div>

      <div className="mt-20 p-10 bg-slate-900 text-white rounded-[40px]">
          <h2 className="text-white">¿Nuevo en REZERVAME?</h2>
          <p className="text-white/70 font-bold mb-8">Únete a cientos de negocios que ya están optimizando su tiempo y aumentando sus ingresos.</p>
          <a href="/business/join" className="inline-block bg-[#ff5a5f] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#e0484d] transition-all">
              Registrar mi Negocio
          </a>
      </div>
    </StaticPageLayout>
  );
}
