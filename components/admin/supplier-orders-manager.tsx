"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Truck,
  Search,
  X,
  Package,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Supplier {
  id: number;
  name: string;
}

interface SupplierOrderItem {
  id?: number;
  itemName: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  totalPrice: string;
}

interface SupplierOrder {
  id: number;
  supplierId: number;
  orderNumber: string;
  totalAmount: string;
  status: "draft" | "sent" | "received" | "cancelled";
  orderDate: string;
  expectedDate: string | null;
  receivedDate: string | null;
  notes: string | null;
  supplier: Supplier;
  items: SupplierOrderItem[];
  createdAt: string;
}

const statusLabels: Record<string, string> = {
  draft: "Draf",
  sent: "Dihantar",
  received: "Diterima",
  cancelled: "Dibatalkan",
};

const statusIcons: Record<string, any> = {
  draft: Clock,
  sent: Package,
  received: CheckCircle,
  cancelled: XCircle,
};

const statusStyles: Record<string, string> = {
  draft: "bg-ink-100 text-ink-600",
  sent: "bg-blue-50 text-blue-700",
  received: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

export function SupplierOrdersManager() {
  const [orders, setOrders] = useState<SupplierOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    orderNumber: "",
    expectedDate: "",
    notes: "",
    items: [{ itemName: "", quantity: "", unit: "pcs", unitPrice: "", totalPrice: "" }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        fetch("/api/admin/supplier-orders"),
        fetch("/api/admin/suppliers"),
      ]);

      if (ordersRes.ok) setOrders(await ordersRes.json());
      if (suppliersRes.ok) setSuppliers(await suppliersRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    setForm({
      ...form,
      items: [...form.items, { itemName: "", quantity: "", unit: "pcs", unitPrice: "", totalPrice: "" }],
    });
  };

  const removeItem = (index: number) => {
    setForm({
      ...form,
      items: form.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === "quantity" || field === "unitPrice") {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const price = parseFloat(newItems[index].unitPrice) || 0;
      newItems[index].totalPrice = (qty * price).toFixed(2);
    }

    setForm({ ...form, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/supplier-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setForm({
          supplierId: "",
          orderNumber: "",
          expectedDate: "",
          notes: "",
          items: [{ itemName: "", quantity: "", unit: "pcs", unitPrice: "", totalPrice: "" }],
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/supplier-orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, receivedDate: status === "received" ? new Date().toISOString() : null }),
      });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Padam order ini?")) return;
    try {
      const res = await fetch(`/api/admin/supplier-orders/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const filtered = orders.filter((o) =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.supplier?.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalAmount = filtered.reduce((sum, o) => sum + parseFloat(o.totalAmount), 0);

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
              <Package className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">{orders.length}</p>
              <p className="text-xs font-medium text-ink-500">Jumlah Order</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">{formatCurrency(totalAmount)}</p>
              <p className="text-xs font-medium text-ink-500">Jumlah Nilai</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-blue-600 tabular-nums">
                {orders.filter((o) => o.status === "sent").length}
              </p>
              <p className="text-xs font-medium text-ink-500">Menunggu Terima</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Cari order..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Order Baru
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Order Baru kepada Supplier</h3>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-ink-700">Supplier *</label>
                  <select
                    className="w-full mt-1 px-3 py-2 border border-ink-200 rounded-lg text-sm"
                    value={form.supplierId}
                    onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                    required
                  >
                    <option value="">Pilih supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700">No. Order *</label>
                  <Input
                    value={form.orderNumber}
                    onChange={(e) => setForm({ ...form, orderNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700">Tarikh Dijangka</label>
                  <Input
                    type="date"
                    value={form.expectedDate}
                    onChange={(e) => setForm({ ...form, expectedDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-ink-700">Nota</label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  />
                </div>
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-ink-700">Barangan</label>
                  <Button type="button" size="sm" variant="outline" onClick={addItem}>
                    <Plus className="h-3 w-3 mr-1" /> Tambah Item
                  </Button>
                </div>
                {form.items.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 mb-2 items-end">
                    <div className="col-span-4">
                      <Input
                        placeholder="Nama barang"
                        value={item.itemName}
                        onChange={(e) => updateItem(index, "itemName", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Kuantiti"
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Unit"
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Harga/unit"
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-span-1">
                      <p className="text-sm font-semibold text-ink-900 py-2">{formatCurrency(item.totalPrice || "0")}</p>
                    </div>
                    <div className="col-span-1">
                      {form.items.length > 1 && (
                        <Button type="button" size="sm" variant="outline" onClick={() => removeItem(index)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="text-right text-sm font-bold text-ink-950">
                  Jumlah: {formatCurrency(form.items.reduce((sum, i) => sum + parseFloat(i.totalPrice || "0"), 0).toFixed(2))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Simpan Order</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Orders Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">No. Order</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Supplier</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tarikh</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Jumlah</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Status</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-ink-400">
                      Tiada order dijumpai
                    </td>
                  </tr>
                ) : (
                  filtered.map((order) => {
                    const StatusIcon = statusIcons[order.status];
                    return (
                      <tr key={order.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                        <td className="py-3 px-3 text-sm font-medium text-ink-900">{order.orderNumber}</td>
                        <td className="py-3 px-3 text-sm text-ink-600">{order.supplier?.name || "-"}</td>
                        <td className="py-3 px-3 text-sm text-ink-600">{formatDate(new Date(order.orderDate))}</td>
                        <td className="py-3 px-3 text-sm font-bold text-right tabular-nums">{formatCurrency(order.totalAmount)}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[order.status]}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusLabels[order.status]}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex justify-end gap-2">
                            {order.status === "draft" && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "sent")}>
                                Hantar
                              </Button>
                            )}
                            {order.status === "sent" && (
                              <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "received")}>
                                Terima
                              </Button>
                            )}
                            <Button size="sm" variant="outline" onClick={() => handleDelete(order.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
