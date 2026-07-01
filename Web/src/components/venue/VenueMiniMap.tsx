"use client";
import React, { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

type VenueMiniMapProps = { lat: number; lng: number; label?: string };

/**
 * Compact interactive Leaflet mini-map for the venue info panel.
 * Clean CARTO Voyager tiles + coral pin, matching the design system.
 */
export function VenueMiniMap({ lat, lng, label }: VenueMiniMapProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    void import("leaflet").then((mod) => {
      const L = (mod as any).default || mod;
      if (disposed || !ref.current || mapRef.current) return;
      const map = L.map(ref.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);
      const pin = L.divIcon({
        className: "",
        html: '<div style="filter:drop-shadow(0 3px 4px rgba(2,48,71,0.3))"><svg width="30" height="40" viewBox="0 0 24 32"><path style="fill:var(--rz-coral)" d="M12 0C5.37 0 0 5.37 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.37 18.63 0 12 0z"/><circle cx="12" cy="12" r="4.6" fill="#fff"/></svg></div>',
        iconSize: [30, 40],
        iconAnchor: [15, 38],
      });
      L.marker([lat, lng], { icon: pin }).addTo(map);
      mapRef.current = map;
      setTimeout(() => map.invalidateSize(), 120);
    });
    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng]);

  return (
    <div
      ref={ref}
      style={{ position: "absolute", inset: 0, isolation: "isolate" }}
      aria-label={label}
    />
  );
}

export default VenueMiniMap;
