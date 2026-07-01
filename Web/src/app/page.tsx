"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "../components/I18nProvider";
import { useAuth } from "../components/AuthProvider";
import { useRouter } from "next/navigation";
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
import { HomeEventsSection } from "@/components/HomeEventsSection";
import {
  CarouselSection,
  CategoryCard,
  BusinessCard,
  HowItWorks,
} from "@/ds";

const CONTENT_MAX = "min(94vw, 1600px)";
const HERO_CHIPS = ["Corte", "Uñas", "Masajes", "Facial", "Cejas", "Maquillaje"];

export default function Home() {
  const { language } = useI18n();
  const router = useRouter();
  const { isLoggedIn, setIsLoginModalOpen } = useAuth();

  const [apiVenues, setApiVenues] = useState<ApiVenue[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [siteHero, setSiteHero] = useState<SiteHeroConfig | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

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

  const goSearch = (params: Record<string, string>) => {
    const qs = new URLSearchParams(params).toString();
    router.push(qs ? `/search?${qs}` : "/search");
  };

  const toggleFav = (id: string) => {
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    setFavorites((f) => ({ ...f, [id]: !f[id] }));
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
      { title: "Recomendados para ti", subtitle: "Elegidos según tus gustos", items: base.slice(0, 8), promoted: true },
      { title: "Mejor valorados", subtitle: "Los favoritos de Panamá", items: byRating.slice(0, 8), promoted: false },
      { title: "Nuevos en Rezervame", subtitle: "Recién llegados a la plataforma", items: rotated.slice(0, 8), promoted: false },
      { title: "Cerca de mí", subtitle: "En tu zona", items: byDistance.slice(0, 8), promoted: false },
    ].filter((s) => s.items.length > 0);
  }, [venues]);

  const heroImg =
    siteHero?.enabled !== false && siteHero?.imageUrl ? siteHero.imageUrl : "/ds/hero-banner.png";
  const heroTitle =
    siteHero?.enabled !== false && siteHero?.title
      ? siteHero.title
      : "Reserva tu momento de belleza y bienestar en segundos.";
  const heroSubtitle =
    siteHero?.enabled !== false && siteHero?.subtitle
      ? siteHero.subtitle
      : "Encuentra salones, spas y expertos cerca de ti, compara opciones y agenda tu cita fácilmente.";

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
      badge={promoted ? "Destacado" : undefined}
      badgeTone="coral"
      favorite={!!favorites[v.businessId]}
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
              Servicios destacados
            </p>
            <div style={{ display: "flex", gap: 20, marginTop: 22, flexWrap: "wrap", justifyContent: "center" }}>
              {HERO_CHIPS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => goSearch({ q: c })}
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
                  {c}
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
            title="Explora por categoría"
            subtitle="Descubre el servicio perfecto para ti"
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
        {sections.map((sec, si) => (
          <CarouselSection
            key={`sec-${si}`}
            title={sec.title}
            linkLabel="Ver todos los negocios"
            onLink={() => goSearch({ q: sec.title })}
            cardWidth={336}
            gap={18}
          >
            {sec.items.map((v, i) => renderBusiness(v, sec.promoted, `${si}-${v.businessId}-${i}`))}
          </CarouselSection>
        ))}

        <HomeEventsSection />
      </div>

      {/* How it works */}
      <div style={{ marginTop: 56 }}>
        <HowItWorks variant="soft" contentMax={CONTENT_MAX} />
      </div>
    </div>
  );
}
