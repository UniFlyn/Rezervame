"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useI18n } from "../../components/I18nProvider";
import { Search, Map as MapIcon, List, LayoutGrid, Star, Clock, Heart, Filter, ChevronDown, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const CATEGORIES = [
  "Servicios para el cabello",
  "Spa y Bienestar",
  "Cuidado de las Uñas",
  "Servicios de Belleza",
  "Barbershop",
  "Depilación"
];

const MOCK_RESULTS = [
  { id: 1, name: "Luxe Hair Studio", category: "Servicios para el cabello", rating: 4.9, reviews: 120, price: 45, img: "1560066984-138dadb4c035", lat: 25, lng: 25, popular: true },
  { id: 2, name: "Bliss Beauty", category: "Spa y Bienestar", rating: 4.8, reviews: 89, price: 65, img: "1544161515-4ab6ce6db874", lat: 30, lng: 30, popular: false },
  { id: 3, name: "Nail Society", category: "Cuidado de las Uñas", rating: 4.7, reviews: 62, price: 30, img: "1522337660859-02fbefca4702", lat: 20, lng: 40, popular: true },
  { id: 4, name: "Brow Studio", category: "Servicios de Belleza", rating: 4.9, reviews: 194, price: 32, img: "1487412947147-5cebf100ffc2", lat: 40, lng: 20, popular: false },
  { id: 5, name: "LUMI Hair Studio", category: "Servicios para el cabello", rating: 4.7, reviews: 145, price: 50, img: "1585747860715-2ba37e788b70", lat: 15, lng: 60, popular: true },
  { id: 6, name: "Nova Hair Atelier", category: "Servicios para el cabello", rating: 4.8, reviews: 76, price: 35, img: "1560066984-138dadb4c035", lat: 50, lng: 50, popular: false },
  { id: 7, name: "Zen Spa", category: "Spa y Bienestar", rating: 4.6, reviews: 45, price: 80, img: "1544161515-4ab6ce6db874", lat: 45, lng: 15, popular: true },
  { id: 8, name: "Glow Parlor", category: "Servicios de Belleza", rating: 4.5, reviews: 32, price: 25, img: "1487412947147-5cebf100ffc2", lat: 10, lng: 10, popular: false },
  { id: 9, name: "The Man Cave", category: "Barbershop", rating: 4.9, reviews: 210, price: 28, img: "1621605815891-2b97b0c03ffc", lat: 60, lng: 15, popular: true },
  { id: 10, name: "Urban Cuts", category: "Barbershop", rating: 4.7, reviews: 123, price: 22, img: "1622286332618-f28020ee72ad", lat: 15, lng: 15, popular: false },
  { id: 11, name: "Elite Beauty", category: "Servicios de Belleza", rating: 4.8, reviews: 88, price: 55, img: "1616394584738-c6b64f94c968", lat: 70, lng: 30, popular: true },
  { id: 12, name: "Pristine Nails", category: "Cuidado de las Uñas", rating: 4.6, reviews: 54, price: 20, img: "1604072366580-c0d12b495146", lat: 80, lng: 40, popular: false },
  { id: 13, name: "Serenity Wellness", category: "Spa y Bienestar", rating: 4.9, reviews: 167, price: 120, img: "1540555700478-422899bcafeb", lat: 25, lng: 80, popular: true },
  { id: 14, name: "The Gentleman", category: "Barbershop", rating: 4.8, reviews: 92, price: 30, img: "1503951914875-452162b0f3f1", lat: 10, lng: 90, popular: false },
  { id: 15, name: "Velvet Lashes", category: "Servicios de Belleza", rating: 4.7, reviews: 110, price: 40, img: "1487412947147-5cebf100ffc2", lat: 90, lng: 10, popular: true },
  { id: 16, name: "Radiance Skin", category: "Spa y Bienestar", rating: 4.5, reviews: 78, price: 95, img: "1570172619624-2900c97eb242", lat: 65, lng: 65, popular: false },
  { id: 17, name: "Modern Edge", category: "Servicios para el cabello", rating: 4.6, reviews: 134, price: 42, img: "1560066984-138dadb4c035", lat: 35, lng: 35, popular: true },
  { id: 18, name: "Pure Elements", category: "Spa y Bienestar", rating: 4.8, reviews: 205, price: 150, img: "1544161515-4ab6ce6db874", lat: 85, lng: 85, popular: true },
  { id: 19, name: "Smooth Skin Center", category: "Depilación", rating: 4.4, reviews: 42, price: 50, img: "1487412947147-5cebf100ffc2", lat: 5, lng: 5, popular: false },
  { id: 20, name: "Wax & Go", category: "Depilación", rating: 4.9, reviews: 88, price: 35, img: "1487412947147-5cebf100ffc2", lat: 95, lng: 95, popular: true },
  { id: 21, name: "Cali Cuts", category: "Barbershop", rating: 4.5, reviews: 67, price: 25, img: "1621605815891-2b97b0c03ffc", lat: 55, lng: 55, popular: false },
  { id: 22, name: "Crystal Nails", category: "Cuidado de las Uñas", rating: 4.7, reviews: 142, price: 28, img: "1522337660859-02fbefca4702", lat: 45, lng: 45, popular: true },
  { id: 23, name: "Heavenly Hands", category: "Spa y Bienestar", rating: 4.8, reviews: 99, price: 110, img: "1544161515-4ab6ce6db874", lat: 10, lng: 85, popular: false },
  { id: 24, name: "Style Bar", category: "Servicios para el cabello", rating: 4.9, reviews: 310, price: 60, img: "1585747860715-2ba37e788b70", lat: 85, lng: 10, popular: true },
  { id: 25, name: "Chic Beauty", category: "Servicios de Belleza", rating: 4.6, reviews: 56, price: 48, img: "1616394584738-c6b64f94c968", lat: 40, lng: 80, popular: false },
  { id: 26, name: "Golden Scissors", category: "Servicios para el cabello", rating: 4.7, reviews: 65, price: 38, img: "1560066984-138dadb4c035", lat: 30, lng: 70, popular: false },
  { id: 27, name: "The Beauty Hub", category: "Servicios de Belleza", rating: 4.8, reviews: 112, price: 52, img: "1487412947147-5cebf100ffc2", lat: 20, lng: 20, popular: true },
  { id: 28, name: "Nail Art Studio", category: "Cuidado de las Uñas", rating: 4.5, reviews: 45, price: 25, img: "1522337660859-02fbefca4702", lat: 50, lng: 90, popular: false },
  { id: 29, name: "Refresh Spa", category: "Spa y Bienestar", rating: 4.9, reviews: 198, price: 135, img: "1544161515-4ab6ce6db874", lat: 75, lng: 75, popular: true },
];

export default function SearchPage() {
  const { t } = useI18n();
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
  const [activeMarkerId, setActiveMarkerId] = useState<number | null>(null);

  // Constants
  const itemsPerPage = viewMode === "list" ? 10 : 15;
  
  const activeVenue = useMemo(() => 
    MOCK_RESULTS.find(v => v.id === activeMarkerId), 
  [activeMarkerId]);

  // Filter & Sort Logic
  const filteredAndSortedResults = useMemo(() => {
    let results = [...MOCK_RESULTS];

    // Filter by category
    if (selectedCategories.length > 0) {
      results = results.filter(r => selectedCategories.includes(r.category));
    }

    // Filter by rating
    if (selectedRatings.length > 0) {
      results = results.filter(r => selectedRatings.some(min => r.rating >= min));
    }

    // Sort
    results.sort((a, b) => {
      if (sortBy === "priceLowHigh") return a.price - b.price;
      if (sortBy === "priceHighLow") return b.price - a.price;
      if (sortBy === "ratingHighLow") return b.rating - a.rating;
      return 0; // Default
    });

    return results;
  }, [selectedCategories, selectedRatings, sortBy]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredAndSortedResults.length / itemsPerPage);
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

  return (
    <div className="min-h-screen bg-white flex flex-col font-outfit">
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
                 {CATEGORIES.map(c => (
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
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{searchParams.get("category") || t('hairService')}</h2>
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
              {viewMode === "list" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {paginatedResults.map((res) => (
                        <Link href={`/venue/${res.id}`} key={res.id} className="group flex flex-col md:flex-row bg-white rounded-[32px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 p-4 h-auto cursor-pointer">
                            <div className="relative w-full md:w-72 h-48 md:h-auto overflow-hidden rounded-[24px] flex-shrink-0">
                                <img 
                                  src={`https://images.unsplash.com/photo-${res.img}?q=80&w=800&fit=crop`} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                                  alt={res.name}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=800&fit=crop";
                                  }}
                                />
                                {res.popular && (
                                    <div className="absolute top-4 left-4 bg-[#ff5a5f] text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                        Popular
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
                                        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full border border-green-100 uppercase tracking-tighter">
                                            <Clock className="w-4 h-4" /> {t('today')} 3:00 PM
                                        </div>
                                        <div className="flex items-center gap-2 bg-slate-50 text-slate-600 px-4 py-1.5 rounded-full border border-slate-100 uppercase tracking-tighter">
                                            Avenida Balboa • 0.5 km
                                        </div>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('priceFrom')}</span>
                                        <span className="font-black text-2xl text-slate-900 tracking-tight">${res.price}.00</span>
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
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-700">
                    {paginatedResults.map((res) => (
                        <Link href={`/venue/${res.id}`} key={res.id} className="group bg-white rounded-[40px] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 flex flex-col cursor-pointer border-b-[6px] border-b-[#ff5a5f]/10 translate-y-0 hover:translate-y-[-8px]">
                            <div className="relative h-64 overflow-hidden">
                                <img 
                                  src={`https://images.unsplash.com/photo-${res.img}?q=80&w=600&fit=crop`} 
                                  className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" 
                                  alt={res.name}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=600&fit=crop";
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
                                    <span className="font-black text-2xl text-slate-900">${res.price}.00</span>
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
              {totalPages > 1 && (
                <div className="mt-20 flex justify-center items-center gap-3">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${currentPage === 1 ? 'border-slate-50 text-slate-200 cursor-not-allowed' : 'border-slate-100 text-slate-600 hover:border-[#ff5a5f] hover:text-[#ff5a5f] hover:bg-white active:scale-95 shadow-sm'}`}
                    >
                        <ChevronLeft className="w-6 h-6" strokeWidth={3} />
                    </button>
                    
                    <div className="flex bg-white border-2 border-slate-100 rounded-2xl p-1.5 shadow-sm">
                        {Array.from({length: totalPages}).map((_, i) => (
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
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 ${currentPage === totalPages ? 'border-slate-50 text-slate-200 cursor-not-allowed' : 'border-slate-100 text-slate-600 hover:border-[#ff5a5f] hover:text-[#ff5a5f] hover:bg-white active:scale-95 shadow-sm'}`}
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
                    {paginatedResults.map((res, i) => (
                        <div 
                            key={res.id} 
                            onClick={() => {
                                setActiveMarkerId(res.id === activeMarkerId ? null : res.id);
                            }}
                            className={`absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${activeMarkerId === res.id ? 'z-50' : 'z-10'}`}
                            style={{ top: `${(res.lat / 100) * 80 + 10}%`, left: `${(res.lng / 100) * 80 + 10}%` }}
                        >
                            <div className={`border-[3px] rounded-2xl px-4 py-2 font-black text-sm shadow-2xl transition-all cursor-pointer hover:scale-110 whitespace-nowrap flex items-center gap-2 group/pin ${activeMarkerId === res.id ? 'bg-slate-900 border-slate-900 text-white scale-110' : 'bg-white border-[#ff5a5f] text-slate-900'}`}>
                                <span className={`w-2 h-2 rounded-full transition-colors ${activeMarkerId === res.id ? 'bg-white' : 'bg-[#ff5a5f]'}`}></span>
                                ${res.price}
                            </div>
                            <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] mx-auto -mt-0.5 filter drop-shadow-lg ${activeMarkerId === res.id ? 'border-t-slate-900' : 'border-t-[#ff5a5f]'}`}></div>
                        </div>
                    ))}
                </div>

                {/* POPUP CARD */}
                {activeVenue && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[320px] bg-white rounded-[32px] p-4 shadow-2xl border border-slate-100 flex items-center gap-4 animate-in slide-in-from-bottom-6 duration-500 pointer-events-auto">
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                            <img 
                               src={`https://images.unsplash.com/photo-${activeVenue.img}?q=80&w=300&fit=crop`} 
                               className="w-full h-full object-cover" 
                               alt={activeVenue.name}
                               onError={(e) => {
                                 const target = e.target as HTMLImageElement;
                                 target.src = "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?q=80&w=300&fit=crop";
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
                                onClick={() => router.push(`/venue/${activeVenue.id}`)}
                                className="w-full bg-[#ff5a5f] text-white text-[10px] font-black uppercase tracking-widest py-2.5 rounded-xl mt-3 hover:bg-[#e0454a] transition-all"
                            >
                                {t('viewDetails')}
                            </button>
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
