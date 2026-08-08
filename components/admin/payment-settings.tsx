"use client";

import { useEffect, useState } from "react";
import { CreditCard, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    qrCodeUrl: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    paymentInstructions: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/payment-settings");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFormData({
            qrCodeUrl: data.qrCodeUrl || "",
            bankName: data.bankName || "",
            accountNumber: data.accountNumber || "",
            accountHolder: data.accountHolder || "",
            paymentInstructions: data.paymentInstructions || "",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const res = await fetch("/api/payment-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Payment settings berjaya disimpan!");
      } else {
        alert("Gagal menyimpan settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Terjadi kesalahan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-8 w-8 text-primary-600" />
        <div>
          <h2 className="text-2xl font-bold">Payment Settings</h2>
          <p className="text-sm text-gray-600">
            Setup payment QR code dan bank details untuk customer
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* QR Code Section */}
            <div className="border-b pb-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                QR Code Payment
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    QR Code Image URL
                  </label>
                  <Input
                    value={formData.qrCodeUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, qrCodeUrl: e.target.value })
                    }
                    placeholder="https://example.com/qr-code.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload QR code ke image hosting (Imgur, Cloudinary, etc.) dan paste URL di sini
                  </p>
                </div>

                {formData.qrCodeUrl && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <img
                      src={formData.qrCodeUrl}
                      alt="QR Code Preview"
                      className="max-w-xs border rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "";
                        e.currentTarget.alt = "Invalid image URL";
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Bank Details Section */}
            <div className="border-b pb-6">
              <h3 className="font-semibold mb-4">Bank Account Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Nama Bank
                  </label>
                  <Input
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                    placeholder="Contoh: Maybank"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    Nombor Akaun
                  </label>
                  <Input
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, accountNumber: e.target.value })
                    }
                    placeholder="1234567890"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium block mb-2">
                  Nama Pemegang Akaun
                </label>
                <Input
                  value={formData.accountHolder}
                  onChange={(e) =>
                    setFormData({ ...formData, accountHolder: e.target.value })
                  }
                  placeholder="LODES DESSERTS SDN BHD"
                />
              </div>
            </div>

            {/* Payment Instructions */}
            <div>
              <h3 className="font-semibold mb-4">Arahan Pembayaran</h3>
              
              <div>
                <label className="text-sm font-medium block mb-2">
                  Arahan Tambahan (Opsional)
                </label>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  value={formData.paymentInstructions}
                  onChange={(e) =>
                    setFormData({ ...formData, paymentInstructions: e.target.value })
                  }
                  placeholder="Contoh: Sila upload resit pembayaran selepas membuat bayaran. Kami akan memproses order anda dalam masa 24 jam."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Preview Card */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">Customer Preview</CardTitle>
          <p className="text-sm text-blue-700">
            Ini adalah preview yang customer akan nampak semasa checkout
          </p>
        </CardHeader>
        <CardContent className="bg-white rounded-lg">
          {formData.qrCodeUrl || formData.bankName ? (
            <div className="space-y-4">
              {formData.qrCodeUrl && (
                <div>
                  <p className="font-semibold mb-2">Scan QR Code untuk bayar:</p>
                  <img
                    src={formData.qrCodeUrl}
                    alt="QR Code"
                    className="max-w-[200px] border rounded-lg"
                  />
                </div>
              )}

              {formData.bankName && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold mb-2">Bank Transfer:</p>
                  <div className="text-sm space-y-1">
                    <p><strong>Bank:</strong> {formData.bankName}</p>
                    <p><strong>Account:</strong> {formData.accountNumber}</p>
                    <p><strong>Name:</strong> {formData.accountHolder}</p>
                  </div>
                </div>
              )}

              {formData.paymentInstructions && (
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-700">{formData.paymentInstructions}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Belum ada payment settings. Sila isi form di atas.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
