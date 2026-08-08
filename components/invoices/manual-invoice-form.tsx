"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Download, RotateCcw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  generateManualInvoicePDF,
  type InvoiceItem,
  type InvoicePaymentSettings,
} from "@/lib/invoice-generator";

interface ItemRow {
  name: string;
  price: string;
  quantity: string;
}

const emptyItem: ItemRow = { name: "", price: "", quantity: "1" };

function nextInvoiceNumber(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const rand = Math.floor(100 + Math.random() * 900);
  return `INV-M-${datePart}-${rand}`;
}

export function ManualInvoiceForm() {
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [items, setItems] = useState<ItemRow[]>([{ ...emptyItem }]);
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"accepted" | "pending" | "paid">("accepted");
  const [paymentSettings, setPaymentSettings] =
    useState<InvoicePaymentSettings | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setInvoiceNumber(nextInvoiceNumber());
    setInvoiceDate(new Date().toISOString().split("T")[0]);

    fetch("/api/payment-settings")
      .then((res) => res.json())
      .then((data) => setPaymentSettings(data || null))
      .catch(() => setPaymentSettings(null));
  }, []);

  const updateItem = (index: number, field: keyof ItemRow, value: string) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);

  const removeItem = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const grandTotal = items.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const qty = parseInt(item.quantity) || 0;
    return sum + price * qty;
  }, 0);

  const handleReset = () => {
    setInvoiceNumber(nextInvoiceNumber());
    setInvoiceDate(new Date().toISOString().split("T")[0]);
    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setItems([{ ...emptyItem }]);
    setNotes("");
    setStatus("accepted");
  };

  const validate = (): string | null => {
    if (!invoiceNumber.trim()) return "No. invoice diperlukan";
    if (!invoiceDate) return "Tarikh invoice diperlukan";
    if (!customerName.trim()) return "Nama customer diperlukan";
    if (!customerPhone.trim()) return "No. telefon customer diperlukan";

    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length === 0) return "Sekurang-kurangnya satu item diperlukan";

    for (const item of validItems) {
      const price = parseFloat(item.price);
      const qty = parseInt(item.quantity);
      if (isNaN(price) || price <= 0) return `Harga item "${item.name}" tidak sah`;
      if (isNaN(qty) || qty <= 0) return `Kuantiti item "${item.name}" tidak sah`;
    }

    return null;
  };

  const handleGenerate = () => {
    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    setGenerating(true);
    try {
      const invoiceItems: InvoiceItem[] = items
        .filter((i) => i.name.trim())
        .map((i) => ({
          name: i.name.trim(),
          price: parseFloat(i.price),
          quantity: parseInt(i.quantity),
        }));

      generateManualInvoicePDF(
        {
          invoiceNumber: invoiceNumber.trim(),
          invoiceDate,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim() || undefined,
          items: invoiceItems,
          notes: notes.trim() || undefined,
          status,
        },
        paymentSettings
      );
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Gagal menjana invoice. Sila cuba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Buat Invoice Manual</span>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">No. Invoice</label>
            <Input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-M-20260809-123"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Tarikh</label>
            <Input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "accepted" | "pending" | "paid")
              }
              className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <option value="accepted">DISAHKAN</option>
              <option value="paid">DIBAYAR</option>
              <option value="pending">MENUNGGU PENGESAHAN</option>
            </select>
          </div>
        </div>

        {/* Customer info */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-700 border-b pb-2">
            Maklumat Customer
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nama Customer *</label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama penuh customer"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">No. Telefon *</label>
              <Input
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="0123456789"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Alamat</label>
            <textarea
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Alamat penghantaran (optional)"
              rows={2}
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            />
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-semibold text-gray-700">Item Pesanan</h3>
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" />
              Tambah Item
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-2 items-center"
              >
                <div className="col-span-12 sm:col-span-6">
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(index, "name", e.target.value)}
                    placeholder={`Nama item ${index + 1} *`}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.price}
                    onChange={(e) => updateItem(index, "price", e.target.value)}
                    placeholder="Harga"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(index, "quantity", e.target.value)
                    }
                    placeholder="Kuantiti"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1 text-sm font-medium text-gray-700 text-right">
                  {formatCurrency(
                    (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 0)
                  )}
                </div>
                <div className="col-span-1 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2 border-t">
            <div className="text-right">
              <p className="text-sm text-gray-500">Jumlah Keseluruhan</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatCurrency(grandTotal)}
              </p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nota (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: Penghantaran pada hari Sabtu, bayaran tunai semasa pickup"
            rows={2}
            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />
        </div>

        {/* Generate button */}
        <Button
          size="lg"
          className="w-full"
          onClick={handleGenerate}
          disabled={generating}
        >
          <Download className="h-5 w-5 mr-2" />
          {generating ? "Menjana PDF..." : "Generate Invoice PDF"}
        </Button>
      </CardContent>
    </Card>
  );
}
