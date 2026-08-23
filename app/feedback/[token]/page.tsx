"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Star,
  CakeSlice,
  CheckCircle,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function FeedbackPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [dessertName, setDessertName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/public/feedback/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setInvalid(true);
          return;
        }
        const data = await res.json();
        setDessertName(data.dessertName);
        setCustomerName(data.customerName);
        setAlreadyReviewed(data.alreadyReviewed);
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Sila pilih rating bintang dahulu");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/public/feedback/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal menghantar feedback");
      }
    } catch {
      setError("Terjadi kesalahan. Sila cuba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const ratingLabels = ["", "Teruk", "Kurang", "Okay", "Sedap", "Sangat Sedap!"];

  return (
    <div className="min-h-dvh bg-ink-50 flex flex-col">
      {/* Header */}
      <div className="bg-ink-950 text-white relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary-500/20 blur-3xl pointer-events-none"
        />
        <div className="max-w-lg mx-auto px-6 py-10 relative text-center">
          <span className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary-500 text-ink-950 mb-4">
            <CakeSlice className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            Lodes<span className="text-primary-400">.</span> Desserts
          </h1>
          <p className="text-sm text-ink-300 mt-1">
            Kami hargai maklum balas anda
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {loading ? (
            <div className="skeleton h-64" />
          ) : invalid ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center">
                <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-ink-950 mb-2">
                  Link Tidak Sah
                </h2>
                <p className="text-ink-500 text-sm">
                  Link feedback ini tidak wujud atau sudah tamat. Sila hubungi
                  penjual untuk link yang baru.
                </p>
              </CardContent>
            </Card>
          ) : submitted || alreadyReviewed ? (
            <Card className="animate-fade-up">
              <CardContent className="pt-10 pb-10 text-center">
                <span className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-50 mb-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600" />
                </span>
                <h2 className="text-xl font-bold text-ink-950 mb-2">
                  Terima Kasih{customerName ? `, ${customerName}` : ""}!
                </h2>
                <p className="text-ink-500 text-sm">
                  {alreadyReviewed && !submitted
                    ? "Anda sudah memberikan feedback untuk order ini."
                    : "Feedback anda telah direkodkan. Kami sangat hargai masa anda!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="animate-fade-up">
              <CardContent className="pt-8 pb-8">
                <h2 className="text-xl font-bold text-ink-950 text-center">
                  Macam mana {dessertName} kami?
                </h2>
                <p className="text-sm text-ink-500 text-center mt-1 mb-8">
                  Hi {customerName}! Kongsikan pengalaman anda
                </p>

                {/* Star rating */}
                <div className="flex justify-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = star <= (hoverRating || rating);
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1.5 transition-transform duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                        aria-label={`${star} bintang`}
                      >
                        <Star
                          className={`h-10 w-10 transition-colors duration-150 ${
                            active
                              ? "fill-primary-500 text-primary-500"
                              : "text-ink-200"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-sm font-semibold text-ink-700 h-5 mb-6">
                  {ratingLabels[hoverRating || rating]}
                </p>

                {/* Comment */}
                <div className="space-y-2 mb-6">
                  <label className="text-sm font-semibold text-ink-800">
                    Komen (optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Apa yang anda suka? Apa yang boleh kami improve?"
                    rows={4}
                    maxLength={500}
                    className="flex w-full rounded-xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus-visible:outline-none focus-visible:border-ink-900 focus-visible:ring-2 focus-visible:ring-primary-500/40"
                  />
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
                  >
                    {error}
                  </div>
                )}

                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Menghantar...
                    </>
                  ) : (
                    "Hantar Feedback"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-ink-400 pb-6">
        &copy; {new Date().getFullYear()} Lodes Desserts
      </p>
    </div>
  );
}
