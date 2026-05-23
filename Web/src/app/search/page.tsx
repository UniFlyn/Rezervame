"use client";
import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useI18n } from "../../components/I18nProvider";
import { Search, Map as MapIcon, List, LayoutGrid, Star, Heart, Filter, ChevronDown, Check, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchPublicVenues,
  fetchPublicCategories,
  mapApiVenueToRow,
  businessListingImageSrc,
  type ApiVenue,
  type SearchVenueRow,
  type PublicCategory,
} from "@/lib/venueSearch";
import { PLACEHOLDER_IMAGE_DATA_URI } from "@/lib/placeholderImage";
import { useAuth } from "@/components/AuthProvider";
import { apiGet, apiDelete, apiPost } from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast";
import en from "../../../../shared/locales/en.json";
import { usePageHeaderMeta } from "@/contexts/PageHeaderMetaContext";
import { AppLoader } from "@/components/ui/AppLoader";
import { Pagination } from "@/components/ui/pagination";
import { userFacingError } from "@/lib/userFacingError";
import { goToVenue } from "@/lib/goToVenue";

function SearchContent() {
  const { t, language } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, setIsLoginModalOpen } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (isLoggedIn) {
      apiGet<{ data?: { businessId?: string }[] } | { businessId?: string }[]>("/mobile/favorites?limit=100", "USER")
        .then((res) => {
          const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          setFavorites(rows.map((f: { businessId?: string }) => f.businessId).filter(Boolean) as string[]);
        })
        .catch(() => {});
    } else {
      setFavorites([]);
    }
  }, [isLoggedIn]);

  const handleToggleFavorite = async (businessId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      setIsLoginModalOpen(true);
      return;
    }
    const isFav = favorites.includes(businessId);
    try {
      if (isFav) {
        await apiDelete(`/mobile/favorites/${businessId}`, "USER");
        setFavorites((prev) => prev.filter((id) => id !== businessId));
        toastSuccess(t("venueFavRemovedTitle") || "Removed from favorites", t("venueFavRemovedBody") || "Removed from favorites");
      } else {
        await apiPost("/mobile/favorites", { businessId }, "USER");
        setFavorites((prev) => [...prev, businessId]);
        toastSuccess(t("venueFavAddedTitle") || "Added to favorites", t("venueFavAddedBody") || "Added to favorites");
      }
    } catch (err) {
      toastError("Error", "Could not update favorites");
    }
  };
  
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
      
      // Map frontend selectedCategories to category keys if they are labels
      // But for now, let's assume they are keys or labels that match.
      // Actually, it's better to pass them as they are or as keys.
      const categoryParam = selectedCategories.length > 0 
        ? selectedCategories.join(',') 
        : (categoryKeyFromQuery || "");

      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        category: categoryParam,
        search: searchQuery,
        sortBy: sortBy,
        minRating: selectedRatings.length > 0 ? Math.min(...selectedRatings) : 0,
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
          setVenuesError(userFacingError(e, "Unable to load venues right now."));
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
  }, [currentPage, itemsPerPage, sortBy, categoryKeyFromQuery, searchQuery, selectedCategories, selectedRatings]);

  const [categories, setCategories] = useState<PublicCategory[]>([]);

  useEffect(() => {
    void fetchPublicCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const activeVenue = useMemo(
    () => venues.find((v) => v.businessId === activeMarkerId),
    [venues, activeMarkerId],
  );
  const legacyCategoryNameFromQuery = searchParams.get("category");
  /** Page title: honor `categoryKey` (e.g. from home tiles), not a stray default to hair. */
  const searchResultsTitle = useMemo(() => {
    if (legacyCategoryNameFromQuery) return legacyCategoryNameFromQuery;
    if (categoryKeyFromQuery) {
        const cat = categories.find(c => c.key === categoryKeyFromQuery);
        if (cat) return cat.labelEn;
        return t(categoryKeyFromQuery as keyof typeof en);
    }
    return t("discoverPerfectService");
  }, [legacyCategoryNameFromQuery, categoryKeyFromQuery, t, language, categories]);

  const filteredAndSortedResults = venues;

  const { setMeta, clearMeta } = usePageHeaderMeta();
  useEffect(() => {
    setMeta({
      title: searchResultsTitle,
      subtitle: `${totalItems} ${t("searchResultCount")}`,
    });
    return () => clearMeta();
  }, [searchResultsTitle, totalItems, t, setMeta, clearMeta]);

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

  const paginatedResults = filteredAndSortedResults;

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
    return <AppLoader label={t("loadingVenues")} variant="page" />;
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex flex-1 relative">
        {/* SIDEBAR FILTERS - Desktop */}
        <aside className="hidden lg:block w-[300px] border-r border-slate-100 p-6 sticky top-[64px] h-[calc(100vh-64px)] overflow-y-auto no-scrollbar shrink-0">
           <div className="mb-12">
              <h4 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                <span className="w-2 h-2 bg-[#ff5a5f] rounded-full"></span>
                {t('filterService')}
              </h4>
              <div className="space-y-5">
                 {categories.map(c => (
                    <label key={c.key} className="flex items-center gap-4 cursor-pointer group">
                      <div 
                        onClick={() => {
                          const isSel = selectedCategories.includes(c.key);
                          if (isSel) setSelectedCategories(prev => prev.filter(x => x !== c.key));
                          else setSelectedCategories(prev => [...prev, c.key]);
                          setCurrentPage(1);
                        }}
                        className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-300 ${selectedCategories.includes(c.key) ? 'bg-[#ff5a5f] border-[#ff5a5f] shadow-lg shadow-[#ff5a5f]/30' : 'border-slate-200 group-hover:border-[#ff5a5f]'}`}
                      >
                        {selectedCategories.includes(c.key) && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                      </div>
                      <span className={`text-sm font-bold transition-all duration-300 ${selectedCategories.includes(c.key) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                        {c.labelEn}
                      </span>
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
                        onClick={() => {
                          const isSel = selectedRatings.includes(r);
                          if (isSel) setSelectedRatings(prev => prev.filter(x => x !== r));
                          else setSelectedRatings([r]); // Only one rating filter at a time for minRating logic
                          setCurrentPage(1);
                        }}
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

        </aside>

        {/* RESULTS SECTION */}
        <main className="flex-1 p-5 md:p-8 overflow-y-auto h-[calc(100vh-64px)] no-scrollbar bg-slate-50/30 min-w-0">
           <div className="max-w-5xl mx-auto w-full">
              <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 mb-8">
                 <div className="flex bg-white p-1 rounded-xl border border-slate-200">
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
              {viewMode === "list" && (filteredAndSortedResults.length === 0 || venuesError) && (
                <div className="rounded-[32px] border border-slate-100 bg-white px-8 py-16 text-center">
                  <p className="text-sm font-bold text-slate-700">{venuesError || t('noVenuesMatch')}</p>
                  <p className="mt-2 text-xs text-slate-400">Try clearing category or rating filters, or change the URL category key.</p>
                </div>
              )}

              {viewMode === "list" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {paginatedResults.map((res) => (
                        <div
                          key={res.businessId}
                          role="link"
                          tabIndex={0}
                          onClick={() => goToVenue(res.businessId)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              goToVenue(res.businessId);
                            }
                          }}
                          className="group flex min-h-[120px] cursor-pointer flex-row overflow-hidden rounded-2xl border border-slate-100 bg-white p-3 transition-all duration-300 hover:shadow-lg"
                        >
                            <div className="relative w-36 sm:w-44 h-28 sm:h-32 overflow-hidden rounded-xl flex-shrink-0">
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
                                <button 
                                  onClick={(e) => handleToggleFavorite(res.businessId, e)}
                                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 hover:text-[#ff5a5f] transition-all shadow-lg hover:scale-110 z-10"
                                >
                                    <Heart className={`w-5 h-5 transition-colors duration-300 ${favorites.includes(res.businessId) ? 'fill-[#ff5a5f] text-[#ff5a5f]' : 'text-slate-900'}`} />
                                </button>
                            </div>
                            <div className="flex flex-col justify-between flex-1 pl-4 py-1 min-w-0">
                                <div>
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-[#ff5a5f] uppercase tracking-wide mb-1">{res.category}</p>
                                            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug group-hover:text-[#ff5a5f] transition-colors line-clamp-2">{res.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                            <span className="text-sm font-black text-slate-900 leading-none">{res.rating}</span>
                                            <span className="text-[11px] font-bold text-slate-400 border-l border-slate-200 pl-2 leading-none">({res.reviews})</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-slate-500 mt-2">
                                        <div className="flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full border border-slate-100 tracking-tight max-w-full">
                                            {res.locationLabel} • {res.distanceLabel}
                                        </div>
                                        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border tracking-tight max-w-full ${res.todaySlotTimings?.toLowerCase().includes('closed') ? 'bg-slate-50 text-slate-500 border-slate-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                            <Clock className="w-3.5 h-3.5 shrink-0" /> {t('todaySlots')}: {res.todaySlotTimings || '—'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{t('priceFrom')}</span>
                                        <span className="font-extrabold text-lg text-slate-900">${res.price.toFixed(2)}</span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        goToVenue(res.businessId);
                                      }}
                                      className="rounded-lg bg-[#ff5a5f] px-5 py-2 text-xs font-bold text-white transition hover:bg-[#e0454a]"
                                    >
                                        {t("bookBtn")}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}

              {/* GRID VIEW */}
              {viewMode === "grid" && (filteredAndSortedResults.length === 0 || venuesError) && (
                <div className="rounded-[40px] border border-slate-100 bg-white px-8 py-16 text-center col-span-full">
                  <p className="text-sm font-bold text-slate-700">{venuesError || t('noVenuesMatch')}</p>
                </div>
              )}

              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-700">
                    {paginatedResults.map((res) => (
                        <div
                          key={res.businessId}
                          role="link"
                          tabIndex={0}
                          onClick={() => goToVenue(res.businessId)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              goToVenue(res.businessId);
                            }
                          }}
                          className="group flex translate-y-0 cursor-pointer flex-col overflow-hidden rounded-[40px] border border-b-[6px] border-b-[#ff5a5f]/10 border-slate-100 bg-white transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-slate-200/50"
                        >
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
                                <button 
                                  onClick={(e) => handleToggleFavorite(res.businessId, e)}
                                  className="absolute top-6 right-6 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-slate-900 hover:text-[#ff5a5f] transition-all shadow-lg z-10"
                                >
                                    <Heart className={`w-5 h-5 transition-colors duration-300 ${favorites.includes(res.businessId) ? 'fill-[#ff5a5f] text-[#ff5a5f]' : 'text-slate-900'}`} />
                                </button>
                                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl shadow-lg border border-white/20">
                                    <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                    <span className="text-xs font-black text-slate-900">{res.rating}</span>
                                </div>
                            </div>
                            <div className="p-8 flex flex-col flex-1">
                                <p className="text-[10px] font-black text-[#ff5a5f] uppercase tracking-widest mb-2">{res.category}</p>
                                <h3 className="text-xl font-black text-slate-900 leading-tight mb-4 group-hover:text-[#ff5a5f] transition-colors line-clamp-2">{res.name}</h3>
                                
                                <div className={`mb-4 flex items-center gap-2 text-[10px] font-semibold normal-case tracking-tight px-3 py-1.5 rounded-xl w-fit max-w-full ${res.todaySlotTimings?.toLowerCase().includes('closed') ? 'bg-slate-50 text-slate-500' : 'bg-emerald-50 text-emerald-700'}`}>
                                    <Clock size={12} className="shrink-0" /> {t('todaySlots')}: {res.todaySlotTimings || '—'}
                                </div>
                                
                                <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50">
                                    <span className="font-black text-2xl text-slate-900">${res.price.toFixed(2)}</span>
                                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg transition-all duration-500 group-hover:rotate-90 group-hover:bg-[#ff5a5f]">
                                        <ChevronRight className="h-6 w-6" strokeWidth={3} />
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
              )}

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="mt-12 rounded-2xl border border-slate-100 overflow-hidden">
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={itemsPerPage}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
           </div>
        </main>

        {/* MAP SECTION - Desktop */}
        {showMap && (
           <aside className="hidden xl:block w-[420px] sticky top-[64px] h-[calc(100vh-64px)] border-l border-slate-100 bg-slate-50 overflow-hidden group shrink-0">
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
                              isActive ? 'z-50 scale-110' : activeMarkerId != null ? 'z-20 opacity-70 scale-95' : 'z-10 opacity-95'
                            }`}
                            style={{ top: `${topPct}%`, left: `${leftPct}%` }}
                        >
                            <div className={`border-2 rounded-lg px-2.5 py-1 font-bold text-[11px] shadow-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${isActive ? 'bg-[#ff5a5f] border-white text-white ring-2 ring-white/90' : 'bg-white border-slate-300 text-slate-800'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-[#ff5a5f]' : 'bg-[#ff5a5f]'}`}></span>
                                ${res.price.toFixed(0)}
                            </div>
                            <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] mx-auto -mt-px filter drop-shadow-lg ${isActive ? 'border-t-slate-900 opacity-100' : 'border-t-slate-300 opacity-60'}`}></div>
                        </div>
                      );
                    })}
                </div>

                {activeVenue && (() => {
                  const { minLat, maxLat, minLng, maxLng } = markerBounds;
                  const topPct = maxLat === minLat ? 50 : ((activeVenue.lat - minLat) / (maxLat - minLat)) * 70 + 15;
                  const leftPct = maxLng === minLng ? 50 : ((activeVenue.lng - minLng) / (maxLng - minLng)) * 70 + 15;
                  return (
                    <div
                      className="absolute z-[60] pointer-events-none"
                      style={{ top: `${Math.min(topPct + 8, 72)}%`, left: `${Math.min(Math.max(leftPct, 18), 82)}%`, transform: "translate(-50%, 0)" }}
                    >
                    <div className="pointer-events-auto w-[220px] bg-white rounded-xl p-3 shadow-xl border border-slate-200 flex flex-col gap-2 animate-in fade-in duration-200">
                        <div className="w-full aspect-square max-h-[100px] rounded-lg overflow-hidden shrink-0">
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
                        <div className="min-w-0">
                            <p className="text-[9px] font-bold text-[#ff5a5f] uppercase truncate">{activeVenue.category}</p>
                            <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-tight">{activeVenue.name}</h4>
                            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 mt-1">
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                {activeVenue.rating} · ${activeVenue.price}
                            </div>
                            <button 
                                type="button"
                                onClick={() => goToVenue(activeVenue.businessId)}
                                className="w-full bg-[#ff5a5f] text-white text-[10px] font-bold py-2 rounded-lg mt-2 hover:bg-[#e0454a]"
                            >
                                {t('viewDetails')}
                            </button>
                        </div>
                    </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-800 shadow-md hover:border-[#ff5a5f] hover:text-[#ff5a5f]"
                  >
                    <MapIcon className="w-4 h-4" />
                    {showMap ? ("Hide map") : t("showMap")}
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
      fallback={<AppLoader label="Loading venues…" variant="section" />}
    >
      <SearchContent />
    </Suspense>
  );
}
