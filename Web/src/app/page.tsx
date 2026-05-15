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

export default function Home() {
  const { t, language } = useI18n();
  const router = useRouter();
  const [apiVenues, setApiVenues] = useState<ApiVenue[]>([]);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const p1 = fetchPublicVenues()
      .then((rows) => setApiVenues(rows.data))
      .catch(() => setApiVenues([]));
    const p2 = fetchPublicCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
    
    Promise.all([p1, p2]).finally(() => setIsLoading(false));
  }, []);

  const venues = useMemo(
    () => apiVenues.map((v) => mapApiVenueToRow(v, language)),
    [apiVenues, language],
  );

  const dynamicCategories = useMemo(
    () =>
      categories.map((c) => ({
        key: c.key,
        title: language === "en" ? c.labelEn : c.labelEs,
        stat: c.activeBusinessCount ?? 0,
        img: (c.imageUrl || "").trim(),
      })),
    [categories, language],
  );

  const featuredVenueCards = useMemo(
    () =>
      [...venues]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 4)
        .map((v) => ({
          businessId: v.businessId,
          serviceName: (v.serviceName && v.serviceName.trim()) || v.name,
          salonName: v.name,
          price: v.price,
          rating: v.rating,
          durationMin: v.serviceDurationMinutes || 0,
          imgSrc: businessBannerHeroSrc(v),
        })),
    [venues],
  );

  /** Below Featured: popular services (by reviews), service imagery; avoids duplicating the same four as Featured when possible. */
  const topServiceMenuCards = useMemo(() => {
    const byRating = [...venues].sort((a, b) => b.rating - a.rating);
    const featuredIds = new Set(byRating.slice(0, 4).map((v) => v.businessId));
    let list = [...venues]
      .filter((v) => !featuredIds.has(v.businessId))
      .sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    if (list.length < 4) {
      list = [...venues].sort((a, b) => b.reviews - a.reviews || b.rating - a.rating);
    }
    return list.slice(0, 8).map((v) => ({
      businessId: v.businessId,
      serviceName: (v.serviceName && v.serviceName.trim()) || v.name,
      salonName: v.name,
      price: v.price,
      rating: v.rating,
      durationMin: v.serviceDurationMinutes || 0,
      imgSrc: venueCardImageSrc(v),
    }));
  }, [venues]);

  const dynamicBestBusinesses = useMemo(
    () =>
      venues.slice(0, 5).map((v) => ({
        n: v.name,
        rat: Number(v.rating).toFixed(1),
        rts: `(${v.reviews} ${t("reviews")})`,
        s: [v.category],
        p: `$${v.price.toFixed(2)}`,
        id: v.businessId,
        location: v.locationLabel,
        imgSrc: businessListingImageSrc(v),
      })),
    [venues, t],
  );

  const heroCategoryChips = useMemo(
    () =>
      categories.slice(0, 8).map((c) => ({
        key: c.key,
        label: language === "en" ? c.labelEn : c.labelEs,
      })),
    [categories, language],
  );

  return (
    <div className="bg-white font-sans text-slate-900">
      {/* HERO SECTION */}
      <div 
        className="relative h-[480px] bg-cover bg-center flex flex-col items-center pt-24" 
        style={{ backgroundImage: "url('/HeroSection.png')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 text-center text-white px-4 w-full max-w-4xl pt-8">
          <h2 className="text-[44px] leading-tight font-extrabold mb-3 max-w-2xl mx-auto drop-shadow-md">{t('heroTitle')}</h2>
          <p className="text-lg font-normal mb-8 max-w-xl mx-auto opacity-90">{t('heroSubtitle')}</p>
          
          <div className="bg-white p-2 rounded-xl shadow-2xl flex w-full max-w-3xl mx-auto items-center h-[72px]">
            <div className="flex-[1.5] flex items-center px-4 border-r border-slate-200 h-full">
              <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder={t('searchPlaceholder')} className="w-full h-full text-sm outline-none text-slate-800 bg-transparent placeholder-slate-400 font-medium" />
            </div>
            <div className="flex-1 flex items-center px-4 h-full">
              <svg className="w-5 h-5 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              <input type="text" placeholder={t('locationPlaceholder')} className="w-full h-full text-sm outline-none text-slate-800 bg-transparent placeholder-slate-400 font-medium" />
            </div>
            <button 
              onClick={() => router.push('/search')}
              className="bg-[#ff5a5f] hover:bg-[#e0454a] text-white px-8 h-full rounded-lg font-bold transition flex-shrink-0"
            >
              {t('searchBtn')}
            </button>
          </div>
          
          {heroCategoryChips.length > 0 ? (
            <div className="mt-8 text-sm font-semibold flex flex-wrap items-center justify-center gap-y-3">
              <span className="mr-3">{t("featuredServices")}</span>
              {heroCategoryChips.map((svc) => (
                <span
                  key={svc.key}
                  onClick={() =>
                    router.push(`/search?categoryKey=${encodeURIComponent(svc.key)}`)
                  }
                  className="inline-block px-5 py-2.5 md:px-6 md:py-3 mx-1 text-[15px] md:text-base border border-white/25 bg-black/45 rounded-xl hover:bg-black/65 cursor-pointer backdrop-blur-md transition shadow-md font-semibold"
                >
                  {svc.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <main className="w-full max-w-[1920px] mx-auto py-16 px-4 sm:px-8 lg:px-14">
        
        {/* CATEGORIES — horizontal carousel, square cards (directly below hero banner) */}
        <section id="browse-categories" className="mb-24 scroll-mt-28">
          <div className="text-center mb-12">
            <h3 className="text-[32px] font-extrabold text-slate-900 tracking-wide">{t('chooseCategory')}</h3>
            <p className="text-slate-500 mt-2 font-medium max-w-lg mx-auto tracking-normal">{t('chooseCategorySub')}</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar -mx-1 px-1">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="snap-start shrink-0 w-56 h-72 bg-slate-100 rounded-[32px] animate-pulse" />
              ))
            ) : dynamicCategories.length === 0 ? (
              <p className="text-sm font-medium text-slate-500 px-2 py-8">
                {language === "en"
                  ? "No categories loaded yet. Start the API and add categories in admin."
                  : "Aún no hay categorías. Inicia el API y agrega categorías en admin."}
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

        {/* FEATURED SERVICES */}
        <section className="mb-24 bg-gradient-to-br from-[#fff7f7] via-slate-50 to-white rounded-[40px] p-10 md:p-14 border border-[#ff5a5f]/10 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#ff5a5f]/8 rounded-full blur-[120px] pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-end mb-12 relative z-10 gap-6">
              <div className="text-left">
                 <span className="inline-block text-[10px] font-black uppercase tracking-[0.2em] text-[#ff5a5f] mb-2">REZERVAME</span>
                 <h3 className="text-[32px] font-extrabold text-slate-900 tracking-wide mb-2">{t('featuredServicesTitle')}</h3>
                 <p className="text-slate-500 font-medium tracking-normal">{t('featuredServicesSub2')}</p>
              </div>
              <button
                type="button"
                onClick={() => router.push("/search")}
                className="inline-flex font-bold text-slate-900 text-[14px] bg-white px-7 py-3 rounded-xl border-2 border-slate-200 hover:border-[#ff5a5f]/40 hover:text-[#ff5a5f] shadow-sm transition-all duration-300 group items-center"
              >
                {t("viewAllFeatured")}{" "}
                <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
              </button>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 relative z-10">
              {featuredVenueCards.length === 0 ? (
                <p className="col-span-full text-center text-sm font-medium text-slate-500 py-12">
                  {language === "en"
                    ? "No featured venues yet. Add active businesses in the admin panel."
                    : "Aún no hay negocios destacados. Agrega negocios activos en el panel admin."}
                </p>
              ) : (
              featuredVenueCards.map((serv, i) => (
                 <div 
                   key={`${serv.businessId}-${i}`} 
                   onClick={() => router.push(`/venue/${serv.businessId}`)}
                   className="group cursor-pointer bg-white rounded-3xl p-3 sm:p-4 shadow-md hover:shadow-2xl hover:shadow-[#ff5a5f]/10 border border-slate-100/80 transition-all duration-500 flex flex-col h-full transform hover:-translate-y-1.5 ring-1 ring-transparent hover:ring-[#ff5a5f]/20"
                 >
                    <div className="relative h-48 sm:h-52 rounded-2xl overflow-hidden mb-4 shadow-inner bg-slate-100">
                       <img
                         src={serv.imgSrc}
                         className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                         alt={serv.salonName}
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-70" />
                       <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                         <span className="bg-[#ff5a5f] text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{t('recommended')}</span>
                       </div>
                       <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-black shadow-sm flex items-center">
                          <span className="text-amber-400 mr-1.5 text-xs">★</span>{serv.rating.toFixed(1)}
                       </div>
                    </div>
                    <div className="flex justify-between items-start mb-2 flex-1 px-1">
                      <h4 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-[#ff5a5f] transition-colors line-clamp-2 tracking-wide">{serv.serviceName}</h4>
                    </div>
                    <div className="px-1 py-3 flex items-center justify-between border-t border-slate-50 mt-auto">
                       <div className="flex flex-col min-w-0">
                          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-normal mb-0.5 truncate">{serv.salonName}</span>
                          <span className="font-black text-slate-900 text-lg">${serv.price.toFixed(2)}</span>
                       </div>
                       <div className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center shrink-0 ml-2">
                          <svg className="w-3 h-3 mr-1.5 opacity-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          {serv.durationMin > 0 ? `${serv.durationMin} ${t('min')}` : `— ${t('min')}`}
                       </div>
                    </div>
                 </div>
              ))
              )}
           </div>
        </section>

        {/* TOP SERVICES — horizontal menu below Featured */}
        <section className="mb-24 w-full">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
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
              className="group inline-flex shrink-0 items-center self-start rounded-xl border-2 border-slate-200 bg-white px-6 py-2.5 text-[14px] font-bold text-slate-900 shadow-sm transition-all hover:border-[#ff5a5f]/40 hover:text-[#ff5a5f] sm:self-auto"
            >
              {t("viewAllTopServices")}{" "}
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory no-scrollbar -mx-1 px-1">
            {topServiceMenuCards.length === 0 ? (
              <p className="px-2 py-8 text-sm font-medium text-slate-500">
                {language === "en"
                  ? "No services to show yet."
                  : "Aún no hay servicios para mostrar."}
              </p>
            ) : (
              topServiceMenuCards.map((row, i) => (
                <div
                  key={`top-svc-${row.businessId}-${i}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/venue/${row.businessId}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/venue/${row.businessId}`);
                    }
                  }}
                  className="group snap-start shrink-0 w-[min(280px,85vw)] cursor-pointer rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition hover:border-[#ff5a5f]/25 hover:shadow-md"
                >
                  <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                    <img
                      src={row.imgSrc}
                      alt={row.serviceName}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent opacity-80" />
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-black uppercase tracking-wide text-white drop-shadow">
                        {row.salonName}
                      </span>
                      <span className="shrink-0 rounded-md bg-white/95 px-2 py-0.5 text-[10px] font-black text-slate-900">
                        ★ {row.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <h4 className="line-clamp-2 px-0.5 text-[15px] font-extrabold leading-snug text-slate-900 group-hover:text-[#ff5a5f]">
                    {row.serviceName}
                  </h4>
                  <div className="mt-2 flex items-center justify-between px-0.5 text-[13px]">
                    <span className="font-black text-slate-900">${row.price.toFixed(2)}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      {row.durationMin > 0 ? `${row.durationMin} ${t("min")}` : `— ${t("min")}`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* BEST BUSINESSES */}
        <section className="text-center mb-16 w-full">
          <div className="flex flex-col items-center mb-10">
             <h3 className="text-[28px] font-extrabold text-slate-900 leading-tight mb-1 tracking-wide">{t('bestNear')}</h3>
             <p className="text-slate-500 font-medium tracking-normal">{t('bestNearSub')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-[18px] text-left mb-10 w-full">
            {dynamicBestBusinesses.length === 0 ? (
              <p className="col-span-full text-center text-sm font-medium text-slate-500 py-10">
                {language === "en"
                  ? "No businesses to show yet."
                  : "Aún no hay negocios para mostrar."}
              </p>
            ) : (
            dynamicBestBusinesses.map((biz, i) => (
              <div 
                key={`${biz.id}-${i}`} 
                onClick={() => router.push(`/venue/${biz.id}`)}
                className="bg-white rounded-[16px] shadow-sm border border-slate-200 overflow-hidden cursor-pointer hover:shadow-md transition flex flex-col pt-1 pl-1 pr-1 pb-1"
              >
                <div className="relative h-[150px] rounded-[13px] overflow-hidden bg-slate-100">
                  <img 
                    src={biz.imgSrc} 
                    alt={biz.n} 
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black text-white text-[10px] px-2.5 py-1 rounded-[6px] font-bold tracking-wide shadow-sm">{t('recommended')}</div>
                  <button className="absolute top-2.5 right-2.5 w-7 h-7 flex items-center justify-center bg-white shadow-sm rounded-full hover:bg-slate-50"><svg className="w-3.5 h-3.5 text-slate-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg></button>
                </div>
                <div className="px-3 pt-4 pb-3 flex flex-col flex-1">
                  <h4 className="font-black text-[15px] text-slate-900 leading-tight mb-1">{biz.n}</h4>
                  <p className="text-[12px] text-slate-500 mb-2 font-medium">{t('beautySalon')}</p>
                  
                  <div className="flex items-center text-[11px] font-black text-slate-800 mb-3">
                    <span className="text-amber-400 mr-[3px] text-sm leading-none">★</span> 
                    <span className="leading-none pt-0.5">{biz.rat} <span className="text-slate-400 font-semibold ml-1 font-sans">{biz.rts}</span></span>
                  </div>
                  
                  <div className="flex items-center text-[10.5px] text-slate-500 mb-3.5 font-semibold">
                    <svg className="w-[14px] h-[14px] text-slate-400 mr-[4px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span className="truncate">{biz.location || "—"}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-[5px] mb-5 border-b border-slate-100 pb-5">
                     {biz.s.map(sTag => (
                        <span key={sTag} className="bg-slate-50 border border-slate-100/60 text-slate-600 px-[6px] py-[3px] rounded-[5px] text-[10px] font-black">{sTag}</span>
                     ))}
                  </div>
                  
                  <div className="mt-auto">
                    <div className="flex justify-between items-center mb-4">
                      <span className="flex flex-col xs:flex-row xs:items-center text-slate-500 font-semibold text-[10px] leading-tight max-w-[55%]">
                         <div className="flex items-center mb-0.5 xs:mb-0"><svg className="w-[14px] h-[14px] mr-1 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {t('nextAppt')}</div> 
                         —
                      </span>
                      <span className="font-black text-slate-900 text-[16px] tracking-tight">{biz.p}</span>
                    </div>
                    <button className="w-full py-[10px] bg-[#fd5b60] hover:bg-[#e64e52] text-white text-[13px] font-black rounded-[10px] transition tracking-wide shadow-sm">
                      {t('bookBtn')}
                    </button>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
          <button 
            onClick={() => router.push('/search')}
            className="font-bold text-slate-900 text-[15px] hover:text-[#ff5a5f] transition inline-flex items-center group"
          >
            {t('viewAllBiz')} <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </section>

      </main>

      {/* HOW IT WORKS */}
      <section className="bg-[#fcfdfd] py-20 text-center border-t border-slate-100 w-full">
        <div className="max-w-[1920px] mx-auto px-4 sm:px-8 lg:px-14">
        <h3 className="text-[28px] font-extrabold text-slate-900 leading-tight tracking-wide">{t('howItWorks')}</h3>
        <p className="text-slate-500 mt-2 mb-16 font-medium tracking-normal max-w-2xl mx-auto">{t('howItWorksSub')}</p>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-center pt-4 relative px-4 gap-4">
          <div className="absolute top-[32px] left-[15%] w-[70%] h-[1px] border-t-2 border-dashed border-slate-200 hidden md:block z-0"></div>
          {[
              { i: "1", title: t('step1'), desc: t('step1Sub'), ic: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
              { i: "2", title: t('step2'), desc: t('step2Sub'), ic: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
              { i: "3", title: t('step3'), desc: t('step3Sub'), ic: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
              { i: "4", title: t('step4'), desc: t('step4Sub'), ic: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" }
          ].map(step => (
            <div key={step.i} className="flex-1 flex flex-col items-center relative z-10 px-4 mb-10 md:mb-0 min-w-0">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center font-bold text-xl relative shadow-md shadow-slate-100 border border-slate-50">
                  <svg className="w-7 h-7 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={step.ic} /></svg>
                </div>
                <div className="absolute -top-2 -left-2 w-6 h-6 bg-slate-900 border-[3px] border-white rounded-full flex justify-center items-center text-white text-[10px] font-extrabold">{step.i}</div>
              </div>
              <h4 className="font-extrabold text-sm mb-2 tracking-wide">{step.title}</h4>
              <p className="text-slate-500 text-xs font-medium max-w-[220px] leading-relaxed tracking-normal">{step.desc}</p>
            </div>
          ))}
        </div>
        </div>
      </section>
    </div>
  );
}
