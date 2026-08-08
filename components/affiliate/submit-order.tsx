"use client";

import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";
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
    return parseFloat(selectedDessert.price) * parseInt(formData.quantity || "1");
  };

  const calculateCommission = () => {
    if (!selectedDessert) return 0;
    return calculateTotal() * (parseFloat(selectedDessert.commissionRate) / 100);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Submit New Order</h2>

      {!selectedDessert ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {desserts.map((dessert) => (
            <Card
              key={dessert.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedDessert(dessert)}
            >
              <CardContent className="pt-6">
                {dessert.imageUrl && (
                  <img
                    src={dessert.imageUrl}
                    alt={dessert.name}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="font-bold text-lg mb-2">{dessert.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{dessert.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(dessert.price)}
                  </span>
                  <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
                    {dessert.commissionRate}% komisen
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Order: {selectedDessert.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Kuantiti</label>
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
                <label className="text-sm font-medium">Nama Customer</label>
                <Input
                  value={formData.customerName}
                  onChange={(e) =>
                    setFormData({ ...formData, customerName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Telefon Customer</label>
                <Input
                  value={formData.customerPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, customerPhone: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Alamat Penghantaran (Optional)</label>
                <Input
                  value={formData.customerAddress}
                  onChange={(e) =>
                    setFormData({ ...formData, customerAddress: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nota (Optional)</label>
                <Input
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Sebarang maklumat tambahan..."
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Jumlah:</span>
                  <span className="font-bold">{formatCurrency(calculateTotal())}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Komisen Anda:</span>
                  <span className="font-bold">{formatCurrency(calculateCommission())}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {submitting ? "Submitting..." : "Submit Order"}
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
