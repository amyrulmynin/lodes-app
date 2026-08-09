"use client";

import { useEffect, useState } from "react";
import { Star, Eye, EyeOff, Trash2, MessageSquareQuote, QrCode, Link2, Check, Download, X } from "lucide-react";
import QRCode from "qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string | null;
  isVisible: number;
  createdAt: string;
  dessert: { name: string } | null;
  affiliate: { name: string } | null;
}

interface ReviewStats {
  total: number;
  avgRating: string;
  distribution: { star: number; count: number }[];
  visible: number;
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-4 w-4 ${
            s <= rating ? "fill-primary-500 text-primary-500" : "text-ink-200"
          }`}
        />
      ))}
    </div>
  );
}

function StaticShareCard() {
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [reviewUrl, setReviewUrl] = useState("");

  useEffect(() => {
    setReviewUrl(`${window.location.origin}/review`);
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reviewUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleQr = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(reviewUrl, {
        width: 400,
        margin: 2,
        color: { dark: "#141412", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setShowQr(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <Card className="bg-ink-950 border-ink-950 text-white relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary-500/20 blur-2xl pointer-events-none"
        />
        <CardContent className="pt-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary-400" />
                Link Review Statik (Manual)
              </h3>
              <p className="text-sm text-ink-300 mt-1">
                Untuk customer walk-in / bukan affiliate. Boleh guna berulang
                kali. Customer isi nama + WhatsApp sendiri.
              </p>
              {reviewUrl && (
                <p className="text-xs text-primary-400 font-mono mt-2 break-all">
                  {reviewUrl}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="bg-white/10 border-white/10 text-white hover:bg-white/15 hover:text-primary-300"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-emerald-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={handleQr}
                className="bg-primary-500 text-ink-950 hover:bg-primary-400"
              >
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showQr && (
        <div
          className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowQr(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-lift animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-ink-950 flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Review Statik
              </h3>
              <button
                onClick={() => setShowQr(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-2 border-dashed border-ink-200 rounded-xl p-6 text-center">
              <p className="text-lg font-bold tracking-tight text-ink-950">
                Lodes<span className="text-primary-600">.</span> Desserts
              </p>
              <p className="text-xs text-ink-500 mt-1 mb-4">
                Macam mana dessert kami? Scan &amp; bagi review!
              </p>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Review QR Code"
                  className="w-full max-w-[220px] mx-auto rounded-lg"
                />
              )}
              <p className="text-xs text-ink-400 mt-4">
                Terima kasih atas sokongan anda
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={qrDataUrl}
                download="lodes-review-qr.png"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-ink-900 text-primary-400 font-semibold text-sm hover:bg-ink-950 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download PNG
              </a>
              <Button
                variant="outline"
                onClick={() => window.print()}
                className="flex-1"
              >
                Print
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setStats(data.stats);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (review: Review) => {
    try {
      const res = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: review.isVisible !== 1 }),
      });
      if (res.ok) fetchReviews();
    } catch (error) {
      console.error("Error toggling review:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Padam review ini secara kekal?")) return;
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      if (res.ok) fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  const filtered = reviews.filter((r) => {
    if (filter === "visible") return r.isVisible === 1;
    if (filter === "hidden") return r.isVisible !== 1;
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StaticShareCard />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold tracking-tight text-ink-950 tabular-nums">
              {stats?.total || 0}
            </p>
            <p className="text-sm font-medium text-ink-500 mt-1">
              Jumlah Review
            </p>
          </CardContent>
        </Card>
        <Card className="bg-ink-950 border-ink-950 text-white">
          <CardContent className="pt-6 text-center">
            <div className="flex items-center justify-center gap-2">
              <p className="text-4xl font-bold tracking-tight text-primary-400 tabular-nums">
                {stats?.avgRating || "0.0"}
              </p>
              <Star className="h-7 w-7 fill-primary-500 text-primary-500" />
            </div>
            <p className="text-sm font-medium text-ink-400 mt-1">
              Purata Rating
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-4xl font-bold tracking-tight text-ink-950 tabular-nums">
              {stats?.visible || 0}
            </p>
            <p className="text-sm font-medium text-ink-500 mt-1">
              Dipapar di Shop
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating distribution */}
      {stats && stats.total > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="font-semibold text-ink-950 mb-4">
              Taburan Rating
            </h3>
            <div className="space-y-2">
              {stats.distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-ink-600 w-12 flex items-center gap-1">
                    {d.star}
                    <Star className="h-3.5 w-3.5 fill-primary-500 text-primary-500" />
                  </span>
                  <div className="flex-1 h-2.5 bg-ink-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${stats.total > 0 ? (d.count / stats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-ink-700 w-8 text-right tabular-nums">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Semua ({reviews.length})
        </Button>
        <Button
          size="sm"
          variant={filter === "visible" ? "default" : "outline"}
          onClick={() => setFilter("visible")}
        >
          Dipapar ({reviews.filter((r) => r.isVisible === 1).length})
        </Button>
        <Button
          size="sm"
          variant={filter === "hidden" ? "default" : "outline"}
          onClick={() => setFilter("hidden")}
        >
          Tersembunyi ({reviews.filter((r) => r.isVisible !== 1).length})
        </Button>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {filtered.map((review) => (
          <Card key={review.id} className="hover:shadow-lift">
            <CardContent className="py-5">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-primary-400 font-bold text-sm">
                      {review.customerName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="font-semibold text-ink-950">
                        {review.customerName}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Stars rating={review.rating} />
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            review.isVisible === 1
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-ink-100 text-ink-500"
                          }`}
                        >
                          {review.isVisible === 1 ? "Dipapar" : "Tersembunyi"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-ink-700 mt-3 leading-relaxed">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                  <p className="text-xs text-ink-400 mt-2">
                    {review.dessert?.name} • oleh{" "}
                    {review.affiliate?.name || "Unknown"} •{" "}
                    {formatDate(new Date(review.createdAt))}
                  </p>
                </div>

                <div className="flex sm:flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleVisibility(review)}
                  >
                    {review.isVisible === 1 ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Sembunyi
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Papar
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Padam
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquareQuote className="h-10 w-10 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-400">
                {reviews.length === 0
                  ? "Belum ada review. Kongsi link feedback kepada customer!"
                  : "Tiada review dalam kategori ini"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}



