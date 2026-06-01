"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "../../../components/I18nProvider";
import {
  MapPin,
  Star,
  Clock,
  Heart,
  ChevronLeft,
  Share2,
  Info,
  Check,
  Phone,
  Mail,
  Instagram,
  Youtube,
  Twitter,
  X,
  Scissors,
} from "lucide-react";
import { BookingModal, type BookingModalVenueData } from "../../../components/BookingModal";
import { formatCancellationPolicyMessage, normalizeCancellationPolicy } from "@/lib/cancellationPolicy";
import { usePathname, useRouter } from "next/navigation";
import { resolveVenueBusinessId } from "@/lib/resolveVenueBusinessId";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { amenityLucideIcon } from "@/lib/amenityIcons";
import { AppLoader } from "@/components/ui/AppLoader";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { fetchPublicCategories, serviceCardImageSrc, type PublicCategory } from "@/lib/venueSearch";
import { normalizePublicImageUrl } from "@/lib/s3Assets";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/lib/toast";
import { userFacingError } from "@/lib/userFacingError";
import { useAuth } from "@/components/AuthProvider";
import { formatAvailabilityDisplay, formatStaffStatValue, parseAvailability } from "@/lib/staffAvailability";
import { getNextAvailableSlotLabel } from "@/lib/bookingSlots";
import { usePageHeaderMeta } from "@/contexts/PageHeaderMetaContext";
import { useVenueBookingCartStore } from "@/store/venueBookingCartStore";
import { VenueDetailSections, type VenueDetailSection } from "@/components/venue/VenueDetailSections";

type VenueService = { id: string; name: string; description: string; time: string; price: number; image?: string | null; tag: string };
type VenueTeam = {
  id: string;
  name: string;
  role: string;
  rating: number;
  reviews: number;
  clients: string;
  years: string;
  img: string;
  bio: string;
  serviceIds: string[];
  availability: string;
};
type VenueAmenity = { key: string; name: string; desc: string };

export type VenueState = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviews: number;
  address: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  images: string[];
  services: VenueService[];
  team: VenueTeam[];
  schedule: { day: string; hours: string }[];
  socials: { instagram: string; tiktok: string; youtube: string; x: string };
  amenities: VenueAmenity[];
  contactPhone: string;
  contactEmail: string;
  taxPercentage: number;
  commissionPercent: number;
  appointmentApprovalMode?: 'manual' | 'automatic';
  cancellationAllowed?: boolean;
  cancellationHoursBefore?: number;
  cancellationPolicyMessage?: string;
  venueDetailSections?: VenueDetailSection[];
};

function memberOffersService(member: VenueTeam, serviceId: string): boolean {
  if (!member.serviceIds?.length) return true;
  return member.serviceIds.includes(serviceId);
}

function servicesForMember(member: VenueTeam, services: VenueService[]): VenueService[] {
  return services.filter((s) => memberOffersService(member, s.id));
}

function buildGalleryImages(
  rawImages: string[] | undefined,
  banner: string,
  logo: string,
): string[] {
  const skip = new Set([banner, logo].filter(Boolean));
  const out: string[] = [];
  const push = (u?: string) => {
    const s = normalizePublicImageUrl(u || "");
    if (!s || skip.has(s) || out.includes(s)) return;
    out.push(s);
  };
  if (Array.isArray(rawImages)) rawImages.forEach((img) => push(img));
  if (out.length === 0) {
    if (banner) out.push(banner);
    else if (logo) out.push(logo);
    else out.push(PLACEHOLDER_IMAGE_DATA_URI);
  }
  return out;
}

function emptyVenue(venueId: string): VenueState {
  return {
    id: venueId,
    name: "—",
    category: "—",
    rating: 0,
    reviews: 0,
    address: "",
    description: "",
    logoUrl: '',
    bannerUrl: '',
    images: [PLACEHOLDER_IMAGE_DATA_URI],
    services: [],
    team: [],
    schedule: [],
    socials: { instagram: "", tiktok: "", youtube: "", x: "" },
    amenities: [],
    contactPhone: "",
    contactEmail: "",
    taxPercentage: 0,
    commissionPercent: 15,
    appointmentApprovalMode: 'manual',
  };
}

function shouldRetryVenueLoad(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const text = msg.toLowerCase();
  return (
    text.includes("502") ||
    text.includes("503") ||
    text.includes("bad gateway") ||
    text.includes("invalid json") ||
    text.includes("timing out") ||
    text.includes("longer than usual")
  );
}

async function withRetries<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (!shouldRetryVenueLoad(err) || i === attempts - 1) throw err;
      await new Promise((r) => setTimeout(r, 700 * (i + 1)));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Failed to load venue");
}

