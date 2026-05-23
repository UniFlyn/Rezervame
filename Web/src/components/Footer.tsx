"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "./I18nProvider";
import { Facebook, Linkedin, Instagram } from "lucide-react";
import { usePathname } from "next/navigation";
import {
  fetchSiteFooterConfig,
  type FooterNavLink,
  type SiteFooterConfig,
} from "../lib/siteFooter";
import { isBookingConfirmationPath } from "@/lib/bookingConfirmation";

const footerLinkClass = "block hover:underline opacity-90 transition-opacity hover:opacity-100";

function FooterNavItem({ link, label }: { link: FooterNavLink; label: string }) {
  if (link.external) {
    return (
      <a
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className={footerLinkClass}
      >
        {label}
      </a>
    );
  }
  return (
    <Link href={link.url} className={footerLinkClass}>
      {label}
    </Link>
  );
}

function FooterLinkList({
  links,
  labelFor,
}: {
  links: FooterNavLink[];
  labelFor: (key: string) => string;
}) {
  if (!links.length) return null;
  return (
    <ul className="space-y-2.5 text-[13px] font-bold opacity-90">
      {links.map((link) => (
        <li key={`${link.labelKey}-${link.url}`}>
          <FooterNavItem link={link} label={labelFor(link.labelKey)} />
        </li>
      ))}
    </ul>
  );
}

export const Footer = () => {
  const { t } = useI18n();
  const pathname = usePathname();
  const [footer, setFooter] = useState<SiteFooterConfig | null>(null);

  useEffect(() => {
    fetchSiteFooterConfig().then(setFooter);
  }, []);

  if (pathname.startsWith("/business") || isBookingConfirmationPath(pathname)) return null;

  const socials = [
    { url: footer?.socialFacebookUrl, Icon: Facebook, label: "Facebook" },
    { url: footer?.socialInstagramUrl, Icon: Instagram, label: "Instagram" },
    { url: footer?.socialLinkedinUrl, Icon: Linkedin, label: "LinkedIn" },
  ].filter((s) => s.url);

  const showDownloadSection = footer?.showDownloadSection ?? false;
  const appStoreUrl = footer?.appStoreUrl;
  const playStoreUrl = footer?.playStoreUrl;
  const clientLinks = footer?.clientLinks ?? [];
  const businessLinks = footer?.businessLinks ?? [];
  const legalLinks = footer?.legalLinks ?? [];

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
           {socials.length > 0 ? (
           <div className="flex space-x-3">
              {socials.map(({ url, Icon, label }) => (
              <a
                key={label}
                href={url!}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition hover:scale-110"
                aria-label={label}
              >
                <Icon size={18} />
              </a>
              ))}
           </div>
           ) : null}
        </div>
        
        {clientLinks.length > 0 ? (
        <div className="md:col-span-2">
          <h4 className="mb-4 text-[15px] font-bold tracking-wide">{t("footerForClients")}</h4>
          <FooterLinkList links={clientLinks} labelFor={(key) => t(key)} />
        </div>
        ) : null}
        
        {businessLinks.length > 0 ? (
        <div className="md:col-span-3">
          <h4 className="mb-4 text-[15px] font-bold tracking-wide">{t('footerForBusiness')}</h4>
          <FooterLinkList links={businessLinks} labelFor={(key) => t(key)} />
        </div>
        ) : null}
        
        {legalLinks.length > 0 ? (
        <div className="md:col-span-3">
          <h4 className="mb-4 text-[15px] font-bold tracking-wide text-white/90">{t("footerLegal")}</h4>
          <FooterLinkList links={legalLinks} labelFor={(key) => t(key)} />
        </div>
        ) : null}

      </div>
      
      {showDownloadSection ? (
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row items-center justify-between">
         <div className="flex flex-col">
            <h5 className="font-extrabold text-[15px] mb-1">{t("downloadApp")}</h5>
            <p className="text-xs font-semibold opacity-80">{t("downloadSub")}</p>
         </div>
         <div className="flex space-x-3 mt-4 md:mt-0">
            {appStoreUrl ? (
            <a
              href={appStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition"
            >
               <span className="text-xs font-bold tracking-tight">App Store</span>
            </a>
            ) : null}
            {playStoreUrl ? (
            <a
              href={playStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-2 bg-transparent border border-white/30 rounded-lg hover:bg-white/10 transition"
            >
               <span className="text-xs font-bold tracking-tight">Google Play</span>
            </a>
            ) : null}
         </div>
      </div>
      ) : null}
    </footer>
  );
};
