import type { SearchVenueRow } from '@/lib/venueSearch';
import {
  PARTNER_BUSINESS_TYPES,
  partnerTypeTileImage,
  searchCategoryParamForPartnerType,
} from '@/lib/partnerBusinessTypes';

const FEATURED_TARGET = 5;
const TOP_TARGET = 6;

export const DISCOVERY_PLACEHOLDER_PREFIX = 'discovery:';

export function isDiscoveryPlaceholderBusinessId(id: string): boolean {
  return String(id || '').startsWith(DISCOVERY_PLACEHOLDER_PREFIX);
}

export function searchCategoryForDiscoveryPlaceholder(businessId: string): string {
  const typeId = businessId.slice(DISCOVERY_PLACEHOLDER_PREFIX.length);
  return searchCategoryParamForPartnerType(typeId);
}

function dedupeByBusinessId(venues: SearchVenueRow[]): SearchVenueRow[] {
  const seen = new Set<string>();
  return venues.filter((v) => {
    const id = (v.businessId || v.id || '').trim();
    if (!id) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Stable-ish daily shuffle so home rows vary but do not flicker every render. */
function shuffledArray<T>(items: T[], seed: string): T[] {
  const arr = [...items];
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  for (let i = arr.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const j = (h >>> 0) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function shuffledVenues(venues: SearchVenueRow[], seed: string): SearchVenueRow[] {
  return shuffledArray(venues, seed);
}

function sortByRating(a: SearchVenueRow, b: SearchVenueRow) {
  return (
    b.rating - a.rating ||
    b.reviews - a.reviews ||
    a.businessId.localeCompare(b.businessId)
  );
}

function sortByReviews(a: SearchVenueRow, b: SearchVenueRow) {
  return (
    b.reviews - a.reviews ||
    b.rating - a.rating ||
    a.businessId.localeCompare(b.businessId)
  );
}

function fillToCount(
  primary: SearchVenueRow[],
  pool: SearchVenueRow[],
  target: number,
): SearchVenueRow[] {
  const out = [...primary];
  const ids = new Set(out.map((v) => v.businessId));
  for (const v of pool) {
    if (out.length >= target) break;
    if (ids.has(v.businessId)) continue;
    ids.add(v.businessId);
    out.push(v);
  }
  return out.slice(0, target);
}

/** Shuffled category tiles used when the live catalog cannot fill a home section. */
export function buildHomeDiscoveryPlaceholders(seed: string): SearchVenueRow[] {
  const types = shuffledArray([...PARTNER_BUSINESS_TYPES], seed);
  return types.map((type, index) => {
    const businessId = `${DISCOVERY_PLACEHOLDER_PREFIX}${type.id}`;
    const img = partnerTypeTileImage(type);
    const rating = 4.4 + (index % 6) * 0.1;
    const reviews = 12 + ((index * 17) % 88);
    const price = 18 + ((index * 11) % 72);
    return {
      id: businessId,
      businessId,
      name: type.primaryCategoryKey,
      category: type.primaryCategoryKey,
      categoryKey: type.primaryCategoryKey,
      rating,
      reviews,
      price,
      img,
      lat: 0,
      lng: 0,
      popular: false,
      locationLabel: '',
      distanceLabel: '',
      serviceName: type.primaryCategoryKey,
      serviceDurationMinutes: 45,
      imageUrl: img,
      bannerUrl: img,
      isDiscoveryPlaceholder: true,
      placeholderLabelKey: type.labelKey,
    };
  });
}

/**
 * Featured = highest-rated venues (up to 5).
 * Top services = most-reviewed venues (up to 6), preferring businesses not in Featured.
 * Backfill from shuffled real venues, then discovery placeholders so sections are never empty.
 */
export function splitHomeFeaturedAndTopServices(
  venues: SearchVenueRow[],
  seed = 'home',
): {
  featured: SearchVenueRow[];
  topServices: SearchVenueRow[];
} {
  const placeholders = buildHomeDiscoveryPlaceholders(`${seed}-ph`);
  const unique = dedupeByBusinessId(venues);

  if (unique.length === 0) {
    return {
      featured: fillToCount([], placeholders, FEATURED_TARGET),
      topServices: fillToCount(
        [],
        shuffledVenues(placeholders, `${seed}-top-ph`),
        TOP_TARGET,
      ),
    };
  }

  const randomPool = shuffledVenues(unique, seed);
  const byRating = [...unique].sort(sortByRating);
  const byReviews = [...unique].sort(sortByReviews);

  let featured = fillToCount(byRating.slice(0, FEATURED_TARGET), randomPool, FEATURED_TARGET);

  const featuredIds = new Set(featured.map((v) => v.businessId));
  const topPrimary = byReviews.filter((v) => !featuredIds.has(v.businessId));
  const topPool = shuffledVenues(
    unique.filter((v) => !featuredIds.has(v.businessId)),
    `${seed}-top`,
  );

  let topServices = fillToCount(topPrimary.slice(0, TOP_TARGET), topPool, TOP_TARGET);

  if (topServices.length < TOP_TARGET) {
    topServices = fillToCount(
      topServices,
      shuffledVenues(byReviews, `${seed}-top-fallback`),
      TOP_TARGET,
    );
  }

  const featuredTarget = FEATURED_TARGET;
  if (featured.length < featuredTarget) {
    featured = fillToCount(
      featured,
      shuffledVenues([...byRating, ...placeholders], `${seed}-feat-fallback`),
      featuredTarget,
    );
  }

  if (topServices.length < TOP_TARGET) {
    topServices = fillToCount(
      topServices,
      shuffledVenues([...byReviews, ...placeholders], `${seed}-top-ph-fill`),
      TOP_TARGET,
    );
  }

  return { featured, topServices };
}

/** Show up to maxCount items; never return empty when the pool has entries. */
export function pickHomeSectionDisplay<T>(items: T[], maxCount: number): T[] {
  if (items.length === 0) return [];
  return items.slice(0, Math.min(maxCount, items.length));
}

/** @deprecated use pickHomeSectionDisplay */
export function sliceByAvailability<T>(items: T[], allowedCounts: readonly number[]): T[] {
  if (items.length === 0) return [];
  const cap = [...allowedCounts].sort((a, b) => b - a).find((n) => n <= items.length);
  return items.slice(0, cap ?? items.length);
}
