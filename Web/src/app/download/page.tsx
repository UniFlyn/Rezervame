"use client";

import React, { useEffect, useState } from "react";
import { StaticPageLayout } from "../../components/StaticPageLayout";
import { fetchSiteFooterConfig, type SiteFooterConfig } from "../../lib/siteFooter";

export default function DownloadPage() {
  const [footer, setFooter] = useState<SiteFooterConfig | null>(null);

  useEffect(() => {
    fetchSiteFooterConfig().then(setFooter);
  }, []);

  const appStoreUrl = footer?.appStoreUrl;
  const playStoreUrl = footer?.playStoreUrl;
  const hasStores = Boolean(appStoreUrl || playStoreUrl);

  return (
    <StaticPageLayout title="Descargar App">
      <div className="text-center space-y-12">
        <p className="text-xl">Lleva REZERVAME contigo a donde quiera que vayas. Reserva en segundos desde tu móvil.</p>
        
        {hasStores ? (
        <div className="flex flex-col md:flex-row justify-center gap-6">
          {appStoreUrl ? (
          <a
            href={appStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-4 hover:scale-105 transition shadow-xl"
          >
             <div className="text-left">
               <div className="text-xs opacity-70">Download on the</div>
               <div className="text-xl font-bold">App Store</div>
             </div>
          </a>
          ) : null}
          {playStoreUrl ? (
          <a
            href={playStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black text-white px-8 py-4 rounded-2xl flex items-center gap-4 hover:scale-105 transition shadow-xl"
          >
             <div className="text-left">
               <div className="text-xs opacity-70">GET IT ON</div>
               <div className="text-xl font-bold">Google Play</div>
             </div>
          </a>
          ) : null}
        </div>
        ) : (
          <p className="text-slate-500">Los enlaces de descarga estarán disponibles pronto.</p>
        )}

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
