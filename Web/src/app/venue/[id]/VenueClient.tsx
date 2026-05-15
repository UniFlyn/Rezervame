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
  X,
  Scissors,
} from "lucide-react";
import { BookingModal, type BookingModalVenueData } from "../../../components/BookingModal";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { amenityLucideIcon } from "@/lib/amenityIcons";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { fetchPublicCategories, type PublicCategory } from "@/lib/venueSearch";
import { toastError, toastInfo, toastSuccess, toastWarning } from "@/lib/toast";
import { useAuth } from "@/components/AuthProvider";
import { formatAvailabilityDisplay } from "@/lib/staffAvailability";
import { useVenueBookingCartStore } from "@/store/venueBookingCartStore";

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
  images: string[];
  services: VenueService[];
  team: VenueTeam[];
  schedule: { day: string; hours: string }[];
  socials: { instagram: string; tiktok: string; youtube: string };
  amenities: VenueAmenity[];
  contactPhone: string;
  contactEmail: string;
};

function memberOffersService(member: VenueTeam, serviceId: string): boolean {
  if (!member.serviceIds?.length) return true;
  return member.serviceIds.includes(serviceId);
}

function servicesForMember(member: VenueTeam, services: VenueService[]): VenueService[] {
  return services.filter((s) => memberOffersService(member, s.id));
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
    images: [PLACEHOLDER_IMAGE_DATA_URI],
    services: [],
    team: [],
    schedule: [],
    socials: { instagram: "", tiktok: "", youtube: "" },
    amenities: [],
    contactPhone: "",
    contactEmail: "",
  };
}

