import type { SearchVenueRow } from '@/lib/venueSearch';

function dedupeByBusinessId(venues: SearchVenueRow[]): SearchVenueRow[] {
  const seen = new Set<string>();
  return venues.filter((v) => {
    if (seen.has(v.businessId)) return false;
    seen.add(v.businessId);
    return true;
  });
}

/**
 * Featured = highest-rated venues (editorial “recommended”).
 * Top services = most-reviewed venues, excluding businesses already in Featured.
 */
export function splitHomeFeaturedAndTopServices(venues: SearchVenueRow[]): {
  featured: SearchVenueRow[];
  topServices: SearchVenueRow[];
} {
  const unique = dedupeByBusinessId(venues);

  const featured = dedupeByBusinessId(
    [...unique].sort(
      (a, b) =>
        b.rating - a.rating ||
        b.reviews - a.reviews ||
        a.businessId.localeCompare(b.businessId),
    ),
  ).slice(0, 5);

  const featuredIds = new Set(featured.map((v) => v.businessId));

  const topServices = dedupeByBusinessId(
    [...unique]
      .filter((v) => !featuredIds.has(v.businessId))
      .sort(
        (a, b) =>
          b.reviews - a.reviews ||
          b.rating - a.rating ||
          a.businessId.localeCompare(b.businessId),
      ),
  ).slice(0, 6);

  return { featured, topServices };
}

/** Show up to the largest allowed count that does not exceed available items. */
export function sliceByAvailability<T>(items: T[], allowedCounts: readonly number[]): T[] {
  if (items.length === 0) return [];
  const cap = [...allowedCounts].sort((a, b) => b - a).find((n) => n <= items.length);
  return items.slice(0, cap ?? items.length);
}
