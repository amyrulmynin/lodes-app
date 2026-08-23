"use client";

import { useEffect, useState } from "react";
import { Wallet, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function CommissionBalance() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="skeleton h-36" />
        <div className="skeleton h-36" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Featured balance card (brand) */}
      <Card className="bg-ink-950 border-ink-950 text-white relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary-500/25 blur-2xl pointer-events-none"
        />
        <CardContent className="pt-6 relative">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500 text-ink-950">
              <Wallet className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm font-medium text-ink-300">
              Commission Balance
            </p>
          </div>
          <p className="text-4xl font-bold tracking-tight text-primary-400 tabular-nums">
            {formatCurrency(profile?.commissionBalance || 0)}
          </p>
          <p className="text-sm text-ink-400 mt-3">
            Minimum withdrawal: RM10
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lift">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-100 text-ink-700">
              <TrendingUp className="h-5 w-5" strokeWidth={2} />
            </span>
            <p className="text-sm font-medium text-ink-500">Total Earned</p>
          </div>
          <p className="text-4xl font-bold tracking-tight text-ink-950 tabular-nums">
            {formatCurrency(profile?.totalEarned || 0)}
          </p>
          <p className="text-sm text-ink-400 mt-3">
            Termasuk {formatCurrency(profile?.totalWithdrawn || 0)} telah
            dikeluarkan
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
