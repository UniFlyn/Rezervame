"use client";
import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { MessageCircle, Phone, Mail, Clock } from "lucide-react";

export default function CustomerServicePage() {
  return (
    <StaticPageLayout 
      title="Atención al Cliente" 
      subtitle="Estamos aquí para ayudarte. Contacta con nosotros por cualquier duda o inconveniente."
      breadcrumb="Customer Service"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-6">
           <div className="w-12 h-12 bg-[#ff5a5f] text-white rounded-xl flex items-center justify-center shrink-0">
              <MessageCircle size={24} />
           </div>
           <div>
              <h4 className="text-xl font-black uppercase mb-2">Chat en Vivo</h4>
              <p className="text-sm font-bold text-slate-500 mb-4">Disponible 24/7 para consultas rápidas.</p>
              <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#ff5a5f] transition-all">Iniciar Chat</button>
           </div>
        </div>
        <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex items-start gap-6">
           <div className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0">
              <Phone size={24} />
           </div>
           <div>
              <h4 className="text-xl font-black uppercase mb-2">Llámanos</h4>
              <p className="text-sm font-bold text-slate-500 mb-2">+507 800-REZ-M</p>
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <Clock size={12} /> Lun - Vie, 8am - 6pm
              </div>
           </div>
        </div>
      </div>

      <h2>Preguntas Frecuentes</h2>
      <div className="space-y-4">
          <details className="group bg-white border border-slate-100 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:border-[#ff5a5f] transition-all">
            <summary className="flex items-center justify-between font-black uppercase tracking-tight text-slate-800">
              ¿Cómo cancelo una reserva?
              <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </summary>
            <p className="mt-4 leading-relaxed text-slate-500 font-bold">
              Puedes cancelar tu reserva directamente desde la sección "Mis Reservas" en tu perfil, siempre que estés dentro del plazo permitido por el negocio.
            </p>
          </details>
          
          <details className="group bg-white border border-slate-100 rounded-2xl p-6 [&_summary::-webkit-details-marker]:hidden cursor-pointer hover:border-[#ff5a5f] transition-all">
            <summary className="flex items-center justify-between font-black uppercase tracking-tight text-slate-800">
              ¿Es seguro pagar a través de la app?
              <span className="shrink-0 transition duration-300 group-open:-rotate-180">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            </summary>
            <p className="mt-4 leading-relaxed text-slate-500 font-bold">
              Sí, utilizamos pasarelas de pago cifradas y certificadas para garantizar que tu información financiera esté siempre protegida.
            </p>
          </details>
      </div>
    </StaticPageLayout>
  );
}
