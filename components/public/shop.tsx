"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, CheckCircle, Phone, MapPin, User, MessageSquare, Upload as UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface Dessert {
  id: number;
  name: string;
  description: string | null;
  price: string;
  imageUrl: string | null;
  commissionRate: string;
}

interface PublicShopProps {
  affiliateId: string;
}

export function PublicShop({ affiliateId }: PublicShopProps) {
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [affiliate, setAffiliate] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDessert, setSelectedDessert] = useState<Dessert | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState({
    quantity: "1",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    notes: "",
    receiptUrl: "",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [affiliateId]);

  const fetchData = async () => {
    try {
      const [dessertsRes, affiliateRes, paymentRes] = await Promise.all([
        fetch("/api/desserts"),
        fetch(`/api/public/affiliate/${affiliateId}`),
        fetch("/api/payment-settings")
      ]);
      
      const dessertsData = await dessertsRes.json();
      const affiliateData = await affiliateRes.json();
      const paymentData = await paymentRes.json();
      
      setDesserts(dessertsData);
      setAffiliate(affiliateData);
      setPaymentSettings(paymentData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");

    if (!file) {
      setReceiptFile(null);
      setReceiptPreview("");
      return;
    }

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      setUploadError("Only JPG, PNG, and PDF files are allowed");
      return;
    }

    if (file.size > maxSize) {
      setUploadError("File size must be less than 5MB");
      return;
    }

    setReceiptFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setReceiptPreview("PDF file selected");
    }
  };

  const handleFinalSubmit = async () => {
    if (!selectedDessert) return;

    setSubmitting(true);
    try {
      let receiptData = null;

      if (receiptFile) {
        const reader = new FileReader();
        receiptData = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(receiptFile);
        });
      }

      const res = await fetch("/api/public/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: parseInt(affiliateId),
          dessertId: selectedDessert.id,
          quantity: parseInt(formData.quantity),
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerAddress: formData.customerAddress,
          notes: formData.notes,
          receiptUrl: receiptData || null,
        }),
      });

      if (res.ok) {
        setOrderSuccess(true);
        setSelectedDessert(null);
        setShowPayment(false);
        setReceiptFile(null);
        setReceiptPreview("");
        setFormData({
          quantity: "1",
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          notes: "",
          receiptUrl: "",
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        alert("Gagal submit order. Sila cuba lagi.");
      }
    } catch (error) {
      console.error("Error submitting order:", error);
      alert("Terjadi kesalahan. Sila cuba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedDessert) return 0;
    return parseFloat(selectedDessert.price) * parseInt(formData.quantity || "1");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Affiliate Not Found</h1>
          <p className="text-gray-600">The affiliate link you are looking for does not exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">LODES DESSERTS</h1>
          <p className="text-lg opacity-90">Delicious Desserts, Delivered Fresh</p>
          <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 inline-block">
            <p className="text-sm">
              Recommended by: <span className="font-semibold">{affiliate.name}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {orderSuccess && (
          <Card className="mb-8 border-2 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-green-900 text-lg mb-1">
                    Order Berjaya Disubmit!
                  </h3>
                  <p className="text-green-800 mb-2">
                    Terima kasih atas pesanan anda. Admin akan review dan menghubungi anda tidak lama lagi.
                  </p>
                  <Button
                    onClick={() => setOrderSuccess(false)}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Buat Order Lagi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Form */}
        {selectedDessert && !orderSuccess && !showPayment && (
          <Card className="mb-8 border-2 border-primary-300">
            <CardHeader>
              <CardTitle>Complete Your Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start gap-4">
                    {selectedDessert.imageUrl && (
                      <img
                        src={selectedDessert.imageUrl}
                        alt={selectedDessert.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold">{selectedDessert.name}</h4>
                      <p className="text-sm text-gray-600">{selectedDessert.description}</p>
                      <p className="text-lg font-bold text-primary-600 mt-1">
                        {formatCurrency(selectedDessert.price)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    <ShoppingCart className="h-4 w-4 inline mr-1" />
                    Kuantiti
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Nama Penuh *
                  </label>
                  <Input
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                    placeholder="Contoh: Ahmad bin Abdullah"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    No. Telefon *
                  </label>
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, customerPhone: e.target.value })
                    }
                    placeholder="0123456789"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    <MapPin className="h-4 w-4 inline mr-1" />
                    Alamat Penghantaran
                  </label>
                  <Input
                    value={formData.customerAddress}
                    onChange={(e) =>
                      setFormData({ ...formData, customerAddress: e.target.value })
                    }
                    placeholder="Alamat lengkap untuk penghantaran"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Nota Tambahan
                  </label>
                  <Input
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Sebarang permintaan khas..."
                  />
                </div>

                <div className="bg-primary-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-bold">{formatCurrency(calculateTotal().toString())}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg">
                    <span className="font-bold text-gray-900">Total:</span>
                    <span className="font-bold text-primary-600 text-2xl">
                      {formatCurrency(calculateTotal().toString())}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Proceed to Payment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedDessert(null)}
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Payment Section */}
        {selectedDessert && !orderSuccess && showPayment && paymentSettings && (
          <Card className="mb-8 border-2 border-green-300">
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Total: <span className="font-bold text-2xl text-primary-600">{formatCurrency(calculateTotal().toString())}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {paymentSettings.qrCodeUrl && (
                <div className="bg-white border-2 border-primary-200 rounded-lg p-6">
                  <h3 className="font-semibold mb-4 text-lg">1. Scan QR Code untuk Bayar</h3>
                  <div className="flex justify-center">
                    <img
                      src={paymentSettings.qrCodeUrl}
                      alt="Payment QR Code"
                      className="max-w-[250px] border-2 border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              {paymentSettings.bankName && (
                <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold mb-4 text-lg">
                    {paymentSettings.qrCodeUrl ? "2. Atau Bank Transfer:" : "1. Bank Transfer:"}
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Bank:</span>
                      <span className="font-semibold">{paymentSettings.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Number:</span>
                      <span className="font-semibold">{paymentSettings.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Name:</span>
                      <span className="font-semibold">{paymentSettings.accountHolder}</span>
                    </div>
                  </div>
                </div>
              )}

              {paymentSettings.paymentInstructions && (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">{paymentSettings.paymentInstructions}</p>
                </div>
              )}

              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                <h3 className="font-semibold mb-4 text-lg flex items-center gap-2">
                  <UploadIcon className="h-5 w-5" />
                  {paymentSettings.qrCodeUrl ? (paymentSettings.bankName ? "3." : "2.") : "2."} Upload Payment Receipt
                </h3>
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Upload Receipt (JPG, PNG, or PDF)
                  </label>
                  
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={handleFileChange}
                        className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer
                                 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                                 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700
                                 hover:file:bg-primary-100 hover:border-primary-400
                                 focus:outline-none focus:border-primary-500"
                      />
                    </div>

                    {uploadError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                        {uploadError}
                      </div>
                    )}

                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-xs text-gray-600 space-y-1">
                        <span className="font-semibold block mb-2">📋 Requirements:</span>
                        <span className="block">• Accepted formats: JPG, PNG, PDF</span>
                        <span className="block">• Maximum file size: 5MB</span>
                        <span className="block">• Receipt upload is optional</span>
                      </p>
                    </div>

                    {receiptFile && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-green-900">File Selected</p>
                            <p className="text-xs text-green-700 mt-1">
                              {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {receiptPreview && receiptPreview !== "PDF file selected" && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Preview:</p>
                        <img
                          src={receiptPreview}
                          alt="Receipt Preview"
                          className="max-w-xs border-2 border-gray-300 rounded-lg"
                        />
                      </div>
                    )}

                    {receiptPreview === "PDF file selected" && (
                      <div className="bg-gray-100 border-2 border-gray-300 rounded-lg p-4 text-center">
                        <p className="text-sm text-gray-600">📄 PDF file ready to upload</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleFinalSubmit}
                  disabled={submitting}
                  className="flex-1"
                >
                  {submitting ? "Submitting..." : "Submit Order"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPayment(false)}
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Products Grid */}
        {!selectedDessert && !orderSuccess && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Desserts</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {desserts.map((dessert) => (
                <Card key={dessert.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    {dessert.imageUrl && (
                      <img
                        src={dessert.imageUrl}
                        alt={dessert.name}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <h3 className="font-bold text-lg mb-2">{dessert.name}</h3>
                    <p className="text-sm text-gray-600 mb-4">{dessert.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-2xl font-bold text-primary-600">
                        {formatCurrency(dessert.price)}
                      </span>
                    </div>
                    <Button
                      onClick={() => setSelectedDessert(dessert)}
                      className="w-full"
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Order Now
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm opacity-75">
            © 2024 LODES Desserts. All rights reserved.
          </p>
          <p className="text-xs opacity-50 mt-2">
            This is an affiliate shop powered by {affiliate.name}
          </p>
        </div>
      </div>
    </div>
  );
}
