"use client";

import { useEffect, useState } from "react";
import { Link2, Copy, Check, Share2, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShareableLink() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shopUrl, setShopUrl] = useState("");

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
          title: 'LODES Desserts - Order Now!',
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
    window.open(shopUrl, '_blank');
  };

  if (loading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <Card className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary-600" />
          Your Affiliate Shop Link
        </CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          Share this link with customers. When they order through your link, you automatically earn commission!
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-white border-2 border-primary-300 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1">
              <Input
                value={shopUrl}
                readOnly
                className="font-mono text-sm bg-gray-50"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button
              onClick={handleCopy}
              variant="outline"
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2 text-green-600" />
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

            <Button
              onClick={handleOpenShop}
              className="w-full"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View Shop
            </Button>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            How It Works
          </h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Customer visits your shop link</li>
            <li>• They browse and order desserts</li>
            <li>• You earn commission automatically!</li>
            <li>• Track all orders in &quot;My Orders&quot; tab</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Share on WhatsApp, Facebook, Instagram</li>
            <li>• Add to your social media bio</li>
            <li>• Send directly to potential customers</li>
            <li>• Post in groups and communities</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}
