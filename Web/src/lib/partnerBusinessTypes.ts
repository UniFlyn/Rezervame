/**
 * Canonical “type of business” tiles (rezervame-socios.html).
 * Used on /partners, home browse, and /business/join — maps to platform categoryKeys.
 */
import { categoryTileImageSrc } from "./venueSearch";

export type PartnerBusinessType = {
  /** Form value / URL param (`?type=salon`). */
  id: string;
  emoji: string;
  /** i18n keys: `${labelKey}Title`, `${labelKey}Desc`, `${labelKey}F1`…`F3`. */
  labelKey: string;
  /** Primary key for search tiles and default imagery. */
  primaryCategoryKey: string;
  /** Stored on Business.categoryKeys at registration. */
  categoryKeys: string[];
};

export const PARTNER_BUSINESS_TYPES: PartnerBusinessType[] = [
  {
    id: "salon",
    emoji: "💇‍♀️",
    labelKey: "partnersTypeSalon",
    primaryCategoryKey: "hairService",
    categoryKeys: ["hairService", "beautyService"],
  },
  {
    id: "barberia",
    emoji: "✂️",
    labelKey: "partnersTypeBarber",
    primaryCategoryKey: "barber",
    categoryKeys: ["barber"],
  },
  {
    id: "nails",
    emoji: "💅",
    labelKey: "partnersTypeNails",
    primaryCategoryKey: "nailCare",
    categoryKeys: ["nailCare"],
  },
  {
    id: "tattoo",
    emoji: "🎨",
    labelKey: "partnersTypeTattoo",
    primaryCategoryKey: "tattoo",
    categoryKeys: ["tattoo"],
  },
  {
    id: "spa",
    emoji: "💆",
    labelKey: "partnersTypeSpa",
    primaryCategoryKey: "spaService",
    categoryKeys: ["spaService", "massage"],
  },
  {
    id: "estetica",
    emoji: "✨",
    labelKey: "partnersTypeEstetica",
    primaryCategoryKey: "estetica",
    categoryKeys: ["estetica"],
  },
  {
    id: "dermatologo",
    emoji: "🩺",
    labelKey: "partnersTypeDerm",
    primaryCategoryKey: "dermatology",
    categoryKeys: ["dermatology"],
  },
  {
    id: "yoga",
    emoji: "🧘",
    labelKey: "partnersTypeYoga",
    primaryCategoryKey: "yoga",
    categoryKeys: ["yoga"],
  },
];

export function partnerTypeById(id: string | null | undefined): PartnerBusinessType | undefined {
  const t = (id || "").trim().toLowerCase();
  if (!t) return undefined;
  return PARTNER_BUSINESS_TYPES.find((p) => p.id === t);
}

export function categoryKeysForPartnerType(id: string): string[] {
  return partnerTypeById(id)?.categoryKeys ?? [];
}

/** Resolve partner tile id from stored keys and/or registration `businessType`. */
export function inferPartnerTypeId(
  categoryKeys: string[] | null | undefined,
  businessType?: string | null,
): string {
  const fromReg = partnerTypeById(businessType);
  if (fromReg) return fromReg.id;
  const keys = Array.from(
    new Set((categoryKeys ?? []).map((k) => k.trim()).filter(Boolean)),
  );
  const sig = keys.slice().sort().join(",");
  for (const p of PARTNER_BUSINESS_TYPES) {
    if (p.categoryKeys.slice().sort().join(",") === sig) return p.id;
  }
  for (const p of PARTNER_BUSINESS_TYPES) {
    if (p.categoryKeys.every((k) => keys.includes(k))) return p.id;
  }
  if (keys.includes("barber")) return "barberia";
  if (keys.includes("nailCare")) return "nails";
  if (keys.includes("tattoo")) return "tattoo";
  if (keys.includes("estetica")) return "estetica";
  if (keys.includes("dermatology")) return "dermatologo";
  if (keys.includes("yoga")) return "yoga";
  if (keys.includes("spaService") || keys.includes("massage")) return "spa";
  if (keys.includes("hairService") || keys.includes("beautyService")) return "salon";
  return "";
}

/** Search filter: comma-separated category keys (API `category` param). */
export function searchCategoryParamForPartnerType(id: string): string {
  const row = partnerTypeById(id);
  if (!row) return "";
  return row.categoryKeys.join(",");
}

export function partnerTypeTileImage(type: PartnerBusinessType, apiImageUrl?: string | null): string {
  return categoryTileImageSrc(type.primaryCategoryKey, apiImageUrl);
}
