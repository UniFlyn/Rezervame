"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { MapMarker, MapCard, Glyph } from "@/ds";
import { businessListingImageSrc, type SearchVenueRow } from "@/lib/venueSearch";

type LeafletMap = any;

interface ResultsMapProps {
  results: SearchVenueRow[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  onOpen: (id: string) => void;
}

const FALLBACK_CENTER: [number, number] = [8.9824, -79.5199]; // Ciudad de Panamá

/**
 * Interactive results map (Leaflet + OpenStreetMap) with Design System price
 * markers and a compact preview card — the customer-web spec's results map.
 */
export function ResultsMap({ results, activeId, setActiveId, onOpen }: ResultsMapProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap>(null);
  const LRef = useRef<any>(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((t) => (t + 1) % 1e9), []);

  const points = results.filter(
    (r) => Number.isFinite(r.lat) && Number.isFinite(r.lng) && (r.lat !== 0 || r.lng !== 0),
  );

  useEffect(() => {
    let disposed = false;
    void import("leaflet").then((mod) => {
      const L = (mod as any).default || mod;
      LRef.current = L;
      if (disposed || !elRef.current || mapRef.current) return;
      const center: [number, number] = points.length
        ? [points[0].lat, points[0].lng]
        : FALLBACK_CENTER;
      const map = L.map(elRef.current, {
        center,
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
        zoomAnimation: false,
        minZoom: 11,
        maxZoom: 18,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      mapRef.current = map;
      map.on("move zoom viewreset", bump);
      if (points.length > 1) {
        try {
          map.fitBounds(points.map((p) => [p.lat, p.lng]) as any, { padding: [48, 48], maxZoom: 16 });
        } catch {
          /* ignore */
        }
      }
      setTimeout(() => {
        map.invalidateSize();
        bump();
      }, 60);
      bump();
    });
    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.off();
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fit when the result set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;
    try {
      if (points.length === 1) map.setView([points[0].lat, points[0].lng], 15);
      else map.fitBounds(points.map((p) => [p.lat, p.lng]) as any, { padding: [48, 48], maxZoom: 16 });
    } catch {
      /* ignore */
    }
    bump();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.map((r) => r.businessId).join("|")]);

  useEffect(() => {
    const el = elRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
        bump();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [bump]);

  const map = mapRef.current;
  const L = LRef.current;
  const W = elRef.current ? elRef.current.clientWidth : 0;
  const H = elRef.current ? elRef.current.clientHeight : 0;
  const ptOf = (r: SearchVenueRow) => {
    if (!map || !L) return null;
    const p = map.latLngToContainerPoint(L.latLng([r.lat, r.lng]));
    return { x: p.x, y: p.y };
  };

  const ctrlBtn: React.CSSProperties = {
    width: 38,
    height: 38,
    border: "none",
    background: "var(--surface-card)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--rz-navy)",
  };
  const CARD_W = 210;
  const CARD_H = 236;
  const PAD = 10;

  const activeVenue = points.find((r) => r.businessId === activeId) || null;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "#e8ecef",
        zIndex: 0,
        isolation: "isolate",
      }}
    >
      <div ref={elRef} style={{ position: "absolute", inset: 0 }} />

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 500 }}>
        {map &&
          points.map((b) => {
            const p = ptOf(b);
            if (!p) return null;
            const isActive = activeId === b.businessId;
            return (
              <div
                key={b.businessId}
                onClick={() => setActiveId(isActive ? null : b.businessId)}
                style={{
                  position: "absolute",
                  left: p.x,
                  top: p.y,
                  transform: "translate(-50%, -100%)",
                  pointerEvents: "auto",
                  cursor: "pointer",
                  zIndex: isActive ? 30 : 10,
                }}
              >
                <MapMarker
                  variant="price"
                  label={`$${Math.round(b.price)}`}
                  active={isActive}
                  dimmed={activeId != null && !isActive}
                />
              </div>
            );
          })}

        {map &&
          activeVenue &&
          (() => {
            const p = ptOf(activeVenue);
            if (!p) return null;
            const below = p.y + 14 + CARD_H + PAD <= H;
            const left = Math.max(PAD, Math.min(W - CARD_W - PAD, p.x - CARD_W / 2));
            const top = Math.max(PAD, Math.min(H - CARD_H - PAD, below ? p.y + 14 : p.y - 50 - CARD_H));
            return (
              <div style={{ position: "absolute", left, top, width: CARD_W, pointerEvents: "auto", zIndex: 45 }}>
                <div style={{ position: "relative" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveId(null);
                    }}
                    aria-label="Cerrar"
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      zIndex: 3,
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      border: "none",
                      background: "rgba(255,255,255,0.94)",
                      boxShadow: "var(--shadow-sm)",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--rz-gray-600)",
                    }}
                  >
                    <Glyph name="close" size={14} />
                  </button>
                  <MapCard
                    compact
                    image={businessListingImageSrc(activeVenue)}
                    category={activeVenue.category}
                    name={activeVenue.name}
                    rating={activeVenue.rating || undefined}
                    distance={activeVenue.distanceLabel}
                    address={activeVenue.locationLabel}
                    onCta={() => onOpen(activeVenue.businessId)}
                    onClick={() => onOpen(activeVenue.businessId)}
                    width="100%"
                  />
                </div>
              </div>
            );
          })()}
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 16,
          right: 14,
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--radius-md)",
          overflow: "hidden",
          boxShadow: "var(--shadow-md)",
          background: "var(--surface-card)",
          zIndex: 600,
        }}
      >
        <button
          aria-label="Acercar"
          onClick={() => mapRef.current && mapRef.current.zoomIn()}
          style={{ ...ctrlBtn, borderBottom: "1px solid var(--border-subtle)" }}
        >
          <Glyph name="plus" size={18} />
        </button>
        <button aria-label="Alejar" onClick={() => mapRef.current && mapRef.current.zoomOut()} style={ctrlBtn}>
          <span style={{ width: 14, height: 2, borderRadius: 1, background: "var(--rz-navy)" }} />
        </button>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 6,
          left: 8,
          fontSize: 10,
          color: "#5b6470",
          background: "rgba(255,255,255,0.72)",
          padding: "1px 6px",
          borderRadius: 4,
          zIndex: 600,
        }}
      >
        © OpenStreetMap
      </div>
    </div>
  );
}
