"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "../../../components/I18nProvider";
import {
  StickyBookingBar,
  Tabs,
  Chip,
  Badge,
  Rating,
  Button,
  IconButton,
  ServiceCard,
  StaffCard,
  BusinessInfoPanel,
  CategoryCard,
  PortfolioGallery,
  Glyph,
  Modal,
  Avatar,
} from "@/ds";
import { VenueMiniMap } from "@/components/venue/VenueMiniMap";
import { BookingModal, type BookingModalVenueData } from "../../../components/BookingModal";
import { formatCancellationPolicyMessage, normalizeCancellationPolicy } from "@/lib/cancellationPolicy";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { resolveVenueBusinessId } from "@/lib/resolveVenueBusinessId";
import { useStaticExportRouteReady } from "@/lib/useStaticExportRouteReady";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { amenityLucideIcon } from "@/lib/amenityIcons";
import { AppLoader } from "@/components/ui/AppLoader";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { fetchPublicCategories, serviceCardImageSrc, categoryLabelFromKey, type PublicCategory } from "@/lib/venueSearch";
import { normalizePublicImageUrl } from "@/lib/s3Assets";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/lib/toast";
import { userFacingError } from "@/lib/userFacingError";
import { useAuth } from "@/components/AuthProvider";
import { formatAvailabilityDisplay, formatStaffStatValue, parseAvailability } from "@/lib/staffAvailability";
import { getNextAvailableSlotLabel } from "@/lib/bookingSlots";
import { usePageHeaderMeta } from "@/contexts/PageHeaderMetaContext";
import { useVenueBookingCartStore } from "@/store/venueBookingCartStore";
import { dateLocaleFor } from "@/lib/locale";
import {
  defaultWeekSchedule,
  hoursForWeekdayIndex,
  localizeHoursLabel,
  localizeSchedule,
  weekdayLabel,
} from "@/lib/scheduleLocale";
import { localizeServiceName, localizeStaffRole } from "@/lib/serviceLabels";
import type { VenueDetailSection } from "@/components/venue/VenueDetailSections";

function inferServiceAudienceTag(name: string, category: string): string {
  const text = `${name} ${category}`.toLowerCase();
  const cat = category.toLowerCase();
  const parts: string[] = ["all"];
  const isKids = /\b(niños?|niñas?|ninos?|ninas?|kid|kids|child|children|infantil)\b/.test(text);
  const isMen = /\b(hombres?|man|men|male|masculin|barber|barba|barbería|barberia|afeitado|beard|fade|deportivo)\b/.test(text);
  const isWomen =
    /\b(mujeres?|woman|women|female|femenin|ladies|lady|uñas|manicur|pedicur|cejas|pestañas|balayage|highlights|keratin|tinte|color|peinado|blow|secado|beauty|facial|hydra|masaje|peeling|depilaci|estética|estetica|maquillaje|prenatal)\b/.test(text) ||
    /\b(beauty|estetica|nailcare|nail)\b/.test(cat);

  if (isKids) parts.push("niño", "kid", "children");
  if (isMen) parts.push("hombre", "men", "barber");
  if (isWomen) parts.push("mujer", "women", "female");

  // Unisex cuts/styles appear in both men and women filters when not kid-specific.
  if (!isKids && !isMen && !isWomen && /\b(haircut|cut|corte|style|estilo|hair|classic)\b/.test(text)) {
    parts.push("hombre", "men", "mujer", "women");
  }

  // Category-based defaults for businesses whose services lack gender keywords.
  if (!isKids && !isMen && !isWomen) {
    if (/\bbarber\b/.test(cat)) {
      parts.push("hombre", "men", "barber");
    } else if (/\b(beauty|estetica|nail)\b/.test(cat)) {
      parts.push("mujer", "women", "female");
    } else if (/\b(spa|massage)\b/.test(cat)) {
      parts.push("hombre", "men", "mujer", "women");
    } else if (/\byoga\b/.test(cat)) {
      parts.push("hombre", "men", "mujer", "women");
    }
  }

  return parts.join(" ");
}

function localizeCategoryLabel(raw: string, lang: "en" | "es"): string {
  if (!raw || raw === "—") return raw;
  return raw
    .split(/[·,]/)
    .map((part) => categoryLabelFromKey(part.trim(), lang) || part.trim())
    .join(" · ");
}

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
  lat?: number | null;
  lng?: number | null;
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
    lat: null,
    lng: null,
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

