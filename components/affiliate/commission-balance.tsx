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
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card className="bg-gradient-to-br from-primary-500 to-primary-600 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="h-8 w-8" />
            <p className="text-sm opacity-90">Commission Balance</p>
          </div>
          <p className="text-4xl font-bold">
            {formatCurrency(profile?.commissionBalance || 0)}
          </p>
          <p className="text-sm opacity-75 mt-2">
            Minimum withdrawal: RM10
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <p className="text-sm text-gray-600">Total Earned</p>
          </div>
          <p className="text-4xl font-bold text-gray-900">
            {formatCurrency(profile?.totalEarned || 0)}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Including {formatCurrency(profile?.totalWithdrawn || 0)} withdrawn
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
