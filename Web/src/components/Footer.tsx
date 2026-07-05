"use client";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { isBookingConfirmationPath } from "@/lib/bookingConfirmation";
import { Footer as DSFooter } from "@/ds";
import { useI18n } from "./I18nProvider";
import { appPath } from "@/lib/publicBasePath";
import { fetchSiteFooterConfig, type FooterNavLink, type SiteFooterConfig } from "@/lib/siteFooter";

const FOOTER_CONTENT_MAX = "min(94vw, 1600px)";

function mapNavLinks(
  links: FooterNavLink[],
  t: (key: string) => string,
): Array<{ label: string; href: string; external?: boolean }> {
  return links.map((link) => ({
    label: t(link.labelKey) || link.labelKey,
    href: link.external ? link.url : appPath(link.url),
    external: link.external,
  }));
}

const DEFAULT_CLIENT: Array<{ labelKey: string; url: string }> = [
  { labelKey: "footerDownload", url: "/download" },
  { labelKey: "footerHow", url: "/how-it-works" },
  { labelKey: "footerSupport", url: "/customer-service" },
  { labelKey: "footerEvents", url: "/events" },
];

const DEFAULT_BUSINESS: Array<{ labelKey: string; url: string }> = [
  { labelKey: "footerJoin", url: "/business/join" },
  { labelKey: "footerBusinessAccess", url: "/business/login" },
  { labelKey: "footerPrices", url: "/pricing" },
  { labelKey: "footerSupportBiz", url: "/business/support" },
];

const DEFAULT_LEGAL: Array<{ labelKey: string; url: string }> = [
  { labelKey: "footerAboutUs", url: "/about" },
  { labelKey: "footerJobs", url: "/jobs" },
  { labelKey: "footerPrivacy", url: "/privacy" },
  { labelKey: "footerTerms", url: "/terms" },
];

function fallbackLinks(
  items: Array<{ labelKey: string; url: string }>,
  t: (key: string) => string,
) {
  return items.map((item) => ({
    label: t(item.labelKey),
    href: appPath(item.url),
  }));
}

/**
 * Customer footer — full-bleed coral, rendered with the Rezervame Design System
 * `Footer`. Columns follow the design-system customer-web kit exactly. Hidden on
 * the business panel and the booking-confirmation screen (previous behaviour).
 */
export const Footer = () => {
  const pathname = usePathname();
  const { t } = useI18n();
  const [siteFooter, setSiteFooter] = useState<SiteFooterConfig | null>(null);

  useEffect(() => {
    void fetchSiteFooterConfig()
      .then(setSiteFooter)
      .catch(() => setSiteFooter(null));
  }, []);

  const columns = useMemo(() => {
    const client =
      siteFooter && siteFooter.clientLinks.length > 0
        ? mapNavLinks(siteFooter.clientLinks, t)
        : fallbackLinks(DEFAULT_CLIENT, t);
    const business =
      siteFooter && siteFooter.businessLinks.length > 0
        ? mapNavLinks(siteFooter.businessLinks, t)
        : fallbackLinks(DEFAULT_BUSINESS, t);
    const legal =
      siteFooter && siteFooter.legalLinks.length > 0
        ? mapNavLinks(siteFooter.legalLinks, t)
        : fallbackLinks(DEFAULT_LEGAL, t);

    return [
      { title: t("footerForClients"), links: client },
      { title: t("footerForBusiness"), links: business },
      { title: t("footerBrandColumn"), links: legal },
    ];
  }, [siteFooter, t]);

  const socialItems = useMemo(() => {
    const items: Array<{ name: string; href?: string }> = [];
    if (siteFooter?.socialInstagramUrl) items.push({ name: "instagram", href: siteFooter.socialInstagramUrl });
    if (siteFooter?.socialFacebookUrl) items.push({ name: "facebook", href: siteFooter.socialFacebookUrl });
    if (siteFooter?.socialLinkedinUrl) items.push({ name: "linkedin", href: siteFooter.socialLinkedinUrl });
    if (items.length === 0) {
      return [
        { name: "instagram" },
        { name: "facebook" },
        { name: "linkedin" },
        { name: "x" },
      ];
    }
    return items;
  }, [siteFooter]);

  if (pathname.startsWith("/business") || isBookingConfirmationPath(pathname)) return null;

  const appStoreHref = siteFooter?.appStoreUrl || undefined;
  const playStoreHref = siteFooter?.playStoreUrl || undefined;
  const downloadFallback = appPath("/download");

  return (
    <DSFooter
      logoSrc={appPath("/ds/logos/rezervame-white.png")}
      tagline={t("footerAbout")}
      columns={columns}
      socialItems={socialItems}
      contentMax={FOOTER_CONTENT_MAX}
      downloadTitle={t("downloadApp")}
      downloadSubtitle={t("downloadSub")}
      appStoreHref={appStoreHref || downloadFallback}
      playStoreHref={playStoreHref || downloadFallback}
    />
  );
};
