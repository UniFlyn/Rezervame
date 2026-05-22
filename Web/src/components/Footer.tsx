"use client";
import React from "react";
import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { Facebook, Linkedin, Instagram } from "lucide-react";
import { usePathname } from "next/navigation";

const footerLinkClass = "block hover:underline opacity-90 transition-opacity hover:opacity-100";

export const Footer = () => {
  const { t } = useI18n();
  const pathname = usePathname();

  if (pathname.startsWith('/business')) return null;

  return (
    <footer className="bg-[#ff5a5f] px-6 py-10 text-white sm:px-10">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 border-b border-white/20 pb-8 mb-6 md:grid-cols-12">
        
        <div className="md:col-span-4 pr-6">
           <div className="mb-3 flex items-center space-x-2">
             <img src="/logo.png" alt="rezervame text logo" className="h-8 object-contain brightness-0 invert" />
           </div>
           <p className="mb-4 max-w-sm pr-4 text-sm font-medium leading-relaxed opacity-95">
             {t('footerAbout')}
           </p>
           <div className="flex space-x-3">
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook size={18} />
              </a>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://www.linkedin.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin size={18} />
              </a>
           </div>
        </div>
        
        <div className="md:col-span-2">
          <h4 className="mb-4 text-[15px] font-bold tracking-wide">{t("footerForClients")}</h4>
          <ul className="space-y-2.5 text-[13px] font-bold opacity-90">
             <li><Link href="/download" className={footerLinkClass}>{t("footerDownload")}</Link></li>
             <li><Link href="/how-it-works" className={footerLinkClass}>{t("footerHow")}</Link></li>
             <li><Link href="/customer-service" className={footerLinkClass}>{t("footerSupport")}</Link></li>
             <li><Link href="/events" className={footerLinkClass}>{t("footerEvents")}</Link></li>
          </ul>
        </div>
        
        <div className="md:col-span-3">
          <h4 className="mb-4 text-[15px] font-bold tracking-wide">{t('footerForBusiness')}</h4>
          <ul className="space-y-2.5 text-[13px] font-bold opacity-90">
             <li><Link href="/business/join" className={footerLinkClass}>{t('footerJoin')}</Link></li>
             <li><Link href="/business/login" className={footerLinkClass}>{t('footerApp')}</Link></li>
             <li><Link href="/pricing" className={footerLinkClass}>{t('footerPrices')}</Link></li>
             <li><Link href="/business/support" className={footerLinkClass}>{t('footerSupportBiz')}</Link></li>
          </ul>
        </div>
        
        <div className="md:col-span-3">
          <h4 className="mb-4 text-[15px] font-bold tracking-wide text-white/90">{t("footerLegal")}</h4>
          <ul className="space-y-2.5 text-[13px] font-bold opacity-90">
             <li><Link href="/about" className={footerLinkClass}>{t("footerAboutUs")}</Link></li>
             <li><Link href="/jobs" className={footerLinkClass}>{t("footerJobs")}</Link></li>
             <li><Link href="/privacy" className={footerLinkClass}>{t("footerPrivacy")}</Link></li>
             <li><Link href="/terms" className={footerLinkClass}>{t("footerTerms")}</Link></li>
          </ul>
        </div>

      </div>
      
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between">
         <div className="flex flex-col">
            <h5 className="font-extrabold text-[15px] mb-1">{t("downloadApp")}</h5>
            <p className="text-xs font-semibold opacity-80">{t("downloadSub")}</p>
         </div>
         <div className="flex space-x-3 mt-4 md:mt-0">
            <a
              href="https://apps.apple.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition"
            >
               <span className="text-xs font-bold tracking-tight">App Store</span>
            </a>
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition"
            >
               <span className="text-xs font-bold tracking-tight">Google Play</span>
            </a>
         </div>
      </div>
    </footer>
  );
};
