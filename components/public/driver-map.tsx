"use client";

import { useEffect, useRef } from "react";

// ============================================================
// DriverMap - rider's own live position + destination pin + line
// ============================================================

interface DriverMapProps {
  current: { lat: number; lng: number } | null;
  destination: { lat: number; lng: number } | null;
}

export function DriverMap({ current, destination }: DriverMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const meMarker = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const lineRef = useRef<any>(null);
  const LRef = useRef<any>(null);

  // Load Leaflet once
  useEffect(() => {
    let mounted = true;
    (async () => {
      const L = await import("leaflet");
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (mounted) LRef.current = L;
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Init map
  useEffect(() => {
    const L = LRef.current;
    if (!L || !mapRef.current || leafletMap.current) return;
    const center = current || destination || { lat: 3.139, lng: 101.6869 };
    leafletMap.current = L.map(mapRef.current).setView([center.lat, center.lng], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(leafletMap.current);
  });

  // Update markers
  useEffect(() => {
    const L = LRef.current;
    const map = leafletMap.current;
    if (!L || !map) return;

    // destination pin (yellow)
    if (destination && !destMarker.current) {
      const destIcon = L.divIcon({
        className: "",
        html: `<div style="background:#facc15;width:18px;height:18px;border-radius:50%;border:3px solid #141412;box-shadow:0 0 0 2px #fff"></div>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });
      destMarker.current = L.marker([destination.lat, destination.lng], {
        icon: destIcon,
      }).addTo(map);
    }

    // my position (blue)
    if (current) {
      const meIcon = L.divIcon({
        className: "",
        html: `<div style="background:#3b82f6;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      if (meMarker.current) {
        meMarker.current.setLatLng([current.lat, current.lng]);
      } else {
        meMarker.current = L.marker([current.lat, current.lng], { icon: meIcon }).addTo(map);
      }

      // line between me + destination
      if (destination) {
        const pts: [number, number][] = [
          [current.lat, current.lng],
          [destination.lat, destination.lng],
        ];
        if (lineRef.current) {
          lineRef.current.setLatLngs(pts);
        } else {
          lineRef.current = L.polyline(pts, {
            color: "#3b82f6",
            weight: 3,
            dashArray: "6 8",
          }).addTo(map);
        }
        map.fitBounds(pts, { padding: [50, 50] });
      } else {
        map.setView([current.lat, current.lng], 15);
      }
    }
  }, [current, destination]);

  return (
    <div className="rounded-xl overflow-hidden border border-white/10">
      <div ref={mapRef} className="h-56 w-full bg-white/5" />
    </div>
  );
}
