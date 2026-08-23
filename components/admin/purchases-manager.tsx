"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ShoppingBag,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Supplier {
  id: number;
  name: string;
}

interface Purchase {
  id: number;
  supplierId: number | null;
  itemName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
  purchaseDate: string;
  receiptUrl: string | null;
  notes: string | null;
  supplier: Supplier | null;
  createdAt: string;
}

export function PurchasesManager() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Purchase | null>(null);
  const [form, setForm] = useState({
    supplierId: "",
    itemName: "",
    quantity: "",
    unit: "pcs",
    unitPrice: "",
    totalPrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchasesRes, suppliersRes] = await Promise.all([
        fetch("/api/admin/purchases"),
        fetch("/api/admin/suppliers"),
      ]);

      if (purchasesRes.ok) setPurchases(await purchasesRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTotal = (qty: string, price: string) => {
    const q = parseFloat(qty) || 0;
    const p = parseFloat(price) || 0;
    return (q * p).toFixed(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/admin/purchases/${editing.id}` : "/api/admin/purchases";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supplierId: form.supplierId ? parseInt(form.supplierId) : null,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        setForm({
          supplierId: "",
          itemName: "",
          quantity: "",
          unit: "pcs",
          unitPrice: "",
          totalPrice: "",
          purchaseDate: new Date().toISOString().split("T")[0],
          notes: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error saving purchase:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Padam rekod belian ini?")) return;
    try {
      const res = await fetch(`/api/admin/purchases/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Error deleting purchase:", error);
    }
  };

  const openEdit = (purchase: Purchase) => {
    setEditing(purchase);
    setForm({
      supplierId: purchase.supplierId?.toString() || "",
      itemName: purchase.itemName,
      quantity: purchase.quantity,
      unit: purchase.unit,
      unitPrice: purchase.unitPrice,
      totalPrice: purchase.totalPrice,
      purchaseDate: purchase.purchaseDate.split("T")[0],
      notes: purchase.notes || "",
    });
    setShowForm(true);
  };

  const filtered = purchases.filter((p) =>
    p.itemName.toLowerCase().includes(search.toLowerCase()) ||
    (p.supplier?.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalSpent = filtered.reduce((sum, p) => sum + parseFloat(p.totalPrice), 0);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-16" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
              <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">{purchases.length}</p>
              <p className="text-xs font-medium text-ink-500">Jumlah Rekod</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <ShoppingBag className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-red-600 tabular-nums">{formatCurrency(totalSpent)}</p>
              <p className="text-xs font-medium text-ink-500">Jumlah Perbelanjaan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Cari belian..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <Button onClick={() => { setEditing(null); setForm({ supplierId: "", itemName: "", quantity: "", unit: "pcs", unitPrice: "", totalPrice: "", purchaseDate: new Date().toISOString().split("T")[0], notes: "" }); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Rekod Belian
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? "Edit Belian" : "Rekod Belian Baru"}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-ink-700">Supplier</label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-ink-200 rounded-lg text-sm"
                  value={form.supplierId}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                >
                  <option value="">Pilih supplier (pilihan)</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Tarikh Belian</label>
                <Input
                  type="date"
                  value={form.purchaseDate}
                  onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-ink-700">Nama Barang *</label>
                <Input
                  value={form.itemName}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Kuantiti *</label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => {
                    const qty = e.target.value;
                    setForm({ ...form, quantity: qty, totalPrice: updateTotal(qty, form.unitPrice) });
                  }}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Unit</label>
                <Input
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Harga Seunit *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => {
                    const price = e.target.value;
                    setForm({ ...form, unitPrice: price, totalPrice: updateTotal(form.quantity, price) });
                  }}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Jumlah</label>
                <Input
                  value={formatCurrency(form.totalPrice || "0")}
                  readOnly
                  className="bg-ink-50"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-ink-700">Nota</label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button type="submit">Simpan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Purchases Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tarikh</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Barang</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Supplier</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Kuantiti</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Harga/Unit</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Jumlah</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-ink-400">
                      Tiada rekod belian dijumpai
                    </td>
                  </tr>
                ) : (
                  filtered.map((purchase) => (
                    <tr key={purchase.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                      <td className="py-3 px-3 text-sm text-ink-600">{formatDate(new Date(purchase.purchaseDate))}</td>
                      <td className="py-3 px-3 text-sm font-medium text-ink-900">{purchase.itemName}</td>
                      <td className="py-3 px-3 text-sm text-ink-600">{purchase.supplier?.name || "-"}</td>
                      <td className="py-3 px-3 text-sm text-right tabular-nums">{purchase.quantity} {purchase.unit}</td>
                      <td className="py-3 px-3 text-sm text-right tabular-nums">{formatCurrency(purchase.unitPrice)}</td>
                      <td className="py-3 px-3 text-sm font-bold text-right tabular-nums">{formatCurrency(purchase.totalPrice)}</td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(purchase)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(purchase.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
