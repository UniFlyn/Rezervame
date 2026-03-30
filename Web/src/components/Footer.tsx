"use client";
import React from "react";
import { useI18n } from "./I18nProvider";
import { Facebook, Linkedin, Instagram } from "lucide-react";

export const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-[#ff5a5f] text-white pt-16 pb-12 px-10">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 border-b border-white/20 pb-16 mb-8">
        
        <div className="md:col-span-4 pr-6">
           <div className="flex items-center space-x-2 mb-5">
             <img src="/logo.png" alt="rezervame text logo" className="h-8 object-contain brightness-0 invert" />
           </div>
           <p className="text-sm font-medium opacity-95 leading-relaxed max-w-sm mb-6 pr-4">
             {t('footerAbout')}
           </p>
           <div className="flex space-x-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition hover:scale-110">
                <Facebook size={18} />
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition hover:scale-110">
                <Instagram size={18} />
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer bg-white/10 hover:bg-white/20 transition hover:scale-110">
                <Linkedin size={18} />
              </div>
           </div>
        </div>
        
        <div className="md:col-span-2">
          <h4 className="font-bold text-[15px] mb-6 tracking-wide">Para Clientes</h4>
          <ul className="space-y-4 text-[13px] font-bold opacity-90">
             <li><a href="/download" className="hover:underline opacity-90">Descargar app</a></li>
             <li><a href="/how-it-works" className="hover:underline opacity-90">Cómo funciona</a></li>
             <li><a href="/customer-service" className="hover:underline opacity-90">Atención al cliente</a></li>
             <li><a href="/events" className="hover:underline opacity-90">Eventos en REZERVAME</a></li>
          </ul>
        </div>
        
        <div className="md:col-span-3">
          <h4 className="font-bold text-[15px] mb-6 tracking-wide">Para Negocios</h4>
          <ul className="space-y-4 text-[13px] font-bold opacity-90">
             <li><a href="/business/join" className="hover:underline opacity-90">Únete a REZERVAME</a></li>
             <li><a href="/download" className="hover:underline opacity-90">App para negocios</a></li>
             <li><a href="/pricing" className="hover:underline opacity-90">Precios</a></li>
             <li><a href="/business/support" className="hover:underline opacity-90">Soporte para Negocios</a></li>
          </ul>
        </div>
        
        <div className="md:col-span-3">
          <h4 className="font-bold text-[15px] mb-6 tracking-wide text-transparent select-none">Legal</h4>
          <ul className="space-y-4 text-[13px] font-bold opacity-90">
             <li><a href="/about" className="hover:underline opacity-90">Sobre nosotros</a></li>
             <li><a href="/jobs" className="hover:underline opacity-90">Empleos</a></li>
             <li><a href="/privacy" className="hover:underline opacity-90">Política de privacidad</a></li>
             <li><a href="/terms" className="hover:underline opacity-90">Términos del servicio</a></li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between">
         <div className="flex flex-col">
            <h5 className="font-extrabold text-[15px] mb-1">Descarga la aplicación REZERVAME</h5>
            <p className="text-xs font-semibold opacity-80">Reserva citas estés donde estés</p>
         </div>
         <div className="flex space-x-3 mt-4 md:mt-0">
            <button className="flex items-center px-4 py-2 bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition">
               <span className="text-xs font-bold tracking-tight">App Store</span>
            </button>
            <button className="flex items-center px-4 py-2 bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition">
               <span className="text-xs font-bold tracking-tight">Google Play</span>
            </button>
         </div>
      </div>
    </footer>
  );
};
