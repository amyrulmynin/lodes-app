"use client";

import { useEffect, useState } from "react";
import { Check, X, QrCode, CreditCard, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Withdrawal {
  id: number;
  amount: string;
  withdrawalMethod: string;
  bankName: string | null;
  bankAccount: string | null;
  accountHolder: string | null;
  qrCodeUrl: string | null;
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
  const [viewingQr, setViewingQr] = useState<string | null>(null);

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
      {/* QR Code Modal */}
      {viewingQr && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingQr(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-lg w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary-600" />
                QR Code E-Wallet
              </h3>
              <button
                onClick={() => setViewingQr(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <img
                src={viewingQr}
                alt="QR Code Fullscreen"
                className="w-full max-w-md mx-auto rounded border-2 border-gray-300"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={viewingQr}
                download="qr-code.png"
                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </a>
              <Button
                variant="outline"
                onClick={() => setViewingQr(null)}
                className="flex-1"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

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

              {/* Withdrawal Method Badge */}
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200">
                  {withdrawal.withdrawalMethod === "qr" ? (
                    <>
                      <QrCode className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">QR Code Payment</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">Bank Transfer</span>
                    </>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              {withdrawal.withdrawalMethod === "bank" && withdrawal.bankName && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Bank Details
                  </p>
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
              )}

              {/* QR Code Display */}
              {withdrawal.withdrawalMethod === "qr" && withdrawal.qrCodeUrl && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg mb-4 border-2 border-blue-200">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-blue-600" />
                      QR Code E-Wallet Affiliate
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setViewingQr(withdrawal.qrCodeUrl)}
                        className="text-xs"
                      >
                        <Maximize2 className="h-3 w-3 mr-1" />
                        View Full
                      </Button>
                      <a
                        href={withdrawal.qrCodeUrl}
                        download={`qr-withdrawal-${withdrawal.id}.png`}
                        className="inline-flex items-center px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </a>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border-2 border-gray-200">
                    <img
                      src={withdrawal.qrCodeUrl}
                      alt="QR Code"
                      className="max-w-[200px] mx-auto rounded"
                    />
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Scan QR code ini untuk bayar ke e-wallet affiliate
                    </p>
                  </div>
                </div>
              )}

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