export default function VenueDetailsPage({ businessId }: { businessId: string }) {
  const { t, language } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const venueId = resolveVenueBusinessId(pathname, businessId);
  const { isLoggedIn, setIsLoginModalOpen, setPendingAfterLogin } = useAuth();
  const [venueData, setVenueData] = useState<VenueState>(() => emptyVenue(venueId || businessId));
  const [reviewRows, setReviewRows] = useState<
    Array<{
      id: string;
      customerName: string;
      date: string;
      rating: number;
      comment: string;
      reply?: string | null;
      initials: string;
    }>
  >([]);
  const [browseCategories, setBrowseCategories] = useState<PublicCategory[]>([]);
  const [activeTab, setActiveTab] = useState<"services" | "team" | "portfolio" | "reviews" | "amenities">("services");
  const [activeServiceFilter, setActiveServiceFilter] = useState<"all" | "women" | "men" | "kids" | "promotions">("all");
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [portfolioLightbox, setPortfolioLightbox] = useState<number | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [crossVenuePendingServiceId, setCrossVenuePendingServiceId] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [profileStaff, setProfileStaff] = useState<VenueTeam | null>(null);
  const [venueLoading, setVenueLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bestsellerMap, setBestsellerMap] = useState<Record<string, number>>({});
  const [promotionServiceIds, setPromotionServiceIds] = useState<Set<string>>(new Set());
  const [promotionData, setPromotionData] = useState<Array<{ serviceId: string; discountPercent: number; label?: string | null }>>([]);

  const { setMeta, clearMeta } = usePageHeaderMeta();

  const cartBusinessId = useVenueBookingCartStore((s) => s.businessId);
  const cartServiceIds = useVenueBookingCartStore((s) => s.serviceIds);

  useEffect(() => {
    if (cartBusinessId === venueId) {
      setSelectedServices([...cartServiceIds]);
    } else {
      setSelectedServices([]);
    }
  }, [venueId, cartBusinessId, cartServiceIds]);

  const applyServiceAdd = (serviceId: string) => {
    const storeApi = useVenueBookingCartStore.getState();
    const { businessId: cartBiz, serviceIds: cartIds } = storeApi;
    const onThisVenue = cartBiz === venueId;
    const currentIds = onThisVenue ? cartIds : [];

    if (cartIds.length > 0 && cartBiz !== null && cartBiz !== venueId) {
      setCrossVenuePendingServiceId(serviceId);
      return;
    }
    storeApi.setCart(venueId, [...currentIds, serviceId]);
  };

  const applyServiceRemove = (serviceId: string) => {
    useVenueBookingCartStore.getState().removeService(venueId, serviceId);
  };

  const onServiceBookClick = (serviceId: string) => {
    if (!isLoggedIn) {
      setPendingAfterLogin(() => () => applyServiceAdd(serviceId));
      setIsLoginModalOpen(true);
      toastInfo(t("venueLoginToAddTitle"), t("venueLoginToAddBody"));
      return;
    }
    applyServiceAdd(serviceId);
  };

  const confirmCrossVenueReplace = () => {
    if (!crossVenuePendingServiceId) return;
    const next = [crossVenuePendingServiceId];
    setSelectedServices(next);
    useVenueBookingCartStore.getState().setCart(venueId, next);
    setCrossVenuePendingServiceId(null);
  };

  const openBookingModal = () => {
    if (!isLoggedIn) {
      setPendingAfterLogin(() => () => openBookingModal());
      setIsLoginModalOpen(true);
      toastInfo(t("venueLoginToBookTitle"), t("venueLoginToBookBody"));
      return;
    }
    if (selectedServices.length === 0) return;
    setProfileStaff(null);
    setIsBookingModalOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = venueData.name;
    const text = `${t("venueShareText")} ${venueData.name} ${t("venueShareTextAt")} ${venueData.address}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(url);
      toastInfo(t("venueShareCopiedTitle"), t("venueShareCopiedBody"));
    }
  };

  const handleToggleFavorite = async () => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    try {
      if (isFavorite) {
        await apiDelete(`/mobile/favorites/${venueId}`, "USER");
        setIsFavorite(false);
        toastSuccess(t("venueFavRemovedTitle"), t("venueFavRemovedBody"));
      } else {
        await apiPost("/mobile/favorites", { businessId: venueId }, "USER");
        setIsFavorite(true);
        toastSuccess(t("venueFavAddedTitle"), t("venueFavAddedBody"));
      }
    } catch (err) {
      toastError(t("venueFavErrorTitle"), t("venueFavErrorBody"));
    }
  };

  useEffect(() => {
    void fetchPublicCategories()
      .then(setBrowseCategories)
      .catch(() => setBrowseCategories([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setVenueLoading(true);
      const base = emptyVenue(venueId);
      try {
        if (!venueId) {
          setVenueData(emptyVenue(""));
          setVenueLoading(false);
          toastWarning(t("venueUnavailableTitle"), t("venueUnavailableBody"));
          return;
        }
        const business = await withRetries(
          () => apiGet<Record<string, unknown> | null>(`/business/${venueId}`),
          3,
        );
        if (!business) {
          if (!cancelled) {
            setVenueData(base);
            setReviewRows([]);
            toastWarning(t("venueUnavailableTitle"), t("venueUnavailableBody"));
          }
          return;
        }
        const [services, staff, reviews, favorites, bestsellers, promotions] = await Promise.all([
          withRetries(() => apiGet<unknown[]>(`/business/${venueId}/services`), 2).catch(() => [] as unknown[]),
          withRetries(() => apiGet<unknown[]>(`/business/${venueId}/staff`), 2).catch(() => [] as unknown[]),
          withRetries(() => apiGet<unknown[]>(`/business/${venueId}/reviews`), 2).catch(() => [] as unknown[]),
          isLoggedIn
            ? apiGet<{ data?: { businessId?: string }[] } | { businessId?: string }[]>(
                `/mobile/favorites?limit=100`,
                "USER",
              ).catch(() => ({ data: [] }))
            : Promise.resolve({ data: [] }),
          apiGet<Array<{ serviceId: string; bookingCount: number }>>(`/business/${venueId}/bestsellers`).catch(() => []),
          apiGet<Array<{ serviceId: string; discountPercent: number; label?: string | null }>>(`/business/${venueId}/promotions`).catch(() => []),
        ]);
        // Process bestsellers
        const bMap: Record<string, number> = {};
        if (Array.isArray(bestsellers)) bestsellers.forEach(b => { if (b.serviceId) bMap[b.serviceId] = b.bookingCount; });
        setBestsellerMap(bMap);
        // Process promotions
        const promoIds = new Set<string>();
        const promoArr: Array<{ serviceId: string; discountPercent: number; label?: string | null }> = [];
        if (Array.isArray(promotions)) promotions.forEach(p => { 
          if (p.serviceId) { promoIds.add(p.serviceId); promoArr.push(p); }
        });
        setPromotionServiceIds(promoIds);
        setPromotionData(promoArr);
        if (isLoggedIn) {
          const favRows = Array.isArray(favorites)
            ? favorites
            : Array.isArray((favorites as { data?: { businessId?: string }[] })?.data)
              ? (favorites as { data: { businessId?: string }[] }).data
              : [];
          setIsFavorite(favRows.some((f) => f.businessId === venueId));
        }
        const b = business as {
          banner?: string;
          logo?: string;
          images?: string[];
          contactPhone?: string;
          contactEmail?: string;
          socialInstagram?: string;
          socialTiktok?: string;
          socialYoutube?: string;
          socialX?: string;
          workingHours?: string;
          amenities?: Array<{
            key: string;
            labelEn?: string;
            labelEs?: string;
            descriptionEn?: string | null;
            descriptionEs?: string | null;
          }>;
        };
        const contactPhone = String((business as { contactPhone?: string }).contactPhone ?? "");
        const contactEmail = String((business as { contactEmail?: string }).contactEmail ?? "");
        const logoUrl = normalizePublicImageUrl(
          String((business as { logo?: string }).logo ?? b.logo ?? ""),
        );
        const bannerUrl = normalizePublicImageUrl(
          String((business as { banner?: string }).banner ?? b.banner ?? ""),
        );
        const portfolioFromApi = Array.isArray(
          (business as { portfolioImageUrls?: string[] }).portfolioImageUrls,
        )
          ? (business as { portfolioImageUrls: string[] }).portfolioImageUrls
          : [];
        const regPhotos = Array.isArray((business as { registrationPhotoUrls?: string[] }).registrationPhotoUrls)
          ? (business as { registrationPhotoUrls: string[] }).registrationPhotoUrls.map((u) =>
              normalizePublicImageUrl(u),
            )
          : [];
        const rawGallery =
          portfolioFromApi.length > 0
            ? portfolioFromApi
            : Array.isArray((business as { images?: string[] }).images)
              ? (business as { images: string[] }).images
              : [];
        const imgs = buildGalleryImages(
          [...regPhotos.filter(Boolean), ...rawGallery],
          bannerUrl,
          logoUrl,
        );
        const venueDetailSections = Array.isArray((business as { venueDetailSections?: VenueDetailSection[] }).venueDetailSections)
          ? (business as { venueDetailSections: VenueDetailSection[] }).venueDetailSections
          : [];

        let amenities: VenueAmenity[] = [];
        if (Array.isArray(b.amenities) && b.amenities.length > 0) {
          amenities = b.amenities.map((am) => ({
            key: am.key,
            name: String(am.labelEn ?? am.labelEs ?? am.key).trim() || am.key,
            desc: String(am.descriptionEn ?? am.descriptionEs ?? "").trim() || "—",
          }));
        }

        const svcList = Array.isArray(services) ? services : (services as any)?.data || [];
        const staffList = Array.isArray(staff) ? staff : (staff as any)?.data || [];
        const revList = Array.isArray(reviews) ? reviews : (reviews as any)?.data || [];



        if (cancelled) return;

        // Group reviews by user and date to show as a single "visit"
        const groupedReviews: Record<string, any> = {};
        revList.forEach((r: any) => {
          const d = new Date(r.date);
          const dateKey = Number.isNaN(d.getTime())
            ? "invalid"
            : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
          
          // Use userId if available, otherwise fallback to customerName
          const groupKey = `${r.userId || r.customerName}_${dateKey}`;
          
          if (!groupedReviews[groupKey]) {
            groupedReviews[groupKey] = {
              ...r,
              ratingSum: Number(r.rating) || 0,
              ratingCount: 1,
              comments: r.comment && r.comment.trim() ? [r.comment.trim()] : [],
              reply: r.reply,
              formattedDate: dateKey === "invalid" ? "" : d.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            };
          } else {
            groupedReviews[groupKey].ratingSum += Number(r.rating) || 0;
            groupedReviews[groupKey].ratingCount += 1;
            if (r.comment && r.comment.trim() && !groupedReviews[groupKey].comments.includes(r.comment.trim())) {
              groupedReviews[groupKey].comments.push(r.comment.trim());
            }
            if (r.reply && !groupedReviews[groupKey].reply) {
              groupedReviews[groupKey].reply = r.reply;
            }
          }
        });

        const finalReviewRows = Object.values(groupedReviews).map((g: any) => {
          const initials = (g.customerName || "?")
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((p: string) => p[0]?.toUpperCase())
            .join("");
            
          return {
            id: g.id,
            customerName: g.customerName,
            date: g.formattedDate,
            rating: Math.round(g.ratingSum / g.ratingCount),
            comment: g.comments.join(" | "),
            reply: g.reply,
            initials: initials || "?",
          };
        });

        setReviewRows(finalReviewRows);

        if (cancelled) return;

        const bizData = business as any;
        const apiRating = parseFloat(String(bizData.rating || '0'));
        const apiReviews = parseInt(String(bizData.reviews || '0'), 10);

        setVenueData({
          ...base,
          id: String((business as { id?: string }).id ?? venueId),
          name: String((business as { name?: string }).name ?? "—"),
          category: String((business as { category?: string }).category ?? "—"),
          rating: apiRating,
          reviews: apiReviews,
          address: String((business as { location?: string }).location ?? ""),
          description: String((business as { description?: string }).description ?? ""),
          logoUrl,
          bannerUrl,
          images: imgs,
          amenities,
          services: svcList.map((s: any) => {
            const row = s as { id: string; name: string; category: string; duration: number; price: number; imageUrl?: string | null };
            return {
              id: String(row.id),
              name: row.name,
              description: row.category || "—",
              time: `${row.duration} min`,
              price: row.price,
              image: serviceCardImageSrc(row.imageUrl, imgs, String(row.id)),
              tag: "all",
            };
          }),
          team: staffList.map((m: any) => {
            const row = m as any;
            const img = (row.image || "").trim();
            const svcIds = Array.isArray(row.serviceIds) ? row.serviceIds.map(String) : [];
            return {
              id: String(row.id),
              name: row.name,
              role: row.role,
              rating: Number(row.rating) || 0,
              reviews: Number(row.reviews) || 0,
              clients: formatStaffStatValue(row.clients),
              years: formatStaffStatValue(row.experienceYears),
              img: img || PLACEHOLDER_IMAGE_DATA_URI,
              bio: row.bio || (Array.isArray(row.skills) && row.skills.length ? row.skills.join(", ") : "—"),
              serviceIds: svcIds,
              availability: String(row.availability ?? ""),
            };
          }),
          schedule: (() => {
            try {
              if (b.workingHours) {
                const parsed = JSON.parse(b.workingHours);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  return parsed.map((item: any) => {
                    let hoursStr = "";
                    if (item.hours !== undefined) {
                      hoursStr = String(item.hours || "");
                    } else if (item.open === false) {
                      hoursStr = "Closed";
                    } else if (item.start && item.end) {
                      hoursStr = `${item.start} - ${item.end}`;
                    } else {
                      hoursStr = "Closed";
                    }
                    return {
                      day: String(item.day || ""),
                      hours: hoursStr,
                    };
                  });
                }
              }
            } catch (e) {
              console.error("Error parsing workingHours JSON:", e);
            }
            return [
              { day: "Monday", hours: "9:00 AM - 6:00 PM" },
              { day: "Tuesday", hours: "9:00 AM - 6:00 PM" },
              { day: "Wednesday", hours: "9:00 AM - 6:00 PM" },
              { day: "Thursday", hours: "9:00 AM - 6:00 PM" },
              { day: "Friday", hours: "9:00 AM - 6:00 PM" },
              { day: "Saturday", hours: "10:00 AM - 4:00 PM" },
              { day: "Sunday", hours: "Closed" },
            ];
          })(),
          socials: {
            instagram: (b.socialInstagram || "").trim(),
            tiktok: (b.socialTiktok || "").trim(),
            youtube: (b.socialYoutube || "").trim(),
            x: (b.socialX || "").trim(),
          },
          contactPhone,
          contactEmail,
          taxPercentage: Number((business as { taxPercentage?: number }).taxPercentage ?? 0) || 0,
          commissionPercent:
            Number(
              (business as { commissionPercent?: number; serviceFee?: number }).commissionPercent ??
                (business as { serviceFee?: number }).serviceFee ??
                15,
            ) || 15,
          appointmentApprovalMode:
            (business as { appointmentApprovalMode?: string }).appointmentApprovalMode === 'automatic'
              ? 'automatic'
              : 'manual',
          cancellationAllowed: (business as { cancellationAllowed?: boolean }).cancellationAllowed !== false,
          cancellationHoursBefore:
            Number((business as { cancellationHoursBefore?: number }).cancellationHoursBefore ?? 24) || 24,
          venueDetailSections,
          cancellationPolicyMessage:
            language === "es"
              ? (business as { cancellationPolicyMessageEs?: string }).cancellationPolicyMessageEs
              : (business as { cancellationPolicyMessageEn?: string }).cancellationPolicyMessageEn ||
                formatCancellationPolicyMessage(
                  normalizeCancellationPolicy(business as { cancellationAllowed?: boolean; cancellationHoursBefore?: number }),
                  "en",
                ),
        });
      } catch (err: unknown) {
          if (!cancelled) {
            setVenueData((prev) =>
              prev.id === venueId && prev.name !== "—" ? prev : base,
            );
          setReviewRows([]);
          toastError(
            t("venueLoadFailedTitle"),
            userFacingError(err, t("venueLoadFailedBody")),
          );
        }
      } finally {
        if (!cancelled) setVenueLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [venueId, language]);

  const VENUE_DATA = venueData;
  const heroSrc = VENUE_DATA.bannerUrl || VENUE_DATA.images[0] || PLACEHOLDER_IMAGE_DATA_URI;
  const portfolioImages = VENUE_DATA.images.filter((u) => u && u.trim().length > 0);

  useEffect(() => {
    if (!VENUE_DATA.name || VENUE_DATA.name === "—") return;
    setMeta({ title: VENUE_DATA.name, subtitle: VENUE_DATA.category });
    return () => clearMeta();
  }, [VENUE_DATA.name, VENUE_DATA.category, setMeta, clearMeta]);

  const venueTabs = useMemo(
    () =>
      [
        { id: "services" as const, label: t("venueServicios") },
        { id: "team" as const, label: t("venueEquipo") },
        { id: "portfolio" as const, label: "Portfolio" },
        { id: "reviews" as const, label: t("venueReseñas") },
        { id: "amenities" as const, label: t("venueAmenidades") },
      ] as const,
    [t, language],
  );

  const matchesAudience = (tag: string, keys: string[]) => {
    const t = (tag || "").toLowerCase();
    return keys.some((k) => t.includes(k));
  };

  const serviceFilters = useMemo(() => {
    const filters: Array<{ id: typeof activeServiceFilter; label: string }> = [
      { id: "all", label: "All" },
    ];
    const services = VENUE_DATA.services;
    if (services.some((s) => matchesAudience(s.tag, ["mujer", "woman", "women", "female", "femenin"]))) {
      filters.push({ id: "women", label: "Women" });
    }
    if (services.some((s) => matchesAudience(s.tag, ["hombre", "man", "men", "male", "masculin", "barber"]))) {
      filters.push({ id: "men", label: "Men" });
    }
    if (services.some((s) => matchesAudience(s.tag, ["niño", "nino", "kid", "child", "children"]))) {
      filters.push({ id: "kids", label: "Children" });
    }
    if (promotionServiceIds.size > 0) {
      filters.push({ id: "promotions", label: t("venueServiceFilterPromotions") });
    }
    return filters;
  }, [VENUE_DATA.services, language, promotionServiceIds, t]);

  const SERVICES_PREVIEW_LIMIT = 6;

  const filteredServices = useMemo(() => {
    let filtered = VENUE_DATA.services;
    if (activeServiceFilter === "women") {
      filtered = filtered.filter((s) => matchesAudience(s.tag, ["mujer", "woman", "women", "female", "femenin"]));
    } else if (activeServiceFilter === "men") {
      filtered = filtered.filter((s) => matchesAudience(s.tag, ["hombre", "man", "men", "male", "masculin", "barber"]));
    } else if (activeServiceFilter === "kids") {
      filtered = filtered.filter((s) => matchesAudience(s.tag, ["niño", "nino", "kid", "child", "children"]));
    } else if (activeServiceFilter === "promotions") {
      filtered = filtered.filter((s) => promotionServiceIds.has(s.id));
    }
    return filtered;
  }, [VENUE_DATA.services, activeServiceFilter, promotionServiceIds]);

  const hasMoreServices = filteredServices.length > SERVICES_PREVIEW_LIMIT;
  const visibleServices = servicesExpanded
    ? filteredServices
    : filteredServices.slice(0, SERVICES_PREVIEW_LIMIT);

  useEffect(() => {
    setServicesExpanded(false);
  }, [activeServiceFilter]);

  const scrollToSection = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const el = document.getElementById(`venue-section-${tab}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="relative min-h-screen bg-white">
      {venueLoading ? (
        <div
          className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-white/90 backdrop-blur-sm"
          aria-busy="true"
          aria-live="polite"
        >
          <div className="pointer-events-auto">
            <AppLoader label={t("venueLoading")} variant="section" />
          </div>
        </div>
      ) : null}

      {/* Sticky cart bar — service count + book */}
      <div
        className="sticky z-40 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md sm:px-8"
        style={{ top: "var(--app-header-height, 4.5rem)" }}
      >
        <div className="flex min-w-0 items-center gap-3">
          <a
            href="/search"
            aria-label={language === "en" ? "Back to search" : "Volver a búsqueda"}
            className="relative z-10 shrink-0 rounded-full p-2 transition-colors hover:bg-slate-100"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = "/search";
            }}
          >
            <ChevronLeft size={20} className="text-slate-600" />
          </a>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-slate-900 sm:text-base">{VENUE_DATA.name}</h2>
            <p className="truncate text-[10px] font-bold uppercase tracking-widest text-[#ff5a5f]">{VENUE_DATA.category}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {selectedServices.length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg animate-in fade-in zoom-in duration-300">
              <Check size={12} className="text-green-400" />
              {selectedServices.length}{" "}
              {selectedServices.length === 1 ? t("venueServiceSingular") : t("venueServicePlural")}
            </div>
          )}
          <button
            type="button"
            onClick={openBookingModal}
            disabled={selectedServices.length === 0}
            className={`rounded-xl px-5 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
              selectedServices.length > 0
                ? "bg-[#ff5a5f] text-white shadow-lg shadow-[#ff5a5f]/20 hover:bg-[#e0454a]"
                : "cursor-not-allowed bg-slate-200 text-slate-400"
            }`}
          >
            {t("venueBookNow")}
          </button>
        </div>
      </div>
      {VENUE_DATA.cancellationPolicyMessage ? (
        <p className="mx-auto mt-2 flex max-w-3xl items-center justify-end gap-2 px-4 text-right text-[10px] font-semibold text-slate-500 sm:px-0">
          <Clock size={14} className="shrink-0 text-[#ff5a5f]" />
          {VENUE_DATA.cancellationPolicyMessage}
        </p>
      ) : null}

      {/* HERO SECTION */}
      <section className="relative h-[550px] w-full overflow-hidden">
          <img 
            src={heroSrc} 
            className="w-full h-full object-cover" 
            alt={VENUE_DATA.name}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            onError={(e) => {
              const el = e.currentTarget;
              if (el.src.startsWith("data:")) return;
              el.src = PLACEHOLDER_IMAGE_DATA_URI;
            }}
          />
         <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
         {VENUE_DATA.logoUrl ? (
           <div className="absolute bottom-8 left-6 z-10 sm:bottom-12 sm:left-12">
             <div className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl border-4 border-white bg-white p-1.5 shadow-2xl sm:h-24 sm:w-24 sm:rounded-3xl">
               <img
                 src={VENUE_DATA.logoUrl}
                 alt={`${VENUE_DATA.name} logo`}
                 className="h-full w-full rounded-xl object-contain sm:rounded-2xl"
                 onError={(e) => {
                   const el = e.currentTarget;
                   if (el.src.startsWith('data:')) return;
                   el.src = PLACEHOLDER_IMAGE_DATA_URI;
                 }}
               />
             </div>
           </div>
         ) : null}
         <div className="absolute bottom-8 right-6 z-10 flex justify-end gap-3 sm:bottom-12 sm:right-12">
             <button onClick={handleShare} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all text-slate-900"><Share2 size={20} /></button>
             <button onClick={handleToggleFavorite} className="bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-2xl hover:scale-110 transition-all text-slate-900">
               <Heart size={20} className={isFavorite ? "fill-[#ff5a5f] text-[#ff5a5f]" : ""} />
             </button>
         </div>
      </section>

      {/* MAIN CONTENT */}
      <div className="max-w-[1920px] mx-auto px-6 sm:px-10 lg:px-14 py-16 flex flex-col lg:flex-row gap-12">
          
          <main className="flex-1">
              <div className="flex justify-between items-start mb-8">
                  <div>
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-[#ff5a5f]/5 text-[#ff5a5f] text-[10px] font-black px-3 py-1.5 rounded-full border border-[#ff5a5f]/10 uppercase tracking-widest">{t("venueNewOnPlatform")}</span>
                        <div className="flex gap-1.5 items-center">
                            <Share2 onClick={handleShare} className="w-5 h-5 text-slate-300 hover:text-[#ff5a5f] cursor-pointer" />
                            <Heart onClick={handleToggleFavorite} className={`w-5 h-5 cursor-pointer hover:text-[#ff5a5f] ${isFavorite ? "fill-[#ff5a5f] text-[#ff5a5f]" : "text-slate-300"}`} />
                        </div>
                      </div>
                      <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">{VENUE_DATA.name}</h1>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                             <div className="flex gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i < Math.round(VENUE_DATA.rating)
                                          ? "text-amber-400 fill-amber-400"
                                          : "text-slate-200"
                                      }`}
                                    />
                                ))}
                             </div>
                             <span className="text-sm font-black text-slate-900">
                               {VENUE_DATA.rating > 0 ? VENUE_DATA.rating.toFixed(1) : "—"}
                             </span>
                             <span className="text-sm font-bold text-slate-400">
                               ({VENUE_DATA.reviews} {t("reviews")})
                             </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-400">
                             <MapPin size={16} />
                             <span className="text-sm font-bold">{VENUE_DATA.address}</span>
                        </div>
                      </div>
                  </div>
              </div>

              <p className="text-slate-600 leading-relaxed font-normal mb-10 max-w-3xl">
                  {VENUE_DATA.description}
              </p>

              {/* PORTFOLIO */}
              {portfolioImages.length > 0 && (
                <section className="mb-12">
                  <div className="relative mb-3 overflow-hidden rounded-2xl">
                    <img
                      src={portfolioImages[0]}
                      alt=""
                      className="h-56 w-full object-cover md:h-72"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.src.startsWith("data:")) return;
                        el.src = PLACEHOLDER_IMAGE_DATA_URI;
                      }}
                    />
                    {VENUE_DATA.logoUrl ? (
                      <div className="absolute bottom-4 left-4 flex h-14 w-14 items-center justify-center rounded-xl border-2 border-white bg-white p-1 shadow-lg sm:h-16 sm:w-16">
                        <img
                          src={VENUE_DATA.logoUrl}
                          alt=""
                          className="h-full w-full rounded-lg object-contain"
                        />
                      </div>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => scrollToSection("portfolio")}
                      className="absolute bottom-4 right-4 rounded-lg bg-white/95 px-4 py-2 text-xs font-bold text-slate-900 shadow-md hover:bg-white"
                    >
                      {"View all photos"}
                    </button>
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {portfolioImages.slice(1, 6).map((src, i) => (
                      <button
                        key={`${src}-${i}`}
                        type="button"
                        onClick={() => setPortfolioLightbox(i + 1)}
                        className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-slate-100"
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const el = e.currentTarget;
                            if (el.src.startsWith("data:")) return;
                            el.src = PLACEHOLDER_IMAGE_DATA_URI;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* TABS */}
              <div
                className="sticky z-30 mb-10 flex flex-wrap justify-center gap-2 border-b border-slate-100 bg-white pb-4 pt-3"
                style={{ top: "calc(var(--app-header-height, 4.5rem) + 3.25rem)" }}
              >
                  {venueTabs.map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => scrollToSection(tab.id)}
                        className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>

              {/* TAB CONTENT: SERVICIOS */}
              {activeTab === "services" && (
                <div id="venue-section-services" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{t('ourServices')}</h2>
                        <p className="text-slate-500 text-sm font-medium max-w-xl mx-auto">{t("venueServicesBlurb")}</p>
                    </div>

                    <div className="flex justify-center gap-4 mb-12">
                        {serviceFilters.map((f) => (
                            <button 
                                type="button"
                                key={f.id}
                                onClick={() => setActiveServiceFilter(f.id)}
                                className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeServiceFilter === f.id ? 'border-slate-900 bg-slate-900 text-white shadow-xl' : 'border-slate-100 text-slate-400 hover:border-slate-300'}`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    <div className="mx-auto flex max-w-3xl flex-col gap-3">
                        {visibleServices.map(s => {
                          const promo = promotionData.find(p => p.serviceId === s.id);
                          const discountedPrice = promo ? s.price * (1 - promo.discountPercent / 100) : null;
                          const isBestseller = !promo && (bestsellerMap[s.id] ?? 0) > 0;
                          const promoLabel = promo?.label?.trim() || (promo ? `${promo.discountPercent}% off` : null);
                          return (
                            <div
                              key={s.id}
                              className={`group flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 transition ${
                                promo
                                  ? "border-[#ff5a5f]/20 bg-gradient-to-r from-rose-50/90 via-white to-white hover:border-[#ff5a5f]/35"
                                  : "border-slate-100 bg-white hover:border-[#ff5a5f]/40"
                              }`}
                            >
                                <div className="flex min-w-0 flex-1 items-center gap-4">
                                    <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 transition-colors ${
                                      promo ? "border-[#ff5a5f]/25" : "border-slate-100 group-hover:border-[#ff5a5f]/30"
                                    }`}>
                                        {s.image ? (
                                            <img src={s.image} alt={s.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#ff5a5f]/10 to-[#ff5a5f]/5">
                                                <Scissors size={20} className="text-[#ff5a5f]/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <h4 className="truncate text-sm font-extrabold text-slate-900 group-hover:text-[#ff5a5f]">{s.name}</h4>
                                          {promoLabel ? (
                                            <span className="shrink-0 rounded-md border border-[#ff5a5f]/20 bg-[#ff5a5f]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#ff5a5f]">
                                              {promoLabel}
                                            </span>
                                          ) : null}
                                          {isBestseller ? (
                                            <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                                              Popular
                                            </span>
                                          ) : null}
                                        </div>
                                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{s.description}</p>
                                        <p className="mt-1 text-[10px] font-semibold text-slate-400">{s.time} · Next: {getNextAvailableSlotLabel(VENUE_DATA.schedule, VENUE_DATA.team, s.id)}</p>
                                    </div>
                                </div>
                                    <div className="flex shrink-0 flex-col items-end gap-2.5 pl-2">
                                    <div className="text-right leading-tight">
                                      {discountedPrice !== null && promo ? (
                                        <>
                                          <p className="text-lg font-extrabold tabular-nums text-[#ff5a5f]">${discountedPrice.toFixed(2)}</p>
                                          <p className="text-xs font-medium tabular-nums text-slate-400 line-through">${Number(s.price).toFixed(2)}</p>
                                          <p className="mt-0.5 text-[10px] font-semibold text-emerald-600">
                                            {language === "en" ? "You save" : "Ahorras"} {promo.discountPercent}%
                                          </p>
                                        </>
                                      ) : (
                                        <p className="text-lg font-extrabold tabular-nums text-slate-900">${Number(s.price).toFixed(2)}</p>
                                      )}
                                    </div>
                                    {selectedServices.filter((id) => id === s.id).length > 0 ? (
                                      <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 shadow-lg shadow-slate-900/20 animate-in fade-in zoom-in duration-300">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            applyServiceRemove(s.id);
                                          }}
                                          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-black text-white transition-colors hover:bg-slate-800"
                                          aria-label="Remove one"
                                        >
                                          -
                                        </button>
                                        <span className="w-5 select-none text-center text-[11px] font-black text-white">
                                          {selectedServices.filter((id) => id === s.id).length}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            onServiceBookClick(s.id);
                                          }}
                                          className="flex h-8 w-8 items-center justify-center rounded-lg text-lg font-black text-white transition-colors hover:bg-slate-800"
                                          aria-label="Add one more"
                                        >
                                          +
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onServiceBookClick(s.id);
                                        }}
                                        className="rounded-lg border-2 border-[#ff5a5f] px-4 py-2 text-xs font-bold text-[#ff5a5f] transition hover:bg-[#ff5a5f] hover:text-white"
                                      >
                                        {t("bookBtn")}
                                      </button>
                                    )}
                                </div>
                            </div>
                          );
                        })}
                    </div>

                    {hasMoreServices && !servicesExpanded ? (
                      <div className="mt-16 text-center">
                        <button
                          type="button"
                          onClick={() => setServicesExpanded(true)}
                          className="group mx-auto flex items-center gap-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 transition-colors hover:text-[#ff5a5f]"
                        >
                          {t("venueSeeMorePlus")}{" "}
                          <span className="text-2xl transition-transform group-hover:translate-x-2">+</span>
                        </button>
                      </div>
                    ) : null}
                </div>
              )}

              {/* TAB CONTENT: PORTFOLIO */}
              {activeTab === "portfolio" && portfolioImages.length > 0 && (
                <div id="venue-section-portfolio" className="animate-in fade-in duration-500">
                  <h2 className="mb-6 text-center text-2xl font-extrabold text-slate-900">
                    {"Portfolio"}
                  </h2>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {portfolioImages.map((src, i) => (
                      <button
                        key={`${src}-grid-${i}`}
                        type="button"
                        onClick={() => setPortfolioLightbox(i)}
                        className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-100"
                      >
                        <img
                          src={src}
                          alt=""
                          className="h-full w-full object-cover transition hover:scale-105"
                          onError={(e) => {
                            const el = e.currentTarget;
                            if (el.src.startsWith("data:")) return;
                            el.src = PLACEHOLDER_IMAGE_DATA_URI;
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: EQUIPO */}
              {activeTab === "team" && (
                <div id="venue-section-team" className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">{t("venueTeamSectionTitle")}</h2>
                        <p className="text-slate-500 text-sm font-medium max-w-xl mx-auto">{t("venueTeamIntro")}</p>
                    </div>

                    <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">
                        {VENUE_DATA.team.map((member) => (
                            <div
                              key={member.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => setProfileStaff(member)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setProfileStaff(member);
                                }
                              }}
                              className="group w-[280px] shrink-0 snap-start bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-[#ff5a5f]/20 hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer text-left"
                            >
                                <div className="relative h-44 overflow-hidden rounded-t-2xl">
                                    <img 
                                      src={member.img} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                                      alt={member.name}
                                    />
                                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 px-2.5 py-1 rounded-lg text-[11px] font-black text-slate-900 shadow-sm border border-slate-100">
                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        {member.rating > 0 ? member.rating.toFixed(1) : "—"}
                                    </div>
                                </div>
                                <div className="p-5 text-left flex flex-col flex-1">
                                    <h4 className="text-lg font-extrabold text-slate-900 mb-1 group-hover:text-[#ff5a5f] transition-colors">{member.name}</h4>
                                    <p className="text-[#ff5a5f] text-xs font-bold uppercase tracking-wide mb-2 line-clamp-2">{member.role}</p>
                                    <p className="text-slate-600 text-sm leading-snug mb-4 flex-1 line-clamp-3">
                                      {member.bio?.trim() && member.bio.trim() !== "—"
                                        ? member.bio
                                        : t("venueStaffProfileNoBio")}
                                    </p>
                                    <div className="flex gap-4 text-xs font-semibold text-slate-600 border-t border-slate-100 pt-3">
                                        <span>{member.years} {t("venueStaffExp")}</span>
                                        <span className="text-slate-300">|</span>
                                        <span>{member.clients} {t("venueStaffClientsLabel")}</span>
                                        <span className="text-slate-300">|</span>
                                        <span>{member.reviews} {t("reviews")}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setProfileStaff(member);
                                      }}
                                      className="mt-4 w-full py-3 rounded-xl border-2 border-slate-900 text-xs font-bold uppercase tracking-wide text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
                                    >
                                      {t("venueViewProfile")}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
              )}

              {/* TAB CONTENT: RESEÑAS */}
              {activeTab === "reviews" && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex justify-between items-center mb-12">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 mb-2">{t("venueReviewsCustomerTitle")}</h2>
                            <div className="flex items-center gap-4">
                                <div className="flex gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`w-5 h-5 ${
                                            i < Math.round(VENUE_DATA.rating)
                                              ? "text-amber-400 fill-amber-400"
                                              : "text-slate-200"
                                          }`}
                                        />
                                    ))}
                                </div>
                                <span className="text-lg font-black text-slate-900">
                                  {VENUE_DATA.rating > 0 ? `${VENUE_DATA.rating.toFixed(1)} / 5.0` : "— / 5.0"}
                                </span>
                                <span className="text-sm font-bold text-slate-400">
                                  {t("venueReviewsBasedOn")} {VENUE_DATA.reviews} {t("reviews")}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {reviewRows.length === 0 ? (
                          <p className="text-center text-sm font-semibold text-slate-500 py-8">
                            {t("venueReviewsNone")}
                          </p>
                        ) : (
                        reviewRows.map((rev) => (
                            <div key={rev.id} className="bg-white p-8 rounded-[32px] border-2 border-slate-50 hover:shadow-xl transition-all duration-500">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-[#ff5a5f]/10 text-[#ff5a5f] rounded-full flex items-center justify-center font-black text-sm">{rev.initials}</div>
                                        <div>
                                            <h4 className="font-black text-slate-900 tracking-tight">{rev.customerName}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rev.date}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {Array.from({ length: Math.min(5, Math.max(0, rev.rating)) }).map((_, i) => (
                                            <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                                        ))}
                                    </div>
                                </div>
                                {rev.comment && rev.comment.trim() && (
                                  <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-[#ff5a5f]/20 pl-6">&ldquo;{rev.comment}&rdquo;</p>
                                )}
                                {rev.reply && rev.reply.trim() && (
                                  <div className="mt-6 ml-6 p-5 bg-slate-50 rounded-2xl border-l-4 border-slate-900 relative">
                                    <div className="absolute -top-3 left-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded">
                                      {t("venueReviewReplyLabel") || "Barber's Response"}
                                    </div>
                                    <p className="text-slate-700 text-sm font-semibold leading-relaxed">
                                      {rev.reply}
                                    </p>
                                  </div>
                                )}
                            </div>
                        ))
                        )}
                    </div>
                </div>
              )}

              {/* TAB CONTENT: AMENIDADES */}
              {activeTab === "amenities" && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">{t("venueAmenitiesSectionTitle")}</h2>
                        <p className="text-slate-400 text-sm font-bold max-w-xl mx-auto uppercase tracking-tighter">{t("venueAmenitiesBlurb")}</p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {VENUE_DATA.amenities.length === 0 ? (
                          <p className="col-span-full text-center text-sm text-slate-500 py-6">{t("venueNoAmenitiesListed")}</p>
                        ) : (
                        VENUE_DATA.amenities.map((amenity, i) => {
                          const Icon = amenityLucideIcon(amenity.key);
                          return (
                            <div key={`${amenity.key}-${i}`} className="group bg-white p-4 rounded-xl border border-slate-100 hover:border-[#ff5a5f]/25 hover:shadow-md transition-all duration-300 text-center">
                                <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 text-slate-700 group-hover:bg-[#ff5a5f]/10 group-hover:text-[#ff5a5f] transition-colors">
                                    <Icon className="w-5 h-5" strokeWidth={1.75} />
                                </div>
                                <h4 className="font-black text-slate-900 text-xs mb-1 tracking-wide">{amenity.name}</h4>
                                <p className="text-[10px] font-medium text-slate-500 leading-snug tracking-normal">{amenity.desc}</p>
                            </div>
                          );
                        })
                        )}
                    </div>
                </div>
              )}
          </main>

          {/* SIDEBAR — unified map + info */}
          <aside className="w-full lg:w-[400px] lg:sticky lg:top-24 lg:self-start">
               <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
               <div className="flex min-h-[200px] flex-col items-center justify-center bg-slate-50 p-6 text-center border-b border-slate-100">
                    <MapPin className="text-[#ff5a5f] mb-3" size={32} />
                    <p className="text-sm font-bold text-slate-800">{VENUE_DATA.name}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{VENUE_DATA.address || t("venueLocationMissing")}</p>
                    {VENUE_DATA.address ? (
                      <a
                        href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(VENUE_DATA.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 rounded-lg bg-[#ff5a5f] px-5 py-2 text-xs font-bold text-white hover:bg-[#e0454a]"
                      >
                        {t("venueMapOpen")}
                      </a>
                    ) : null}
               </div>

               <div className="p-6">
                   <h3 className="text-sm font-extrabold text-slate-900 mb-1">{"About us"}</h3>
                   <p className="text-xs text-slate-600 leading-relaxed mb-5 line-clamp-4">{VENUE_DATA.description || "—"}</p>
                   <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3 flex items-center gap-2">
                       <Info size={16} className="text-[#ff5a5f]" />
                       {t("venueInfoHeading")}
                   </h3>
                   
                   <VenueDetailSections sections={VENUE_DATA.venueDetailSections ?? []} />
                   <div className="space-y-5">
                       <div>
                           <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-wide mb-2">{t("venueHoursHeading")}</p>
                           {VENUE_DATA.schedule.length === 0 ? (
                             <p className="text-[13px] text-slate-500">{t("venueHoursPlaceholder")}</p>
                           ) : (
                             VENUE_DATA.schedule.map((s) => (
                               <div key={s.day} className="flex justify-between items-center gap-3 py-2 border-b border-slate-100 last:border-0 text-[13px]">
                                   <span className="font-semibold text-slate-600">{s.day}</span>
                                   <span className="font-bold text-slate-900 whitespace-nowrap">{s.hours}</span>
                               </div>
                             ))
                           )}
                       </div>

                       <div>
                           <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-wide mb-2">{t("contact")}</p>
                           <div className="space-y-2.5">
                                {VENUE_DATA.contactPhone ? (
                                <div className="flex items-center gap-3 text-slate-700 transition-colors group">
                                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-[#ff5a5f]/10 shrink-0"><Phone size={15} /></div>
                                    <a href={`tel:${VENUE_DATA.contactPhone}`} className="text-[13px] font-semibold hover:text-[#ff5a5f]">{VENUE_DATA.contactPhone}</a>
                                </div>
                                ) : null}
                                {VENUE_DATA.contactEmail ? (
                                <div className="flex items-center gap-3 text-slate-700 transition-colors group">
                                    <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center group-hover:bg-[#ff5a5f]/10 shrink-0"><Mail size={15} /></div>
                                    <a href={`mailto:${VENUE_DATA.contactEmail}`} className="text-[13px] font-semibold break-all hover:text-[#ff5a5f]">{VENUE_DATA.contactEmail}</a>
                                </div>
                                ) : null}
                                {!VENUE_DATA.contactPhone && !VENUE_DATA.contactEmail ? (
                                  <p className="text-[13px] text-slate-500">{t("venueNoContactDetails")}</p>
                                ) : null}
                           </div>
                       </div>
                   </div>

                   <div className="mt-6 flex justify-center gap-2 border-t border-slate-100 pt-5">
                       {VENUE_DATA.socials.instagram ? (
                       <a href={VENUE_DATA.socials.instagram.startsWith("http") ? VENUE_DATA.socials.instagram : `https://instagram.com/${VENUE_DATA.socials.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff5a5f]/10 text-[#ff5a5f] hover:bg-[#ff5a5f] hover:text-white transition-all"><Instagram size={20} /></a>
                       ) : null}
                       {VENUE_DATA.socials.tiktok ? (
                       <a href={VENUE_DATA.socials.tiktok.startsWith("http") ? VENUE_DATA.socials.tiktok : `https://www.tiktok.com/@${VENUE_DATA.socials.tiktok.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff5a5f]/10 text-[#ff5a5f] font-bold hover:bg-[#ff5a5f] hover:text-white transition-all">T</a>
                       ) : null}
                       {VENUE_DATA.socials.youtube ? (
                       <a href={VENUE_DATA.socials.youtube.startsWith("http") ? VENUE_DATA.socials.youtube : `https://youtube.com/${VENUE_DATA.socials.youtube.replace(/^\//, "")}`} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff5a5f]/10 text-[#ff5a5f] hover:bg-[#ff5a5f] hover:text-white transition-all"><Youtube size={20} /></a>
                       ) : null}
                       {VENUE_DATA.socials.x ? (
                       <a href={VENUE_DATA.socials.x.startsWith("http") ? VENUE_DATA.socials.x : `https://x.com/${VENUE_DATA.socials.x.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff5a5f]/10 text-[#ff5a5f] hover:bg-[#ff5a5f] hover:text-white transition-all"><Twitter size={20} /></a>
                       ) : null}
                   </div>
               </div>
               </div>
          </aside>
      </div>

      {/* BOTTOM CATEGORY EXPLORATION */}
      <section className="border-t border-slate-100 bg-slate-50/50 py-12">
           <div className="max-w-[1920px] mx-auto px-6 lg:px-14">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">{t("venuePickCategoryTitle")}</h2>
                    <p className="text-slate-500 text-sm font-medium">{t("venuePickCategorySub")}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {browseCategories.length === 0 ? (
                      <p className="col-span-full text-center text-sm text-slate-500 py-8">{t("venueCategoriesNone")}</p>
                    ) : (
                    browseCategories.map((cat) => {
                      const title = cat.labelEn;
                      const img = (cat.imageUrl || "").trim();
                      return (
                        <button
                          type="button"
                          key={cat.id}
                          onClick={() => router.push(`/search?categoryKey=${encodeURIComponent(cat.key)}`)}
                          className="group relative aspect-square rounded-[32px] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl transition-all duration-700 hover:scale-[1.03] text-left border-0 p-0 bg-slate-200"
                        >
                            {img ? (
                            <img 
                              src={img.startsWith("http") || img.startsWith("/") ? img : img} 
                              className="w-full h-full object-cover transition duration-1000 group-hover:scale-125" 
                              alt={title} 
                            />
                            ) : null}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-6">
                                <h4 className="text-white text-sm font-black leading-tight mb-1 uppercase tracking-tighter group-hover:text-[#ff5a5f] transition-all line-clamp-2">{title}</h4>
                                <p className="text-white/60 text-[8px] font-bold uppercase tracking-widest">{t("venueExplore")}</p>
                            </div>
                        </button>
                      );
                    })
                    )}
                </div>
           </div>
      </section>
      <BookingModal 
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        onBookingSuccess={() => {
          useVenueBookingCartStore.getState().clear();
          setSelectedServices([]);
        }}
        selectedServiceIds={selectedServices}
        venueData={VENUE_DATA as BookingModalVenueData}
        promotions={promotionData}
      />

      {profileStaff ? (
        <div
          className="fixed inset-0 z-[95] flex items-end justify-center sm:items-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="staff-profile-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label={t("venueStaffProfileClose")}
            onClick={() => setProfileStaff(null)}
          />
          <div className="relative z-10 flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[32px] border border-slate-100 bg-white shadow-2xl sm:rounded-[40px] animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setProfileStaff(null)}
              className="absolute right-4 top-4 z-20 rounded-2xl border border-slate-100 bg-white/95 p-2 text-slate-500 shadow-sm hover:text-slate-900"
              aria-label={t("venueStaffProfileClose")}
            >
              <X size={20} />
            </button>
            <div className="overflow-y-auto overscroll-contain">
              <div className="relative h-56 w-full shrink-0 bg-slate-100 sm:h-64">
                <img
                  src={profileStaff.img}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-lg border border-white/80 bg-white/95 px-2.5 py-1 text-[11px] font-black text-slate-900 shadow-sm">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {profileStaff.rating > 0 ? profileStaff.rating.toFixed(1) : "—"}
                </div>
              </div>
              <div className="space-y-6 p-6 sm:p-8">
                <div>
                  <h3 id="staff-profile-title" className="text-2xl font-black text-slate-900">
                    {profileStaff.name}
                  </h3>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a5f]">{profileStaff.role}</p>
                </div>
                <p className="text-sm font-medium leading-relaxed text-slate-600">
                  {profileStaff.bio?.trim() && profileStaff.bio.trim() !== "—"
                    ? profileStaff.bio
                    : t("venueStaffProfileNoBio")}
                </p>
                <div className="flex gap-4 border-y border-slate-100 py-4 text-[10px] font-bold text-slate-600">
                  <span>
                    {profileStaff.years} {t("venueStaffExp")}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    {profileStaff.clients} {t("venueStaffClientsLabel")}
                  </span>
                  <span className="text-slate-300">|</span>
                  <span>
                    {profileStaff.reviews} {t("reviews")}
                  </span>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("venueStaffProfileAvailabilityHeading")}
                  </p>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatAvailabilityDisplay(profileStaff.availability)}
                  </p>
                </div>
                <div>
                  <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("venueStaffProfileServicesHeading")}
                  </p>
                  <ul className="space-y-2">
                    {servicesForMember(profileStaff, VENUE_DATA.services).map((svc) => (
                      <li
                        key={svc.id}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                      >
                        <div>
                          <p className="font-bold text-slate-900">{svc.name}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            {svc.time} · ${svc.price}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => onServiceBookClick(svc.id)}
                          className={`shrink-0 rounded-xl px-4 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${
                            selectedServices.includes(svc.id)
                              ? "bg-slate-900 text-white"
                              : "border-2 border-[#ff5a5f] text-[#ff5a5f] hover:bg-[#ff5a5f] hover:text-white"
                          }`}
                        >
                          {selectedServices.includes(svc.id) ? t("venueAddedToBooking") : t("bookBtn")}
                        </button>
                      </li>
                    ))}
                  </ul>
                  {servicesForMember(profileStaff, VENUE_DATA.services).length === 0 ? (
                    <p className="text-sm text-slate-500">{t("venueStaffProfileNoServices")}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("services");
                      setProfileStaff(null);
                    }}
                    className="flex-1 rounded-2xl border-2 border-slate-200 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-800 hover:border-slate-900"
                  >
                    {t("venueStaffProfileBrowseServices")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileStaff(null)}
                    className="flex-1 rounded-2xl bg-slate-900 py-3.5 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-800"
                  >
                    {t("venueStaffProfileClose")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {crossVenuePendingServiceId ? (
        <div
          className="fixed inset-0 z-[98] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-md animate-in fade-in duration-200"
          role="alertdialog"
          aria-labelledby="cross-venue-title"
          aria-describedby="cross-venue-desc"
        >
          <button
            type="button"
            className="absolute inset-0 cursor-default"
            aria-label={t("venueCrossBusinessCancel")}
            onClick={() => setCrossVenuePendingServiceId(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 id="cross-venue-title" className="text-xl font-black text-slate-900">
              {t("venueCrossBusinessTitle")}
            </h3>
            <p id="cross-venue-desc" className="mt-4 text-sm font-semibold leading-relaxed text-slate-600">
              {t("venueCrossBusinessBody")}
            </p>
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={() => confirmCrossVenueReplace()}
                className="w-full rounded-2xl bg-[#ff5a5f] py-4 text-[11px] font-black uppercase tracking-widest text-white shadow-lg shadow-[#ff5a5f]/25"
              >
                {t("venueCrossBusinessReplace")}
              </button>
              <button
                type="button"
                onClick={() => setCrossVenuePendingServiceId(null)}
                className="w-full rounded-2xl py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900"
              >
                {t("venueCrossBusinessCancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {portfolioLightbox !== null && portfolioImages[portfolioLightbox] ? (
        <div
          className="fixed inset-0 z-[96] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0"
            aria-label={"Close"}
            onClick={() => setPortfolioLightbox(null)}
          />
          <button
            type="button"
            onClick={() => setPortfolioLightbox(null)}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/90 p-2 text-slate-900"
          >
            <X size={22} />
          </button>
          <img
            src={portfolioImages[portfolioLightbox]}
            alt=""
            className="relative z-10 max-h-[85vh] max-w-full rounded-xl object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
