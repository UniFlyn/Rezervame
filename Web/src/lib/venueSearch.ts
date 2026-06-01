import { PLACEHOLDER_IMAGE_DATA_URI } from "./placeholderImage";
import {
  DEFAULT_CATEGORY_IMAGES,
  defaultCategoryImageForKey,
  isS3PublicUrl,
  normalizePublicImageUrl,
} from "./s3Assets";

import { resolveApiBase } from "./apiBase";

const API_BASE = resolveApiBase();

export type ApiVenue = {
  id: number;
  businessId: string;
  name: string;
  categoryKey: string;
  rating: string;
  reviews: string;
  price: string;
  lat: number;
  lng: number;
  unsplashImgId?: string | null;
  imageUrl?: string | null;
  /** Business storefront / hero banner (preferred for venue cards). */
  bannerUrl?: string | null;
  logoUrl?: string | null;
  /** Aggregated list/service/gallery images for fallback. */
  portfolioImageUrls?: string[];
  locationLabel: string;
  distanceLabel: string;
  serviceName?: string;
  serviceDurationMinutes?: number;
  amenityKeys?: string[];
  amenityLabelsEn?: string[];
  amenityLabelsEs?: string[];
  nextAvailable?: string;
  todaySlotTimings?: string;
};

/** UI row for search / map (derived from [ApiVenue]). */
export type SearchVenueRow = {
  id: string;
  businessId: string;
  name: string;
  category: string;
  categoryKey: string;
  rating: number;
  reviews: number;
  price: number;
  img: string;
  lat: number;
  lng: number;
  popular: boolean;
  locationLabel: string;
  distanceLabel: string;
  serviceName?: string;
  serviceDurationMinutes?: number;
  /** Service/item image from API (`Service.imageUrl`). */
  imageUrl?: string | null;
  bannerUrl?: string | null;
  logoUrl?: string | null;
  portfolioImageUrls?: string[];
  nextAvailable?: string;
  todaySlotTimings?: string;
};

const ES_CATEGORY: Record<string, string> = {
  hairService: "Servicios para el cabello",
  spaService: "Spa y Bienestar",
  nailCare: "Cuidado de las Uñas",
  beautyService: "Servicios de Belleza",
  barber: "Barbershop",
  tattoo: "Estudio de tatuajes",
  yoga: "Yoga y fitness",
  estetica: "Centro de estética",
  dermatology: "Dermatología / clínica",
};

/** English labels for `categoryKey` from the API (must stay in sync with home/search UI). */
const EN_CATEGORY: Record<string, string> = {
  hairService: "Hair services",
  spaService: "Spa & wellness",
  nailCare: "Nail care",
  beautyService: "Beauty services",
  barber: "Barbershop",
  tattoo: "Tattoo studio",
  yoga: "Yoga & fitness",
  estetica: "Aesthetics center",
  dermatology: "Dermatology / clinic",
  Massage: "Massage",
  massage: "Massage",
};

/** Fallback tile images when API returns null (AWS S3 defaults). */
export { DEFAULT_CATEGORY_IMAGES };

export function categoryTileImageSrc(key: string, imageUrl?: string | null): string {
  const trimmed = (imageUrl || "").trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed.startsWith("/") ? `${API_BASE.replace(/\/api$/, "")}${trimmed}` : trimmed;
  }
  if (trimmed.startsWith("data:")) return trimmed;
  return defaultCategoryImageForKey(key);
}

export function categoryLabelEs(key: string): string {
  return ES_CATEGORY[key] || "Servicios de belleza";
}

export function categoryLabelFromKey(key: string, lang: "en" | "es"): string {
  if (lang === "en") {
    return EN_CATEGORY[key] || key;
  }
  return categoryLabelEs(key);
}

function isUsableImageUrl(u: string): boolean {
  const t = normalizePublicImageUrl(u);
  if (!t) return false;
  if (isS3PublicUrl(t)) return true;
  return t.startsWith("http") || t.startsWith("data:") || t.startsWith("/");
}

/** Stable hash for picking a consistent portfolio image per service id. */
export function stableHash32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash || 1;
}

/** Deterministic portfolio pick — same [seed] always maps to the same image. */
export function pickPortfolioImageUrl(portfolio: string[], seed: string): string | null {
  const usable = portfolio.filter((u) => isUsableImageUrl(u));
  if (!usable.length) return null;
  return usable[stableHash32(seed) % usable.length] ?? null;
}

