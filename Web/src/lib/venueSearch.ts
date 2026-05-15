import { PLACEHOLDER_IMAGE_DATA_URI } from "./placeholderImage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api";

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
  locationLabel: string;
  distanceLabel: string;
  serviceName?: string;
  serviceDurationMinutes?: number;
  amenityKeys?: string[];
  amenityLabelsEn?: string[];
  amenityLabelsEs?: string[];
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
};

const ES_CATEGORY: Record<string, string> = {
  hairService: "Servicios para el cabello",
  spaService: "Spa y Bienestar",
  nailCare: "Cuidado de las Uñas",
  beautyService: "Servicios de Belleza",
  barber: "Barbershop",
};

/** English labels for `categoryKey` from the API (must stay in sync with home/search UI). */
const EN_CATEGORY: Record<string, string> = {
  hairService: "Hair services",
  spaService: "Spa & wellness",
  nailCare: "Nail care",
  beautyService: "Beauty services",
  barber: "Barbershop",
};

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
  const t = u.trim();
  return t.startsWith("http") || t.startsWith("data:") || t.startsWith("/");
}

export function venueCardImageSrc(row: Pick<SearchVenueRow, "img" | "imageUrl">): string {
  const u = (row.imageUrl || "").trim();
  if (isUsableImageUrl(u)) return u;
  const raw = (row.img || "").trim().replace(/^photo-/, "");
  if (!raw) return PLACEHOLDER_IMAGE_DATA_URI;
  return `https://images.unsplash.com/photo-${raw}?q=80&w=800&fit=crop`;
}

/** Venue listings and home cards: prefer business banner, then logo, then service photo / fallback. */
export function businessListingImageSrc(row: SearchVenueRow): string {
  const banner = (row.bannerUrl || "").trim();
  if (isUsableImageUrl(banner)) return banner;
  const logo = (row.logoUrl || "").trim();
  if (isUsableImageUrl(logo)) return logo;
  return venueCardImageSrc(row);
}

/** Featured / hero tiles: business banner or logo only — never the service thumbnail (`imageUrl`). */
export function businessBannerHeroSrc(row: SearchVenueRow): string {
  const banner = (row.bannerUrl || "").trim();
  if (isUsableImageUrl(banner)) return banner;
  const logo = (row.logoUrl || "").trim();
  if (isUsableImageUrl(logo)) return logo;
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
      throw new Error(
        `Venues request timed out after ${timeoutMs / 1000}s. Is the API running at ${API_BASE}?`,
      );
    }
    throw e instanceof Error ? e : new Error("Failed to reach venues API");
  }
  if (!res.ok) throw new Error(`Failed to load venues (${res.status}). Check ${API_BASE}/mobile/venues`);
  
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
};

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
};

export async function fetchPublicEvents(): Promise<PublicEvent[]> {
  const res = await fetch(`${API_BASE}/mobile/events`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load events");
  return res.json() as Promise<PublicEvent[]>;
}
