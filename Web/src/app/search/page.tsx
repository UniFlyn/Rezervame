"use client";
import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useI18n } from "../../components/I18nProvider";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchPublicVenues,
  fetchPublicCategories,
  mapApiVenueToRow,
  categoryFilterParamFromSelection,
  businessListingImageSrc,
  type ApiVenue,
  type SearchVenueRow,
  type PublicCategory,
} from "@/lib/venueSearch";
import { useAuth } from "@/components/AuthProvider";
import { apiGet, apiDelete, apiPost } from "@/lib/api";
import { toastSuccess, toastError } from "@/lib/toast";
import { usePageHeaderMeta } from "@/contexts/PageHeaderMetaContext";
import { AppLoader } from "@/components/ui/AppLoader";
import { Pagination } from "@/components/ui/pagination";
import { PARTNER_BUSINESS_TYPES } from "@/lib/partnerBusinessTypes";
import { goToVenue } from "@/lib/goToVenue";
import { ResultsMap } from "@/components/venue/ResultsMap";
import {
  Button,
  Chip,
  Checkbox,
  Radio,
  IconButton,
  Glyph,
  BusinessListItem,
  BusinessResultCard,
  EmptyState,
} from "@/ds";

const RATING_OPTIONS = [
  { v: 0, l: "Todas" },
  { v: 4.5, l: "4.5+" },
  { v: 4.0, l: "4.0+" },
  { v: 3.5, l: "3.5+" },
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recomendados" },
  { value: "ratingHighLow", label: "Mejor valorados" },
  { value: "distanceNearFar", label: "Más cercanos" },
  { value: "priceLowHigh", label: "Precio: menor a mayor" },
  { value: "priceHighLow", label: "Precio: mayor a menor" },
];

function useViewportWidth() {
  const [vw, setVw] = useState(1280);
  useEffect(() => {
    setVw(window.innerWidth);
    const onR = () => setVw(window.innerWidth);
    window.addEventListener("resize", onR, { passive: true });
    return () => window.removeEventListener("resize", onR);
  }, []);
  return vw;
}

