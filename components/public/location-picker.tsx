"use client";

import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  Crosshair,
  Loader2,
  Navigation,
  Search,
} from "lucide-react";
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

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  type?: string;
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

  // Place search state (forward geocoding by place name)
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchAbort = useRef<AbortController | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

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

  // --------------------------------------------------------
  // Forward geocoding: search place by name (e.g. "NY Matcha")
  // Debounced, biased to Malaysia, aborts stale requests.
  // --------------------------------------------------------
  const searchPlaces = async (term: string) => {
    if (searchAbort.current) searchAbort.current.abort();
    if (term.trim().length < 3) {
      setResults([]);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    searchAbort.current = controller;
    setSearching(true);
    try {
      const viewbox = "99.0,8.0,120.5,0.5"; // Malaysia bounds approx
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
          term
        )}&countrycodes=my&limit=6&viewbox=${viewbox}&bounded=0&accept-language=ms`,
        {
          headers: { "Accept-Language": "ms" },
          signal: controller.signal,
        }
      );
      const data: SearchResult[] = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setShowResults(true);
    } catch (e: any) {
      if (e?.name !== "AbortError") setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setQuery(term);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (term.trim().length < 3) {
      setResults([]);
      setShowResults(false);
      return;
    }
    searchTimer.current = setTimeout(() => searchPlaces(term), 500);
  };

  const handleSelectResult = async (item: SearchResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (isNaN(lat) || isNaN(lng)) return;

    setShowResults(false);
    setResults([]);
    setQuery(item.display_name);
    setError("");

    // Move map + marker to the selected place
    if (leafletMap.current && markerRef.current) {
      leafletMap.current.setView([lat, lng], 17);
      markerRef.current.setLatLng([lat, lng]);
    }
    // Use the place's own display name as the address (no extra request)
    onChange({ latitude: lat, longitude: lng, address: item.display_name });
  };

  // Close dropdown on outside click; cleanup timers
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (searchAbort.current) searchAbort.current.abort();
    };
  }, []);

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

      {/* Search by place name — e.g. "NY Matcha" */}
      <div ref={searchBoxRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            onFocus={() => results.length > 0 && setShowResults(true)}
            placeholder="Cari nama kedai / tempat (cth: NY Matcha)"
            className="w-full rounded-xl border border-ink-200 bg-white pl-10 pr-10 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500"
          />
          {searching && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400 animate-spin" />
          )}
        </div>

        {showResults && results.length > 0 && (
          <div className="absolute z-[1000] left-0 right-0 mt-1.5 bg-white border border-ink-200 rounded-xl shadow-lg max-h-60 overflow-auto">
            {results.map((item, idx) => (
              <button
                key={`${item.lat}-${item.lon}-${idx}`}
                type="button"
                onClick={() => handleSelectResult(item)}
                className="w-full text-left px-3.5 py-2.5 hover:bg-ink-50 flex items-start gap-2.5 border-b border-ink-100 last:border-0 transition-colors"
              >
                <MapPin className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-ink-800 leading-snug">
                  {item.display_name}
                </span>
              </button>
            ))}
          </div>
        )}

        {showResults && !searching && query.trim().length >= 3 && results.length === 0 && (
          <div className="absolute z-[1000] left-0 right-0 mt-1.5 bg-white border border-ink-200 rounded-xl shadow-lg px-3.5 py-2.5">
            <p className="text-sm text-ink-500">
              Tiada hasil. Cuba nama penuh tempat atau guna pin pada map.
            </p>
          </div>
        )}
      </div>

      {/* Map */}
      <div className="rounded-xl overflow-hidden border border-ink-200">
        <div ref={mapRef} className="h-56 w-full bg-ink-100" />
      </div>

      <p className="text-xs text-ink-500 flex items-center gap-1.5">
        <Navigation className="h-3.5 w-3.5" />
        Cari nama tempat, guna GPS, atau drag pin ke lokasi yang tepat
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
