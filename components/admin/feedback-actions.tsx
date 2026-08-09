"use client";

import { useState } from "react";
import QRCode from "qrcode";
import { Link2, QrCode, Check, X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackActionsProps {
  orderId: number;
  orderStatus: string;
}

export function FeedbackActions({ orderId, orderStatus }: FeedbackActionsProps) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [feedbackUrl, setFeedbackUrl] = useState("");

  // Only for accepted orders
  if (orderStatus !== "accepted") return null;

  const getFeedbackUrl = async (): Promise<string> => {
    if (feedbackUrl) return feedbackUrl;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/feedback-token`);
      const data = await res.json();
      const url = `${window.location.origin}/feedback/${data.token}`;
      setFeedbackUrl(url);
      return url;
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      const url = await getFeedbackUrl();
      const message = `Hi! Terima kasih kerana order dessert kami ?? Kami amat hargai jika anda boleh kongsi feedback (30 saat sahaja): ${url}`;
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying link:", error);
      alert("Gagal menjana link. Sila cuba lagi.");
    }
  };

  const handleQr = async () => {
    try {
      const url = await getFeedbackUrl();
      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 2,
        color: { dark: "#141412", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
      setShowQr(true);
    } catch (error) {
      console.error("Error generating QR:", error);
      alert("Gagal menjana QR code. Sila cuba lagi.");
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleCopy}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : copied ? (
          <Check className="h-4 w-4 mr-2 text-emerald-600" />
        ) : (
          <Link2 className="h-4 w-4 mr-2" />
        )}
        {copied ? "Copied!" : "Feedback Link"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleQr}
        disabled={loading}
      >
        <QrCode className="h-4 w-4 mr-2" />
        QR
      </Button>

      {/* QR Modal */}
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
                QR Feedback - Order #{orderId}
              </h3>
              <button
                onClick={() => setShowQr(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Printable card */}
            <div className="border-2 border-dashed border-ink-200 rounded-xl p-6 text-center">
              <p className="text-lg font-bold tracking-tight text-ink-950">
                Lodes<span className="text-primary-600">.</span> Desserts
              </p>
              <p className="text-xs text-ink-500 mt-1 mb-4">
                Macam mana dessert kami? Scan &amp; bagi feedback!
              </p>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="Feedback QR Code"
                  className="w-full max-w-[220px] mx-auto rounded-lg"
                />
              )}
              <p className="text-xs text-ink-400 mt-4">
                Terima kasih atas sokongan anda ??
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <a
                href={qrDataUrl}
                download={`feedback-qr-order-${orderId}.png`}
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
            <p className="text-xs text-ink-400 text-center mt-3">
              Print &amp; tampal pada kotak dessert, atau download untuk
              kegunaan lain
            </p>
          </div>
        </div>
      )}
    </>
  );
}