function SearchContent() {
  const { t, language } = useI18n();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isLoggedIn, openFavoritePrompt } = useAuth();
  const { setMeta, clearMeta } = usePageHeaderMeta();

  const vw = useViewportWidth();
  const isDesktop = vw >= 1080;
  const isWide = vw >= 1280;
  const isTablet = vw >= 720 && vw < 1080;
  const isMobile = vw < 720;

  const [favorites, setFavorites] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [showMap, setShowMap] = useState(false);
  const [sortBy, setSortBy] = useState("recommended");
  const [sortOpen, setSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get("category") ? [searchParams.get("category")!] : [],
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);

  const [apiVenues, setApiVenues] = useState<ApiVenue[]>([]);
  const [venuesLoading, setVenuesLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<PublicCategory[]>([]);

  const itemsPerPage = viewMode === "list" ? 10 : 15;
  const legacyCategoryNameFromQuery = searchParams.get("category");
  const categoryKeyFromQuery = searchParams.get("categoryKey");
  const searchQuery = searchParams.get("q") || "";

  const venues = useMemo(
    () => apiVenues.map((v) => mapApiVenueToRow(v, language)),
    [apiVenues, language],
  );

  useEffect(() => {
    if (isLoggedIn) {
      apiGet<{ data?: { businessId?: string }[] } | { businessId?: string }[]>(
        "/mobile/favorites?limit=100",
        "USER",
      )
        .then((res) => {
          const rows = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
          setFavorites(rows.map((f) => f.businessId).filter(Boolean) as string[]);
        })
        .catch(() => {});
    } else {
      setFavorites([]);
    }
  }, [isLoggedIn]);

  const toggleFavorite = async (businessId: string) => {
    const run = async () => {
      const isFav = favorites.includes(businessId);
      try {
        if (isFav) {
          await apiDelete(`/mobile/favorites/${businessId}`, "USER");
          setFavorites((prev) => prev.filter((id) => id !== businessId));
        } else {
          await apiPost("/mobile/favorites", { businessId }, "USER");
          setFavorites((prev) => [...prev, businessId]);
        }
      } catch {
        toastError("Error", "No se pudieron actualizar los favoritos");
      }
    };
    if (!isLoggedIn) {
      openFavoritePrompt(() => void run());
      return;
    }
    await run();
  };

  useEffect(() => {
    let cancelled = false;
    const run = (geo?: { lat: number; lng: number }) => {
      setVenuesLoading(true);
      const categoryParam =
        selectedCategories.length > 0
          ? categoryFilterParamFromSelection(selectedCategories)
          : categoryKeyFromQuery || legacyCategoryNameFromQuery || "";
      const filters = {
        page: currentPage,
        limit: itemsPerPage,
        category: categoryParam,
        search: searchQuery,
        sortBy,
        minRating: selectedRatings.length > 0 ? Math.min(...selectedRatings) : 0,
      };
      void fetchPublicVenues(15_000, geo, filters)
        .then((res) => {
          if (cancelled) return;
          setApiVenues(res.data);
          setTotalItems(res.total);
          setTotalPages(res.totalPages);
        })
        .catch(() => {
          if (cancelled) return;
          setApiVenues([]);
          setTotalItems(0);
          setTotalPages(1);
        })
        .finally(() => {
          if (!cancelled) setVenuesLoading(false);
        });
    };
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => !cancelled && run({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => !cancelled && run(),
        { enableHighAccuracy: false, maximumAge: 300_000, timeout: 12_000 },
      );
    } else {
      run();
    }
    return () => {
      cancelled = true;
    };
  }, [
    currentPage,
    itemsPerPage,
    sortBy,
    categoryKeyFromQuery,
    legacyCategoryNameFromQuery,
    searchQuery,
    selectedCategories,
    selectedRatings,
  ]);

  useEffect(() => {
    void fetchPublicCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  const partnerFilterOptions = useMemo(() => {
    const countByKey = new Map<string, number>();
    for (const c of categories) countByKey.set(c.key, c.activeBusinessCount ?? 0);
    return PARTNER_BUSINESS_TYPES.map((type) => ({
      id: type.id,
      filterParam: type.categoryKeys.join(","),
      label: t(`${type.labelKey}Title`),
      count: type.categoryKeys.reduce((sum, k) => sum + (countByKey.get(k) ?? 0), 0),
    }));
  }, [categories, t]);

  const pageTitle = useMemo(() => {
    if (searchQuery.trim()) return `Resultados para “${searchQuery.trim()}”`;
    if (legacyCategoryNameFromQuery) {
      const partnerMatch = PARTNER_BUSINESS_TYPES.find(
        (p) => p.categoryKeys.join(",") === legacyCategoryNameFromQuery,
      );
      if (partnerMatch) return t(`${partnerMatch.labelKey}Title`);
      const firstKey = legacyCategoryNameFromQuery.split(",")[0]?.trim();
      const cat = categories.find((c) => c.key === firstKey);
      if (cat) return language === "es" ? cat.labelEs || cat.labelEn : cat.labelEn;
      return legacyCategoryNameFromQuery;
    }
    return "Todos los negocios";
  }, [searchQuery, legacyCategoryNameFromQuery, categories, language, t]);

  const countLabel = `${totalItems} ${totalItems === 1 ? "resultado" : "resultados"}`;

  useEffect(() => {
    setMeta({ title: pageTitle, subtitle: countLabel });
    return () => clearMeta();
  }, [pageTitle, countLabel, setMeta, clearMeta]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategories, selectedRatings, sortBy, viewMode]);

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedRatings.length > 0 ||
    Boolean(categoryKeyFromQuery) ||
    Boolean(searchQuery.trim());

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedRatings([]);
    setCurrentPage(1);
    router.push("/search");
  };

  const activeFilterCount = selectedCategories.length + selectedRatings.length;

  const showMapList = () => {
    setShowMap(true);
    setViewMode("list");
  };
  const hideMapGrid = () => {
    setShowMap(false);
    setViewMode("grid");
  };

  const rowFor = (res: SearchVenueRow, i: number) => ({
    key: `${res.businessId}-${i}`,
    image: businessListingImageSrc(res),
    name: res.name,
    rating: res.rating || undefined,
    reviews: res.reviews || undefined,
    category: res.category,
    location: res.locationLabel,
    distance: res.distanceLabel,
    services: res.serviceName ? [res.serviceName] : [],
    hoursToday: res.todaySlotTimings,
    priceFrom: res.price ? Math.round(res.price) : undefined,
    badge: res.popular ? "Popular" : undefined,
    favorite: favorites.includes(res.businessId),
    onFavorite: () => toggleFavorite(res.businessId),
    onClick: () => goToVenue(res.businessId),
    onReserve: () => goToVenue(res.businessId),
  });

  // Filters ------------------------------------------------------------------
  const FilterSection = ({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) => (
    <div style={{ padding: "18px 0", borderBottom: last ? "none" : "1px solid var(--border-subtle)" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--rz-gray-500)",
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--rz-coral)" }} />
        {title}
      </div>
      {children}
    </div>
  );

  const OrdenarPor = (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setSortOpen((o) => !o)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          width: "100%",
          height: 42,
          padding: "0 13px",
          background: "var(--surface-card)",
          border: `1px solid ${sortOpen ? "var(--rz-coral)" : "var(--border-subtle)"}`,
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--rz-gray-900)",
          boxShadow: sortOpen ? "0 0 0 3px var(--rz-coral-050)" : "none",
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {(SORT_OPTIONS.find((o) => o.value === sortBy) || SORT_OPTIONS[0]).label}
        </span>
        <Glyph
          name="chevronDown"
          size={16}
          style={{ color: "var(--rz-gray-400)", flex: "none", transform: sortOpen ? "rotate(180deg)" : "none" }}
        />
      </button>
      {sortOpen && (
        <>
          <div onClick={() => setSortOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              left: 0,
              right: 0,
              zIndex: 31,
              background: "var(--surface-card)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-lg)",
              padding: 5,
            }}
          >
            {SORT_OPTIONS.map((o) => {
              const on = o.value === sortBy;
              return (
                <button
                  key={o.value}
                  onClick={() => {
                    setSortBy(o.value);
                    setSortOpen(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                    width: "100%",
                    padding: "8px 11px",
                    border: "none",
                    background: on ? "var(--rz-coral-050)" : "transparent",
                    borderRadius: "var(--radius-sm)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "var(--font-sans)",
                    fontSize: 13.5,
                    color: on ? "var(--rz-coral-700)" : "var(--rz-gray-700)",
                    fontWeight: on ? 600 : 500,
                  }}
                >
                  {o.label}
                  {on && <Glyph name="check" size={15} style={{ color: "var(--rz-coral)", flex: "none" }} />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  const FiltersBody = (
    <div>
      <FilterSection title="Ordenar por">{OrdenarPor}</FilterSection>
      <FilterSection title="Tipo de servicio">
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {partnerFilterOptions.map((c) => (
            <Checkbox
              key={c.id}
              label={c.label}
              checked={selectedCategories.includes(c.filterParam)}
              onChange={(v: boolean) =>
                setSelectedCategories((prev) =>
                  v ? [...prev, c.filterParam] : prev.filter((x) => x !== c.filterParam),
                )
              }
            />
          ))}
        </div>
      </FilterSection>
      <FilterSection title="Calificación" last>
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          {RATING_OPTIONS.map((r) => (
            <label
              key={r.v}
              onClick={() => setSelectedRatings(r.v ? [r.v] : [])}
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
            >
              <Radio checked={(selectedRatings[0] || 0) === r.v} onChange={() => setSelectedRatings(r.v ? [r.v] : [])} />
              {r.v ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 15, color: "var(--rz-gray-700)" }}>
                  <Glyph name="star" size={15} filled style={{ color: "var(--rz-gold)" }} />
                  {r.l}
                </span>
              ) : (
                <span style={{ fontSize: 15, color: "var(--rz-gray-700)" }}>{r.l}</span>
              )}
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  const FiltersPanel = (
    <aside
      className="rz-scroll-thin"
      style={{
        width: 280,
        flex: "none",
        alignSelf: "flex-start",
        position: "sticky",
        top: 100,
        background: "transparent",
        padding: "6px 22px 14px 0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0 4px" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--rz-navy)" }}>Filtros</h3>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--rz-coral)",
            }}
          >
            Limpiar
          </button>
        )}
      </div>
      {FiltersBody}
    </aside>
  );

  // View + map segmented control --------------------------------------------
  const segBase: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 7,
    height: 38,
    padding: "0 16px",
    border: "none",
    borderRadius: "var(--radius-pill)",
    cursor: "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: 13,
    fontWeight: 600,
    whiteSpace: "nowrap",
  };
  const seg = (on: boolean): React.CSSProperties => ({
    ...segBase,
    background: on ? "var(--rz-navy)" : "transparent",
    color: on ? "#fff" : "var(--rz-gray-600)",
  });

  const ViewMapControls = (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        padding: 4,
        background: "var(--rz-gray-100)",
        borderRadius: "var(--radius-pill)",
      }}
    >
      <button onClick={() => setViewMode("list")} style={seg(viewMode === "list")}>
        <Glyph name="list" size={16} />
        {!isMobile && "Lista"}
      </button>
      <button onClick={() => setViewMode("grid")} style={seg(viewMode === "grid")}>
        <Glyph name="grid" size={16} />
        {!isMobile && "Cuadrícula"}
      </button>
      {!isMobile && <span style={{ width: 1, height: 22, background: "var(--rz-gray-300)", margin: "0 4px", flex: "none" }} />}
      {!isMobile && (
        <button onClick={showMap ? hideMapGrid : showMapList} style={seg(showMap)}>
          <Glyph name={showMap ? "close" : "mapPin"} size={16} />
          {showMap ? "Ocultar mapa" : "Mostrar mapa"}
        </button>
      )}
    </div>
  );

  const Toolbar = (
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      {(isTablet || isMobile) && (
        <Button variant="outline" size="sm" leftIcon="filter" onClick={() => setFiltersOpen(true)}>
          Filtros{activeFilterCount ? ` (${activeFilterCount})` : ""}
        </Button>
      )}
      <span style={{ flex: 1, minWidth: 0 }} />
      {ViewMapControls}
    </div>
  );

  const ChipRow = null;

  const ResultsList =
    viewMode === "grid" ? (
      <div
        style={{
          display: "grid",
          rowGap: 26,
          columnGap: 16,
          gridTemplateColumns: `repeat(${
            isMobile ? 1 : isTablet ? 2 : isWide ? (showMap ? 3 : 4) : showMap ? 2 : 3
          }, minmax(0,1fr))`,
        }}
      >
        {venues.map((res, i) => {
          const p = rowFor(res, i);
          return <BusinessResultCard {...p} />;
        })}
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {venues.map((res, i) => {
          const p = rowFor(res, i);
          return (
            <BusinessListItem
              {...p}
              active={activeMarkerId === res.businessId}
              onMouseEnter={() => setActiveMarkerId(res.businessId)}
            />
          );
        })}
      </div>
    );

  const Empty = (
    <EmptyState
      icon="search"
      title="Ningún negocio coincide con tu búsqueda"
      message="Prueba con otro servicio, categoría, ubicación o filtro."
      actionLabel={hasActiveFilters ? "Borrar filtros" : undefined}
      onAction={hasActiveFilters ? clearAllFilters : undefined}
    />
  );

  if (venuesLoading) {
    return <AppLoader label={t("loadingVenues")} variant="page" />;
  }

  const PAGE_PAD = "clamp(24px, 3vw, 40px)";

  return (
    <div style={{ background: "var(--rz-gray-050)", minHeight: "100vh" }}>
      <div style={{ width: "100%", padding: `24px ${PAGE_PAD} 56px` }}>
        <div style={{ display: "flex", gap: "clamp(32px, 2.6vw, 40px)", alignItems: "flex-start" }}>
          {isDesktop && FiltersPanel}

          <main style={{ flex: 1, minWidth: 0 }}>
            <div style={{ padding: "6px 0 8px" }}>{Toolbar}</div>
            {ChipRow}
            <div style={{ marginTop: 16 }}>{venues.length ? ResultsList : Empty}</div>

            {totalPages > 1 && (
              <div style={{ marginTop: 32, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  totalItems={totalItems}
                  pageSize={itemsPerPage}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </main>

          {isWide && showMap && (
            <div style={{ flex: "none", width: "clamp(400px, 31vw, 560px)", alignSelf: "flex-start", position: "sticky", top: 100 }}>
              <div
                style={{
                  height: "calc(100vh - 148px)",
                  minHeight: 560,
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  border: "1px solid var(--border-subtle)",
                  boxShadow: "var(--shadow-sm)",
                }}
              >
                <ResultsMap results={venues} activeId={activeMarkerId} setActiveId={setActiveMarkerId} onOpen={goToVenue} />
              </div>
            </div>
          )}
        </div>

        {!isWide && showMap && (
          <div style={{ marginTop: 20, height: 480, borderRadius: "var(--radius-xl)", overflow: "hidden", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-sm)" }}>
            <ResultsMap results={venues} activeId={activeMarkerId} setActiveId={setActiveMarkerId} onOpen={goToVenue} />
          </div>
        )}
      </div>

      {isMobile && (
        <button
          onClick={() => (showMap ? hideMapGrid() : showMapList())}
          style={{
            position: "fixed",
            bottom: 22,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 70,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            height: 48,
            padding: "0 22px",
            border: "none",
            borderRadius: "var(--radius-pill)",
            cursor: "pointer",
            background: "var(--rz-navy)",
            color: "#fff",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 10px 26px rgba(2,48,71,0.28)",
          }}
        >
          <Glyph name={showMap ? "list" : "mapPin"} size={18} />
          {showMap ? "Ver lista" : "Ver mapa"}
        </button>
      )}

      {!isDesktop && filtersOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div onClick={() => setFiltersOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(2,30,44,0.45)", backdropFilter: "blur(2px)" }} />
          <div
            style={{
              position: "relative",
              background: "var(--surface-card)",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              maxHeight: "86vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div style={{ padding: "14px 22px 10px", borderBottom: "1px solid var(--border-subtle)" }}>
              <div style={{ width: 44, height: 5, borderRadius: 999, background: "var(--rz-gray-200)", margin: "0 auto 12px" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: "var(--rz-navy)" }}>Filtros</h3>
                <IconButton icon="close" variant="ghost" round label="Cerrar" onClick={() => setFiltersOpen(false)} />
              </div>
            </div>
            <div style={{ overflowY: "auto", padding: "0 22px" }}>{FiltersBody}</div>
            <div style={{ display: "flex", gap: 12, padding: "14px 22px", borderTop: "1px solid var(--border-subtle)" }}>
              <Button variant="ghost" fullWidth onClick={clearAllFilters}>
                Limpiar
              </Button>
              <Button variant="primary" fullWidth onClick={() => setFiltersOpen(false)}>
                Ver {totalItems} negocios
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<AppLoader label="Cargando negocios…" variant="section" />}>
      <SearchContent />
    </Suspense>
  );
}
