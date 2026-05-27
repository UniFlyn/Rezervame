"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useI18n } from "../components/I18nProvider";
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
import { ArrowRight, Clock, Heart, MapPin, Star } from "lucide-react";
import { goToVenue } from "@/lib/goToVenue";
import { HomeEventsSection } from "@/components/HomeEventsSection";
import { fetchSiteHeroConfig, type SiteHeroConfig } from "@/lib/siteHero";

export default function Home() {
  const { t, language } = useI18n();
  const router = useRouter();
  const [apiVenues, setApiVenues] = useState<ApiVenue[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [siteHero, setSiteHero] = useState<SiteHeroConfig | null>(null);

  useEffect(() => {
    const p1 = fetchPublicVenues(20_000, undefined, { limit: 40, page: 1 })
      .then((rows) => setApiVenues(rows.data))
      .catch(() => setApiVenues([]));
    const p2 = fetchPublicCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    const p3 = fetchSiteHeroConfig().then(setSiteHero).catch(() => setSiteHero(null));
    
    Promise.all([p1, p2, p3]).finally(() => setIsLoading(false));
  }, []);

  const venues = useMemo(
    () => apiVenues.map((v) => mapApiVenueToRow(v, language)),
    [apiVenues, language],
  );

  const dynamicCategories = useMemo(
    () =>
      categories.map((c) => ({
        key: c.key,
        title: (language === "es" ? c.labelEs || c.labelEn : c.labelEn) || c.key,
        stat: c.activeBusinessCount ?? 0,
        img: (c.imageUrl || "").trim(),
      })),
    [categories, language],
  );

  const featuredVenueCards = useMemo(
    () => {
      const seen = new Set<string>();
      return [...venues]
        .sort((a, b) => b.rating - a.rating)
        .filter((v) => {
          if (seen.has(v.businessId)) return false;
          seen.add(v.businessId);
          return true;
        })
        .slice(0, 5)
        .map((v) => ({
          businessId: v.businessId,
          serviceName: (v.serviceName && v.serviceName.trim()) || v.name,
          salonName: v.name,
          price: v.price,
          rating: v.rating,
          durationMin: v.serviceDurationMinutes || 0,
          imgSrc: businessBannerHeroSrc(v),
          todaySlotTimings: v.todaySlotTimings,
        }));
    },
    [venues],
  );

  /** Below Featured: popular services (by reviews), service imagery; avoids duplicating the same four as Featured when possible. */
  const topServiceMenuCards = useMemo(() => {
    const byRating = [...venues].sort((a, b) => b.rating - a.rating);
    const featuredIds = new Set(byRating.slice(0, 5).map((v) => v.businessId));
    let list = [...venues]
      .filter((v) => !featuredIds.has(v.businessId))
      .sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    if (list.length < 5) {
      list = [...venues].sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    }
    return list.slice(0, 5).map((v) => ({
      businessId: v.businessId,
      serviceName: (v.serviceName && v.serviceName.trim()) || v.name,
      salonName: v.name,
      price: v.price,
      rating: v.rating,
      durationMin: v.serviceDurationMinutes || 0,
      imgSrc: venueCardImageSrc(v),
      todaySlotTimings: v.todaySlotTimings,
    }));
  }, [venues]);

  const dynamicBestBusinesses = useMemo(
    () => {
      const seen = new Set<string>();
      return venues
        .filter((v) => {
          if (seen.has(v.businessId)) return false;
          seen.add(v.businessId);
          return true;
        })
        .slice(0, 5)
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
    },
    [venues, t],
  );

  const heroCategoryChips = useMemo(
    () =>
      categories.slice(0, 8).map((c) => ({
        key: c.key,
        label: c.labelEn,
      })),
    [categories, language],
  );

  return (
    <div className="bg-white font-sans text-slate-900">
      {/* HERO SECTION — search lives in global header (Rezervame 2.0) */}
      <div
        className="relative flex h-[420px] flex-col items-center justify-center bg-cover bg-center pt-8"
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
          <h2 className="mx-auto mb-3 max-w-2xl text-[40px] font-extrabold leading-tight drop-shadow-md md:text-[44px]">
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
              <div className="flex flex-nowrap items-center justify-center gap-2 overflow-x-auto pb-1 sm:gap-3 md:gap-4 no-scrollbar">
                {heroCategoryChips.map((svc) => (
                  <button
                    key={svc.key}
                    type="button"
                    onClick={() =>
                      router.push(`/search?categoryKey=${encodeURIComponent(svc.key)}`)
                    }
                    className="inline-flex h-10 shrink-0 items-center justify-center whitespace-nowrap rounded-lg border border-white/30 bg-black/50 px-4 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-black/70 sm:h-11 sm:px-5"
                  >
                    {svc.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1920px] px-4 py-10 sm:px-8 lg:px-14">
        
        {/* CATEGORIES — full-width carousel */}
        <section id="browse-categories" className="mb-12 scroll-mt-28">
          <div className="mb-8 text-center">
            <h3 className="text-[32px] font-extrabold text-slate-900 tracking-wide">{t('chooseCategory')}</h3>
            <p className="text-slate-500 mt-2 font-medium max-w-lg mx-auto tracking-normal">{t('chooseCategorySub')}</p>
          </div>
          <div className="flex w-full gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="snap-start shrink-0 w-56 h-72 bg-slate-100 rounded-[32px] animate-pulse" />
              ))
            ) : dynamicCategories.length === 0 ? (
              <p className="text-sm font-medium text-slate-500 px-2 py-8">
                {t("noCategoriesYet")}
              </p>
            ) : (
              dynamicCategories.map((cat, i) => (
                <div
                  key={`${cat.key}-${i}`}
                  onClick={() =>
                    router.push(`/search?categoryKey=${encodeURIComponent(cat.key)}`)
                  }
                  className="snap-start shrink-0 w-[min(220px,78vw)] sm:w-56 cursor-pointer group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-lg hover:shadow-xl transition-all duration-500 hover:-translate-y-1 bg-slate-200">
                    {cat.img ? (
                      <img
                        src={cat.img.startsWith("http") ? cat.img : cat.img}
                        alt={cat.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                      />
                    ) : null}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                      <h4 className="font-extrabold text-white text-[15px] leading-snug tracking-wide drop-shadow-md">
                        {cat.title}
                      </h4>
                      <p className="text-white/75 text-[11px] font-bold uppercase tracking-normal mt-1">
                        {typeof cat.stat === "number" ? cat.stat.toLocaleString() : cat.stat}{" "}
                        {t("places")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* FEATURED — bento / asymmetric grid (distinct from list sections below) */}
        <section className="relative mb-16 overflow-hidden rounded-[32px] border border-[#ff5a5f]/10 bg-gradient-to-br from-[#fff7f7] via-slate-50 to-white p-8 md:p-12">
          <div className="pointer-events-none absolute right-0 top-0 h-1/2 w-1/2 rounded-full bg-[#ff5a5f]/8 blur-[120px]" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-1/3 w-1/3 rounded-full bg-indigo-500/5 blur-[100px]" />

          <div className="relative z-10 mb-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="text-left">
              <span className="mb-2 inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a5f]">
                REZERVAME
              </span>
              <h3 className="mb-2 text-[32px] font-extrabold tracking-wide text-slate-900">{t("featuredServicesTitle")}</h3>
              <p className="font-medium tracking-normal text-slate-500">{t("featuredServicesSub2")}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="group inline-flex items-center rounded-xl border-2 border-slate-200 bg-white px-7 py-3 text-[14px] font-bold text-slate-900 shadow-sm transition-all duration-300 hover:border-[#ff5a5f]/40 hover:text-[#ff5a5f]"
            >
              {t("viewAllFeatured")}{" "}
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>

          <div className="relative z-10">
            {featuredVenueCards.length === 0 ? (
              <p className="py-12 text-center text-sm font-medium text-slate-500">{t("homeEmptyFeatured")}</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,1fr)] lg:grid-rows-2">
                {featuredVenueCards.map((serv, i) => {
                  const isHero = i === 0;
                  return (
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
                      className={`group cursor-pointer overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-lg shadow-slate-200/50 ring-1 ring-slate-100/80 transition duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#ff5a5f]/10 hover:ring-[#ff5a5f]/20 ${
                        isHero ? "lg:row-span-2 lg:min-h-[420px]" : "flex flex-col"
                      }`}
                    >
                      <div
                        className={`relative shrink-0 overflow-hidden bg-slate-100 ${
                          isHero ? "h-[240px] lg:h-[min(58%,520px)] lg:flex-1" : "h-44 sm:h-40 lg:h-[46%]"
                        }`}
                      >
                        <img
                          src={serv.imgSrc}
                          alt={serv.salonName}
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                        <div className="absolute left-3 top-3 flex flex-col gap-1.5 sm:left-4 sm:top-4">
                          <span className="rounded-lg bg-[#ff5a5f] px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lg">
                            {t("recommended")}
                          </span>
                        </div>
                        <div className="absolute right-3 top-3 flex items-center rounded-xl bg-white/95 px-2.5 py-1 text-[11px] font-black text-slate-900 shadow backdrop-blur-sm sm:right-4 sm:top-4">
                          <Star className="mr-1 h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                          {serv.rating.toFixed(1)}
                        </div>
                        {isHero ? (
                          <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/75">{serv.salonName}</p>
                            <h4 className="mt-1 text-2xl font-black leading-tight text-white drop-shadow-sm md:text-3xl">{serv.serviceName}</h4>
                          </div>
                        ) : null}
                      </div>
                      <div className={`flex flex-1 flex-col justify-between p-4 sm:p-5 ${isHero ? "lg:pt-2" : ""}`}>
                        {!isHero ? (
                          <>
                            <h4 className="line-clamp-2 font-extrabold leading-snug tracking-wide text-slate-900 transition group-hover:text-[#ff5a5f]">
                              {serv.serviceName}
                            </h4>
                            <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-wide text-slate-400">{serv.salonName}</p>
                          </>
                        ) : (
                          <div className="hidden lg:block" aria-hidden />
                        )}
                        <div className={`mt-4 flex items-end justify-between border-t border-slate-100 pt-4 ${isHero ? "lg:mt-auto" : ""}`}>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 lg:hidden">{serv.salonName}</span>
                            <p className="font-black text-2xl tabular-nums text-slate-900 lg:text-3xl">${serv.price.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-white">
                            <Clock className="h-3 w-3 opacity-90" aria-hidden />
                            {serv.durationMin > 0 ? `${serv.durationMin} ${t("min")}` : `— ${t("min")}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* TOP SERVICES — editorial list rows (distinct from Featured bento & venue cards) */}
        <section className="mb-16 w-full">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-left">
              <span className="mb-1 inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a5f]">
                REZERVAME
              </span>
              <h3 className="text-[28px] font-extrabold tracking-wide text-slate-900">{t("topServicesTitle")}</h3>
              <p className="mt-1 font-medium text-slate-500">{t("topServicesSub")}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="group inline-flex shrink-0 items-center self-start rounded-full border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-900 shadow-sm transition-all hover:border-[#ff5a5f]/35 hover:text-[#ff5a5f] sm:self-auto"
            >
              {t("viewAllTopServices")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          <div className="relative mx-auto max-w-4xl">
            <div className="pointer-events-none absolute inset-y-8 left-[52px] hidden w-px bg-gradient-to-b from-transparent via-[#ff5a5f]/20 to-transparent md:block" aria-hidden />

            <ul className="flex flex-col gap-3 md:gap-4">
              {topServiceMenuCards.length === 0 ? (
                <li className="py-10 text-center text-sm font-medium text-slate-500">{t("homeEmptyServices")}</li>
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
          </div>
        </section>

        {/* TOP VENUES — clean 2-col cards w/ overlay + meta (distinct from sections above) */}
        <section className="mb-16 w-full">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="text-left">
              <span className="mb-1 inline-block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                {t("bestNear")}
              </span>
              <h3 className="text-[28px] font-extrabold tracking-wide text-slate-900">{t("bestNearSub")}</h3>
              <p className="mt-1 max-w-2xl font-medium text-slate-500">
                {t("bestNear")}: {t("bestNearSub")}
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/search")}
              className="group inline-flex items-center rounded-xl bg-slate-900 px-5 py-3 text-[13px] font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-slate-800"
            >
              {t("viewAllBiz")}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </button>
          </div>

          {dynamicBestBusinesses.length === 0 ? (
            <p className="py-10 text-center text-sm font-medium text-slate-500">{t("homeEmptyBusinesses")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                  className="group overflow-hidden rounded-[26px] border border-slate-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(255,90,95,0.16)]"
                >
                  <div className="relative h-[220px] bg-slate-100">
                    <img src={biz.imgSrc} alt={biz.n} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-900 backdrop-blur-sm">
                        {t("recommended")}
                      </span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                        #{i + 1}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-sm backdrop-blur-sm transition hover:bg-white"
                      aria-label="Favorite"
                    >
                      <Heart className="h-4 w-4 text-slate-900" aria-hidden />
                    </button>

                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-xl font-black leading-tight text-white drop-shadow-sm">{biz.n}</h4>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-semibold text-white/85">
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                          {biz.rat} <span className="text-white/70">{biz.rts}</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-white/75" aria-hidden />
                          <span className="truncate">{biz.location || "—"}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex flex-wrap gap-2">
                      {biz.s.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-100 pt-4">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-[12px] font-semibold text-slate-500">
                          <Clock className="h-4 w-4 text-slate-400" aria-hidden /> {t("todaySlots")}:{" "}
                          <span className="line-clamp-2">{biz.todaySlotTimings || "—"}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black tabular-nums text-slate-900 text-xl">{biz.p}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToVenue(biz.id);
                          }}
                          className="rounded-xl bg-[#ff5a5f] px-5 py-3 text-[12px] font-black uppercase tracking-wide text-white shadow-sm transition hover:bg-[#e0454a]"
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