function resolveSocialHref(kind: "instagram" | "tiktok" | "youtube" | "x", raw: string): string {
  const v = (raw || "").trim();
  if (!v) return "";
  if (v.startsWith("http")) return v;
  const handle = v.replace(/^@/, "").replace(/^\//, "");
  switch (kind) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "youtube":
      return `https://youtube.com/${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    default:
      return v;
  }
}

export default function VenueDetailsPage({ businessId }: { businessId: string }) {
  const { t, language } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const routeReady = useStaticExportRouteReady();
  const [venueId, setVenueId] = useState("");
  const venueLoadGenRef = useRef(0);
  const { isLoggedIn, isHydrated, setIsLoginModalOpen, setPendingAfterLogin, openFavoritePrompt, whenHydrated } = useAuth();
  const [venueData, setVenueData] = useState<VenueState>(() => emptyVenue(""));
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
  const [preferredStaffId, setPreferredStaffId] = useState<string | undefined>(undefined);
  const [bookingInitialDate, setBookingInitialDate] = useState<string | undefined>(undefined);
  const [bookingInitialTime, setBookingInitialTime] = useState<string | undefined>(undefined);
  const [profileStaff, setProfileStaff] = useState<VenueTeam | null>(null);
  const [venueLoading, setVenueLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bestsellerMap, setBestsellerMap] = useState<Record<string, number>>({});
  const [promotionServiceIds, setPromotionServiceIds] = useState<Set<string>>(new Set());
  const [promotionData, setPromotionData] = useState<Array<{ serviceId: string; discountPercent: number; label?: string | null }>>([]);
  const [vw, setVw] = useState(1280);
  const [teamExpanded, setTeamExpanded] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"todas" | "comentario" | "5" | "4" | "3" | "2" | "1">("todas");
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [starMenuOpen, setStarMenuOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [infoModal, setInfoModal] = useState<{ title: string; body: string } | null>(null);
  const titleRef = React.useRef<HTMLDivElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!routeReady) return;
    setVenueId(resolveVenueBusinessId(pathname, businessId));
  }, [routeReady, pathname, businessId]);

  useEffect(() => {
    setVw(window.innerWidth);
    const onResize = () => setVw(window.innerWidth);
    window.addEventListener("resize", onResize, { passive: true });
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), 2200);
  };

  const { setMeta, clearMeta } = usePageHeaderMeta();
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  const cartBusinessId = useVenueBookingCartStore((s) => s.businessId);
  const cartServiceIds = useVenueBookingCartStore((s) => s.serviceIds);

  useEffect(() => {
    if (cartBusinessId === venueId) {
      setSelectedServices([...cartServiceIds]);
    } else {
      setSelectedServices([]);
    }
  }, [venueId, cartBusinessId, cartServiceIds]);

  const rebookHandledRef = useRef(false);
  useEffect(() => {
    if (venueLoading || rebookHandledRef.current) return;
    const rebook = searchParams.get("rebook");
    const servicesParam = searchParams.get("services");
    if (rebook !== "1" || !servicesParam) return;
    rebookHandledRef.current = true;
    const ids = servicesParam.split(",").map((s) => s.trim()).filter(Boolean);
    const date = searchParams.get("date") || undefined;
    const time = searchParams.get("time") || undefined;
    void openBookingFlow({ addServiceIds: ids, initialDateISO: date, initialTime: time });
    router.replace(pathname, { scroll: false });
  }, [venueLoading, searchParams, pathname, router]);

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

  const onServiceBookClick = async (serviceId: string) => {
    await whenHydrated();
    if (!isLoggedIn) {
      setPendingAfterLogin(() => () => applyServiceAdd(serviceId));
      setIsLoginModalOpen(true);
      toastInfo(t("venueLoginToAddTitle"), t("venueLoginToAddBody"));
      return;
    }
    applyServiceAdd(serviceId);
  };

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      applyServiceRemove(serviceId);
    } else {
      onServiceBookClick(serviceId);
    }
  };

  const confirmCrossVenueReplace = () => {
    if (!crossVenuePendingServiceId) return;
    const next = [crossVenuePendingServiceId];
    setSelectedServices(next);
    useVenueBookingCartStore.getState().setCart(venueId, next);
    setCrossVenuePendingServiceId(null);
  };

  const startBookingFlow = (opts?: { addServiceId?: string; addServiceIds?: string[]; staffId?: string; initialDateISO?: string; initialTime?: string }) => {
    if (opts?.addServiceIds?.length) {
      opts.addServiceIds.forEach((id) => {
        if (!selectedServices.includes(id)) applyServiceAdd(id);
      });
    } else if (opts?.addServiceId && !selectedServices.includes(opts.addServiceId)) {
      applyServiceAdd(opts.addServiceId);
    }
    setPreferredStaffId(opts?.staffId);
    if (opts?.initialDateISO) setBookingInitialDate(opts.initialDateISO);
    if (opts?.initialTime) setBookingInitialTime(opts.initialTime);
    setProfileStaff(null);
    setIsBookingModalOpen(true);
  };

  const openBookingModal = () => void openBookingFlow();

  /**
   * Spec §6/§7: every entry point opens the booking flow directly.
   * - opts.addServiceId → preselect that service (service card "Reservar")
   * - opts.staffId → prioritize that professional (staff "Ver disponibilidad")
   * No cart gate: the main "Reservar" opens the flow ready to add services.
   */
  const openBookingFlow = async (opts?: { addServiceId?: string; addServiceIds?: string[]; staffId?: string; initialDateISO?: string; initialTime?: string }) => {
    await whenHydrated();
    if (!isLoggedIn) {
      setPendingAfterLogin(() => () => startBookingFlow(opts));
      setIsLoginModalOpen(true);
      toastInfo(t("venueLoginToBookTitle"), t("venueLoginToBookBody"));
      return;
    }
    startBookingFlow(opts);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = venueData.name;
    const text = `${t("venueShareText")} ${venueData.name} ${t("venueShareTextAt")} ${venueData.address}`;
    const isTouch = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

    if (navigator.share && isTouch) {
      try {
        await navigator.share({ title, text, url });
      } catch (err) {
        // Ignored
      }
    } else {
      setShareOpen((o) => !o);
    }
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (err) {
      // Ignored
    }
    setShareOpen(false);
    showToast(t("venueShareCopiedTitle") || "Enlace copiado");
  };

  const handleToggleFavorite = async () => {
    await whenHydrated();
    const run = async () => {
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
    if (!isLoggedIn) {
      openFavoritePrompt(() => void run());
      return;
    }
    await run();
  };

  useEffect(() => {
    void fetchPublicCategories()
      .then(setBrowseCategories)
      .catch(() => setBrowseCategories([]));
  }, []);

  useEffect(() => {
    if (!routeReady) return;
    let cancelled = false;
    const loadGen = ++venueLoadGenRef.current;
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
          2,
        );
        if (!business) {
          if (!cancelled && venueLoadGenRef.current === loadGen) {
            setVenueData(base);
            setReviewRows([]);
            toastWarning(t("venueUnavailableTitle"), t("venueUnavailableBody"));
          }
          return;
        }
        const [services, staff, reviews, bestsellers, promotions] = await Promise.all([
          withRetries(() => apiGet<unknown[]>(`/business/${venueId}/services`), 2).catch(() => [] as unknown[]),
          withRetries(() => apiGet<unknown[]>(`/business/${venueId}/staff`), 2).catch(() => [] as unknown[]),
          withRetries(() => apiGet<unknown[]>(`/business/${venueId}/reviews`), 2).catch(() => [] as unknown[]),
          apiGet<Array<{ serviceId: string; bookingCount: number }>>(`/business/${venueId}/bestsellers`).catch(() => []),
          apiGet<Array<{ serviceId: string; discountPercent: number; label?: string | null }>>(`/business/${venueId}/promotions`).catch(() => []),
        ]);
        if (cancelled || venueLoadGenRef.current !== loadGen) return;
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
        const dateLocale = dateLocaleFor(language);
        revList.forEach((r: any) => {
          const d = new Date(r.date);
          const dateKey = Number.isNaN(d.getTime())
            ? "invalid"
            : d.toLocaleDateString(dateLocale, { year: "numeric", month: "short", day: "numeric" });
          
          // Use userId if available, otherwise fallback to customerName
          const groupKey = `${r.userId || r.customerName}_${dateKey}`;
          
          if (!groupedReviews[groupKey]) {
            groupedReviews[groupKey] = {
              ...r,
              ratingSum: Number(r.rating) || 0,
              ratingCount: 1,
              comments: r.comment && r.comment.trim() ? [r.comment.trim()] : [],
              reply: r.reply,
              formattedDate: dateKey === "invalid" ? "" : d.toLocaleDateString(dateLocale, {
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
          category: localizeCategoryLabel(String((business as { category?: string }).category ?? "—"), language),
          rating: apiRating,
          reviews: apiReviews,
          address: String((business as { location?: string }).location ?? ""),
          description: String((business as { description?: string }).description ?? ""),
          lat: (() => {
            const raw = (business as { latitude?: unknown; lat?: unknown }).latitude ?? (business as { lat?: unknown }).lat;
            const n = Number(raw);
            return Number.isFinite(n) && n !== 0 ? n : null;
          })(),
          lng: (() => {
            const raw = (business as { longitude?: unknown; lng?: unknown }).longitude ?? (business as { lng?: unknown }).lng;
            const n = Number(raw);
            return Number.isFinite(n) && n !== 0 ? n : null;
          })(),
          logoUrl,
          bannerUrl,
          images: imgs,
          amenities,
          services: svcList.map((s: any) => {
            const row = s as { id: string; name: string; category: string; duration: number; price: number; imageUrl?: string | null };
            const categoryKey = String(row.category || "");
            return {
              id: String(row.id),
              name: localizeServiceName(row.name, language),
              description: "",
              time: `${row.duration} min`,
              price: row.price,
              image: serviceCardImageSrc(row.imageUrl, imgs, String(row.id)),
              tag: inferServiceAudienceTag(row.name, categoryKey),
            };
          }),
          team: staffList.map((m: any) => {
            const row = m as any;
            const img = (row.image || "").trim();
            const svcIds = Array.isArray(row.serviceIds) ? row.serviceIds.map(String) : [];
            return {
              id: String(row.id),
              name: row.name,
              role: localizeStaffRole(String(row.role || ""), language),
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
            return defaultWeekSchedule(language);
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
            (language === "es"
              ? (business as { cancellationPolicyMessageEs?: string }).cancellationPolicyMessageEs
              : (business as { cancellationPolicyMessageEn?: string }).cancellationPolicyMessageEn) ||
            formatCancellationPolicyMessage(
              normalizeCancellationPolicy(business as { cancellationAllowed?: boolean; cancellationHoursBefore?: number }),
              language === "es" ? "es" : "en",
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
        if (!cancelled && venueLoadGenRef.current === loadGen) setVenueLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [venueId, language, routeReady]);

  useEffect(() => {
    if (!isLoggedIn || !venueId) return;
    let cancelled = false;
    void apiGet<{ data?: { businessId?: string }[] } | { businessId?: string }[]>(
      `/mobile/favorites?limit=100`,
      "USER",
    )
      .then((favorites) => {
        if (cancelled) return;
        const favRows = Array.isArray(favorites)
          ? favorites
          : Array.isArray((favorites as { data?: { businessId?: string }[] })?.data)
            ? (favorites as { data: { businessId?: string }[] }).data
            : [];
        setIsFavorite(favRows.some((f) => f.businessId === venueId));
      })
      .catch(() => {
        if (!cancelled) setIsFavorite(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, venueId]);

  useEffect(() => {
    if (!venueLoading) return;
    const timeout = window.setTimeout(() => setVenueLoading(false), 18000);
    return () => window.clearTimeout(timeout);
  }, [venueLoading]);

  const VENUE_DATA = venueData;
  const heroSrc = VENUE_DATA.bannerUrl || VENUE_DATA.images[0] || PLACEHOLDER_IMAGE_DATA_URI;
  const portfolioImages = VENUE_DATA.images.filter((u) => u && u.trim().length > 0);

  useEffect(() => {
    if (!VENUE_DATA.name || VENUE_DATA.name === "—") return;
    setMeta({ title: VENUE_DATA.name, subtitle: VENUE_DATA.category, hideHeader: false });
    return () => clearMeta();
  }, [VENUE_DATA.name, VENUE_DATA.category, setMeta, clearMeta]);

  const venueTabs = useMemo(
    () =>
      [
        { id: "services" as const, label: t("venueServicios") },
        { id: "team" as const, label: t("venueEquipo") },
        { id: "portfolio" as const, label: t("venuePortfolio") },
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
      { id: "all", label: t("venueServiceFilterAll") || "Todos" },
    ];
    const services = VENUE_DATA.services;
    if (services.some((s) => matchesAudience(s.tag, ["mujer", "woman", "women", "female", "femenin"]))) {
      filters.push({ id: "women", label: t("venueServiceFilterWomen") || "Mujeres" });
    }
    if (services.some((s) => matchesAudience(s.tag, ["hombre", "man", "men", "male", "masculin", "barber"]))) {
      filters.push({ id: "men", label: t("venueServiceFilterMen") || "Hombres" });
    }
    if (services.some((s) => matchesAudience(s.tag, ["niño", "nino", "kid", "child", "children"]))) {
      filters.push({ id: "kids", label: t("venueServiceFilterKids") || "Niños" });
    }
    if (promotionServiceIds.size > 0) {
      filters.push({ id: "promotions", label: t("venueServiceFilterPromotions") || "Promociones" });
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

  const goToPortfolio = () => {
    setActiveTab("portfolio");
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  const openDirections = () => {
    const query = VENUE_DATA.address || VENUE_DATA.name;
    if (!query) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, "_blank");
  };

  // ---- lightbox keyboard + body-scroll lock ----
  const lbCount = portfolioImages.length;
  const lbPrev = React.useCallback(
    () => setPortfolioLightbox((i) => (i == null ? i : (i - 1 + lbCount) % lbCount)),
    [lbCount],
  );
  const lbNext = React.useCallback(
    () => setPortfolioLightbox((i) => (i == null ? i : (i + 1) % lbCount)),
    [lbCount],
  );
  useEffect(() => {
    if (portfolioLightbox == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPortfolioLightbox(null);
      else if (e.key === "ArrowLeft") lbPrev();
      else if (e.key === "ArrowRight") lbNext();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [portfolioLightbox, lbPrev, lbNext]);

  // ---- responsive helpers (matching the design system venue layout) ----
  const PAD = "clamp(24px, 3vw, 44px)";
  const MAXW = 1760;
  const stack = vw < 1000;
  const thumbCols = vw < 640 ? 3 : 6;
  const teamCols = vw < 560 ? 1 : vw < 880 ? 2 : vw < 1180 ? 3 : 4;

  // ---- info panel derived data ----
  const todayIdx = new Date().getDay();
  const todayLabel = weekdayLabel(todayIdx, language === "es" ? "es" : "en");
  const todayHours = localizeHoursLabel(
    hoursForWeekdayIndex(VENUE_DATA.schedule, todayIdx),
    language === "es" ? "es" : "en",
  );
  const weekHours = localizeSchedule(VENUE_DATA.schedule, language === "es" ? "es" : "en");
  const socialsArr = [
    VENUE_DATA.socials.instagram && { name: "instagram", href: resolveSocialHref("instagram", VENUE_DATA.socials.instagram) },
    VENUE_DATA.socials.tiktok && { name: "tiktok", href: resolveSocialHref("tiktok", VENUE_DATA.socials.tiktok) },
    VENUE_DATA.socials.youtube && { name: "youtube", href: resolveSocialHref("youtube", VENUE_DATA.socials.youtube) },
    VENUE_DATA.socials.x && { name: "x", href: resolveSocialHref("x", VENUE_DATA.socials.x) },
  ].filter(Boolean) as Array<{ name: string; href: string }>;

  const infoLinks: string[] = [];
  const infoLinkContent: Array<{ title: string; body: string }> = [];
  if (VENUE_DATA.cancellationPolicyMessage) {
    const cancelTitle = t("venueCancellationPolicyTitle") || "Política de pago y cancelación";
    infoLinks.push(cancelTitle);
    infoLinkContent.push({ title: cancelTitle, body: VENUE_DATA.cancellationPolicyMessage });
  }

  // ---- reviews derived data ----
  const reviewDist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviewRows.forEach((r) => {
    const k = Math.min(5, Math.max(1, Math.round(r.rating)));
    reviewDist[k] += 1;
  });
  const reviewTotal = VENUE_DATA.reviews || reviewRows.length;
  const reviewAvg = VENUE_DATA.rating || 0;
  let filteredReviews = reviewRows;
  if (["5", "4", "3", "2", "1"].includes(reviewFilter)) {
    filteredReviews = reviewRows.filter((r) => Math.round(r.rating) === Number(reviewFilter));
  } else if (reviewFilter === "comentario") {
    filteredReviews = reviewRows.filter((r) => r.comment && r.comment.trim());
  }
  const REVIEWS_LIMIT = 4;
  const shownReviews = reviewsExpanded ? filteredReviews : filteredReviews.slice(0, REVIEWS_LIMIT);

  const priceFor = (s: VenueService) => {
    const promo = promotionData.find((p) => p.serviceId === s.id);
    if (promo) {
      const discounted = Number(s.price) * (1 - promo.discountPercent / 100);
      return discounted.toFixed(2);
    }
    return Number(s.price).toFixed(2);
  };

  const SectionHead = ({ title, sub }: { title: string; sub?: string }) => (
    <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 28px" }}>
      <h2 style={{ fontSize: 30, fontWeight: 700 }}>{title}</h2>
      {sub && <p style={{ fontSize: 15, color: "var(--rz-gray-500)", marginTop: 10, lineHeight: 1.5 }}>{sub}</p>}
    </div>
  );

  if (!routeReady) {
    return (
      <div
        style={{
          background: "var(--surface-card)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <AppLoader label={t("venueLoading")} variant="section" />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--surface-card)", position: "relative", minHeight: "100vh" }}>
      {venueLoading && !isBookingModalOpen ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(4px)",
          }}
          aria-busy="true"
          aria-live="polite"
        >
          <AppLoader label={t("venueLoading")} variant="section" />
        </div>
      ) : null}

      <StickyBookingBar
        name={VENUE_DATA.name}
        location={VENUE_DATA.address}
        avatar={VENUE_DATA.logoUrl || undefined}
        watchRef={titleRef}
        onReserve={openBookingModal}
        onVisibilityChange={setStickyBarVisible}
        ctaLabel={
          selectedServices.length > 0
            ? `${t("venueBookNow")} (${selectedServices.length})`
            : t("venueBookNow")
        }
      />

      <div style={{ maxWidth: MAXW, margin: "0 auto", padding: `28px ${PAD} 0` }}>
        {/* Gallery */}
        <div style={{ position: "relative", borderRadius: "var(--radius-lg)", overflow: "hidden", height: "clamp(230px, 36vw, 440px)" }}>
          <img
            src={heroSrc}
            alt={VENUE_DATA.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              const el = e.currentTarget;
              if (el.src.startsWith("data:")) return;
              el.src = PLACEHOLDER_IMAGE_DATA_URI;
            }}
          />
          {portfolioImages.length > 0 && (
            <div style={{ position: "absolute", right: 18, bottom: 18 }}>
              <Button
                variant="dark"
                size="sm"
                leftIcon="grid"
                style={{ background: "rgba(2,30,44,0.78)", backdropFilter: "blur(6px)" }}
                onClick={goToPortfolio}
              >
                {t("venueViewAllPhotos") || "Ver todas las fotos"}
              </Button>
            </div>
          )}
        </div>
        {portfolioImages.length > 1 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${thumbCols},1fr)`, gap: 12, marginTop: 12 }}>
            {portfolioImages.slice(0, thumbCols).map((h, i) => (
              <div
                key={`${h}-${i}`}
                style={{ height: vw < 640 ? 96 : 120, borderRadius: "var(--radius-md)", overflow: "hidden", cursor: "pointer" }}
                onClick={() => setPortfolioLightbox(i)}
              >
                <img
                  src={h}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (el.src.startsWith("data:")) return;
                    el.src = PLACEHOLDER_IMAGE_DATA_URI;
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Title + content / sidebar */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: stack ? "1fr" : "minmax(0,1fr) clamp(340px, 24vw, 400px)",
            gap: stack ? 28 : "clamp(32px, 2.6vw, 48px)",
            marginTop: 36,
            alignItems: "start",
          }}
        >
          <div>
            <div ref={titleRef} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 700 }}>{VENUE_DATA.name}</h1>
                <div style={{ marginTop: 10 }}>
                  <Rating value={reviewAvg} count={VENUE_DATA.reviews} />
                </div>
                {VENUE_DATA.address && (
                  <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--rz-gray-500)", marginTop: 10 }}>
                    <Glyph name="mapPin" size={15} /> {VENUE_DATA.address}
                  </p>
                )}
                {VENUE_DATA.description && (
                  <p style={{ fontSize: 15, color: "var(--rz-gray-600)", lineHeight: 1.55, marginTop: 14, maxWidth: 640 }}>
                    {VENUE_DATA.description}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {VENUE_DATA.reviews === 0 && (
                  <Badge tone="coral" uppercase={false}>{t("venueNewOnPlatform")}</Badge>
                )}
                <IconButton
                  variant="outlineNeutral"
                  round
                  label={isFavorite ? t("venueFavRemovedTitle") : t("venueFavAddedTitle")}
                  icon={<Glyph name="heart" size={20} filled={isFavorite} style={{ color: isFavorite ? "var(--rz-coral)" : undefined }} />}
                  onClick={handleToggleFavorite}
                />
                <div style={{ position: "relative" }}>
                  <IconButton icon="share" variant="outlineNeutral" round label={t("venueShareButton")} onClick={handleShare} />
                  {shareOpen && (
                    <>
                      <div onClick={() => setShareOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 60 }} />
                      <div
                        style={{
                          position: "absolute",
                          top: "calc(100% + 8px)",
                          right: 0,
                          zIndex: 61,
                          width: 232,
                          background: "var(--surface-card)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-md)",
                          boxShadow: "var(--shadow-lg)",
                          padding: 6,
                        }}
                      >
                        <button
                          onClick={copyShareLink}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 11,
                            width: "100%",
                            padding: "10px 11px",
                            border: "none",
                            background: "transparent",
                            borderRadius: "var(--radius-sm)",
                            cursor: "pointer",
                            textAlign: "left",
                            fontFamily: "var(--font-sans)",
                            fontSize: 14,
                            fontWeight: 500,
                            color: "var(--rz-gray-700)",
                          }}
                        >
                          <Glyph name="link" size={17} style={{ color: "var(--rz-coral)", flex: "none" }} />
                          {t("venueCopyLink") || "Copiar enlace"}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div ref={contentRef} style={{ scrollMarginTop: 90 }}>
              <div style={{ display: "flex", justifyContent: "center", marginTop: 30, marginBottom: 36 }}>
                <Tabs
                  value={activeTab}
                  onChange={(v: typeof activeTab) => {
                    setActiveTab(v);
                    if (v === "portfolio") {
                      setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
                    }
                  }}
                  items={venueTabs.map((tb) => ({ label: tb.label, value: tb.id }))}
                />
              </div>

              {activeTab === "services" && (
                <div id="venue-section-services">
                  <SectionHead title={t("ourServices")} sub={t("venueServicesBlurb")} />
                  {serviceFilters.length > 1 && (
                    <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap", marginBottom: 28 }}>
                      {serviceFilters.map((f) => (
                        <Chip key={f.id} active={activeServiceFilter === f.id} onClick={() => setActiveServiceFilter(f.id)} style={{ padding: "0 24px" }}>
                          {f.label}
                        </Chip>
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {visibleServices.map((s) => {
                      const selected = selectedServices.includes(s.id);
                      return (
                        <ServiceCard
                          key={s.id}
                          name={s.name}
                          description={s.description}
                          duration={s.time}
                          price={priceFor(s)}
                          selected={selected}
                          actionLabel={t("bookBtn")}
                          onAction={() => openBookingFlow({ addServiceId: s.id })}
                        />
                      );
                    })}
                    {visibleServices.length === 0 && (
                      <p style={{ textAlign: "center", padding: "32px 0", color: "var(--rz-gray-500)", fontSize: 14 }}>
                        {t("venueNoServices") || "No hay servicios disponibles."}
                      </p>
                    )}
                  </div>
                  {hasMoreServices && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 22 }}>
                      <Button
                        variant="outline"
                        onClick={() => setServicesExpanded((e) => !e)}
                        rightIcon={<Glyph name="chevronDown" size={16} style={{ transform: servicesExpanded ? "rotate(180deg)" : "none", transition: "transform var(--dur-base)" }} />}
                      >
                        {servicesExpanded ? (t("venueSeeLess") || "Ver menos") : `${t("venueSeeMore") || "Ver más"} (${filteredServices.length - SERVICES_PREVIEW_LIMIT})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "team" && (
                <div id="venue-section-team">
                  <SectionHead title={t("venueTeamSectionTitle")} sub={t("venueTeamIntro")} />
                  {VENUE_DATA.team.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "32px 0", color: "var(--rz-gray-500)", fontSize: 14 }}>
                      {t("venueNoTeam") || "No hay profesionales listados."}
                    </p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${teamCols},1fr)`, gap: 16, alignItems: "stretch" }}>
                      {(teamExpanded ? VENUE_DATA.team : VENUE_DATA.team.slice(0, teamCols)).map((m) => (
                        <StaffCard
                          key={m.id}
                          compact
                          photo={m.img}
                          name={m.name}
                          role={m.role}
                          rating={m.rating || 0}
                          reviews={m.reviews || 0}
                          bio={m.bio && m.bio !== "—" ? m.bio : undefined}
                          stats={[
                            { icon: "clock", value: m.years, label: t("venueStaffExp") },
                            { icon: "users", value: m.clients, label: t("venueStaffClientsLabel") },
                            { icon: "star", value: m.reviews, label: t("reviews") },
                          ]}
                          actionLabel={t("venueViewAvailability") || "Ver disponibilidad"}
                          onAction={() => openBookingFlow({ staffId: m.id })}
                        />
                      ))}
                    </div>
                  )}
                  {VENUE_DATA.team.length > teamCols && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                      <Button
                        variant="outline"
                        onClick={() => setTeamExpanded((e) => !e)}
                        rightIcon={<Glyph name="chevronDown" size={16} style={{ transform: teamExpanded ? "rotate(180deg)" : "none", transition: "transform var(--dur-base)" }} />}
                      >
                        {teamExpanded ? (t("venueSeeLess") || "Ver menos") : `${t("venueSeeMore") || "Ver más"} (${VENUE_DATA.team.length - teamCols})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "portfolio" && (
                <div id="venue-section-portfolio">
                  <SectionHead title={t("venuePortfolio")} sub={t("venuePortfolioBlurb") || "Explora una galería de trabajos reales realizados por el negocio."} />
                  {portfolioImages.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "32px 0", color: "var(--rz-gray-500)", fontSize: 14 }}>
                      {t("venueNoPortfolio") || "No hay fotos disponibles."}
                    </p>
                  ) : (
                    <PortfolioGallery
                      columns={vw < 560 ? 2 : vw < 980 ? 3 : 4}
                      images={portfolioImages.map((src) => ({ src }))}
                      onOpen={(_img: unknown, i: number) => setPortfolioLightbox(i)}
                    />
                  )}
                </div>
              )}

              {activeTab === "reviews" && (
                <div id="venue-section-reviews">
                  <SectionHead title={t("venueReviewsCustomerTitle")} sub={t("venueReviewsBlurb") || "Conoce la experiencia de otros clientes antes de reservar."} />

                  <div
                    style={{
                      maxWidth: 600,
                      background: "var(--rz-gray-050)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-lg)",
                      padding: "clamp(18px,2.2vw,24px) clamp(20px,2.6vw,28px)",
                      marginBottom: 24,
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: "clamp(20px,3vw,32px)",
                    }}
                  >
                    <div style={{ flex: "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ fontFamily: "var(--font-sans)", fontSize: 44, fontWeight: 700, color: "var(--rz-navy)", lineHeight: 1, letterSpacing: "-0.5px" }}>
                        {reviewAvg > 0 ? reviewAvg.toFixed(1) : "—"}
                      </div>
                      <div>
                        <div style={{ display: "flex", gap: 2, marginBottom: 4 }}>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <Glyph key={i} name="star" size={15} filled style={{ color: i < Math.round(reviewAvg) ? "var(--rz-gold)" : "var(--rz-gray-200)" }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 13, color: "var(--rz-gray-600)", fontWeight: 600 }}>{reviewTotal} {t("reviews")}</div>
                      </div>
                    </div>
                    <div style={{ alignSelf: "stretch", width: 1, background: "var(--border-subtle)" }} />
                    <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 6 }}>
                      {[5, 4, 3, 2, 1].map((star) => {
                        const base = reviewRows.length || 1;
                        const pct = Math.round((reviewDist[star] / base) * 100);
                        return (
                          <div key={star} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, width: 22, flex: "none", fontSize: 12, fontWeight: 600, color: "var(--rz-gray-700)" }}>
                              {star}
                              <Glyph name="star" size={11} filled style={{ color: "var(--rz-gold)" }} />
                            </span>
                            <div style={{ flex: 1, height: 6, background: "var(--rz-gray-200)", borderRadius: "var(--radius-pill)", overflow: "hidden" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: "var(--rz-gold)", borderRadius: "var(--radius-pill)", transition: "width var(--dur-slow) var(--ease-out)" }} />
                            </div>
                            <span style={{ width: 32, flex: "none", textAlign: "right", fontSize: 11, fontWeight: 600, color: "var(--rz-gray-500)", fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 24 }}>
                    {[
                      { key: "todas" as const, label: t("venueReviewFilterAll") || "Todas" },
                      { key: "comentario" as const, label: t("venueReviewFilterComment") || "Con comentario" },
                    ].map((f) => (
                      <Chip key={f.key} active={reviewFilter === f.key} uppercase={false} onClick={() => { setReviewFilter(f.key); setStarMenuOpen(false); }}>
                        {f.label}
                      </Chip>
                    ))}
                    {(() => {
                      const STAR_OPTS = [
                        { label: `5 ${t("stars") || "estrellas"}`, value: "5" as const },
                        { label: `4 ${t("stars") || "estrellas"}`, value: "4" as const },
                        { label: `3 ${t("stars") || "estrellas"}`, value: "3" as const },
                        { label: `2 ${t("stars") || "estrellas"}`, value: "2" as const },
                        { label: `1 ${t("star") || "estrella"}`, value: "1" as const },
                      ];
                      const isStar = ["5", "4", "3", "2", "1"].includes(reviewFilter);
                      const current = STAR_OPTS.find((o) => o.value === reviewFilter);
                      return (
                        <div style={{ position: "relative" }}>
                          <button
                            onClick={() => setStarMenuOpen((o) => !o)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 7,
                              height: 40,
                              padding: "0 16px",
                              fontFamily: "var(--font-sans)",
                              fontSize: 13,
                              fontWeight: 600,
                              letterSpacing: "var(--ls-tight)",
                              borderRadius: "var(--radius-pill)",
                              cursor: "pointer",
                              background: isStar ? "var(--rz-navy)" : "var(--surface-card)",
                              color: isStar ? "#fff" : "var(--rz-gray-700)",
                              border: isStar ? "1.5px solid var(--rz-navy)" : "1.5px solid var(--border-default)",
                              transition: "all var(--dur-base)",
                            }}
                          >
                            <Glyph name="star" size={14} filled style={{ color: isStar ? "var(--rz-gold)" : "var(--rz-gray-400)" }} />
                            {current ? current.label : (t("venueReviewFilterStars") || "Filtrar por estrellas")}
                            <Glyph name="chevronDown" size={15} style={{ transform: starMenuOpen ? "rotate(180deg)" : "none", transition: "transform var(--dur-base)", opacity: 0.85 }} />
                          </button>
                          {starMenuOpen && (
                            <>
                              <div onClick={() => setStarMenuOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 29 }} />
                              <div
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 6px)",
                                  left: 0,
                                  zIndex: 30,
                                  minWidth: 170,
                                  background: "var(--surface-card)",
                                  border: "1px solid var(--border-subtle)",
                                  borderRadius: "var(--radius-md)",
                                  boxShadow: "var(--shadow-md)",
                                  padding: 6,
                                }}
                              >
                                {STAR_OPTS.map((o) => (
                                  <button
                                    key={o.value}
                                    onClick={() => { setReviewFilter(o.value); setStarMenuOpen(false); }}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "space-between",
                                      gap: 10,
                                      width: "100%",
                                      padding: "9px 12px",
                                      border: "none",
                                      cursor: "pointer",
                                      textAlign: "left",
                                      background: o.value === reviewFilter ? "var(--rz-coral-050)" : "transparent",
                                      borderRadius: "var(--radius-sm)",
                                      fontFamily: "var(--font-sans)",
                                      fontSize: 14,
                                      color: o.value === reviewFilter ? "var(--rz-coral-700)" : "var(--rz-gray-700)",
                                      fontWeight: o.value === reviewFilter ? 600 : 400,
                                    }}
                                  >
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                      <Glyph name="star" size={13} filled style={{ color: "var(--rz-gold)" }} />
                                      {o.label}
                                    </span>
                                    {o.value === reviewFilter && <Glyph name="check" size={15} />}
                                  </button>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {shownReviews.map((r) => (
                      <div
                        key={r.id}
                        style={{
                          background: "var(--surface-card)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: "var(--radius-lg)",
                          padding: "clamp(18px,2.4vw,24px)",
                          boxShadow: "var(--shadow-xs)",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                          <Avatar name={r.customerName} size={48} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                              <div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "var(--rz-navy)" }}>{r.customerName}</div>
                                {r.date && <div style={{ fontSize: 13, color: "var(--rz-gray-500)", marginTop: 2 }}>{r.date}</div>}
                              </div>
                              <div style={{ display: "inline-flex", gap: 2, flex: "none" }}>
                                {[0, 1, 2, 3, 4].map((i) => (
                                  <Glyph key={i} name="star" size={15} filled style={{ color: i < r.rating ? "var(--rz-gold)" : "var(--rz-gray-200)" }} />
                                ))}
                              </div>
                            </div>
                            {r.comment && r.comment.trim() && (
                              <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--rz-gray-700)", marginTop: 12 }}>{r.comment}</p>
                            )}
                            {r.reply && r.reply.trim() && (
                              <div
                                style={{
                                  marginTop: 14,
                                  padding: "12px 16px",
                                  background: "var(--rz-gray-050)",
                                  borderLeft: "3px solid var(--rz-coral)",
                                  borderRadius: "0 var(--radius-sm) var(--radius-sm) 0",
                                }}
                              >
                                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--rz-navy)", letterSpacing: "var(--ls-wide)", textTransform: "uppercase" }}>
                                  <Glyph name="shield" size={13} style={{ color: "var(--rz-coral)" }} />
                                  {t("venueReviewReplyLabel") || "Respuesta del negocio"}
                                </div>
                                <p style={{ fontSize: 14, lineHeight: 1.55, color: "var(--rz-gray-600)", marginTop: 6 }}>{r.reply}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredReviews.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: "var(--rz-gray-500)", fontSize: 14 }}>
                      {t("venueReviewsNone")}
                    </div>
                  )}

                  {filteredReviews.length > REVIEWS_LIMIT && (
                    <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
                      <Button
                        variant="outline"
                        onClick={() => setReviewsExpanded((e) => !e)}
                        rightIcon={<Glyph name="chevronDown" size={16} style={{ transform: reviewsExpanded ? "rotate(180deg)" : "none", transition: "transform var(--dur-base)" }} />}
                      >
                        {reviewsExpanded ? (t("venueSeeLess") || "Ver menos") : `${t("venueSeeMore") || "Ver más"} (${filteredReviews.length - REVIEWS_LIMIT})`}
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "amenities" && (
                <div id="venue-section-amenities">
                  <SectionHead title={t("venueAmenitiesSectionTitle")} sub={t("venueAmenitiesBlurb")} />
                  {VENUE_DATA.amenities.length === 0 ? (
                    <p style={{ textAlign: "center", padding: "32px 0", color: "var(--rz-gray-500)", fontSize: 14 }}>
                      {t("venueNoAmenitiesListed")}
                    </p>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: `repeat(${vw < 560 ? 2 : vw < 880 ? 3 : 4}, 1fr)`, gap: 12 }}>
                      {VENUE_DATA.amenities.map((a, i) => {
                        const Icon = amenityLucideIcon(a.key);
                        return (
                          <div
                            key={`${a.key}-${i}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              padding: "14px 16px",
                              background: "var(--surface-card)",
                              border: "1px solid var(--border-subtle)",
                              borderRadius: "var(--radius-md)",
                            }}
                          >
                            <span
                              style={{
                                flex: "none",
                                width: 38,
                                height: 38,
                                borderRadius: "var(--radius-sm)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "var(--rz-coral-050)",
                                color: "var(--rz-coral)",
                              }}
                            >
                              <Icon size={19} strokeWidth={2} />
                            </span>
                            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--rz-navy)", lineHeight: 1.3 }}>{a.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <BusinessInfoPanel
            name={VENUE_DATA.name}
            mapNode={
              VENUE_DATA.lat != null && VENUE_DATA.lng != null ? (
                <VenueMiniMap
                  lat={VENUE_DATA.lat}
                  lng={VENUE_DATA.lng}
                  label={`Mapa de ${VENUE_DATA.name}`}
                  language={language === "es" ? "es" : "en"}
                />
              ) : undefined
            }
            address={VENUE_DATA.address || undefined}
            about={VENUE_DATA.description || undefined}
            todayLabel={todayLabel}
            todayHours={todayHours || undefined}
            weekHours={weekHours}
            phone={VENUE_DATA.contactPhone || undefined}
            email={VENUE_DATA.contactEmail || undefined}
            socials={socialsArr}
            links={infoLinks}
            onLinkClick={(_label: string, i: number) => setInfoModal(infoLinkContent[i])}
            onDirections={openDirections}
          />
        </div>
      </div>

      {/* Categories */}
      {browseCategories.length > 0 && (
        <div style={{ background: "var(--rz-gray-050)", marginTop: 56, padding: `52px ${PAD}` }}>
          <div style={{ maxWidth: MAXW, margin: "0 auto" }}>
            <SectionHead title={t("venuePickCategoryTitle")} sub={t("venuePickCategorySub")} />
            {vw >= 980 ? (
              <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(browseCategories.length, 6)},1fr)`, gap: vw < 1200 ? 10 : 14 }}>
                {browseCategories.slice(0, 6).map((c) => (
                  <CategoryCard
                    key={c.id}
                    image={(c.imageUrl || "").trim() || undefined}
                    title={language === "es" ? c.labelEs || c.labelEn : c.labelEn}
                    onClick={() => router.push(`/search?categoryKey=${encodeURIComponent(c.key)}`)}
                  />
                ))}
              </div>
            ) : (
              <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 10, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
                {browseCategories.map((c) => (
                  <div key={c.id} style={{ flex: "none", width: vw < 600 ? 150 : 180, scrollSnapAlign: "start" }}>
                    <CategoryCard
                      image={(c.imageUrl || "").trim() || undefined}
                      title={language === "es" ? c.labelEs || c.labelEn : c.labelEn}
                      onClick={() => router.push(`/search?categoryKey=${encodeURIComponent(c.key)}`)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setPreferredStaffId(undefined);
          setBookingInitialDate(undefined);
          setBookingInitialTime(undefined);
        }}
        onBookingSuccess={() => {
          useVenueBookingCartStore.getState().clear();
          setSelectedServices([]);
        }}
        selectedServiceIds={selectedServices}
        venueData={VENUE_DATA as BookingModalVenueData}
        promotions={promotionData}
        preferredStaffId={preferredStaffId}
        initialDateISO={bookingInitialDate}
        initialTime={bookingInitialTime}
      />

      {/* Staff profile modal */}
      {profileStaff ? (
        <Modal open onClose={() => setProfileStaff(null)} width={520}>
          <div style={{ position: "relative" }}>
            <div style={{ height: 220, background: "var(--rz-gray-100)", overflow: "hidden", borderRadius: "var(--radius-2xl) var(--radius-2xl) 0 0" }}>
              <img src={profileStaff.img} alt={profileStaff.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <div style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 700, color: "var(--rz-navy)" }}>{profileStaff.name}</h3>
                <p style={{ marginTop: 4, fontSize: 12, fontWeight: 700, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--rz-coral)" }}>{profileStaff.role}</p>
                {profileStaff.rating > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <Rating value={profileStaff.rating} count={profileStaff.reviews} layout="compact" />
                  </div>
                )}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--rz-gray-600)" }}>
                {profileStaff.bio && profileStaff.bio.trim() !== "—" ? profileStaff.bio : t("venueStaffProfileNoBio")}
              </p>
              <div style={{ display: "flex", gap: 16, borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "14px 0", fontSize: 12, fontWeight: 600, color: "var(--rz-gray-600)" }}>
                <span>{profileStaff.years} {t("venueStaffExp")}</span>
                <span style={{ color: "var(--rz-gray-300)" }}>|</span>
                <span>{profileStaff.clients} {t("venueStaffClientsLabel")}</span>
                <span style={{ color: "var(--rz-gray-300)" }}>|</span>
                <span>{profileStaff.reviews} {t("reviews")}</span>
              </div>
              <div>
                <p style={{ marginBottom: 8, fontSize: 11, fontWeight: 700, letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--rz-gray-500)" }}>
                  {t("venueStaffProfileAvailabilityHeading")}
                </p>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--rz-gray-700)" }}>{formatAvailabilityDisplay(profileStaff.availability, language === "es" ? "es" : "en")}</p>
              </div>
              <div>
                <p style={{ marginBottom: 10, fontSize: 11, fontWeight: 700, letterSpacing: "var(--ls-eyebrow)", textTransform: "uppercase", color: "var(--rz-gray-500)" }}>
                  {t("venueStaffProfileServicesHeading")}
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {servicesForMember(profileStaff, VENUE_DATA.services).map((svc) => (
                    <div
                      key={svc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)",
                        background: "var(--rz-gray-050)",
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "var(--rz-navy)" }}>{svc.name}</p>
                        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "var(--ls-wide)", textTransform: "uppercase", color: "var(--rz-gray-500)" }}>
                          {svc.time} · ${priceFor(svc)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        uppercase
                        onClick={() => openBookingFlow({ addServiceId: svc.id, staffId: profileStaff.id })}
                      >
                        {t("bookBtn")}
                      </Button>
                    </div>
                  ))}
                  {servicesForMember(profileStaff, VENUE_DATA.services).length === 0 && (
                    <p style={{ fontSize: 14, color: "var(--rz-gray-500)" }}>{t("venueStaffProfileNoServices")}</p>
                  )}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <Button variant="outline" fullWidth uppercase onClick={() => setProfileStaff(null)}>
                  {t("venueStaffProfileClose")}
                </Button>
                <Button variant="dark" fullWidth uppercase onClick={() => openBookingFlow({ staffId: profileStaff.id })}>
                  {t("venueViewAvailability") || "Ver disponibilidad"}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Cross-venue replace confirmation */}
      {crossVenuePendingServiceId ? (
        <Modal open onClose={() => setCrossVenuePendingServiceId(null)} width={440} showClose={false}>
          <div style={{ padding: "clamp(26px,4vw,34px) clamp(24px,4vw,32px)" }}>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: "var(--rz-navy)" }}>{t("venueCrossBusinessTitle")}</h3>
            <p style={{ marginTop: 12, fontSize: 14.5, lineHeight: 1.6, color: "var(--rz-gray-600)" }}>{t("venueCrossBusinessBody")}</p>
            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
              <Button variant="primary" fullWidth onClick={confirmCrossVenueReplace}>{t("venueCrossBusinessReplace")}</Button>
              <Button variant="ghost" fullWidth onClick={() => setCrossVenuePendingServiceId(null)}>{t("venueCrossBusinessCancel")}</Button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* Footer-link info modal */}
      {infoModal && (
        <Modal open onClose={() => setInfoModal(null)} width={460}>
          <div style={{ padding: "clamp(26px,4vw,34px) clamp(24px,4vw,32px)" }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--rz-navy)", letterSpacing: "-0.3px" }}>{infoModal.title}</h2>
            <p style={{ fontSize: 14.5, color: "var(--rz-gray-600)", lineHeight: 1.6, marginTop: 12 }}>{infoModal.body}</p>
            <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
              <Button variant="primary" onClick={() => setInfoModal(null)}>{t("gotIt") || "Entendido"}</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Portfolio lightbox */}
      {portfolioLightbox != null && portfolioImages[portfolioLightbox] && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setPortfolioLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2147483000,
            background: "rgba(8, 17, 26, 0.94)",
            backdropFilter: "blur(2px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ flex: "none", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "clamp(14px,2vw,22px) clamp(16px,3vw,28px)", color: "#fff" }}>
            <span style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, fontVariantNumeric: "tabular-nums" }}>
              {portfolioLightbox + 1} / {lbCount}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setPortfolioLightbox(null); }}
              aria-label="Cerrar"
              style={{ width: 44, height: 44, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.12)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Glyph name="close" size={22} />
            </button>
          </div>
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: "clamp(8px,2vw,20px)", padding: "0 clamp(10px,2vw,24px)" }}>
            {lbCount > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); lbPrev(); }}
                aria-label="Anterior"
                style={{ flex: "none", width: vw < 600 ? 44 : 52, height: vw < 600 ? 44 : 52, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.12)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Glyph name="chevronLeft" size={26} />
              </button>
            )}
            <div style={{ flex: 1, maxWidth: "min(1100px, 92vw)", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
              <img
                key={portfolioLightbox}
                src={portfolioImages[portfolioLightbox]}
                alt=""
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: "var(--radius-md)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
              />
            </div>
            {lbCount > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); lbNext(); }}
                aria-label="Siguiente"
                style={{ flex: "none", width: vw < 600 ? 44 : 52, height: vw < 600 ? 44 : 52, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(255,255,255,0.12)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Glyph name="chevronRight" size={26} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: 28,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: "var(--rz-navy)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "var(--radius-pill)",
            boxShadow: "var(--shadow-lg)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Glyph name="check" size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