/** Service tile: own image, else a stable random image from the business portfolio. */
export function serviceCardImageSrc(
  serviceImageUrl: string | null | undefined,
  portfolioImages: string[],
  serviceId: string,
): string {
  const svc = normalizePublicImageUrl(serviceImageUrl || "");
  if (isUsableImageUrl(svc)) return svc;
  const pick = pickPortfolioImageUrl(portfolioImages, serviceId);
  if (pick) return pick;
  const first = portfolioImages.find((u) => isUsableImageUrl(u));
  if (first) return normalizePublicImageUrl(first);
  return PLACEHOLDER_IMAGE_DATA_URI;
}

export function venueCardImageSrc(row: Pick<SearchVenueRow, "img" | "imageUrl" | "bannerUrl" | "logoUrl">): string {
  const serviceImg = (row.imageUrl || "").trim();
  if (isUsableImageUrl(serviceImg)) return serviceImg;

  const banner = (row.bannerUrl || "").trim();
  if (isUsableImageUrl(banner)) return banner;

  const logo = (row.logoUrl || "").trim();
  if (isUsableImageUrl(logo)) return logo;

  const raw = (row.img || "").trim().replace(/^photo-/, "");
  if (!raw) return PLACEHOLDER_IMAGE_DATA_URI;
  return `https://images.unsplash.com/photo-${raw}?q=80&w=800&fit=crop`;
}

/** Venue listings and home cards: prefer service image, then business banner, then logo. */
export function businessListingImageSrc(row: SearchVenueRow): string {
  const serviceImg = (row.imageUrl || "").trim();
  if (isUsableImageUrl(serviceImg)) return serviceImg;

  const banner = (row.bannerUrl || "").trim();
  if (isUsableImageUrl(banner)) return banner;

  const logo = (row.logoUrl || "").trim();
  if (isUsableImageUrl(logo)) return logo;

  return venueCardImageSrc(row);
}

/** Featured / hero tiles: prefer service image, then business banner or logo. */
export function businessBannerHeroSrc(row: SearchVenueRow): string {
  const serviceImg = (row.imageUrl || "").trim();
  if (isUsableImageUrl(serviceImg)) return serviceImg;

  const banner = (row.bannerUrl || "").trim();
  if (isUsableImageUrl(banner)) return banner;

  const logo = (row.logoUrl || "").trim();
  if (isUsableImageUrl(logo)) return logo;

  const portfolioPick = pickPortfolioImageUrl(row.portfolioImageUrls || [], row.businessId || row.id);
  if (portfolioPick) return portfolioPick;

  const raw = (row.img || "").trim().replace(/^photo-/, "");
  if (raw) return `https://images.unsplash.com/photo-${raw}?q=80&w=800&fit=crop`;

  return PLACEHOLDER_IMAGE_DATA_URI;
}

export function mapApiVenueToRow(v: ApiVenue, lang: "en" | "es" = "en"): SearchVenueRow {
  const priceNum = parseFloat(String(v.price).replace(/[^\d.]/g, "")) || 0;
  const reviewsNum = parseInt(String(v.reviews), 10) || 0;
  const ratingNum = parseFloat(String(v.rating)) || 0;
  return {
    id: v.businessId,
    businessId: v.businessId,
    name: v.name,
    category: categoryLabelFromKey(v.categoryKey, lang),
    categoryKey: v.categoryKey,
    rating: ratingNum,
    reviews: reviewsNum,
    price: priceNum,
    img: (v.unsplashImgId || "").replace(/^photo-/, ""),
    lat: v.lat,
    lng: v.lng,
    popular: ratingNum >= 4.8,
    locationLabel: v.locationLabel,
    distanceLabel: v.distanceLabel,
    serviceName: v.serviceName,
    serviceDurationMinutes: v.serviceDurationMinutes,
    imageUrl: v.imageUrl ?? null,
    bannerUrl: v.bannerUrl ?? null,
    logoUrl: v.logoUrl ?? null,
    portfolioImageUrls: Array.isArray(v.portfolioImageUrls) ? v.portfolioImageUrls : [],
    nextAvailable: v.nextAvailable,
    todaySlotTimings: v.todaySlotTimings,
  };
}

const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, cache: "no-store", signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

