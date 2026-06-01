"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "../components/I18nProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchPublicCategories,
  fetchPublicVenues,
  mapApiVenueToRow,
  businessBannerHeroSrc,
  businessListingImageSrc,
  venueCardImageSrc,
  type ApiVenue,
  type PublicCategory,
  type SearchVenueRow,
} from "../lib/venueSearch";
import {
  PARTNER_BUSINESS_TYPES,
  partnerTypeTileImage,
  searchCategoryParamForPartnerType,
} from "../lib/partnerBusinessTypes";
import { ArrowRight, Clock, Heart, MapPin, Star } from "lucide-react";
import { goToVenue } from "@/lib/goToVenue";
import { HomeEventsSection } from "@/components/HomeEventsSection";
import { fetchSiteHeroConfig, type SiteHeroConfig } from "@/lib/siteHero";
import { StatePanel, statePanelVariantForMessage } from "@/components/ui/StatePanel";
import { userFacingError } from "@/lib/userFacingError";
import { sliceByAvailability, splitHomeFeaturedAndTopServices } from "@/lib/homeFeedSections";

export default function Home() {
  const { t, language } = useI18n();
  const router = useRouter();
  const [apiVenues, setApiVenues] = useState<ApiVenue[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [siteHero, setSiteHero] = useState<SiteHeroConfig | null>(null);
  const [homeLoadError, setHomeLoadError] = useState<string | null>(null);
  const [homeReloadNonce, setHomeReloadNonce] = useState(0);

  useEffect(() => {
    setHomeLoadError(null);
    const p1 = fetchPublicVenues(20_000, undefined, { limit: 40, page: 1 })
      .then((rows) => {
        setApiVenues(rows.data);
        setHomeLoadError(null);
      })
      .catch((e: unknown) => {
        setApiVenues([]);
        setHomeLoadError(userFacingError(e, t("stateLoadFailedBody")));
      });
    const p2 = fetchPublicCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    const p3 = fetchSiteHeroConfig().then(setSiteHero).catch(() => setSiteHero(null));
    
    Promise.all([p1, p2, p3]).finally(() => setIsLoading(false));
  }, [homeReloadNonce, t]);

  const venues = useMemo(
    () => apiVenues.map((v) => mapApiVenueToRow(v, language)),
    [apiVenues, language],
  );

  const browseBusinessTypes = useMemo(() => {
    const countByKey = new Map(
      categories.map((c) => [c.key, c.activeBusinessCount ?? 0]),
    );
    return PARTNER_BUSINESS_TYPES.map((type) => {
      const stat = type.categoryKeys.reduce(
        (sum, k) => sum + (countByKey.get(k) ?? 0),
        0,
      );
      const apiImg = categories.find((c) => c.key === type.primaryCategoryKey)?.imageUrl;
      return {
        id: type.id,
        title: t(`${type.labelKey}Title`),
        stat,
        img: partnerTypeTileImage(type, apiImg),
        searchCategory: searchCategoryParamForPartnerType(type.id),
      };
    });
  }, [categories, t]);

  const { featuredVenueCards, topServiceMenuCards } = useMemo(() => {
    const { featured, topServices } = splitHomeFeaturedAndTopServices(venues);
    const toFeaturedCard = (v: (typeof venues)[number]) => ({
      businessId: v.businessId,
      serviceName: (v.serviceName && v.serviceName.trim()) || v.name,
      salonName: v.name,
      price: v.price,
      rating: v.rating,
      durationMin: v.serviceDurationMinutes || 0,
      imgSrc: businessBannerHeroSrc(v),
      todaySlotTimings: v.todaySlotTimings,
    });
    const toTopCard = (v: (typeof venues)[number]) => ({
      businessId: v.businessId,
      serviceName: (v.serviceName && v.serviceName.trim()) || v.name,
      salonName: v.name,
      price: v.price,
      rating: v.rating,
      durationMin: v.serviceDurationMinutes || 0,
      imgSrc: venueCardImageSrc(v),
      todaySlotTimings: v.todaySlotTimings,
    });
    return {
      featuredVenueCards: featured.map(toFeaturedCard),
      topServiceMenuCards: sliceByAvailability(topServices.map(toTopCard), [2, 4, 6]),
    };
  }, [venues]);

  const dynamicBestBusinesses = useMemo(() => {
    const seen = new Set<string>();
    const mapped = venues
      .filter((v) => {
        if (seen.has(v.businessId)) return false;
        seen.add(v.businessId);
        return true;
      })
      .map((v) => ({
        n: v.name,
        rat: Number(v.rating).toFixed(1),
        rts: `(${v.reviews} ${t("reviews")})`,
        s: [v.category],
        p: `$${v.price.toFixed(2)}`,
        id: v.businessId,
        location: v.locationLabel,
        todaySlotTimings: v.todaySlotTimings,
        imgSrc: businessListingImageSrc(v),
      }));
    return sliceByAvailability(mapped, [3, 6]);
  }, [venues, t]);

  const heroCategoryChips = useMemo(
    () =>
      browseBusinessTypes.map((b) => ({
        key: b.id,
        label: b.title,
        searchCategory: b.searchCategory,
      })),
    [browseBusinessTypes],
  );

  const heroChipButtons = (items: typeof heroCategoryChips, keyPrefix: string) =>
    items.map((svc) => (
      <button
        key={`${keyPrefix}-${svc.key}`}
        type="button"
        onClick={() =>
          router.push(`/search?category=${encodeURIComponent(svc.searchCategory)}`)
        }
        className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-white/30 bg-black/50 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/70 sm:h-11 sm:px-5"
      >
        {svc.label}
      </button>
    ));

  return (
    <div className="bg-white font-sans text-slate-900">
      {/* HERO SECTION — search lives in global header (Rezervame 2.0) */}
      <div
        className="relative flex h-[min(360px,52vh)] flex-col items-center justify-center bg-cover bg-center pt-6"
        style={{
          backgroundImage: `url('${
            siteHero?.enabled !== false && siteHero?.imageUrl ? siteHero.imageUrl : "/HeroSection.png"
          }')`,
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-4xl px-4 text-center text-white">
          {siteHero?.enabled !== false && siteHero?.dealText ? (
            <div className="mx-auto mb-4 inline-flex items-center rounded-full bg-white/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-sm ring-1 ring-white/20">
              {siteHero.dealText}
            </div>
          ) : null}
          <h2 className="mx-auto mb-3 max-w-2xl text-[32px] font-extrabold leading-tight drop-shadow-md md:text-[36px]">
            {siteHero?.enabled !== false && siteHero?.title ? siteHero.title : t("heroTitle")}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg font-normal opacity-90">
            {siteHero?.enabled !== false && siteHero?.subtitle ? siteHero.subtitle : t("heroSubtitle")}
          </p>

          {siteHero?.enabled !== false && siteHero?.ctaUrl ? (
            <button
              type="button"
              onClick={() => {
                if (siteHero.ctaExternal) window.open(siteHero.ctaUrl!, "_blank", "noreferrer");
                else router.push(siteHero.ctaUrl!);
              }}
              className="mx-auto mb-8 inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-[13px] font-black uppercase tracking-wide text-slate-900 shadow-lg shadow-black/15 transition hover:bg-white/95"
            >
              {siteHero.ctaText || t("bookBtn")}
              <span className="ml-2">→</span>
            </button>
          ) : (
            <div className="mb-2" />
          )}

          {heroCategoryChips.length > 0 ? (
            <div className="mx-auto w-full max-w-5xl px-2">
              <p className="mb-4 text-sm font-semibold text-white/95">{t("featuredServices")}</p>
              <div className="hero-chip-marquee-wrap pb-1">
                <div className="hero-chip-marquee-track items-center gap-2 sm:gap-3 md:gap-4">
                  {heroChipButtons(heroCategoryChips, "a")}
                  {heroChipButtons(heroCategoryChips, "b")}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1920px] px-4 py-10 sm:px-8 lg:px-14">
        {homeLoadError && !isLoading ? (
          <StatePanel
            className="mb-10"
            variant={statePanelVariantForMessage(homeLoadError)}
            title={t("stateLoadFailedTitle")}
            description={homeLoadError}
            actions={[
              {
                label: t("tryAgain"),
                onClick: () => setHomeReloadNonce((n) => n + 1),
                primary: true,
              },
            ]}
          />
        ) : null}

        {/* Business types — aligned with /partners */}
        <section id="browse-categories" className="mb-12 scroll-mt-28">
          <h3 className="mb-2 text-center text-[22px] font-extrabold tracking-wide text-slate-900 md:text-2xl">
            {t("homeBrowseBusinessTypes")}
          </h3>
          <p className="mb-6 text-center text-sm font-medium text-slate-500">
            {t("homeBrowseBusinessTypesSub")}
          </p>
          <div className="mx-auto flex max-w-6xl flex-nowrap justify-start gap-3 overflow-x-auto px-2 pb-2 no-scrollbar sm:justify-center sm:gap-4 md:max-w-7xl">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-[120px] w-[120px] shrink-0 rounded-2xl bg-slate-100 animate-pulse sm:h-[132px] sm:w-[132px] md:h-36 md:w-36"
                />
              ))
            ) : (
              browseBusinessTypes.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() =>
                    router.push(
                      `/search?category=${encodeURIComponent(cat.searchCategory)}`,
                    )
                  }
                  className="w-[120px] shrink-0 cursor-pointer group sm:w-[132px] md:w-36"
                >
                  <div className="relative h-[120px] w-[120px] overflow-hidden rounded-2xl border border-slate-100 bg-slate-200 shadow-md transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:h-[132px] sm:w-[132px] md:h-36 md:w-36">
                    <img
                      src={cat.img}
                      alt={cat.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                      <p className="line-clamp-2 text-[10px] font-extrabold leading-tight text-white drop-shadow-md sm:text-[11px] md:text-xs">
                        {cat.title}
                        {cat.stat > 0 ? (
                          <span className="font-bold text-white/80">
                            {" "}
                            · {cat.stat.toLocaleString()}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <p className="mt-4 text-center">
            <Link
              href="/partners"
              className="text-xs font-black uppercase tracking-widest text-[#ff5a5f] hover:underline"
            >
              {t("footerPartners")} →
            </Link>
          </p>
        </section>

        {/* FEATURED — compact cards */}
        <section className="relative mb-12 overflow-hidden rounded-2xl border border-[#ff5a5f]/10 bg-gradient-to-br from-[#fff7f7] via-slate-50 to-white p-6 md:p-8">
          <div className="relative z-10 mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="text-left">
              <span className="mb-1 inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a5f]">
                REZERVAME
              </span>
              <h3 className="mb-1 text-[24px] font-extrabold tracking-wide text-slate-900 md:text-[26px]">{t("featuredServicesTitle")}</h3>
              <p className="text-sm font-medium text-slate-500">{t("featuredServicesSub2")}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="group inline-flex items-center rounded-lg border border-slate-200 bg-white px-5 py-2 text-[13px] font-bold text-slate-900 shadow-sm transition hover:border-[#ff5a5f]/40 hover:text-[#ff5a5f]"
            >
              {t("viewAllFeatured")}{" "}
              <span className="ml-1.5 transition-transform group-hover:translate-x-0.5">→</span>
            </button>
          </div>

          <div className="relative z-10">
            {featuredVenueCards.length === 0 ? (
              <p className="py-8 text-center text-sm font-medium text-slate-500">{t("homeEmptyFeatured")}</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {featuredVenueCards.map((serv, i) => (
                  <div
                    key={`${serv.businessId}-${i}`}
                    onClick={() => goToVenue(serv.businessId)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        goToVenue(serv.businessId);
                      }
                    }}
                    className="group cursor-pointer overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:ring-1 hover:ring-[#ff5a5f]/20"
                  >
                    <div className="relative h-36 overflow-hidden bg-slate-100 sm:h-40">
                      <img
                        src={serv.imgSrc}
                        alt={serv.salonName}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute left-2 top-2 rounded-md bg-[#ff5a5f] px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white">
                        {t("recommended")}
                      </span>
                      <div className="absolute right-2 top-2 flex items-center rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-bold text-slate-900">
                        <Star className="mr-0.5 h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                        {serv.rating.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-3">
                      <h4 className="line-clamp-2 text-sm font-extrabold leading-snug text-slate-900 group-hover:text-[#ff5a5f]">
                        {serv.serviceName}
                      </h4>
                      <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-wide text-slate-400">{serv.salonName}</p>
                      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                        <p className="text-base font-black tabular-nums text-slate-900">${serv.price.toFixed(2)}</p>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase text-slate-500">
                          <Clock className="h-3 w-3" aria-hidden />
                          {serv.durationMin > 0 ? `${serv.durationMin} ${t("min")}` : `—`}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* TOP SERVICES — two per row, same row card size */}
        <section className="mb-12 w-full">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-left">
              <span className="mb-1 inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a5f]">
                REZERVAME
              </span>
              <h3 className="text-[24px] font-extrabold tracking-wide text-slate-900 md:text-[26px]">{t("topServicesTitle")}</h3>
              <p className="mt-1 text-sm font-medium text-slate-500">{t("topServicesSub")}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="group inline-flex shrink-0 items-center self-start rounded-full border border-slate-200 bg-white px-5 py-2 text-[13px] font-bold text-slate-900 shadow-sm transition-all hover:border-[#ff5a5f]/35 hover:text-[#ff5a5f] sm:self-auto"
            >
              {t("viewAllTopServices")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
              {topServiceMenuCards.length === 0 ? (
                <li className="col-span-full py-8 text-center text-sm font-medium text-slate-500">{t("homeEmptyServices")}</li>
              ) : (
                topServiceMenuCards.map((row, i) => (
                  <li key={`top-svc-${row.businessId}-${i}`}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => goToVenue(row.businessId)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          goToVenue(row.businessId);
                        }
                      }}
                      className="group flex cursor-pointer gap-4 rounded-2xl border border-slate-100/90 bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.04)] ring-1 ring-slate-100/80 transition hover:border-[#ff5a5f]/20 hover:bg-gradient-to-r hover:from-white hover:to-rose-50/40 hover:shadow-lg md:gap-6 md:p-4"
                    >
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-100 shadow-inner md:h-[108px] md:w-[108px]">
                        <img
                          src={row.imgSrc}
                          alt=""
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                        <span className="absolute bottom-2 left-2 rounded-md bg-white/95 px-1.5 py-0.5 text-[10px] font-black text-slate-900 shadow-sm backdrop-blur-sm">
                          #{i + 1}
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col justify-center">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#ff5a5f]">{row.salonName}</p>
                        <h4 className="mt-0.5 line-clamp-2 text-lg font-extrabold leading-snug text-slate-900 transition group-hover:text-[#ff5a5f] md:text-xl">
                          {row.serviceName}
                        </h4>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-semibold text-slate-500">
                          <span className="inline-flex items-center gap-1 text-slate-800">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                            {row.rating.toFixed(1)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                            {row.durationMin > 0 ? `${row.durationMin} ${t("min")}` : `— ${t("min")}`}
                          </span>
                          <span
                            className={`truncate text-[11px] font-medium ${row.todaySlotTimings?.toLowerCase().includes("closed") ? "text-slate-400" : "text-slate-600"}`}
                          >
                            {t("todaySlots")}: {row.todaySlotTimings || "—"}
                          </span>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end justify-center gap-2 border-l border-slate-100 pl-4 md:pl-6">
                        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{t("fromPrice") ?? "From"}</span>
                        <span className="font-black tabular-nums text-slate-900 text-xl md:text-2xl">${row.price.toFixed(2)}</span>
                        <span className="hidden items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#ff5a5f] transition group-hover:flex sm:flex">
                          {t("bookBtn")}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      </div>
                    </div>
                  </li>
                ))
              )}
            </ul>
        </section>

        {/* BEST EXPERTS NEARBY — three per row, compact cards */}
        <section className="mb-12 w-full">
          <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="text-left">
              <span className="mb-1 inline-block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t("bestNear")}
              </span>
              <h3 className="text-[24px] font-extrabold tracking-wide text-slate-900 md:text-[26px]">{t("bestNearSub")}</h3>
              <p className="mt-1 max-w-2xl text-sm font-medium text-slate-500">{t("bestNearSub")}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="group inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-[12px] font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800"
            >
              {t("viewAllBiz")}
              <ArrowRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          {dynamicBestBusinesses.length === 0 ? (
            <p className="py-8 text-center text-sm font-medium text-slate-500">{t("homeEmptyBusinesses")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dynamicBestBusinesses.map((biz, i) => (
                <div
                  key={`${biz.id}-${i}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => goToVenue(biz.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      goToVenue(biz.id);
                    }
                  }}
                  className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative h-36 bg-slate-100 sm:h-40">
                    <img src={biz.imgSrc} alt={biz.n} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

                    <div className="absolute left-2 top-2 flex items-center gap-1.5">
                      <span className="rounded-md bg-white/95 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-slate-900">
                        {t("recommended")}
                      </span>
                      <span className="rounded-md bg-black/30 px-2 py-0.5 text-[9px] font-black uppercase text-white backdrop-blur-sm">
                        #{i + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm transition hover:bg-white"
                      aria-label="Favorite"
                    >
                      <Heart className="h-3.5 w-3.5 text-slate-900" aria-hidden />
                    </button>

                    <div className="absolute bottom-2 left-2 right-2">
                      <h4 className="text-sm font-black leading-tight text-white drop-shadow-sm line-clamp-2">{biz.n}</h4>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-semibold text-white/90">
                        <span className="inline-flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
                          {biz.rat} <span className="text-white/70">{biz.rts}</span>
                        </span>
                        <span className="inline-flex min-w-0 items-center gap-0.5">
                          <MapPin className="h-3 w-3 shrink-0 text-white/75" aria-hidden />
                          <span className="truncate">{biz.location || "—"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3">
                    <div className="flex flex-wrap gap-1.5">
                      {biz.s.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                      <p className="flex min-w-0 items-center gap-1 text-[10px] font-semibold text-slate-500">
                        <Clock className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                        <span className="line-clamp-1">{biz.todaySlotTimings || "—"}</span>
                      </p>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-sm font-black tabular-nums text-slate-900">{biz.p}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToVenue(biz.id);
                          }}
                          className="rounded-lg bg-[#ff5a5f] px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white transition hover:bg-[#e0454a]"
                        >
                          {t("bookBtn")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <HomeEventsSection />

      </main>

      {/* HOW IT WORKS */}
      <section className="w-full border-t border-slate-100 bg-[#fcfdfd] py-14 text-center">
        <div className="mx-auto max-w-[1920px] px-4 sm:px-8 lg:px-14">
        <h3 className="text-[30px] font-extrabold leading-tight tracking-wide text-slate-900">{t("howItWorks")}</h3>
        <p className="mx-auto mt-2 mb-12 max-w-2xl font-medium tracking-normal text-slate-500">{t("howItWorksSub")}</p>
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 px-2 md:flex-row md:gap-4">
          <div className="absolute top-[40px] left-[12%] z-0 hidden h-[1px] w-[76%] border-t-2 border-dashed border-slate-200 md:block" />
          {[
              { i: "1", title: t('step1'), desc: t('step1Sub'), ic: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
              { i: "2", title: t('step2'), desc: t('step2Sub'), ic: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { i: "3", title: t('step3'), desc: t('step3Sub'), ic: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { i: "4", title: t('step4'), desc: t('step4Sub'), ic: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" }
          ].map(step => (
            <div key={step.i} className="relative z-10 flex min-w-0 flex-1 flex-col items-center px-3">
              <div className="relative mb-5">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-slate-100 bg-white shadow-md">
                  <svg className="h-9 w-9 text-[#ff5a5f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={step.ic} /></svg>
                </div>
                <div className="absolute -left-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-slate-900 text-[11px] font-extrabold text-white">{step.i}</div>
              </div>
              <h4 className="mb-2 text-base font-extrabold tracking-wide text-slate-900">{step.title}</h4>
              <p className="max-w-[240px] text-sm font-medium leading-relaxed text-slate-500">{step.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}