export default function VenueDetailsPage({ businessId }: { businessId: string }) {
  const { t, language } = useI18n();
  const router = useRouter();
  const { isLoggedIn, setIsLoginModalOpen, setPendingAfterLogin } = useAuth();
  const [venueId, setVenueId] = useState(businessId);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const parts = window.location.pathname.split('/');
      if (parts.length >= 3 && parts[1] === 'venue' && parts[2] !== 'default') {
        setVenueId(parts[2]);
      }
    }
  }, []);
  const [venueData, setVenueData] = useState<VenueState>(() => emptyVenue(venueId));
  const [reviewRows, setReviewRows] = useState<
    Array<{
      id: string;
      customerName: string;
      date: string;
      rating: number;
      comment: string;
      initials: string;
    }>
  >([]);
  const [browseCategories, setBrowseCategories] = useState<PublicCategory[]>([]);
  const [activeTab, setActiveTab] = useState<"services" | "team" | "reviews" | "amenities">("services");
  const [activeServiceFilter, setActiveServiceFilter] = useState<"all" | "bestsellers" | "promotions">("all");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [profileStaff, setProfileStaff] = useState<VenueTeam | null>(null);
  const [crossVenuePendingServiceId, setCrossVenuePendingServiceId] = useState<string | null>(null);
  const [venueLoading, setVenueLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [bestsellerMap, setBestsellerMap] = useState<Record<string, number>>({});
  const [promotionServiceIds, setPromotionServiceIds] = useState<Set<string>>(new Set());
  const [promotionData, setPromotionData] = useState<Array<{ serviceId: string; discountPercent: number; label?: string | null }>>([]);

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
    const storeApi = useVenueBookingCartStore.getState();
    storeApi.removeService(venueId, serviceId);
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
        if (venueId === 'default') {
          setVenueData(emptyVenue(venueId));
          setVenueLoading(false);
          return;
        }
        const business = await apiGet<Record<string, unknown> | null>(`/business/${venueId}`);
        if (!business) {
          if (!cancelled) {
            setVenueData(base);
            setReviewRows([]);
            toastWarning(t("venueUnavailableTitle"), t("venueUnavailableBody"));
          }
          return;
        }
        const [services, staff, reviews, favorites, bestsellers, promotions] = await Promise.all([
          apiGet<unknown[]>(`/business/${venueId}/services`).catch(() => [] as unknown[]),
          apiGet<unknown[]>(`/business/${venueId}/staff`).catch(() => [] as unknown[]),
          apiGet<unknown[]>(`/business/${venueId}/reviews`).catch(() => [] as unknown[]),
          isLoggedIn ? apiGet<any[]>(`/mobile/favorites`, "USER").catch(() => []) : Promise.resolve([]),
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
        if (isLoggedIn && Array.isArray(favorites)) {
          const fav = favorites.find((f: any) => f.businessId === venueId);
          setIsFavorite(!!fav);
        }
        const b = business as {
          banner?: string;
          logo?: string;
          contactPhone?: string;
          contactEmail?: string;
          socialInstagram?: string;
          socialTiktok?: string;
          socialYoutube?: string;
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
        const imgs: string[] = [];
        const pushIf = (u?: string) => {
          const s = (u || "").trim();
          if (!s || imgs.includes(s)) return;
          imgs.push(s);
        };
        pushIf(b.banner as string | undefined);
        pushIf(b.logo as string | undefined);
        if (imgs.length === 0) imgs.push(PLACEHOLDER_IMAGE_DATA_URI);

        let amenities: VenueAmenity[] = [];
        if (Array.isArray(b.amenities) && b.amenities.length > 0) {
          amenities = b.amenities.map((am) => ({
            key: am.key,
            name: (
              language === "en"
                ? String(am.labelEn ?? am.labelEs ?? am.key).trim()
                : String(am.labelEs ?? am.labelEn ?? am.key).trim()
            ) || am.key,
            desc:
              String(
                language === "en"
                  ? am.descriptionEn ?? am.descriptionEs ?? ""
                  : am.descriptionEs ?? am.descriptionEn ?? "",
              ).trim() || "—",
          }));
        }

        const svcList = Array.isArray(services) ? services : (services as any)?.data || [];
        const staffList = Array.isArray(staff) ? staff : (staff as any)?.data || [];
        const revList = Array.isArray(reviews) ? reviews : (reviews as any)?.data || [];

        const ratingAvg =
          revList.length > 0
            ? (revList as { rating?: number }[]).reduce(
                (acc, r) => acc + Number(r.rating ?? 0),
                0,
              ) / revList.length
            : 0;

        if (cancelled) return;

        setReviewRows(
          revList.map((raw: any) => {
            const r = raw as {
              id: string;
              customerName: string;
              date: string;
              rating: number;
              comment: string;
            };
            const d = new Date(r.date);
            const initials = (r.customerName || "?")
              .split(/\s+/)
              .filter(Boolean)
              .slice(0, 2)
              .map((p) => p[0]?.toUpperCase())
              .join("");
            return {
              id: r.id,
              customerName: r.customerName,
              date: Number.isNaN(d.getTime())
                ? ""
                : d.toLocaleDateString(language === "en" ? "en-US" : "es-PA", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }),
              rating: Number(r.rating) || 0,
              comment: r.comment || "",
              initials: initials || "?",
            };
          }),
        );

        if (cancelled) return;

        setVenueData({
          ...base,
          id: String((business as { id?: string }).id ?? venueId),
          name: String((business as { name?: string }).name ?? "—"),
          category: String((business as { category?: string }).category ?? "—"),
          rating: Number(ratingAvg.toFixed(1)) || 0,
          reviews: revList.length,
          address: String((business as { location?: string }).location ?? ""),
          description: String((business as { description?: string }).description ?? ""),
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
              image: row.imageUrl || null,
              tag: "all",
            };
          }),
          team: staffList.map((m: any) => {
            const row = m as {
              id: string;
              name: string;
              role: string;
              image?: string | null;
              skills?: string[];
              serviceIds?: string[];
              availability?: string;
            };
            const img = (row.image || "").trim();
            const svcIds = Array.isArray(row.serviceIds) ? row.serviceIds.map(String) : [];
            return {
              id: String(row.id),
              name: row.name,
              role: row.role,
              rating: 0,
              reviews: 0,
              clients: "—",
              years: "—",
              img: img || PLACEHOLDER_IMAGE_DATA_URI,
              bio: Array.isArray(row.skills) && row.skills.length ? row.skills.join(", ") : "—",
              serviceIds: svcIds,
              availability: String(row.availability ?? ""),
            };
          }),
          schedule: [],
          socials: {
            instagram: (b.socialInstagram || "").trim(),
            tiktok: (b.socialTiktok || "").trim(),
            youtube: (b.socialYoutube || "").trim(),
          },
          contactPhone,
          contactEmail,
        });
      } catch (err: unknown) {
        if (!cancelled) {
          setVenueData(base);
          setReviewRows([]);
          const detail = err instanceof Error ? err.message : "";
          toastError(
            t("venueLoadFailedTitle"),
            detail.trim() ? detail : t("venueLoadFailedBody"),
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
  const heroSrc = VENUE_DATA.images[0] || PLACEHOLDER_IMAGE_DATA_URI;

  const venueTabs = useMemo(
    () =>
      [
        { id: "services" as const, label: t("venueServicios") },
        { id: "team" as const, label: t("venueEquipo") },
        { id: "reviews" as const, label: t("venueReseñas") },
        { id: "amenities" as const, label: t("venueAmenidades") },
      ] as const,
    [t, language],
  );

  const serviceFilters = useMemo(
    () => {
      const filters: Array<{ id: "all" | "bestsellers" | "promotions"; label: string }> = [
        { id: "all", label: t("venueServiceFilterAll") },
        { id: "bestsellers", label: t("venueServiceFilterBestsellers") },
      ];
      // Only show Promotions tab if there are active promotions
      if (promotionServiceIds.size > 0) {
        filters.push({ id: "promotions", label: t("venueServiceFilterPromotions") });
      }
      return filters;
    },
    [t, language, promotionServiceIds],
  );

  return (
    <div className="relative min-h-screen bg-white">
      {venueLoading ? (
        <div
          className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-4 bg-white/95 backdrop-blur-sm"
          aria-busy="true"
          aria-live="polite"
        >
          <div
            className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff5a5f] border-t-transparent"
            role="status"
          />
          <p className="text-center text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {t("venueLoading")}
          </p>
        </div>
      ) : null}

      {/* VENUE NAME TOP BAR (SLIM) */}
      <div className="bg-slate-50 border-b border-slate-200 px-12 py-3 flex items-center justify-between sticky top-[73px] z-40 backdrop-blur-md bg-white/80">
          <div className="flex items-center gap-4">
              <Link href="/search" className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <ChevronLeft size={20} className="text-slate-600" />
              </Link>
              <div>
                  <h1 className="text-xl font-black text-slate-900 leading-none">{VENUE_DATA.name}</h1>
                  <p className="text-[10px] font-bold text-[#ff5a5f] uppercase tracking-widest mt-1">{VENUE_DATA.category}</p>
              </div>
          </div>
          <div className="flex items-center gap-4">
              {selectedServices.length > 0 && (
                  <div className="flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl animate-in fade-in zoom-in duration-300">
                      <Check size={12} className="text-green-400" /> {selectedServices.length}{" "}
                      {selectedServices.length === 1 ? t("venueServiceSingular") : t("venueServicePlural")}
                  </div>
              )}
              <button 
                onClick={() => {
                  if (!isLoggedIn) {
                    setPendingAfterLogin(() => () => {
                      setProfileStaff(null);
                      setIsBookingModalOpen(true);
                    });
                    setIsLoginModalOpen(true);
                    toastInfo(t("venueLoginToBookTitle"), t("venueLoginToBookBody"));
                    return;
                  }
                  setProfileStaff(null);
                  setIsBookingModalOpen(true);
                }}
                disabled={selectedServices.length === 0}
                className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${
                    selectedServices.length > 0 
                    ? 'bg-[#ff5a5f] text-white hover:bg-[#e0454a] shadow-[#ff5a5f]/20 cursor-pointer' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed grayscale'
                }`}
              >
                  {t("venueBookNow")}
              </button>
          </div>
      </div>

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
         <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
         <div className="absolute bottom-12 left-12 right-12 flex justify-end gap-3">
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

              <p className="text-slate-500 leading-relaxed font-medium mb-12 max-w-3xl border-l-[4px] border-slate-100 pl-8 py-2 italic">
                  {VENUE_DATA.description}
              </p>

              {/* TABS */}
              <div className="flex gap-4 mb-12 border-b border-slate-100 pb-4 sticky top-[100px] bg-white pt-4 z-30">
                  {venueTabs.map((tab) => (
                      <button
                        type="button"
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-10 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>

              {/* TAB CONTENT: SERVICIOS */}
              {activeTab === "services" && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">{t('ourServices')}</h2>
                        <p className="text-slate-400 text-sm font-bold max-w-xl mx-auto uppercase tracking-tighter">{t("venueServicesBlurb")}</p>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
                        {(() => {
                          let filtered = VENUE_DATA.services;
                          if (activeServiceFilter === "bestsellers") {
                            // Sort by booking count desc, if no bookings show all randomly
                            const hasBestsellers = Object.keys(bestsellerMap).length > 0;
                            if (hasBestsellers) {
                              filtered = [...filtered].sort((a, b) => (bestsellerMap[b.id] || 0) - (bestsellerMap[a.id] || 0));
                            } else {
                              // Shuffle for random display
                              filtered = [...filtered].sort(() => Math.random() - 0.5);
                            }
                          } else if (activeServiceFilter === "promotions") {
                            filtered = filtered.filter(s => promotionServiceIds.has(s.id));
                          }
                          return filtered;
                        })().map(s => {
                          const promo = promotionData.find(p => p.serviceId === s.id);
                          const discountedPrice = promo ? s.price * (1 - promo.discountPercent / 100) : null;
                          return (
                            <div key={s.id} className="group bg-white p-5 rounded-2xl border border-slate-100 hover:border-[#ff5a5f]/25 hover:shadow-lg transition-all duration-300 flex flex-col justify-between relative">
                                {/* Promo Badge */}
                                {promo && (
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#ff5a5f] to-rose-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-[#ff5a5f]/30 z-10 animate-in zoom-in duration-300">
                                    {promo.label || `${promo.discountPercent}% OFF`}
                                  </div>
                                )}
                                {/* Bestseller Badge */}
                                {!promo && bestsellerMap[s.id] && bestsellerMap[s.id] > 0 && (
                                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg shadow-amber-500/30 z-10">
                                    🔥 {language === "en" ? "Popular" : "Popular"}
                                  </div>
                                )}
                                <div className="flex gap-4">
                                    {/* Circle Service Image */}
                                    <div className="w-16 h-16 rounded-full shrink-0 overflow-hidden border-2 border-slate-100 group-hover:border-[#ff5a5f]/30 transition-colors shadow-sm">
                                        {s.image ? (
                                            <img src={s.image} alt={s.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-[#ff5a5f]/10 to-[#ff5a5f]/5 flex items-center justify-center">
                                                <Scissors size={20} className="text-[#ff5a5f]/50" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-base font-black text-slate-900 mb-1 group-hover:text-[#ff5a5f] transition-colors tracking-wide truncate">{s.name}</h4>
                                        <p className="text-slate-500 text-[11px] font-medium leading-snug mb-3 tracking-normal">{s.description}</p>
                                        <div className="flex items-center gap-2 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                                            <Clock size={13} className="text-[#ff5a5f] shrink-0" /> {s.time}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100 gap-3">
                                    <div className="flex items-baseline gap-2">
                                      {discountedPrice !== null ? (
                                        <>
                                          <span className="text-xl font-black text-[#ff5a5f]">${discountedPrice.toFixed(2)}</span>
                                          <span className="text-sm font-bold text-slate-400 line-through">${s.price}</span>
                                        </>
                                      ) : (
                                        <span className="text-xl font-black text-slate-900">${s.price}</span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {selectedServices.filter(id => id === s.id).length > 0 ? (
                                            <div className="flex items-center bg-slate-900 rounded-xl p-1 gap-1 shadow-lg shadow-slate-900/20 animate-in fade-in zoom-in duration-300">
                                                <button 
                                                  onClick={() => applyServiceRemove(s.id)}
                                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-white transition-colors text-lg font-black"
                                                >
                                                  -
                                                </button>
                                                <span className="text-[11px] font-black text-white w-5 text-center select-none">
                                                  {selectedServices.filter(id => id === s.id).length}
                                                </span>
                                                <button 
                                                  onClick={() => applyServiceAdd(s.id)}
                                                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-800 text-white transition-colors text-lg font-black"
                                                >
                                                  +
                                                </button>
                                            </div>
                                        ) : (
                                            <button 
                                                type="button"
                                                onClick={() => onServiceBookClick(s.id)}
                                                className="px-5 py-2 rounded-xl border-2 border-[#ff5a5f] text-[#ff5a5f] font-black text-[10px] uppercase tracking-widest hover:bg-[#ff5a5f] hover:text-white transition-all duration-300"
                                            >
                                                {t("bookBtn")}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                          );
                        })}
                    </div>

                    <div className="mt-16 text-center">
                        <button type="button" className="font-black text-slate-900 uppercase tracking-[0.3em] text-[11px] group flex items-center gap-4 mx-auto hover:text-[#ff5a5f] transition-colors">
                            {t("venueSeeMorePlus")} <span className="text-2xl transition-transform group-hover:translate-x-2">+</span>
                        </button>
                    </div>
                </div>
              )}

              {/* TAB CONTENT: EQUIPO */}
              {activeTab === "team" && (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-black text-slate-900 mb-4">{t("venueTeamSectionTitle")}</h2>
                        <p className="text-slate-400 text-sm font-bold max-w-xl mx-auto uppercase tracking-tighter">{t("venueTeamIntro")}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-[#ff5a5f]/20 hover:shadow-lg transition-all duration-300 flex flex-col cursor-pointer text-left"
                            >
                                <div className="relative h-56 overflow-hidden">
                                    <img 
                                      src={member.img} 
                                      className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                                      alt={member.name}
                                    />
                                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/95 px-2.5 py-1 rounded-lg text-[11px] font-black text-slate-900 shadow-sm border border-slate-100">
                                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                        {member.rating}
                                    </div>
                                </div>
                                <div className="p-5 text-left flex flex-col flex-1">
                                    <h4 className="text-base font-black text-slate-900 mb-1 tracking-wide group-hover:text-[#ff5a5f] transition-colors">{member.name}</h4>
                                    <p className="text-[#ff5a5f] text-[9px] font-black uppercase tracking-widest mb-3 line-clamp-2">{member.role}</p>
                                    <p className="text-slate-500 text-[11px] leading-snug mb-4 flex-1 tracking-normal">
                                      {member.bio?.trim() && member.bio.trim() !== "—"
                                        ? member.bio
                                        : t("venueStaffProfileNoBio")}
                                    </p>
                                    <div className="flex gap-4 text-[10px] font-bold text-slate-600 border-t border-slate-100 pt-3">
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
                                      className="mt-4 w-full py-2.5 rounded-xl border-2 border-slate-900 text-[10px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-colors"
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
                                <p className="text-slate-600 font-medium leading-relaxed italic border-l-4 border-[#ff5a5f]/20 pl-6">&ldquo;{rev.comment}&rdquo;</p>
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

          {/* SIDEBAR */}
          <aside className="w-full lg:w-[450px] space-y-12">
               {/* MINI MAP */}
               <div className="rounded-[40px] overflow-hidden border-2 border-slate-100 shadow-2xl relative group min-h-[280px] flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
                    <MapPin className="text-[#ff5a5f] mb-4" size={40} />
                    <p className="text-sm font-semibold text-slate-600 mb-4">{VENUE_DATA.address || t("venueLocationMissing")}</p>
                    {VENUE_DATA.address ? (
                      <a
                        href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(VENUE_DATA.address)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-slate-900 px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-[#ff5a5f] transition-colors"
                      >
                        {t("venueMapOpen")}
                      </a>
                    ) : null}
               </div>

               {/* INFO SECTION */}
               <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
                   <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide mb-5 flex items-center gap-2">
                       <Info size={18} className="text-[#ff5a5f]" />
                       {t("venueInfoHeading")}
                   </h3>
                   
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

                   <div className="mt-8 flex justify-center gap-3">
                       {VENUE_DATA.socials.instagram ? (
                       <a href={VENUE_DATA.socials.instagram.startsWith("http") ? VENUE_DATA.socials.instagram : `https://instagram.com/${VENUE_DATA.socials.instagram.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#f09433] via-[#e6683c] via-[#dc2743] via-[#cc2366] to-[#bc1888] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all"><Instagram size={24} /></a>
                       ) : null}
                       {VENUE_DATA.socials.tiktok ? (
                       <a href={VENUE_DATA.socials.tiktok.startsWith("http") ? VENUE_DATA.socials.tiktok : `https://www.tiktok.com/@${VENUE_DATA.socials.tiktok.replace(/^@/, "")}`} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-2xl bg-[#000000] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all font-black text-xl italic uppercase">T</a>
                       ) : null}
                       {VENUE_DATA.socials.youtube ? (
                       <a href={VENUE_DATA.socials.youtube.startsWith("http") ? VENUE_DATA.socials.youtube : `https://youtube.com/${VENUE_DATA.socials.youtube.replace(/^\//, "")}`} target="_blank" rel="noreferrer" className="w-14 h-14 rounded-2xl bg-[#ff0000] flex items-center justify-center text-white shadow-xl hover:scale-110 transition-all"><Youtube size={24} /></a>
                       ) : null}
                   </div>
               </div>
          </aside>
      </div>

      {/* BOTTOM CATEGORY EXPLORATION */}
      <section className="bg-slate-50/50 py-24 border-t border-slate-100">
           <div className="max-w-[1920px] mx-auto px-6 lg:px-14">
                <div className="text-center mb-20 animate-in fade-in duration-1000">
                    <h2 className="text-6xl font-black text-slate-900 tracking-tight mb-6">{t("venuePickCategoryTitle")}</h2>
                    <p className="text-slate-400 text-xl font-bold uppercase tracking-widest">{t("venuePickCategorySub")}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {browseCategories.length === 0 ? (
                      <p className="col-span-full text-center text-sm text-slate-500 py-8">{t("venueCategoriesNone")}</p>
                    ) : (
                    browseCategories.map((cat) => {
                      const title = language === "en" ? cat.labelEn : cat.labelEs;
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
          <div className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
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
    </div>
  );
}
