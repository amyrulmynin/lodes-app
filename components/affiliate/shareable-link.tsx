"use client";

import { useEffect, useState } from "react";
import {
  Link2,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShareableLink() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shopUrl, setShopUrl] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);

      const baseUrl = window.location.origin;
      const url = `${baseUrl}/shop/${data.id}`;
      setShopUrl(url);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "LODES Desserts - Order Now!",
          text: `Order delicious desserts through my link and get the best service!`,
          url: shopUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      handleCopy();
    }
  };

  const handleOpenShop = () => {
    window.open(shopUrl, "_blank");
  };

  if (loading) {
    return <div className="skeleton h-24" />;
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-ink-50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-ink-950">
              <Link2 className="h-5 w-5" strokeWidth={2} />
            </span>
            <CardTitle className="text-lg">Your Affiliate Shop Link</CardTitle>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-ink-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-ink-400" />
          )}
        </div>
        {!isOpen && (
          <p className="text-sm text-ink-500 mt-2">
            Klik untuk lihat dan kongsi link kedai unik anda
          </p>
        )}
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 animate-fade-up">
          <div className="bg-ink-50 border border-ink-200/70 rounded-xl p-4">
            <Input
              value={shopUrl}
              readOnly
              className="font-mono text-sm bg-white mb-3"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Button onClick={handleCopy} variant="outline" className="w-full">
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-emerald-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>

              <Button
                onClick={handleShare}
                variant="outline"
                className="w-full"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share Link
              </Button>

              <Button onClick={handleOpenShop} className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Shop
              </Button>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200/70 rounded-xl p-4">
            <h4 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              How It Works
            </h4>
            <ul className="text-sm text-emerald-800 space-y-1">
              <li>• Customer visits your shop link</li>
              <li>• They browse and order desserts</li>
              <li>• You earn commission automatically!</li>
              <li>• Track all orders in &quot;My Orders&quot; tab</li>
            </ul>
          </div>

          <div className="bg-primary-50 border border-primary-200/60 rounded-xl p-4">
            <h4 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary-600" />
              Pro Tips
            </h4>
            <ul className="text-sm text-ink-700 space-y-1">
              <li>• Share on WhatsApp, Facebook, Instagram</li>
              <li>• Add to your social media bio</li>
              <li>• Send directly to potential customers</li>
              <li>• Post in groups and communities</li>
            </ul>
          </div>

          <div className="text-center pt-2 border-t border-ink-100">
            <button
              onClick={() => setIsOpen(false)}
              className="text-sm text-ink-600 hover:text-ink-950 font-semibold transition-colors cursor-pointer"
            >
              Collapse
            </button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