export type PaginatedApiVenues = {
  data: ApiVenue[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchPublicVenues(
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS,
  userGeo?: { lat: number; lng: number },
  filters?: { page?: number; limit?: number; search?: string; category?: string; minRating?: number; sortBy?: string }
): Promise<PaginatedApiVenues> {
  const params = new URLSearchParams();
  if (userGeo) {
    params.set("userLat", String(userGeo.lat));
    params.set("userLng", String(userGeo.lng));
  }
  if (filters?.page) params.set("page", String(filters.page));
  if (filters?.limit) params.set("limit", String(filters.limit));
  if (filters?.search) params.set("search", filters.search);
  if (filters?.category) params.set("category", filters.category);
  if (filters?.minRating) params.set("minRating", String(filters.minRating));
  if (filters?.sortBy) params.set("sortBy", filters.sortBy);

  const qs = params.toString();
  const url = `${API_BASE}/mobile/venues${qs ? `?${qs}` : ""}`;
  let res: Response;
  try {
    res = await fetchWithTimeout(url, {}, timeoutMs);
  } catch (e: unknown) {
    const name = e instanceof Error ? e.name : "";
    if (name === "AbortError") {
      throw new Error("Unable to load venues. Please try again in a moment.");
    }
    throw e instanceof Error ? e : new Error("Unable to load venues right now.");
  }
  if (!res.ok) throw new Error("Unable to load venues right now.");
  
  const raw = await res.json();
  // Handle both old array response (for safety) and new object response
  if (Array.isArray(raw)) {
    return {
      data: raw,
      total: raw.length,
      page: 1,
      limit: raw.length,
      totalPages: 1,
    };
  }
  return raw as PaginatedApiVenues;
}

export type PublicCategory = {
  id: string;
  key: string;
  labelEn: string;
  labelEs: string;
  imageUrl?: string | null;
  active: boolean;
  sortOrder: number;
  /** Active businesses offering this category (API-enriched). */
  activeBusinessCount?: number;
  /** Comma-separated keys sent to search/venues `category` param (partner business type). */
  filterParam?: string;
  /** Partner business type id (`salon`, `tattoo`, …). */
  partnerTypeId?: string;
};

/** Expand selected filter values (may be comma-separated) into unique category keys. */
export function expandCategoryFilterParams(selected: string[]): string[] {
  const keys = new Set<string>();
  for (const sel of selected) {
    for (const part of sel.split(',')) {
      const k = part.trim();
      if (k) keys.add(k);
    }
  }
  return Array.from(keys);
}

export function categoryFilterParamFromSelection(selected: string[]): string {
  return expandCategoryFilterParams(selected).join(',');
}

export async function fetchPublicCategories(): Promise<PublicCategory[]> {
  const res = await fetch(`${API_BASE}/public/categories`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load categories");
  return res.json() as Promise<PublicCategory[]>;
}

export type PublicAmenity = {
  id: string;
  key: string;
  labelEn: string;
  labelEs: string;
  descriptionEn?: string | null;
  descriptionEs?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
};

export async function fetchPublicAmenities(): Promise<PublicAmenity[]> {
  const res = await fetch(`${API_BASE}/public/amenities`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load amenities");
  return res.json() as Promise<PublicAmenity[]>;
}

export type PublicEvent = {
  id: string;
  title: string;
  body: string;
  startAt: string;
  location: string;
  price: number;
  imageKey: string | null;
  websiteUrl?: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export async function fetchPublicEvents(
  page = 1,
  limit = 12,
): Promise<PaginatedResponse<PublicEvent>> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  const res = await fetch(`${API_BASE}/mobile/events?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load events");
  const raw = await res.json();
  if (Array.isArray(raw)) {
    return {
      data: raw as PublicEvent[],
      total: raw.length,
      page: 1,
      limit: raw.length,
      totalPages: 1,
    };
  }
  return raw as PaginatedResponse<PublicEvent>;
}

export function publicEventImageSrc(e: PublicEvent): string {
  const k = (e.imageKey || "").trim();
  if (!k) return PLACEHOLDER_IMAGE_DATA_URI;
  if (k.startsWith("http") || k.startsWith("/") || k.startsWith("data:")) return k;
  return `https://images.unsplash.com/photo-${k.replace(/^photo-/, "")}?q=80&w=800&fit=crop`;
}
