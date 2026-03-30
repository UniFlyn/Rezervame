import React from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";

export default function DownloadPage() {
  return (
    <StaticPageLayout title="Descargar App">
      <div className="text-center space-y-12">
        <p className="text-xl">Lleva REZERVAME contigo a donde quiera que vayas. Reserva en segundos desde tu móvil.</p>
        
        <div className="flex flex-col md:flex-row justify-center gap-6">
          <a href="#" className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-4 hover:scale-105 transition shadow-xl">
             <div className="text-left">
               <div className="text-xs opacity-70">Download on the</div>
               <div className="text-xl font-bold">App Store</div>
             </div>
          </a>
          <a href="#" className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-4 hover:scale-105 transition shadow-xl">
             <div className="text-left">
               <div className="text-xs opacity-70">GET IT ON</div>
               <div className="text-xl font-bold">Google Play</div>
             </div>
          </a>
        </div>

        <div className="mt-16 p-10 bg-slate-50 rounded-3xl border border-slate-100">
          <h3 className="text-2xl font-bold mb-4">¿Por qué usar la App?</h3>
          <ul className="text-left max-w-md mx-auto space-y-4">
            <li className="flex gap-3">
              <span className="text-[#ff5a5f] font-bold">✓</span>
              <span>Notificaciones instantáneas de tus citas</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#ff5a5f] font-bold">✓</span>
              <span>Gestión rápida de favoritos</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[#ff5a5f] font-bold">✓</span>
              <span>Ofertas exclusivas solo en la app</span>
            </li>
          </ul>
        </div>
      </div>
    </StaticPageLayout>
  );
}
