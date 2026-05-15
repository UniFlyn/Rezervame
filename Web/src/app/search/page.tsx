"use client";
import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useI18n } from "../../components/I18nProvider";
import { Search, Map as MapIcon, List, LayoutGrid, Star, Heart, Filter, ChevronDown, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  fetchPublicVenues,
  mapApiVenueToRow,
  businessListingImageSrc,
  type ApiVenue,
  type SearchVenueRow,
} from "@/lib/venueSearch";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import en from "../../../../shared/locales/en.json";

function SearchContent() {
  const { t, language } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // States
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState("ratingHighLow");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category") ? [searchParams.get("category")!] : []
  );
  const [showMap, setShowMap] = useState(true);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [apiVenues, setApiVenues] = useState<ApiVenue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [venuesError, setVenuesError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = viewMode === "list" ? 10 : 15;
  const categoryKeyFromQuery = searchParams.get("categoryKey");
  const searchQuery = searchParams.get("q") || "";
  const venues = useMemo(
    () => apiVenues.map((v) => mapApiVenueToRow(v, language)),
    [apiVenues, language],
  );

  useEffect(() => {
    let cancelled = false;
    const run = (geo?: { lat: number; lng: number }) => {
      setVenuesLoading(true);
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        category: categoryKeyFromQuery || "",
        search: searchQuery,
        sortBy: sortBy,
      };

      void fetchPublicVenues(15_000, geo, filters)
        .then((res) => {
          if (cancelled) return;
          setApiVenues(res.data);
          setTotalItems(res.total);
          setTotalPages(res.totalPages);
          setVenuesError(null);
        })
        .catch((e: unknown) => {
          if (cancelled) return;
          setVenuesError(e instanceof Error ? e.message : "Failed to load venues");
        })
        .finally(() => {
          if (!cancelled) setVenuesLoading(false);
        });
    };

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => {
          if (cancelled) return;
          run({ lat: p.coords.latitude, lng: p.coords.longitude });
        },
        () => {
          if (cancelled) return;
          run();
        },
        { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 },
      );
    } else {
      run();
    }

    return () => {
      cancelled = true;
    };
  }, [currentPage, sortBy, categoryKeyFromQuery, searchQuery]);

  const categoryOptions = useMemo(() => {
    const labels = new Set<string>();
    venues.forEach((v) => labels.add(v.category));
    return Array.from(labels).sort();
  }, [venues]);
  const activeVenue = useMemo(
    () => venues.find((v) => v.businessId === activeMarkerId),
    [venues, activeMarkerId],
  );
  const legacyCategoryNameFromQuery = searchParams.get("category");
  /** Page title: honor `categoryKey` (e.g. from home tiles), not a stray default to hair. */
  const searchResultsTitle = useMemo(() => {
    if (legacyCategoryNameFromQuery) return legacyCategoryNameFromQuery;
    if (categoryKeyFromQuery) return t(categoryKeyFromQuery as keyof typeof en);
    return t("discoverPerfectService");
  }, [legacyCategoryNameFromQuery, categoryKeyFromQuery, t, language]);

  const filteredAndSortedResults = useMemo(() => {
    let results = [...venues];

    if (categoryKeyFromQuery) {
      results = results.filter((r) => r.categoryKey === categoryKeyFromQuery);
    }

    if (selectedCategories.length > 0) {
      results = results.filter((r) => selectedCategories.includes(r.category));
    }

    if (selectedRatings.length > 0) {
      results = results.filter((r) => selectedRatings.some((min) => r.rating >= min));
    }

    results.sort((a, b) => {
      if (sortBy === "priceLowHigh") return a.price - b.price;
      if (sortBy === "priceHighLow") return b.price - a.price;
      if (sortBy === "ratingHighLow") return b.rating - a.rating;
      return 0;
    });

    return results;
  }, [venues, selectedCategories, selectedRatings, sortBy, categoryKeyFromQuery]);

  const markerBounds = useMemo(() => {
    const list = filteredAndSortedResults;
    if (!list.length) return { minLat: 0, maxLat: 1, minLng: 0, maxLng: 1 };
    let minLat = Infinity,
      maxLat = -Infinity,
      minLng = Infinity,
      maxLng = -Infinity;
    for (const r of list) {
      minLat = Math.min(minLat, r.lat);
      maxLat = Math.max(maxLat, r.lat);
      minLng = Math.min(minLng, r.lng);
      maxLng = Math.max(maxLng, r.lng);
    }
    if (minLat === maxLat) {
      minLat -= 0.01;
      maxLat += 0.01;
    }
    if (minLng === maxLng) {
      minLng -= 0.01;
      maxLng += 0.01;
    }
    return { minLat, maxLat, minLng, maxLng };
  }, [filteredAndSortedResults]);

  // Pagination Logic
  const localTotalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);
  const paginatedResults = filteredAndSortedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, selectedRatings, sortBy, viewMode]);

  const toggleRating = (r: number) => {
    setSelectedRatings(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);
  };

  const toggleCategory = (c: string) => {
    setSelectedCategories(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  };

  if (venuesLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-6 py-20">
        <div
          className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#ff5a5f]"
          aria-hidden
        />
        <p className="text-sm font-semibold text-slate-600">{t('loadingVenues')}</p>
        <p className="text-center text-xs text-slate-400 max-w-md">
          Fetching from{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-700">
            {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"}
          </code>
          . If this hangs, start the backend on port 4000 or set{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">NEXT_PUBLIC_API_BASE_URL</code> in{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">Web/.env.local</code>.
        </p>
      </div>
    );
  }

  if (venuesError || venues.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center px-6 py-16">
        <p className="text-sm font-semibold text-red-600">{venuesError ?? "No venues available."}</p>
        <p className="mt-3 text-xs text-slate-500 text-center max-w-lg leading-relaxed">
          Start the Nest API from <code className="font-mono text-[11px]">Backend/</code>{" "}
          (<code className="font-mono text-[11px]">npm run start:dev</code>), then reload. Expected URL:{" "}
          <code className="mt-1 block rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-800">
            {process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"}/mobile/venues
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* SECONDARY SEARCH BAR */}
      <div className="border-b border-slate-100 bg-white sticky top-[72px] z-20 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-4 items-center">
            <div className="bg-slate-50 border border-slate-200 p-1.5 rounded-2xl flex w-full max-w-2xl items-center h-[56px] shadow-sm">
                <div className="flex-1 flex items-center px-4 border-r border-slate-200 h-full">
                    <Search className="w-5 h-5 text-slate-400 mr-3" />
                    <input type="text" placeholder={t('searchPlaceholder')} className="w-full h-full text-sm outline-none text-slate-800 bg-transparent placeholder-slate-400 font-bold" />
                </div>
                <div className="flex-1 flex items-center px-4 h-full hidden sm:flex">
                    <MapIcon className="w-5 h-5 text-slate-400 mr-3" />
                    <input type="text" placeholder={t('locationPlaceholder')} className="w-full h-full text-sm outline-none text-slate-800 bg-transparent placeholder-slate-400 font-bold" />
                </div>
                <button className="bg-[#ff5a5f] hover:bg-[#e0454a] text-white px-8 h-full rounded-xl font-black transition-all duration-300 flex-shrink-0 text-sm shadow-lg shadow-[#ff5a5f]/20 uppercase tracking-wider">
                    {t('searchBtn')}
                </button>
            </div>
            
            <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                <button className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-800 hover:border-slate-300 transition-all shrink-0 uppercase tracking-widest shadow-sm">
                    <Filter className="w-4 h-4" /> {t('filterTitle')}
                </button>
                <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>
                <div className="relative flex items-center shrink-0">
                    <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="pl-5 pr-12 py-3 bg-white border-2 border-slate-100 rounded-2xl text-xs font-black text-slate-800 hover:border-slate-300 transition-all uppercase tracking-widest shadow-sm outline-none appearance-none cursor-pointer"
                    >
                        <option value="ratingHighLow">{t('ratingHighLow')}</option>
                        <option value="priceLowHigh">{t('priceLowHigh')}</option>
                        <option value="priceHighLow">{t('priceHighLow')}</option>
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-4 text-slate-400 pointer-events-none" />
                </div>
            </div>
        </div>
      </div>

      <div className="flex flex-1 relative">
        {/* SIDEBAR FILTERS - Desktop */}
        <aside className="hidden lg:block w-[320px] border-r border-slate-100 p-8 sticky top-[160px] h-[calc(100vh-160px)] overflow-y-auto no-scrollbar">
           <div className="mb-12">
              <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <span className="w-2 h-2 bg-[#ff5a5f] rounded-full"></span>
                {t('filterService')}
              </h4>
              <div className="space-y-5">
                 {categoryOptions.map(c => (
                   <label key={c} className="flex items-center gap-4 cursor-pointer group">
                      <div 
                        onClick={() => toggleCategory(c)}
                        className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-300 ${selectedCategories.includes(c) ? 'bg-[#ff5a5f] border-[#ff5a5f] shadow-lg shadow-[#ff5a5f]/30' : 'border-slate-200 group-hover:border-[#ff5a5f]'}`}
                      >
                        {selectedCategories.includes(c) && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-sm font-bold transition-all duration-300 ${selectedCategories.includes(c) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>{c}</span>
                   </label>
                 ))}
              </div>
           </div>

           <div className="mb-12">
              <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                {t('filterRating')}
              </h4>
              <div className="space-y-5">
                 {[5, 4, 3].map(r => (
                   <label key={r} className="flex items-center gap-4 cursor-pointer group">
                      <div 
                        onClick={() => toggleRating(r)}
                        className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-300 ${selectedRatings.includes(r) ? 'bg-amber-400 border-amber-400 shadow-lg shadow-amber-400/30' : 'border-slate-200 group-hover:border-amber-400'}`}
                      >
                        {selectedRatings.includes(r) && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                      <div className="flex items-center gap-1">
                        {Array.from({length: 5}).map((_, i) => (
                           <Star key={i} className={`w-3.5 h-3.5 ${i < r ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                        ))}
                        <span className="text-sm font-black text-slate-600 ml-2">+{r}.0</span>
                      </div>
                   </label>
                 ))}
              </div>
           </div>

           <div className="bg-slate-50 rounded-[24px] p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-widest">{t('showMap')}</h4>
                <button 
                  onClick={() => setShowMap(!showMap)}
                  className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${showMap ? 'bg-slate-900' : 'bg-slate-200'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transition-all duration-300 ${showMap ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed uppercase tracking-tighter">Habilita esta opción para ver los negocios en el mapa interactivo.</p>
           </div>
        </aside>

        {/* RESULTS SECTION */}
        <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto h-[calc(100vh-160px)] no-scrollbar bg-slate-50/30">
           <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{searchResultsTitle}</h2>
                    <p className="text-xs font-black text-[#ff5a5f] mt-2 uppercase tracking-[0.2em] bg-[#ff5a5f]/5 inline-block px-3 py-1 rounded-full border border-[#ff5a5f]/10">
                        {filteredAndSortedResults.length} {t('searchResultCount')}
                    </p>
                 </div>
                 <div className="flex bg-white p-1.5 rounded-[20px] border-2 border-slate-100 shadow-sm">
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[11px] font-black transition-all duration-500 uppercase tracking-widest ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <List className="w-4 h-4" strokeWidth={3} /> {t('list')}
                    </button>
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`flex items-center gap-3 px-6 py-2.5 rounded-2xl text-[11px] font-black transition-all duration-500 uppercase tracking-widest ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-xl translate-y-[-2px]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <LayoutGrid className="w-4 h-4" strokeWidth={3} /> {t('grid')}
                    </button>
                 </div>
              </div>

              {/* LIST VIEW */}
              {viewMode === "list" && filteredAndSortedResults.length === 0 && (
                <div className="rounded-[32px] border border-slate-100 bg-white px-8 py-16 text-center">
                  <p className="text-sm font-bold text-slate-700">{t('noVenuesMatch')}</p>
                  <p className="mt-2 text-xs text-slate-400">Try clearing category or rating filters, or change the URL category key.</p>
                </div>
              )}

              {viewMode === "list" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {paginatedResults.map((res) => (
                        <Link href={`/venue/${res.businessId}`} key={res.businessId} className="group flex flex-col md:flex-row bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 p-4 h-auto cursor-pointer">
                            <div className="relative w-full md:w-72 h-48 md:h-auto overflow-hidden rounded-[24px] flex-shrink-0">
                                <img 
                                  src={businessListingImageSrc(res)} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                                  alt={res.name}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = PLACEHOLDER_IMAGE_DATA_URI;
                                  }}
                                />
                                {res.popular && (
                                    <div className="absolute top-4 left-4 bg-[#ff5a5f] text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                        {t('popular')}
                                    </div>
                                )}
                                <button className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 hover:text-[#ff5a5f] transition-all shadow-lg hover:scale-110">
                                    <Heart className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex flex-col justify-between flex-1 pl-0 md:pl-8 py-4 pr-4 mt-4 md:mt-0">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[11px] font-black text-[#ff5a5f] uppercase tracking-widest mb-2">{res.category}</p>
                                            <h3 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-3 group-hover:text-[#ff5a5f] transition-colors">{res.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            <span className="text-sm font-black text-slate-900 leading-none">{res.rating}</span>
                                            <span className="text-[11px] font-bold text-slate-400 border-l border-slate-200 pl-2 leading-none">({res.reviews})</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500 mt-6">
                                        <div className="flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full border border-slate-100 tracking-tight max-w-full">
                                            {res.locationLabel} • {res.distanceLabel}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('priceFrom')}</span>
                                        <span className="font-black text-2xl text-slate-900 tracking-tight">${res.price.toFixed(2)}</span>
                                    </div>
                                    <button className="bg-[#ff5a5f] hover:bg-[#e0454a] text-white px-10 py-4 rounded-[20px] font-black transition-all duration-500 shadow-xl shadow-[#ff5a5f]/20 uppercase tracking-widest text-xs hover:translate-y-[-4px] active:translate-y-0">
                                        {t('bookBtn')}
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
              )}

              {/* GRID VIEW */}
              {viewMode === "grid" && filteredAndSortedResults.length === 0 && (
                <div className="rounded-[40px] border border-slate-100 bg-white px-8 py-16 text-center col-span-full">
                  <p className="text-sm font-bold text-slate-700">{t('noVenuesMatch')}</p>
                </div>
              )}

              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-700">
                    {paginatedResults.map((res) => (
                        <Link href={`/venue/${res.businessId}`} key={res.businessId} className="group bg-white rounded-[40px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col cursor-pointer border-b-[6px] border-b-[#ff5a5f]/10 translate-y-0 hover:translate-y-[-8px]">
                            <div className="relative h-64 overflow-hidden">
                                <img 
                                  src={businessListingImageSrc(res)} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                                  alt={res.name}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = PLACEHOLDER_IMAGE_DATA_URI;
                                  }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <button className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 hover:text-[#ff5a5f] transition-all shadow-lg">
                                    <Heart className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/20">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <span className="text-xs font-black text-slate-900">{res.rating}</span>
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-1">
                                <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-widest mb-2">{res.category}</p>
                                <h3 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-[#ff5a5f] transition-colors line-clamp-2">{res.name}</h3>
                                
                                <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50">
                                    <span className="font-black text-2xl text-slate-900">${res.price.toFixed(2)}</span>
                                    <button className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-[#ff5a5f] transition-all duration-500 shadow-lg hover:rotate-90">
                                        <ChevronRight className="w-6 h-6" strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
              )}

              {/* PAGINATION */}
              {localTotalPages > 1 && (
                <div className="mt-20 flex justify-center items-center gap-3">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${currentPage === 1 ? 'border-slate-50 text-slate-200 cursor-not-allowed' : 'border-slate-100 text-slate-600 hover:border-[#ff5a5f] hover:text-[#ff5a5f] hover:bg-white active:scale-95 shadow-sm'}`}
                    >
                        <ChevronLeft className="w-6 h-6" strokeWidth={3} />
                    </button>
                    
                    <div className="flex bg-white border-2 border-slate-100 rounded-2xl p-1.5 shadow-sm">
                        {Array.from({length: localTotalPages}).map((_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-12 h-11 rounded-xl text-xs font-black transition-all duration-500 ${currentPage === i + 1 ? 'bg-slate-900 text-white shadow-xl scale-110' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <button 
                        disabled={currentPage === localTotalPages}
                        onClick={() => setCurrentPage(p => Math.min(localTotalPages, p + 1))}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${currentPage === localTotalPages ? 'border-slate-50 text-slate-200 cursor-not-allowed' : 'border-slate-100 text-slate-600 hover:border-[#ff5a5f] hover:text-[#ff5a5f] hover:bg-white active:scale-95 shadow-sm'}`}
                    >
                        <ChevronRight className="w-6 h-6" strokeWidth={3} />
                    </button>
                </div>
              )}
           </div>
        </main>

        {/* MAP SECTION - Desktop */}
        {showMap && (
           <aside className="hidden xl:block w-[480px] sticky top-[160px] h-[calc(100vh-160px)] border-l border-slate-100 bg-slate-50 overflow-hidden group">
              <div className="absolute inset-0 bg-slate-200 overflow-hidden">
                <iframe 
                    width="100%" 
                    height="100%" 
                    className="grayscale-[0.4] brightness-[1.1] contrast-[1.1]"
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight={0} 
                    marginWidth={0} 
                    src="https://www.openstreetmap.org/export/embed.html?bbox=-79.554%2C8.956%2C-79.516%2C8.986&layer=mapnik" 
                ></iframe>
                
                <div className="absolute inset-0 pointer-events-none">
                    {filteredAndSortedResults.map((res) => {
                      const isActive = activeMarkerId === res.businessId;
                      const { minLat, maxLat, minLng, maxLng } = markerBounds;
                      const topPct =
                        maxLat === minLat ? 50 : ((res.lat - minLat) / (maxLat - minLat)) * 70 + 15;
                      const leftPct =
                        maxLng === minLng ? 50 : ((res.lng - minLng) / (maxLng - minLng)) * 70 + 15;
                      return (
                        <div 
                            key={res.businessId} 
                            onClick={() => {
                                setActiveMarkerId(res.businessId === activeMarkerId ? null : res.businessId);
                            }}
                            className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                              isActive ? 'z-50' : activeMarkerId != null ? 'z-10 opacity-35 scale-[0.92]' : 'z-10 opacity-90'
                            }`}
                            style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                        >
                            <div className={`border-2 rounded-xl px-2.5 py-1 font-black text-[11px] shadow-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${isActive ? 'bg-slate-900 border-white text-white scale-110 ring-2 ring-white/90' : 'bg-white/95 border-slate-200 text-slate-700 scale-95 saturate-75'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#ff5a5f]' : 'bg-[#ff5a5f]'}`}></span>
                                ${res.price.toFixed(0)}
                            </div>
                            <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mx-auto -mt-px filter drop-shadow-lg ${isActive ? 'border-t-slate-900 opacity-100' : 'border-t-slate-300 opacity-60'}`}></div>
                        </div>
                      );
                    })}
                </div>

                {/* Bottom sheet — full-width card */}
                {activeVenue && (
                    <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 pointer-events-none z-[60]">
                    <div className="pointer-events-auto mx-auto max-w-lg w-full bg-white rounded-2xl p-4 shadow-2xl border border-slate-100 flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-300">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                            <img 
                               src={businessListingImageSrc(activeVenue)} 
                               className="w-full h-full object-cover" 
                               alt={activeVenue.name}
                               onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.onerror = null;
                                 target.src = PLACEHOLDER_IMAGE_DATA_URI;
                               }}
                             />
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-start">
                                <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-widest truncate">{activeVenue.category}</p>
                                <button onClick={() => setActiveMarkerId(null)} className="text-slate-300 hover:text-slate-900"><Check className="w-4 h-4 rotate-45" /></button>
                            </div>
                            <h4 className="font-black text-slate-900 mt-1 truncate">{activeVenue.name}</h4>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mt-2">
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                <span className="text-slate-900">{activeVenue.rating}</span>
                                <span className="opacity-50">•</span>
                                <span>${activeVenue.price}</span>
                            </div>
                            <button 
                                onClick={() => router.push(`/venue/${activeVenue.businessId}`)}
                                className="w-full bg-[#ff5a5f] text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl mt-3 hover:bg-[#e0454a] transition-all"
                            >
                                {t('viewDetails')}
                            </button>
                        </div>
                    </div>
                    </div>
                )}
              </div>
              
              <div className="absolute top-8 left-8 flex gap-3">
                  <div className="bg-slate-900/90 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Live Map
                  </div>
                  <button onClick={() => setShowMap(false)} className="bg-white/90 backdrop-blur-md text-slate-900 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:bg-[#ff5a5f] hover:text-white transition-all">
                      Hide
                  </button>
              </div>
           </aside>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#ff5a5f]" aria-hidden />
          <p className="text-sm font-semibold text-slate-500">Loading search…</p>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
