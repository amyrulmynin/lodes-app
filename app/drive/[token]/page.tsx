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
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";

const DriverMap = dynamic(
  () => import("@/components/public/driver-map").then((m) => m.DriverMap),
  { ssr: false }
);

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
  const [myPos, setMyPos] = useState<{ lat: number; lng: number } | null>(null);
  const [proofImage, setProofImage] = useState("");
  const [proofError, setProofError] = useState("");
  const [submittingProof, setSubmittingProof] = useState(false);
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
    setMyPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
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

  const handleProofFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setProofError("");
    if (!file) {
      setProofImage("");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setProofError("Hanya gambar dibenarkan");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProofError("Gambar mestilah < 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setProofImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleDelivered = async () => {
    // Require proof photo
    if (!proofImage) {
      setProofError("Sila ambil/upload gambar bukti penghantaran dahulu.");
      return;
    }
    setProofError("");
    setSubmittingProof(true);
    stopSharing();
    try {
      const res = await fetch(`/api/drive/${token}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "delivered", proofImage }),
      });
      if (res.ok) {
        setOrder((o) => (o ? { ...o, status: "delivered" } : o));
      } else {
        const data = await res.json();
        setProofError(data.error || "Gagal menandakan sampai");
      }
    } catch {
      setProofError("Ralat rangkaian. Cuba lagi.");
    } finally {
      setSubmittingProof(false);
    }
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

            {/* Live map: rider position + destination */}
            <Card className="bg-white/5 border-white/10">
              <CardContent className="pt-5">
                <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary-400" />
                  Peta Penghantaran
                </p>
                <DriverMap
                  current={myPos}
                  destination={
                    order.latitude && order.longitude
                      ? {
                          lat: parseFloat(order.latitude),
                          lng: parseFloat(order.longitude),
                        }
                      : null
                  }
                />
                <div className="flex items-center gap-4 text-xs text-ink-400 mt-3">
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-blue-500 border-2 border-white shadow" />
                    Anda
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-primary-500 border-2 border-ink-950" />
                    Customer
                  </span>
                </div>
                {!myPos && (
                  <p className="text-xs text-ink-400 mt-2">
                    Tekan &quot;Mula Hantar&quot; untuk paparkan lokasi anda pada
                    peta.
                  </p>
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

                {/* Proof of delivery photo (required before "Sampai") */}
                <Card className="bg-white/5 border-white/10">
                  <CardContent className="pt-5">
                    <p className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Camera className="h-4 w-4 text-primary-400" />
                      Bukti Penghantaran
                    </p>
                    <p className="text-xs text-ink-400 mb-3">
                      Ambil gambar dessert/pesanan yang telah diterima customer
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleProofFile}
                      className="w-full px-4 py-3 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 text-sm text-white
                               file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                               file:text-sm file:font-semibold file:bg-primary-500 file:text-ink-950
                               hover:border-white/40 transition-colors"
                    />
                    {proofError && (
                      <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5 mt-3">
                        {proofError}
                      </p>
                    )}
                    {proofImage && (
                      <div className="mt-3">
                        <img
                          src={proofImage}
                          alt="Bukti penghantaran"
                          className="w-full max-w-[240px] rounded-xl border border-white/20"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Button
                  size="lg"
                  onClick={handleDelivered}
                  disabled={submittingProof || !proofImage}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                >
                  {submittingProof ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <PackageCheck className="h-5 w-5 mr-2" />
                      Tandakan Sampai
                    </>
                  )}
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
