"use client";
import React, { Fragment, useEffect, useMemo, useState } from "react";
import { useI18n } from "../components/I18nProvider";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { toastError } from "@/lib/toast";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import {
  fetchPublicCategories,
  fetchPublicVenues,
  mapApiVenueToRow,
  businessListingImageSrc,
  categoryTileImageSrc,
  type ApiVenue,
  type PublicCategory,
  type SearchVenueRow,
} from "../lib/venueSearch";
import { fetchSiteHeroConfig, type SiteHeroConfig } from "@/lib/siteHero";
import { goToVenue } from "@/lib/goToVenue";
import {
  CarouselSection,
  CategoryCard,
  BusinessCard,
  HowItWorks,
} from "@/ds";

const CONTENT_MAX = "min(94vw, 1600px)";
const HERO_CHIP_KEYS = ["cut", "nails", "massage", "facial", "eyebrows", "makeup"] as const;
/** Client-approved hero from the Rezervame customer-web kit (`assets/hero-banner.png`). */
const CLIENT_HERO_BANNER = "/ds/hero-banner.png";

export default function Home() {
  const { language, t } = useI18n();
  const router = useRouter();
  const { isLoggedIn, openFavoritePrompt } = useAuth();

  const [apiVenues, setApiVenues] = useState<ApiVenue[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [siteHero, setSiteHero] = useState<SiteHeroConfig | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recentVenues, setRecentVenues] = useState<SearchVenueRow[]>([]);

  useEffect(() => {
    fetchPublicVenues(20_000, undefined, { limit: 40, page: 1 })
      .then((rows) => setApiVenues(rows.data))
      .catch(() => setApiVenues([]));
    fetchPublicCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    fetchSiteHeroConfig()
      .then(setSiteHero)
      .catch(() => setSiteHero(null));
  }, []);

  const venues = useMemo(
    () => apiVenues.map((v) => mapApiVenueToRow(v, language)),
    [apiVenues, language],
  );

  useEffect(() => {
    if (!isLoggedIn) {
      setFavoriteIds([]);
      setRecentVenues([]);
      return;
    }
    let cancelled = false;
    const catalog = apiVenues.map((v) => mapApiVenueToRow(v, language));
    void (async () => {
      try {
        const [favRes, bookingsRes] = await Promise.all([
          apiGet<{ data?: { businessId?: string }[] } | { businessId?: string }[]>(
            "/mobile/favorites?limit=100",
            "USER",
          ).catch(() => ({ data: [] })),
          apiGet<{ ongoing?: unknown[]; history?: { data?: unknown[] } }>(
            "/mobile/bookings?page=1&limit=20",
            "USER",
          ).catch(() => ({ ongoing: [], history: { data: [] } })),
        ]);
        if (cancelled) return;
        const favRows = Array.isArray(favRes)
          ? favRes
          : Array.isArray(favRes?.data)
            ? favRes.data
            : [];
        setFavoriteIds(
          favRows
            .map((f) => f.businessId)
            .filter((id): id is string => Boolean(id)),
        );

        const bookingRows = [
          ...(Array.isArray(bookingsRes?.ongoing) ? bookingsRes.ongoing : []),
          ...(Array.isArray(bookingsRes?.history?.data) ? bookingsRes.history.data : []),
        ];
        const seen = new Set<string>();
        const recent: SearchVenueRow[] = [];
        for (const row of bookingRows) {
          const b = row as {
            businessId?: string;
            business?: {
              businessId?: string;
              name?: string;
              categoryKey?: string;
              rating?: number | string;
              reviewCount?: number;
              bannerUrl?: string | null;
              logoUrl?: string | null;
              address?: string;
            };
          };
          const businessId = b.business?.businessId || b.businessId;
          if (!businessId || seen.has(businessId)) continue;
          seen.add(businessId);
          const fromCatalog = catalog.find((v) => v.businessId === businessId);
          if (fromCatalog) {
            recent.push(fromCatalog);
          } else if (b.business?.name) {
            recent.push({
              id: businessId,
              businessId,
              name: b.business.name,
              categoryKey: b.business.categoryKey || "",
              category: b.business.categoryKey || "",
              rating: Number(b.business.rating || 0),
              reviews: Number(b.business.reviewCount || 0),
              price: 0,
              img: b.business.bannerUrl || b.business.logoUrl || PLACEHOLDER_IMAGE_DATA_URI,
              lat: 0,
              lng: 0,
              popular: false,
              locationLabel: b.business.address || "",
              distanceLabel: "",
            });
          }
          if (recent.length >= 8) break;
        }
        setRecentVenues(recent);
      } catch {
        if (!cancelled) {
          setFavoriteIds([]);
          setRecentVenues([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, apiVenues, language]);

  const goSearch = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    router.push(qs ? `/search?${qs}` : "/search");
  };

  const applyFavoriteToggle = async (id: string) => {
    const isFav = favoriteIds.includes(id);
    try {
      if (isFav) {
        await apiDelete(`/mobile/favorites/${id}`, "USER");
        setFavoriteIds((prev) => prev.filter((x) => x !== id));
      } else {
        await apiPost("/mobile/favorites", { businessId: id }, "USER");
        setFavoriteIds((prev) => [...prev, id]);
      }
    } catch {
      toastError(t("venueFavErrorTitle"), t("venueFavErrorBody"));
    }
  };

  const toggleFav = (id: string) => {
    if (!isLoggedIn) {
      openFavoritePrompt(() => void applyFavoriteToggle(id));
      return;
    }
    void applyFavoriteToggle(id);
  };

  const dedupe = (rows: SearchVenueRow[]) => {
    const seen = new Set<string>();
    return rows.filter((v) => {
      if (seen.has(v.businessId)) return false;
      seen.add(v.businessId);
      return true;
    });
  };

  const sections = useMemo(() => {
    const base = dedupe(venues);
    if (base.length === 0) return [];
    const byRating = [...base].sort((a, b) => b.rating - a.rating);
    const distance = (v: SearchVenueRow) =>
      parseFloat(String(v.distanceLabel).replace(/[^\d.]/g, "")) || Number.POSITIVE_INFINITY;
    const byDistance = [...base].sort((a, b) => distance(a) - distance(b));
    const rotated = [...base.slice(6), ...base.slice(0, 6)];
    return [
      { title: t("homeSecRecommendedTitle"), subtitle: t("homeSecRecommendedSub"), items: base.slice(0, 8), promoted: true },
      { title: t("homeSecTopRatedTitle"), subtitle: t("homeSecTopRatedSub"), items: byRating.slice(0, 8), promoted: false },
      { title: t("homeSecNewTitle"), subtitle: t("homeSecNewSub"), items: rotated.slice(0, 8), promoted: false },
      { title: t("homeSecNearTitle"), subtitle: t("homeSecNearSub"), items: byDistance.slice(0, 8), promoted: false },
    ].filter((s) => s.items.length > 0);
  }, [venues, t]);

  const hiwSteps = useMemo(
    () => [
      { icon: "search", title: t("step1"), text: t("step1Sub") },
      { icon: "calendar", title: t("step2"), text: t("step2Sub") },
      { icon: "checkCircle", title: t("howItWorksConfirmTitle"), text: t("howItWorksConfirmSub") },
      { icon: "sparkles", title: t("step3"), text: t("step3Sub") },
      { icon: "star", title: t("step4"), text: t("step4Sub") },
    ],
    [t],
  );

  const heroImg = CLIENT_HERO_BANNER;
  const heroTitle =
    siteHero?.enabled !== false && siteHero?.title
      ? siteHero.title
      : t("homeHeroDefaultTitle");
  const heroSubtitle =
    siteHero?.enabled !== false && siteHero?.subtitle
      ? siteHero.subtitle
      : t("homeHeroDefaultSubtitle");

  const renderBusiness = (v: SearchVenueRow, promoted: boolean, key: string) => (
    <BusinessCard
      key={key}
      image={businessListingImageSrc(v)}
      name={v.name}
      rating={v.rating || undefined}
      reviews={v.reviews || undefined}
      category={v.category}
      location={v.locationLabel}
      distance={v.distanceLabel}
      services={v.serviceName ? [v.serviceName] : []}
      hoursToday={v.todaySlotTimings}
      priceFrom={v.price || undefined}
      badge={promoted ? t("featuredServicesTitle") : undefined}
      badgeTone="coral"
      favorite={favoriteIds.includes(v.businessId)}
      onFavorite={() => toggleFav(v.businessId)}
      onClick={() => goToVenue(v.businessId)}
      onReserve={() => goToVenue(v.businessId)}
    />
  );

  return (
    <div style={{ background: "var(--surface-card)" }}>
      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        <img
          src={heroImg}
          alt=""
          style={{ width: "100%", height: 540, objectFit: "cover", objectPosition: "center", display: "block" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(2,18,28,0.24) 0%, rgba(2,18,28,0.32) 55%, rgba(2,18,28,0.44) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 40px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 1120,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                color: "#fff",
                fontSize: 50,
                fontWeight: 700,
                lineHeight: 1.14,
                letterSpacing: "-0.8px",
                maxWidth: 1000,
                textShadow: "0 2px 22px rgba(2,18,28,0.45)",
              }}
            >
              {heroTitle}
            </h1>
            <p
              style={{
                color: "rgba(255,255,255,0.95)",
                fontSize: 18,
                lineHeight: 1.55,
                marginTop: 26,
                maxWidth: 760,
                textShadow: "0 1px 14px rgba(2,18,28,0.4)",
              }}
            >
              {heroSubtitle}
            </p>
            <p
              style={{
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.4px",
                marginTop: 54,
                textShadow: "0 1px 12px rgba(2,18,28,0.4)",
              }}
            >
              {t("homeFeaturedServices")}
            </p>
            <div style={{ display: "flex", gap: 20, marginTop: 22, flexWrap: "wrap", justifyContent: "center" }}>
              {HERO_CHIP_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => goSearch({ q: t(key) })}
                  style={{
                    width: 132,
                    padding: "11px 0",
                    borderRadius: 12,
                    textAlign: "center",
                    background: "rgba(2,18,28,0.30)",
                    border: "1px solid rgba(255,255,255,0.40)",
                    color: "#fff",
                    fontFamily: "var(--font-sans)",
                    fontSize: 14.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    backdropFilter: "blur(6px)",
                    transition:
                      "background var(--dur-base) var(--ease-standard), border-color var(--dur-base) var(--ease-standard), transform var(--dur-fast) var(--ease-standard)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.92)";
                    e.currentTarget.style.color = "var(--rz-navy)";
                    e.currentTarget.style.borderColor = "#fff";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(2,18,28,0.30)";
                    e.currentTarget.style.color = "#fff";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.40)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {t(key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div style={{ width: CONTENT_MAX, margin: "0 auto", padding: "52px 0 0" }}>
          <CarouselSection
            title={t("homeExploreCategoryTitle")}
            subtitle={t("homeExploreCategorySub")}
            align="center"
            arrows={false}
            cardWidth={224}
            gap={18}
          >
            {categories.map((c) => (
              <CategoryCard
                key={c.id}
                image={categoryTileImageSrc(c.key, c.imageUrl)}
                title={language === "en" ? c.labelEn : c.labelEs}
                onClick={() => goSearch({ category: c.filterParam || c.key })}
              />
            ))}
          </CarouselSection>
        </div>
      )}

      {/* Curated sections */}
      <div
        style={{
          width: CONTENT_MAX,
          margin: "0 auto",
          padding: "clamp(40px, 5vw, 72px) 0 8px",
          display: "flex",
          flexDirection: "column",
          gap: 72,
        }}
      >
        {sections.map((sec, si) => {
          const sectionEl = (
            <CarouselSection
              key={`sec-${si}`}
              title={sec.title}
              linkLabel={t("viewAll")}
              onLink={() => goSearch({ q: sec.title })}
              cardWidth={336}
              gap={18}
            >
              {sec.items.map((v, i) => renderBusiness(v, sec.promoted, `${si}-${v.businessId}-${i}`))}
            </CarouselSection>
          );

          if (sec.promoted && isLoggedIn && recentVenues.length > 0) {
            return (
              <Fragment key={`grp-${si}`}>
                {sectionEl}
                <CarouselSection
                  title={t("homeSecBookAgainTitle")}
                  subtitle={t("homeSecBookAgainSub")}
                  linkLabel={t("homeSecBookAgainLink")}
                  onLink={() => router.push("/profile?tab=bookings")}
                  cardWidth={336}
                  gap={18}
                >
                  {recentVenues.map((v, i) => renderBusiness(v, false, `recent-${v.businessId}-${i}`))}
                </CarouselSection>
              </Fragment>
            );
          }

          return sectionEl;
        })}
      </div>

      {/* How it works */}
      <div id="how-it-works" style={{ marginTop: 56 }}>
        <HowItWorks
          variant="soft"
          contentMax={CONTENT_MAX}
          title={t("howItWorks")}
          subtitle={t("howItWorksSub")}
          steps={hiwSteps}
        />
      </div>
    </div>
  );
}
