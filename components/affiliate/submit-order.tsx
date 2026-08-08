"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, CakeSlice, Loader2 } from "lucide-react";
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

export function SubmitOrder() {
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDessert, setSelectedDessert] = useState<Dessert | null>(null);
  const [formData, setFormData] = useState({
    quantity: "1",
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDesserts();
  }, []);

  const fetchDesserts = async () => {
    try {
      const res = await fetch("/api/desserts");
      const data = await res.json();
      setDesserts(data);
    } catch (error) {
      console.error("Error fetching desserts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDessert) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dessertId: selectedDessert.id,
          quantity: parseInt(formData.quantity),
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          customerAddress: formData.customerAddress,
          notes: formData.notes,
        }),
      });

      if (res.ok) {
        alert("Order berjaya disubmit! Admin akan review order anda.");
        setSelectedDessert(null);
        setFormData({
          quantity: "1",
          customerName: "",
          customerPhone: "",
          customerAddress: "",
          notes: "",
        });
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

  const calculateCommission = () => {
    if (!selectedDessert) return 0;
    return calculateTotal() * (parseFloat(selectedDessert.commissionRate) / 100);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-64" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-ink-950">
          Submit New Order
        </h2>
        <p className="text-sm text-ink-500 mt-1">
          Pilih dessert dan isi maklumat customer
        </p>
      </div>

      {!selectedDessert ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {desserts.map((dessert) => (
            <Card
              key={dessert.id}
              className="cursor-pointer overflow-hidden hover:shadow-lift group"
              onClick={() => setSelectedDessert(dessert)}
            >
              {dessert.imageUrl ? (
                <div className="h-44 overflow-hidden">
                  <img
                    src={dessert.imageUrl}
                    alt={dessert.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-44 bg-ink-100 flex items-center justify-center">
                  <CakeSlice className="h-10 w-10 text-ink-300" />
                </div>
              )}
              <CardContent className="pt-5">
                <h3 className="font-bold text-lg text-ink-950 mb-1">
                  {dessert.name}
                </h3>
                <p className="text-sm text-ink-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {dessert.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold tracking-tight text-ink-950 tabular-nums">
                    {formatCurrency(dessert.price)}
                  </span>
                  <span className="text-xs font-semibold bg-primary-100 text-primary-800 px-2.5 py-1 rounded-full">
                    {dessert.commissionRate}% komisen
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-lg">
              Order: {selectedDessert.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
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
                <label className="text-sm font-semibold text-ink-800">
                  Nama Customer
                </label>
                <Input
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
                  Telefon Customer
                </label>
                <Input
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
                  Alamat Penghantaran (Optional)
                </label>
                <Input
                  value={formData.customerAddress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customerAddress: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
                  Nota (Optional)
                </label>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Sebarang maklumat tambahan..."
                />
              </div>

              <div className="bg-ink-950 text-white rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-ink-300">Jumlah:</span>
                  <span className="font-bold text-lg tabular-nums">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-white/10">
                  <span className="text-sm text-ink-300">Komisen Anda:</span>
                  <span className="font-bold text-lg text-primary-400 tabular-nums">
                    {formatCurrency(calculateCommission())}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Submit Order
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedDessert(null)}
                >
                  Pilih Dessert Lain
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
