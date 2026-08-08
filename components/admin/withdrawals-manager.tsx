"use client";

import { useEffect, useState } from "react";
import { Check, X, QrCode, CreditCard, Download, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "./financial-overview";

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
  const [filter, setFilter] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("all");
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
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-44" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* QR Code Modal */}
      {viewingQr && (
        <div
          className="fixed inset-0 bg-ink-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setViewingQr(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-lift animate-fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-ink-950 flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                QR Code E-Wallet
              </h3>
              <button
                onClick={() => setViewingQr(null)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:text-ink-900 hover:bg-ink-100 transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-ink-50 rounded-xl p-4">
              <img
                src={viewingQr}
                alt="QR Code Fullscreen"
                className="w-full max-w-md mx-auto rounded-lg border border-ink-200"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <a
                href={viewingQr}
                download="qr-code.png"
                className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-ink-900 text-primary-400 font-semibold text-sm hover:bg-ink-950 transition-colors"
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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-950">
            Manage Withdrawals
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Proses permintaan pengeluaran komisen affiliate
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
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
            Accepted (
            {withdrawals.filter((w) => w.status === "accepted").length})
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredWithdrawals.map((withdrawal) => (
          <Card key={withdrawal.id} className="hover:shadow-lift">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-bold text-lg text-ink-950">
                    Withdrawal #{withdrawal.id}
                  </h3>
                  <p className="text-sm text-ink-400">
                    {formatDate(new Date(withdrawal.requestedAt))}
                  </p>
                </div>
                <StatusBadge status={withdrawal.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Affiliate
                  </p>
                  <p className="font-semibold text-ink-900">
                    {withdrawal.affiliate.name}
                  </p>
                  <p className="text-sm text-ink-500">
                    {withdrawal.affiliate.email}
                  </p>
                  {withdrawal.affiliate.phone && (
                    <p className="text-sm text-ink-500">
                      {withdrawal.affiliate.phone}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Jumlah
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                    {formatCurrency(withdrawal.amount)}
                  </p>
                </div>
              </div>

              {/* Withdrawal Method Badge */}
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-ink-100">
                  {withdrawal.withdrawalMethod === "qr" ? (
                    <>
                      <QrCode className="h-4 w-4 text-ink-600" />
                      <span className="text-sm font-semibold text-ink-800">
                        QR Code Payment
                      </span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 text-ink-600" />
                      <span className="text-sm font-semibold text-ink-800">
                        Bank Transfer
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Bank Details */}
              {withdrawal.withdrawalMethod === "bank" &&
                withdrawal.bankName && (
                  <div className="bg-ink-50 p-4 rounded-xl mb-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Bank Details
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm text-ink-700">
                        <span className="font-semibold">Bank:</span>{" "}
                        {withdrawal.bankName}
                      </p>
                      <p className="text-sm text-ink-700">
                        <span className="font-semibold">Account:</span>{" "}
                        {withdrawal.bankAccount}
                      </p>
                      <p className="text-sm text-ink-700">
                        <span className="font-semibold">Account Holder:</span>{" "}
                        {withdrawal.accountHolder}
                      </p>
                    </div>
                  </div>
                )}

              {/* QR Code Display */}
              {withdrawal.withdrawalMethod === "qr" &&
                withdrawal.qrCodeUrl && (
                  <div className="bg-ink-50 p-4 rounded-xl mb-5 border border-ink-200/70">
                    <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 flex items-center gap-2">
                        <QrCode className="h-4 w-4" />
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
                          className="inline-flex items-center px-2.5 py-1.5 text-xs font-semibold border border-ink-200 rounded-lg hover:bg-white transition-colors"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-3 border border-ink-200">
                      <img
                        src={withdrawal.qrCodeUrl}
                        alt="QR Code"
                        className="max-w-[200px] mx-auto rounded-lg"
                      />
                      <p className="text-xs text-ink-400 text-center mt-2">
                        Scan QR code ini untuk bayar ke e-wallet affiliate
                      </p>
                    </div>
                  </div>
                )}

              {withdrawal.notes && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Nota Admin
                  </p>
                  <p className="text-sm text-ink-700">{withdrawal.notes}</p>
                </div>
              )}

              {withdrawal.status === "pending" && (
                <div className="flex gap-2 pt-5 border-t border-ink-100">
                  <Button
                    size="sm"
                    onClick={() =>
                      handleUpdateStatus(withdrawal.id, "accepted")
                    }
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Terima &amp; Bayar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const reason = prompt("Sebab penolakan (optional):");
                      handleUpdateStatus(
                        withdrawal.id,
                        "rejected",
                        reason || undefined
                      );
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
            <CardContent className="py-12 text-center">
              <p className="text-ink-400">
                Tiada withdrawal {filter !== "all" && filter}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
