"use client";

import { useEffect, useRef, useState } from "react";
import { Navigation, Loader2 } from "lucide-react";

// ============================================================
// LiveDeliveryMap - shows driver dot moving + destination pin
// Polls the location endpoint; renders Leaflet map client-side.
// ============================================================

interface LiveDeliveryMapProps {
  token: string;
}

// Haversine distance in km
function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function LiveDeliveryMap({ token }: LiveDeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const driverMarker = useRef<any>(null);
  const destMarker = useRef<any>(null);
  const [L, setL] = useState<any>(null);
  const [driver, setDriver] = useState<{ lat: number; lng: number } | null>(null);
  const [destination, setDestination] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState("");
  const [distance, setDistance] = useState<number | null>(null);

  // Load Leaflet
  useEffect(() => {
    let mounted = true;
    (async () => {
      const leaflet = await import("leaflet");
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (mounted) setL(leaflet);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Poll location
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/public/track/${token}/location`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = await res.json();
        setStatus(data.status);
        if (data.destination) setDestination(data.destination);
        if (data.driver) setDriver(data.driver);
      } catch {}
    };
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, [token]);

  // Init + update map
  useEffect(() => {
    if (!L || !mapRef.current) return;
    const center = driver || destination || { lat: 3.139, lng: 101.6869 };

    if (!leafletMap.current) {
      leafletMap.current = L.map(mapRef.current).setView([center.lat, center.lng], 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(leafletMap.current);
    }

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
      }).addTo(leafletMap.current);
    }

    // driver dot (blue, animated pulse)
    if (driver) {
      const driverIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative"><div style="background:#3b82f6;width:20px;height:20px;border-radius:50%;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div><div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;background:rgba(59,130,246,.25);animation:none"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });
      if (driverMarker.current) {
        driverMarker.current.setLatLng([driver.lat, driver.lng]);
      } else {
        driverMarker.current = L.marker([driver.lat, driver.lng], {
          icon: driverIcon,
        }).addTo(leafletMap.current);
      }
      // fit both
      if (destination) {
        leafletMap.current.fitBounds(
          [
            [driver.lat, driver.lng],
            [destination.lat, destination.lng],
          ],
          { padding: [40, 40] }
        );
        setDistance(distanceKm(driver, destination));
      } else {
        leafletMap.current.setView([driver.lat, driver.lng], 15);
      }
    }
  }, [L, driver, destination]);

  if (!driver) return null; // only show once driver starts sharing

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
          <Navigation className="h-4 w-4 text-blue-500" />
          Lokasi rider (live)
        </p>
        {distance != null && (
          <p className="text-xs font-semibold text-ink-600 tabular-nums">
            ~{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`} lagi
          </p>
        )}
      </div>
      <div className="rounded-xl overflow-hidden border border-ink-200">
        <div ref={mapRef} className="h-64 w-full bg-ink-100" />
      </div>
      <div className="flex items-center gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow" />
          Rider
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-primary-500 border-2 border-ink-950" />
          Alamat anda
        </span>
      </div>
    </div>
  );
}
