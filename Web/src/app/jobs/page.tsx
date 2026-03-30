"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";

export default function JobsPage() {
  return (
    <StaticPageLayout 
      title="Únete al Equipo" 
      subtitle="Trabaja en la plataforma que está transformando el sector de la belleza en Panamá."
      breadcrumb="Jobs"
    >
      <h2>¿Por qué trabajar con nosotros?</h2>
      <p>
        En REZERVAME, valoramos el talento, la creatividad y la pasión. Somos un equipo joven y dinámico 
        que busca resolver problemas reales con soluciones tecnológicas innovadoras.
      </p>

      <h2>Posiciones Abiertas</h2>
      <div className="space-y-6 mt-8">
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-[#ff5a5f] transition-all">
          <div>
            <h4 className="text-xl font-bold text-slate-800">Senior Full-stack Developer</h4>
            <p className="text-sm font-medium text-slate-500 mt-1">Remoto • Tiempo Completo</p>
          </div>
          <button className="text-[#ff5a5f] font-black text-xs uppercase tracking-widest hover:underline">Aplicar ahora</button>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:border-[#ff5a5f] transition-all">
          <div>
            <h4 className="text-xl font-bold text-slate-800">Especialista en Marketing Digital</h4>
            <p className="text-sm font-medium text-slate-500 mt-1">Panamá City • Tiempo Completo</p>
          </div>
          <button className="text-[#ff5a5f] font-black text-xs uppercase tracking-widest hover:underline">Aplicar ahora</button>
        </div>
      </div>
    </StaticPageLayout>
  );
}
