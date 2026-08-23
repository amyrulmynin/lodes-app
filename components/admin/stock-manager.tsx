"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Package,
  Trash2,
  ScanLine,
  Loader2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Ingredient {
  id: number;
  name: string;
  unit: string;
  currentStock: string;
  minStockLevel: string;
  costPerUnit: string | null;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  unit: string;
  price: number;
}

export function StockManager() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    unit: "pcs",
    currentStock: "",
    minStockLevel: "",
    costPerUnit: "",
  });
  const [adjusting, setAdjusting] = useState<number | null>(null);
  const [adjustQty, setAdjustQty] = useState("");

  // Receipt OCR
  const [receiptImage, setReceiptImage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [receiptError, setReceiptError] = useState("");

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const res = await fetch("/api/admin/stock");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", ...form }),
      });
      if (res.ok) {
        setShowForm(false);
        setForm({ name: "", unit: "pcs", currentStock: "", minStockLevel: "", costPerUnit: "" });
        fetchStock();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdjust = async (ingredientId: number, sign: 1 | -1) => {
    const qty = parseFloat(adjustQty);
    if (isNaN(qty) || qty <= 0) {
      alert("Masukkan kuantiti yang sah");
      return;
    }
    try {
      const res = await fetch("/api/admin/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "adjust",
          ingredientId,
          quantity: qty * sign,
          type: sign > 0 ? "restock" : "usage",
        }),
      });
      if (res.ok) {
        setAdjusting(null);
        setAdjustQty("");
        fetchStock();
      } else {
        const d = await res.json();
        alert(d.error || "Gagal");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Padam bahan ini?")) return;
    await fetch(`/api/admin/stock?id=${id}`, { method: "DELETE" });
    fetchStock();
  };

  const handleReceiptFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setReceiptImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleScanReceipt = async () => {
    if (!receiptImage) return;
    setScanning(true);
    setReceiptError("");
    setReceipt(null);
    try {
      const res = await fetch("/api/admin/stock/receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: receiptImage }),
      });
      const data = await res.json();
      if (res.ok) {
        setReceipt(data.receipt);
      } else {
        setReceiptError(data.error || "Gagal membaca resit");
      }
    } catch {
      setReceiptError("Ralat rangkaian");
    } finally {
      setScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-950">
            Stok Bahan
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            {items.length} bahan di dalam stok
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Bahan
        </Button>
      </div>

      {/* Receipt OCR (AI) */}
      <Card className="bg-ink-950 border-ink-950 text-white relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-44 w-44 rounded-full bg-primary-500/20 blur-2xl pointer-events-none"
        />
        <CardHeader className="relative">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-ink-950">
              <ScanLine className="h-5 w-5" />
            </span>
            Scan Resit Pembelian (AI)
          </CardTitle>
          <p className="text-sm text-ink-300">
            Upload gambar resit — AI akan baca item & harga secara automatik
          </p>
        </CardHeader>
        <CardContent className="relative space-y-4">
          <input
            type="file"
            accept="image/*"
            onChange={handleReceiptFile}
            className="w-full px-4 py-3 border-2 border-dashed border-white/20 rounded-xl cursor-pointer bg-white/5 text-sm text-white
                     file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                     file:text-sm file:font-semibold file:bg-primary-500 file:text-ink-950
                     hover:border-white/40 transition-colors"
          />

          {receiptImage && (
            <div className="flex items-start gap-4">
              <img
                src={receiptImage}
                alt="Resit"
                className="w-32 rounded-xl border border-white/20"
              />
              <Button onClick={handleScanReceipt} disabled={scanning}>
                {scanning ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    AI membaca...
                  </>
                ) : (
                  <>
                    <ScanLine className="h-4 w-4 mr-2" />
                    Baca Resit
                  </>
                )}
              </Button>
            </div>
          )}

          {receiptError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
              {receiptError}
            </div>
          )}

          {receipt && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5 animate-fade-up">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-white">
                    {receipt.store || "Kedai"}
                  </p>
                  {receipt.date && (
                    <p className="text-xs text-ink-400">{receipt.date}</p>
                  )}
                </div>
                <p className="font-bold text-primary-400 tabular-nums">
                  RM {Number(receipt.total || 0).toFixed(2)}
                </p>
              </div>
              <div className="space-y-2">
                {(receipt.items || []).map((item: ReceiptItem, i: number) => (
                  <div
                    key={i}
                    className="flex justify-between text-sm border-b border-white/5 pb-2 last:border-0"
                  >
                    <span className="text-ink-200">
                      {item.name} × {item.quantity} {item.unit}
                    </span>
                    <span className="text-white font-medium tabular-nums">
                      RM {Number(item.price).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-400 mt-4">
                Semak item di atas, kemudian masukkan ke stok melalui butang +
                pada bahan berkaitan.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create form */}
      {showForm && (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-lg">Tambah Bahan Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">Nama *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Contoh: Pisang"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">Unit</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  className="flex h-11 w-full rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm cursor-pointer"
                >
                  <option value="pcs">pcs</option>
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">Stok Awal</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.currentStock}
                  onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
                  Paras Minimum (alert)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.minStockLevel}
                  onChange={(e) => setForm({ ...form, minStockLevel: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="flex gap-2 md:col-span-2">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Simpan
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stock list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const current = parseFloat(item.currentStock);
          const min = parseFloat(item.minStockLevel);
          const low = min > 0 && current <= min;
          const pct = min > 0 ? Math.min(100, (current / (min * 3)) * 100) : 100;
          return (
            <Card key={item.id} className={`hover:shadow-lift ${low ? "border-amber-300" : ""}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        low
                          ? "bg-amber-100 text-amber-600"
                          : "bg-ink-100 text-ink-600"
                      }`}
                    >
                      <Package className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-ink-950">{item.name}</h3>
                      <p className="text-xs text-ink-400">{item.unit}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-ink-300 hover:text-red-500 transition-colors cursor-pointer"
                    aria-label="Padam"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-baseline gap-2 mb-2">
                  <p className="text-3xl font-bold tracking-tight text-ink-950 tabular-nums">
                    {current.toFixed(1)}
                  </p>
                  <p className="text-sm text-ink-500">{item.unit}</p>
                  {low && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="h-3 w-3" /> Rendah
                    </span>
                  )}
                </div>

                {/* Stock bar */}
                <div className="h-2 bg-ink-100 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      low ? "bg-amber-500" : "bg-primary-500"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {adjusting === item.id ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      placeholder="Kuantiti"
                      className="h-9"
                    />
                    <Button size="sm" onClick={() => handleAdjust(item.id, 1)}>
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAdjust(item.id, -1)}
                    >
                      <TrendingDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setAdjusting(null);
                        setAdjustQty("");
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setAdjusting(item.id)}
                  >
                    Laras Stok
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}

        {items.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Package className="h-10 w-10 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-400">
                Tiada bahan lagi. Klik &quot;Tambah Bahan&quot; untuk mula.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
