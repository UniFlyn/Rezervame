import { apiGet } from "./api";

export type SiteHeroConfig = {
  enabled: boolean;
  title: string | null;
  subtitle: string | null;
  dealText: string | null;
  imageUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  ctaExternal: boolean;
};

const EMPTY: SiteHeroConfig = {
  enabled: true,
  title: null,
  subtitle: null,
  dealText: null,
  imageUrl: null,
  ctaText: null,
  ctaUrl: null,
  ctaExternal: false,
};

export async function fetchSiteHeroConfig(): Promise<SiteHeroConfig> {
  try {
    return await apiGet<SiteHeroConfig>("/public/site/hero");
  } catch {
    return EMPTY;
  }
}

