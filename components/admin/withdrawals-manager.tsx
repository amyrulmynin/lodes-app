"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Withdrawal {
  id: number;
  amount: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  status: string;
  requestedAt: Date;
  notes: string | null;
  affiliate: {
    name: string;
    email: string;
    phone: string | null;
  };
}

export function WithdrawalsManager() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/withdrawals");
      const data = await res.json();
      setWithdrawals(data);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    withdrawalId: number,
    status: "accepted" | "rejected",
    notes?: string
  ) => {
    try {
      const res = await fetch(`/api/withdrawals/${withdrawalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes }),
      });

      if (res.ok) {
        fetchWithdrawals();
      }
    } catch (error) {
      console.error("Error updating withdrawal:", error);
    }
  };

  const filteredWithdrawals = withdrawals.filter((withdrawal) => {
    if (filter === "all") return true;
    return withdrawal.status === filter;
  });

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Withdrawals</h2>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Semua ({withdrawals.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending ({withdrawals.filter((w) => w.status === "pending").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "accepted" ? "default" : "outline"}
            onClick={() => setFilter("accepted")}
          >
            Accepted ({withdrawals.filter((w) => w.status === "accepted").length})
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredWithdrawals.map((withdrawal) => (
          <Card key={withdrawal.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Withdrawal #{withdrawal.id}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(new Date(withdrawal.requestedAt))}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    withdrawal.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : withdrawal.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {withdrawal.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Affiliate</p>
                  <p className="font-medium">{withdrawal.affiliate.name}</p>
                  <p className="text-sm text-gray-600">{withdrawal.affiliate.email}</p>
                  {withdrawal.affiliate.phone && (
                    <p className="text-sm text-gray-600">{withdrawal.affiliate.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Jumlah</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(withdrawal.amount)}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-sm font-medium text-gray-500 mb-2">Bank Details</p>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">Bank:</span> {withdrawal.bankName}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Account:</span> {withdrawal.bankAccount}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Account Holder:</span>{" "}
                    {withdrawal.accountHolder}
                  </p>
                </div>
              </div>

              {withdrawal.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Nota Admin</p>
                  <p className="text-sm">{withdrawal.notes}</p>
                </div>
              )}

              {withdrawal.status === "pending" && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus(withdrawal.id, "accepted")}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Terima & Bayar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      const reason = prompt("Sebab penolakan (optional):");
                      handleUpdateStatus(withdrawal.id, "rejected", reason || undefined);
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Tolak
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredWithdrawals.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Tiada withdrawal {filter !== "all" && filter}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
