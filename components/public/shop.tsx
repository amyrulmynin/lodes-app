"use client";

import { useEffect, useState } from "react";
import {
  ShoppingCart,
  CheckCircle,
  Phone,
  MapPin,
  User,
  MessageSquare,
  Upload as UploadIcon,
  CakeSlice,
  Star,
  BadgeCheck,
  Loader2,
} from "lucide-react";
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

interface Review {
  id: number;
  customerName: string;
  rating: number;
  comment: string | null;
  dessertName: string;
}

interface PublicShopProps {
  affiliateId: string;
}

export function PublicShop({ affiliateId }: PublicShopProps) {
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
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
      const [dessertsRes, affiliateRes, paymentRes, reviewsRes] =
        await Promise.all([
          fetch("/api/desserts"),
          fetch(`/api/public/affiliate/${affiliateId}`),
          fetch("/api/payment-settings"),
          fetch("/api/public/reviews"),
        ]);

      const dessertsData = await dessertsRes.json();
      const affiliateData = await affiliateRes.json();
      const paymentData = await paymentRes.json();
      const reviewsData = reviewsRes.ok ? await reviewsRes.json() : [];

      setDesserts(dessertsData);
      setAffiliate(affiliateData);
      setPaymentSettings(paymentData);
      setReviews(Array.isArray(reviewsData) ? reviewsData : []);
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

    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
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
    return (
      parseFloat(selectedDessert.price) * parseInt(formData.quantity || "1")
    );
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-ink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 rounded-xl bg-ink-950 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <CakeSlice className="h-6 w-6 text-primary-400" />
          </div>
          <p className="text-ink-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-dvh bg-ink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            Affiliate Not Found
          </h1>
          <p className="text-ink-500">
            The affiliate link you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-ink-50">
      {/* Hero Header */}
      <div className="bg-ink-950 text-white relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary-500/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-16 h-64 w-64 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 relative">
          <div className="flex items-center gap-3 mb-6">
            <span className="flex items-center justify-center h-11 w-11 rounded-xl bg-primary-500 text-ink-950">
              <CakeSlice className="h-6 w-6" strokeWidth={2} />
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-400">
              Lodes Desserts
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter leading-[1.05] max-w-xl">
            Dessert premium,
            <br />
            <span className="text-primary-400">dihantar segar.</span>
          </h1>
          <p className="mt-4 text-lg text-ink-300 max-w-md">
            Pilih dessert kegemaran anda dan order dalam masa beberapa minit
            sahaja.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-4 py-2">
            <BadgeCheck className="h-4 w-4 text-primary-400" />
            <p className="text-sm">
              Recommended by{" "}
              <span className="font-semibold text-white">
                {affiliate.name}
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Success Message */}
        {orderSuccess && (
          <Card className="mb-8 border-emerald-200 bg-emerald-50 animate-fade-up">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-8 w-8 text-emerald-600 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-emerald-900 text-lg mb-1">
                    Order Berjaya Disubmit!
                  </h3>
                  <p className="text-emerald-800 mb-2">
                    Terima kasih atas pesanan anda. Admin akan review dan
                    menghubungi anda tidak lama lagi.
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
          <Card className="mb-8 animate-fade-up">
            <CardHeader>
              <CardTitle className="text-xl">Complete Your Order</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-5">
                <div className="bg-ink-50 p-4 rounded-xl border border-ink-200/70">
                  <div className="flex items-start gap-4">
                    {selectedDessert.imageUrl && (
                      <img
                        src={selectedDessert.imageUrl}
                        alt={selectedDessert.name}
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                    )}
                    <div className="flex-1">
                      <h4 className="font-bold text-ink-950">
                        {selectedDessert.name}
                      </h4>
                      <p className="text-sm text-ink-500">
                        {selectedDessert.description}
                      </p>
                      <p className="text-lg font-bold text-ink-950 mt-1 tabular-nums">
                        {formatCurrency(selectedDessert.price)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                    <ShoppingCart className="h-4 w-4 text-ink-400" />
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-ink-400" />
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-ink-400" />
                    No. Telefon *
                  </label>
                  <Input
                    value={formData.customerPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerPhone: e.target.value,
                      })
                    }
                    placeholder="0123456789"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-ink-400" />
                    Alamat Penghantaran
                  </label>
                  <Input
                    value={formData.customerAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        customerAddress: e.target.value,
                      })
                    }
                    placeholder="Alamat lengkap untuk penghantaran"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-ink-400" />
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

                <div className="bg-ink-950 text-white rounded-xl p-5">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-ink-300">Subtotal:</span>
                    <span className="font-semibold tabular-nums">
                      {formatCurrency(calculateTotal().toString())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="font-semibold">Total:</span>
                    <span className="font-bold text-2xl text-primary-400 tabular-nums">
                      {formatCurrency(calculateTotal().toString())}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" size="lg" className="flex-1">
                    Proceed to Payment
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
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
        {selectedDessert &&
          !orderSuccess &&
          showPayment &&
          paymentSettings && (
            <Card className="mb-8 animate-fade-up">
              <CardHeader>
                <CardTitle className="text-xl">Payment Details</CardTitle>
                <p className="text-sm text-ink-500 mt-1">
                  Total:{" "}
                  <span className="font-bold text-2xl text-ink-950 tabular-nums">
                    {formatCurrency(calculateTotal().toString())}
                  </span>
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {paymentSettings.qrCodeUrl && (
                  <div className="bg-white border border-ink-200/70 rounded-xl p-6">
                    <h3 className="font-semibold text-ink-950 mb-4 text-lg">
                      1. Scan QR Code untuk Bayar
                    </h3>
                    <div className="flex justify-center">
                      <img
                        src={paymentSettings.qrCodeUrl}
                        alt="Payment QR Code"
                        className="max-w-[250px] border border-ink-200 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {paymentSettings.bankName && (
                  <div className="bg-ink-50 border border-ink-200/70 rounded-xl p-6">
                    <h3 className="font-semibold text-ink-950 mb-4 text-lg">
                      {paymentSettings.qrCodeUrl
                        ? "2. Atau Bank Transfer:"
                        : "1. Bank Transfer:"}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-ink-500">Bank:</span>
                        <span className="font-semibold text-ink-900">
                          {paymentSettings.bankName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-500">Account Number:</span>
                        <span className="font-semibold text-ink-900 tabular-nums">
                          {paymentSettings.accountNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-500">Account Name:</span>
                        <span className="font-semibold text-ink-900">
                          {paymentSettings.accountHolder}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {paymentSettings.paymentInstructions && (
                  <div className="bg-primary-50 border border-primary-200/60 rounded-xl p-4">
                    <p className="text-sm text-ink-700">
                      {paymentSettings.paymentInstructions}
                    </p>
                  </div>
                )}

                <div className="bg-white border border-ink-200/70 rounded-xl p-6">
                  <h3 className="font-semibold text-ink-950 mb-4 text-lg flex items-center gap-2">
                    <UploadIcon className="h-5 w-5 text-ink-400" />
                    {paymentSettings.qrCodeUrl
                      ? paymentSettings.bankName
                        ? "3."
                        : "2."
                      : "2."}{" "}
                    Upload Payment Receipt
                  </h3>
                  <div>
                    <label className="text-sm font-semibold text-ink-800 block mb-2">
                      Upload Receipt (JPG, PNG, or PDF)
                    </label>

                    <div className="space-y-3">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                        onChange={handleFileChange}
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

                      <div className="bg-ink-50 rounded-xl p-4 border border-ink-200/70">
                        <p className="text-xs text-ink-600 space-y-1">
                          <span className="font-semibold block mb-2">
                            Requirements:
                          </span>
                          <span className="block">
                            • Accepted formats: JPG, PNG, PDF
                          </span>
                          <span className="block">
                            • Maximum file size: 5MB
                          </span>
                          <span className="block">
                            • Receipt upload is optional
                          </span>
                        </p>
                      </div>

                      {receiptFile && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5">
                          <div className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-emerald-900">
                                File Selected
                              </p>
                              <p className="text-xs text-emerald-700 mt-1">
                                {receiptFile.name} (
                                {(receiptFile.size / 1024).toFixed(1)} KB)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {receiptPreview &&
                        receiptPreview !== "PDF file selected" && (
                          <div className="mt-3">
                            <p className="text-sm font-semibold text-ink-800 mb-2">
                              Preview:
                            </p>
                            <img
                              src={receiptPreview}
                              alt="Receipt Preview"
                              className="max-w-xs border border-ink-200 rounded-xl"
                            />
                          </div>
                        )}

                      {receiptPreview === "PDF file selected" && (
                        <div className="bg-ink-50 border border-ink-200 rounded-xl p-4 text-center">
                          <p className="text-sm text-ink-600">
                            PDF file ready to upload
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={submitting}
                    size="lg"
                    className="flex-1"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Order"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
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
            <h2 className="text-2xl font-bold tracking-tight text-ink-950 mb-6">
              Our Desserts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {desserts.map((dessert) => (
                <Card
                  key={dessert.id}
                  className="overflow-hidden hover:shadow-lift group"
                >
                  {dessert.imageUrl ? (
                    <div className="h-52 overflow-hidden">
                      <img
                        src={dessert.imageUrl}
                        alt={dessert.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="h-52 bg-ink-100 flex items-center justify-center">
                      <CakeSlice className="h-12 w-12 text-ink-300" />
                    </div>
                  )}
                  <CardContent className="pt-5">
                    <h3 className="font-bold text-lg text-ink-950 mb-1">
                      {dessert.name}
                    </h3>
                    <p className="text-sm text-ink-500 mb-5 line-clamp-2 min-h-[2.5rem]">
                      {dessert.description}
                    </p>
                    <div className="flex justify-between items-center mb-5">
                      <span className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
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

      {/* Testimonials */}
      {!selectedDessert && !orderSuccess && reviews.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-ink-950">
              Apa Kata Customer Kami
            </h2>
            <p className="text-ink-500 mt-1">
              Review jujur daripada pelanggan sebenar
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {reviews.slice(0, 6).map((review) => (
              <Card key={review.id} className="hover:shadow-lift">
                <CardContent className="pt-6">
                  <div className="flex gap-0.5 mb-3">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`h-4 w-4 ${
                          s <= review.rating
                            ? "fill-primary-500 text-primary-500"
                            : "text-ink-200"
                        }`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-ink-700 leading-relaxed mb-4">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                  <div className="flex items-center gap-3 pt-3 border-t border-ink-100">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-primary-400 font-bold text-sm">
                      {review.customerName.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink-950">
                        {review.customerName}
                      </p>
                      <p className="text-xs text-ink-400">
                        {review.dessertName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {/* Footer */}
      <div className="bg-ink-950 text-white py-10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <CakeSlice className="h-5 w-5 text-primary-400" />
            <span className="font-bold tracking-tight">
              Lodes<span className="text-primary-400">.</span>
            </span>
          </div>
          <p className="text-sm text-ink-400">
            &copy; {new Date().getFullYear()} LODES Desserts. All rights
            reserved.
          </p>
          <p className="text-xs text-ink-500 mt-2">
            This is an affiliate shop powered by {affiliate.name}
          </p>
        </div>
      </div>
    </div>
  );
}



