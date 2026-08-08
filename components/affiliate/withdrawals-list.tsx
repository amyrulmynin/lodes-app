"use client";

import { useEffect, useState } from "react";
import { DollarSign, Download, Upload, CreditCard, QrCode, ChevronLeft, ChevronRight } from "lucide-react";
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

export function WithdrawalsList() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [withdrawalMethod, setWithdrawalMethod] = useState<"bank" | "qr">("bank");
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
    return <div className="text-center py-8">Loading...</div>;
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Withdrawals</h2>
          {withdrawals.length > 0 && (
            <p className="text-sm text-gray-600 mt-1">
              Total: {withdrawals.length} request{withdrawals.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <DollarSign className="h-4 w-4 mr-2" />
          Request Withdrawal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
            <p className="text-sm text-gray-600">
              Balance tersedia: {formatCurrency(profile?.commissionBalance || 0)}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Amount */}
              <div>
                <label className="text-sm font-medium block mb-2">Jumlah (RM)</label>
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
              <div className="border-t pt-4">
                <label className="text-sm font-medium block mb-3">Pilih Kaedah Withdrawal:</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod("bank")}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                      withdrawalMethod === "bank"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-300 hover:border-primary-300"
                    }`}
                  >
                    <CreditCard className={`h-6 w-6 ${withdrawalMethod === "bank" ? "text-primary-600" : "text-gray-400"}`} />
                    <div className="text-left">
                      <p className="font-semibold">Bank Transfer</p>
                      <p className="text-xs text-gray-600">Terus ke akaun bank</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawalMethod("qr")}
                    className={`p-4 border-2 rounded-lg flex items-center gap-3 transition-all ${
                      withdrawalMethod === "qr"
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-300 hover:border-primary-300"
                    }`}
                  >
                    <QrCode className={`h-6 w-6 ${withdrawalMethod === "qr" ? "text-primary-600" : "text-gray-400"}`} />
                    <div className="text-left">
                      <p className="font-semibold">QR Code</p>
                      <p className="text-xs text-gray-600">Scan QR untuk bayar</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bank Transfer Form */}
              {withdrawalMethod === "bank" && (
                <div className="space-y-4 border-2 border-primary-200 bg-primary-50 rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary-600" />
                    Maklumat Bank
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium block mb-2">Nama Bank</label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder="Contoh: Maybank"
                      required={withdrawalMethod === "bank"}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Nombor Akaun</label>
                    <Input
                      value={formData.bankAccount}
                      onChange={(e) =>
                        setFormData({ ...formData, bankAccount: e.target.value })
                      }
                      placeholder="1234567890"
                      required={withdrawalMethod === "bank"}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">Nama Pemegang Akaun</label>
                    <Input
                      value={formData.accountHolder}
                      onChange={(e) =>
                        setFormData({ ...formData, accountHolder: e.target.value })
                      }
                      required={withdrawalMethod === "bank"}
                    />
                  </div>
                </div>
              )}

              {/* QR Code Upload */}
              {withdrawalMethod === "qr" && (
                <div className="space-y-4 border-2 border-primary-200 bg-primary-50 rounded-lg p-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <QrCode className="h-5 w-5 text-primary-600" />
                    Upload QR Code Anda
                  </h3>
                  
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      <Upload className="h-4 w-4 inline mr-1" />
                      QR Code Image (JPG, PNG)
                    </label>
                    
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={handleQrFileChange}
                      className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer
                               file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                               file:text-sm file:font-semibold file:bg-white file:text-primary-700
                               hover:file:bg-primary-100 hover:border-primary-400
                               focus:outline-none focus:border-primary-500"
                    />

                    {uploadError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mt-2">
                        {uploadError}
                      </div>
                    )}

                    <p className="text-xs text-gray-600 mt-2">
                      Upload QR code e-wallet anda (TNG, GrabPay, Boost, etc.)
                    </p>

                    {qrPreview && (
                      <div className="mt-3 bg-white rounded-lg p-4 border-2 border-primary-300">
                        <p className="text-sm font-medium mb-2">Preview QR Code:</p>
                        <img
                          src={qrPreview}
                          alt="QR Preview"
                          className="max-w-[200px] mx-auto border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={submitting} className="flex-1">
                  {submitting ? "Submitting..." : "Submit Request"}
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

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">Jumlah</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(withdrawal.amount)}
                </p>
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
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">Bank Details</p>
                  <p className="font-medium">{withdrawal.bankName}</p>
                  <p className="text-sm text-gray-600">{withdrawal.bankAccount}</p>
                  <p className="text-sm text-gray-600">{withdrawal.accountHolder}</p>
                </div>
              )}

              {/* QR Code Display */}
              {withdrawal.withdrawalMethod === "qr" && withdrawal.qrCodeUrl && (
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-3 rounded-lg mb-4 border border-blue-200">
                  <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-blue-600" />
                    QR Code E-Wallet Anda
                  </p>
                  <div className="bg-white rounded p-2 border">
                    <img
                      src={withdrawal.qrCodeUrl}
                      alt="QR Code"
                      className="max-w-[150px] mx-auto rounded"
                    />
                  </div>
                </div>
              )}

              {withdrawal.notes && (
                <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-700">Nota Admin:</p>
                  <p className="text-sm text-gray-600">{withdrawal.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
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
            <CardContent className="py-8 text-center text-gray-500">
              Tiada withdrawal request lagi
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {withdrawals.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, withdrawals.length)} of {withdrawals.length}
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
            <div className="flex items-center gap-2 px-3">
              <span className="text-sm font-medium">
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
