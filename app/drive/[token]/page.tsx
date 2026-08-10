"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import {
  CakeSlice,
  Truck,
  PackageCheck,
  MapPin,
  Phone,
  Loader2,
  Navigation,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DriveOrder {
  id: number;
  dessertName: string;
  quantity: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  latitude: string | null;
  longitude: string | null;
  status: string;
}

export default function DrivePage() {
  const params = useParams();
  const token = params.token as string;

  const [order, setOrder] = useState<DriveOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const watchId = useRef<number | null>(null);

  useEffect(() => {
    fetch(`/api/drive/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setOrder(await res.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
    // stop sharing if page closed
    return () => stopSharing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const pushLocation = async (pos: GeolocationPosition) => {
    try {
      await fetch(`/api/drive/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      });
      setLastPing(new Date());
    } catch (e) {
      console.error("ping failed", e);
    }
  };

  const startSharing = async () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Browser tidak menyokong GPS.");
      return;
    }

    // mark out_for_delivery
    try {
      await fetch(`/api/drive/${token}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "out_for_delivery" }),
      });
      setOrder((o) => (o ? { ...o, status: "out_for_delivery" } : o));
    } catch {}

    // immediate ping + watch
    navigator.geolocation.getCurrentPosition(pushLocation, () => {}, {
      enableHighAccuracy: true,
    });

    watchId.current = navigator.geolocation.watchPosition(
      pushLocation,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError("Kebenaran lokasi ditolak. Benarkan GPS untuk tracking.");
          stopSharing();
        }
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 }
    );
    setSharing(true);
  };

  const stopSharing = () => {
    if (watchId.current != null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setSharing(false);
  };

  const handleDelivered = async () => {
    stopSharing();
    try {
      await fetch(`/api/drive/${token}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered" }),
      });
      setOrder((o) => (o ? { ...o, status: "delivered" } : o));
    } catch {}
  };

  const destinationUrl =
    order?.latitude && order?.longitude
      ? `https://www.google.com/maps/dir/?api=1&destination=${order.latitude},${order.longitude}`
      : null;

  return (
    <div className="min-h-dvh bg-ink-950 text-white flex flex-col">
      {/* Header */}
      <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
        <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-500 text-ink-950">
          <CakeSlice className="h-5 w-5" strokeWidth={2} />
        </span>
        <div>
          <p className="font-bold tracking-tight">
            Lodes<span className="text-primary-400">.</span> Driver
          </p>
          <p className="text-xs text-ink-400">Mod penghantaran</p>
        </div>
        {sharing && (
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            LIVE
          </span>
        )}
      </div>

      <div className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
        {loading ? (
          <div className="skeleton h-64 bg-white/5" />
        ) : notFound || !order ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-10 pb-10 text-center">
              <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Link Tidak Sah</h2>
              <p className="text-ink-400 text-sm">
                Link penghantaran ini tidak wujud atau sudah tamat.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4 animate-fade-up">
            {/* Order card */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-6">
                <p className="text-xs text-ink-400 uppercase tracking-wider">
                  Order #{order.id}
                </p>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {order.dessertName} × {order.quantity}
                </h2>

                <div className="mt-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary-400 flex-shrink-0" />
                    <p className="text-sm text-ink-200">
                      {order.customerAddress || "Tiada alamat"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary-400 flex-shrink-0" />
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-sm text-white font-medium"
                    >
                      {order.customerName} • {order.customerPhone}
                    </a>
                  </div>
                </div>

                {destinationUrl && (
                  <a
                    href={destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-primary-400 font-semibold text-sm transition-colors"
                  >
                    <Navigation className="h-4 w-4" />
                    Navigasi ke Customer (Google Maps)
                  </a>
                )}
              </CardContent>
            </Card>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Controls */}
            {order.status === "delivered" ? (
              <Card className="bg-emerald-500/10 border-emerald-500/30">
                <CardContent className="pt-8 pb-8 text-center">
                  <PackageCheck className="h-14 w-14 text-emerald-400 mx-auto mb-3" />
                  <p className="text-xl font-bold text-emerald-400">
                    Penghantaran Selesai!
                  </p>
                  <p className="text-sm text-ink-300 mt-1">
                    Order #{order.id} telah sampai. Terima kasih!
                  </p>
                </CardContent>
              </Card>
            ) : order.status === "out_for_delivery" || sharing ? (
              <>
                <div className="bg-primary-500/10 border border-primary-500/30 rounded-xl p-4 text-center">
                  <p className="text-sm text-primary-300 font-medium flex items-center justify-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    {sharing
                      ? `Lokasi sedang dikongsi${
                          lastPing
                            ? ` • ping ${lastPing.toLocaleTimeString("ms-MY")}`
                            : ""
                        }`
                      : "Sedia untuk mula kongsi lokasi"}
                  </p>
                  <p className="text-xs text-ink-400 mt-1">
                    Kekalkan page ini terbuka semasa menghantar
                  </p>
                </div>
                {!sharing && (
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={startSharing}
                  >
                    <Truck className="h-5 w-5 mr-2" />
                    Mula Kongsi Lokasi
                  </Button>
                )}
                <Button
                  size="lg"
                  onClick={handleDelivered}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <PackageCheck className="h-5 w-5 mr-2" />
                  Tandakan Sampai
                </Button>
              </>
            ) : (
              <Button size="lg" className="w-full" onClick={startSharing}>
                <Truck className="h-5 w-5 mr-2" />
                Mula Hantar & Kongsi Lokasi
              </Button>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-ink-500 pb-6">
        Lodes Desserts • Mod Driver
      </p>
    </div>
  );
}
