"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Crosshair, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================
// LocationPicker - GPS + draggable map pin + reverse geocoding
// Uses Leaflet + OpenStreetMap (free, no API key).
// ============================================================

export interface LocationValue {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

interface LocationPickerProps {
  value: LocationValue | null;
  onChange: (loc: LocationValue) => void;
}

const DEFAULT_CENTER: [number, number] = [3.139, 101.6869]; // Kuala Lumpur

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [locating, setLocating] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [error, setError] = useState("");
  const [leafletReady, setLeafletReady] = useState(false);
  const [L, setL] = useState<any>(null);

  // Load Leaflet dynamically (client-side only)
  useEffect(() => {
    let mounted = true;
    (async () => {
      const leaflet = await import("leaflet");
      // Fix default marker icons
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl;
      leaflet.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      if (mounted) {
        setL(leaflet);
        setLeafletReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !L || !mapRef.current || leafletMap.current) return;

    const center: [number, number] = value
      ? [value.latitude, value.longitude]
      : DEFAULT_CENTER;

    const map = L.map(mapRef.current, { center, zoom: value ? 16 : 11 });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker(center, { draggable: true }).addTo(map);
    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      handleLocationChange(pos.lat, pos.lng, undefined, true);
    });

    leafletMap.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      leafletMap.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leafletReady, L]);

  // Reverse geocode coordinates -> address (Nominatim, light use)
  const reverseGeocode = async (lat: number, lng: number) => {
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=ms`,
        { headers: { "Accept-Language": "ms" } }
      );
      const data = await res.json();
      return data?.display_name || "";
    } catch {
      return "";
    } finally {
      setGeocoding(false);
    }
  };

  const handleLocationChange = async (
    lat: number,
    lng: number,
    accuracy?: number,
    fromDrag = false
  ) => {
    setError("");
    const address = await reverseGeocode(lat, lng);
    onChange({ latitude: lat, longitude: lng, accuracy, address });
  };

  const handleUseMyLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Browser anda tidak menyokong GPS.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        // move map + marker
        if (leafletMap.current && markerRef.current) {
          leafletMap.current.setView([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
        }
        await handleLocationChange(latitude, longitude, accuracy);
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "Kebenaran lokasi ditolak. Sila benarkan location dalam browser, atau drag pin pada map."
          );
        } else {
          setError("Tidak dapat mengesan lokasi. Cuba lagi atau drag pin.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const accuracyLabel = (acc?: number) => {
    if (acc == null) return null;
    if (acc <= 20) return { text: `±${Math.round(acc)}m (sangat tepat)`, cls: "text-emerald-600" };
    if (acc <= 60) return { text: `±${Math.round(acc)}m (baik)`, cls: "text-emerald-600" };
    if (acc <= 200) return { text: `±${Math.round(acc)}m (agak kasar)`, cls: "text-amber-600" };
    return { text: `±${Math.round(acc)}m (kurang tepat - sila drag pin)`, cls: "text-red-600" };
  };

  const acc = accuracyLabel(value?.accuracy);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-ink-400" />
          Lokasi Penghantaran
        </label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          disabled={locating}
        >
          {locating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Mengesan...
            </>
          ) : (
            <>
              <Crosshair className="h-4 w-4 mr-2" />
              Guna Lokasi Saya
            </>
          )}
        </Button>
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-ink-200">
        <div ref={mapRef} className="h-56 w-full bg-ink-100" />
      </div>

      <p className="text-xs text-ink-500 flex items-center gap-1.5">
        <Navigation className="h-3.5 w-3.5" />
        Drag pin ke lokasi rumah anda yang tepat
      </p>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
          {error}
        </p>
      )}

      {geocoding && (
        <p className="text-xs text-ink-500 flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Mendapatkan alamat...
        </p>
      )}

      {value?.address && (
        <div className="bg-ink-50 border border-ink-200/70 rounded-xl p-3.5">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">
            Alamat dikesan
          </p>
          <p className="text-sm text-ink-800 leading-snug">{value.address}</p>
          {acc && (
            <p className={`text-xs font-medium mt-1.5 ${acc.cls}`}>
              Ketepatan GPS: {acc.text}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
