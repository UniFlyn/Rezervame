import { apiGet } from "./api";

export type FooterNavLink = {
  labelKey: string;
  url: string;
  external: boolean;
};

export type SiteFooterConfig = {
  socialFacebookUrl: string | null;
  socialInstagramUrl: string | null;
  socialLinkedinUrl: string | null;
  appStoreUrl: string | null;
  playStoreUrl: string | null;
  showFooterDownloadApp: boolean;
  showDownloadSection: boolean;
  clientLinks: FooterNavLink[];
  businessLinks: FooterNavLink[];
  legalLinks: FooterNavLink[];
};

const EMPTY: SiteFooterConfig = {
  socialFacebookUrl: null,
  socialInstagramUrl: null,
  socialLinkedinUrl: null,
  appStoreUrl: null,
  playStoreUrl: null,
  showFooterDownloadApp: true,
  showDownloadSection: false,
  clientLinks: [],
  businessLinks: [],
  legalLinks: [],
};

export async function fetchSiteFooterConfig(): Promise<SiteFooterConfig> {
  try {
    return await apiGet<SiteFooterConfig>("/public/site/footer");
  } catch {
    return EMPTY;
  }
}
