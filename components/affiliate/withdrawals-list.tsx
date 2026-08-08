"use client";

import { useEffect, useState } from "react";
import {
  DollarSign,
  Download,
  Upload,
  CreditCard,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateCommissionStatementPDF } from "@/lib/pdf-generator";

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
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: "bg-emerald-50 text-emerald-700",
    pending: "bg-primary-100 text-primary-800",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
        styles[status] || "bg-ink-100 text-ink-600"
      }`}
    >
      {status}
    </span>
  );
}

export function WithdrawalsList() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState<"bank" | "qr">(
    "bank"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const [formData, setFormData] = useState({
    amount: "",
    bankName: "",
    bankAccount: "",
    accountHolder: "",
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
    fetchProfile();
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

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);
      if (data.bankName && data.bankAccount) {
        setFormData((prev) => ({
          ...prev,
          bankName: data.bankName,
          bankAccount: data.bankAccount,
          accountHolder: data.name,
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");

    if (!file) {
      setQrFile(null);
      setQrPreview("");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    const maxSize = 5 * 1024 * 1024;

    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPG and PNG images are allowed");
      return;
    }

    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setQrFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setQrPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);

    if (amount < 10) {
      alert("Minimum withdrawal adalah RM10");
      return;
    }

    if (profile && parseFloat(profile.commissionBalance) < amount) {
      alert("Balance tidak mencukupi");
      return;
    }

    if (withdrawalMethod === "bank") {
      if (!formData.bankName || !formData.bankAccount || !formData.accountHolder) {
        alert("Sila isi semua maklumat bank");
        return;
      }
    } else if (withdrawalMethod === "qr") {
      if (!qrFile) {
        alert("Sila upload QR code anda");
        return;
      }
    }

    setSubmitting(true);
    try {
      let qrData = null;
      if (withdrawalMethod === "qr" && qrFile) {
        const reader = new FileReader();
        qrData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(qrFile);
        });
      }

      const requestData: any = {
        amount: formData.amount,
        withdrawalMethod,
      };

      if (withdrawalMethod === "bank") {
        requestData.bankName = formData.bankName;
        requestData.bankAccount = formData.bankAccount;
        requestData.accountHolder = formData.accountHolder;
      } else {
        requestData.qrCodeUrl = qrData;
      }

      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (res.ok) {
        alert("Withdrawal request berjaya disubmit!");
        setShowForm(false);
        setQrFile(null);
        setQrPreview("");
        setFormData({
          amount: "",
          bankName: formData.bankName,
          bankAccount: formData.bankAccount,
          accountHolder: formData.accountHolder,
        });
        fetchWithdrawals();
        fetchProfile();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal submit withdrawal");
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      alert("Terjadi kesalahan. Sila cuba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = (withdrawal: Withdrawal) => {
    if (!profile) {
      alert("Profile data tidak tersedia");
      return;
    }

    generateCommissionStatementPDF(withdrawal, {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      commissionBalance: profile.commissionBalance,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-44" />
        ))}
      </div>
    );
  }

  // Pagination logic
  const totalPages = Math.ceil(withdrawals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentWithdrawals = withdrawals.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-950">
            Withdrawals
          </h2>
          {withdrawals.length > 0 && (
            <p className="text-sm text-ink-500 mt-1">
              Total: {withdrawals.length} request
              {withdrawals.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <DollarSign className="h-4 w-4 mr-2" />
          Request Withdrawal
        </Button>
      </div>

      {showForm && (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-lg">Request Withdrawal</CardTitle>
            <p className="text-sm text-ink-500">
              Balance tersedia:{" "}
              <span className="font-bold text-ink-900 tabular-nums">
                {formatCurrency(profile?.commissionBalance || 0)}
              </span>
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
                  Jumlah (RM)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="10"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="Minimum RM10"
                  required
                />
              </div>

              {/* Withdrawal Method Selection */}
              <div className="border-t border-ink-100 pt-5">
                <label className="text-sm font-semibold text-ink-800 block mb-3">
                  Pilih Kaedah Withdrawal:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod("bank")}
                    className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer ${
                      withdrawalMethod === "bank"
                        ? "border-ink-900 bg-ink-50"
                        : "border-ink-200 hover:border-ink-400"
                    }`}
                  >
                    <CreditCard
                      className={`h-6 w-6 ${
                        withdrawalMethod === "bank"
                          ? "text-ink-900"
                          : "text-ink-300"
                      }`}
                    />
                    <div className="text-left">
                      <p className="font-semibold text-ink-900">
                        Bank Transfer
                      </p>
                      <p className="text-xs text-ink-500">
                        Terus ke akaun bank
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod("qr")}
                    className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all duration-200 cursor-pointer ${
                      withdrawalMethod === "qr"
                        ? "border-ink-900 bg-ink-50"
                        : "border-ink-200 hover:border-ink-400"
                    }`}
                  >
                    <QrCode
                      className={`h-6 w-6 ${
                        withdrawalMethod === "qr"
                          ? "text-ink-900"
                          : "text-ink-300"
                      }`}
                    />
                    <div className="text-left">
                      <p className="font-semibold text-ink-900">QR Code</p>
                      <p className="text-xs text-ink-500">
                        Scan QR untuk bayar
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bank Transfer Form */}
              {withdrawalMethod === "bank" && (
                <div className="space-y-4 bg-ink-50 border border-ink-200/70 rounded-xl p-5">
                  <h3 className="font-semibold text-ink-900 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-ink-400" />
                    Maklumat Bank
                  </h3>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink-800">
                      Nama Bank
                    </label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder="Contoh: Maybank"
                      required={withdrawalMethod === "bank"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink-800">
                      Nombor Akaun
                    </label>
                    <Input
                      value={formData.bankAccount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccount: e.target.value,
                        })
                      }
                      placeholder="1234567890"
                      required={withdrawalMethod === "bank"}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink-800">
                      Nama Pemegang Akaun
                    </label>
                    <Input
                      value={formData.accountHolder}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accountHolder: e.target.value,
                        })
                      }
                      required={withdrawalMethod === "bank"}
                    />
                  </div>
                </div>
              )}

              {/* QR Code Upload */}
              {withdrawalMethod === "qr" && (
                <div className="space-y-4 bg-ink-50 border border-ink-200/70 rounded-xl p-5">
                  <h3 className="font-semibold text-ink-900 flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-ink-400" />
                    Upload QR Code Anda
                  </h3>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                      <Upload className="h-4 w-4 text-ink-400" />
                      QR Code Image (JPG, PNG)
                    </label>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleQrFileChange}
                      className="w-full px-4 py-3 border-2 border-dashed border-ink-200 rounded-xl cursor-pointer bg-white text-sm
                               file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                               file:text-sm file:font-semibold file:bg-ink-900 file:text-primary-400
                               hover:border-ink-400 transition-colors
                               focus:outline-none focus:border-ink-900"
                    />

                    {uploadError && (
                      <div
                        role="alert"
                        className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-sm font-medium"
                      >
                        {uploadError}
                      </div>
                    )}

                    <p className="text-xs text-ink-500">
                      Upload QR code e-wallet anda (TNG, GrabPay, Boost, etc.)
                    </p>

                    {qrPreview && (
                      <div className="mt-3 bg-white rounded-xl p-4 border border-ink-200">
                        <p className="text-sm font-semibold text-ink-800 mb-2">
                          Preview QR Code:
                        </p>
                        <img
                          src={qrPreview}
                          alt="QR Preview"
                          className="max-w-[200px] mx-auto border border-ink-200 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setQrFile(null);
                    setQrPreview("");
                    setUploadError("");
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {currentWithdrawals.map((withdrawal) => (
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

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                  Jumlah
                </p>
                <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                  {formatCurrency(withdrawal.amount)}
                </p>
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
                      Bank Details
                    </p>
                    <p className="font-semibold text-ink-900">
                      {withdrawal.bankName}
                    </p>
                    <p className="text-sm text-ink-600">
                      {withdrawal.bankAccount}
                    </p>
                    <p className="text-sm text-ink-600">
                      {withdrawal.accountHolder}
                    </p>
                  </div>
                )}

              {/* QR Code Display */}
              {withdrawal.withdrawalMethod === "qr" &&
                withdrawal.qrCodeUrl && (
                  <div className="bg-ink-50 p-4 rounded-xl mb-5 border border-ink-200/70">
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2 flex items-center gap-2">
                      <QrCode className="h-4 w-4" />
                      QR Code E-Wallet Anda
                    </p>
                    <div className="bg-white rounded-xl p-3 border border-ink-200">
                      <img
                        src={withdrawal.qrCodeUrl}
                        alt="QR Code"
                        className="max-w-[150px] mx-auto rounded-lg"
                      />
                    </div>
                  </div>
                )}

              {withdrawal.notes && (
                <div className="bg-primary-50 border border-primary-200/60 p-4 rounded-xl mb-5">
                  <p className="text-sm font-semibold text-ink-800">
                    Nota Admin:
                  </p>
                  <p className="text-sm text-ink-600">{withdrawal.notes}</p>
                </div>
              )}

              <div className="pt-5 border-t border-ink-100">
                <Button
                  onClick={() => handleDownloadPDF(withdrawal)}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Commission Statement (PDF)
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {withdrawals.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Wallet className="h-10 w-10 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-400">Tiada withdrawal request lagi</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {withdrawals.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t border-ink-100 pt-4">
          <p className="text-sm text-ink-500">
            Showing {startIndex + 1} to{" "}
            {Math.min(endIndex, withdrawals.length)} of {withdrawals.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center px-3">
              <span className="text-sm font-semibold text-ink-700">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
