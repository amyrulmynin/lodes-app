"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Search,
  X,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

interface CashFlowEntry {
  id: number;
  type: "in" | "out";
  category: string;
  description: string;
  amount: string;
  referenceId: number | null;
  referenceType: string | null;
  flowDate: string;
  createdAt: string;
}

const categoryIn = ["Jualan", "Pelaburan", "Pinjaman", "Lain-lain"];
const categoryOut = ["Belian Stok", "Gaji", "Sewa", "Utiliti", "Pengangkutan", "Lain-lain"];

export function CashFlowManager() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "in" | "out">("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<CashFlowEntry | null>(null);
  const [form, setForm] = useState({
    type: "in" as "in" | "out",
    category: "",
    description: "",
    amount: "",
    flowDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchCashFlow();
  }, []);

  const fetchCashFlow = async () => {
    try {
      const res = await fetch("/api/admin/cash-flow");
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (error) {
      console.error("Error fetching cash flow:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/admin/cash-flow/${editing.id}` : "/api/admin/cash-flow";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        setForm({
          type: "in",
          category: "",
          description: "",
          amount: "",
          flowDate: new Date().toISOString().split("T")[0],
        });
        fetchCashFlow();
      }
    } catch (error) {
      console.error("Error saving entry:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Padam rekod ini?")) return;
    try {
      const res = await fetch(`/api/admin/cash-flow/${id}`, { method: "DELETE" });
      if (res.ok) fetchCashFlow();
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const openEdit = (entry: CashFlowEntry) => {
    setEditing(entry);
    setForm({
      type: entry.type,
      category: entry.category,
      description: entry.description,
      amount: entry.amount,
      flowDate: entry.flowDate.split("T")[0],
    });
    setShowForm(true);
  };

  const filtered = entries.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
  });

  const totalIn = entries.filter((e) => e.type === "in").reduce((s, e) => s + parseFloat(e.amount), 0);
  const totalOut = entries.filter((e) => e.type === "out").reduce((s, e) => s + parseFloat(e.amount), 0);
  const balance = totalIn - totalOut;

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
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink-100 text-ink-600">
              <ArrowLeftRight className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">{entries.length}</p>
              <p className="text-xs font-medium text-ink-500">Jumlah Rekod</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 tabular-nums">{formatCurrency(totalIn)}</p>
              <p className="text-xs font-medium text-ink-500">Duit Masuk</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <TrendingDown className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-red-600 tabular-nums">{formatCurrency(totalOut)}</p>
              <p className="text-xs font-medium text-ink-500">Duit Keluar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${balance >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"}`}>
              <ArrowLeftRight className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className={`text-2xl font-bold tracking-tight tabular-nums ${balance >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(balance)}
              </p>
              <p className="text-xs font-medium text-ink-500">Baki</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Semua ({entries.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "in" ? "default" : "outline"}
            onClick={() => setFilter("in")}
          >
            Masuk ({entries.filter((e) => e.type === "in").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "out" ? "default" : "outline"}
            onClick={() => setFilter("out")}
          >
            Keluar ({entries.filter((e) => e.type === "out").length})
          </Button>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <Input
              placeholder="Cari..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-11"
            />
          </div>
          <Button onClick={() => { setEditing(null); setForm({ type: "in", category: "", description: "", amount: "", flowDate: new Date().toISOString().split("T")[0] }); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Rekod
          </Button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? "Edit Rekod" : "Rekod Duit Masuk/Keluar"}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-ink-700">Jenis *</label>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    variant={form.type === "in" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, type: "in", category: "" })}
                    className="flex-1"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Masuk
                  </Button>
                  <Button
                    type="button"
                    variant={form.type === "out" ? "default" : "outline"}
                    onClick={() => setForm({ ...form, type: "out", category: "" })}
                    className="flex-1"
                  >
                    <ArrowDownRight className="h-4 w-4 mr-2" />
                    Keluar
                  </Button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Kategori *</label>
                <select
                  className="w-full mt-1 px-3 py-2 border border-ink-200 rounded-lg text-sm"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">Pilih kategori</option>
                  {(form.type === "in" ? categoryIn : categoryOut).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-ink-700">Deskripsi *</label>
                <Input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Jumlah (RM) *</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Tarikh</label>
                <Input
                  type="date"
                  value={form.flowDate}
                  onChange={(e) => setForm({ ...form, flowDate: e.target.value })}
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

      {/* Cash Flow Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tarikh</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Jenis</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Kategori</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Deskripsi</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Jumlah</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-ink-400">
                      Tiada rekod dijumpai
                    </td>
                  </tr>
                ) : (
                  filtered.map((entry) => (
                    <tr key={entry.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                      <td className="py-3 px-3 text-sm text-ink-600 whitespace-nowrap">
                        {formatDate(new Date(entry.flowDate))}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            entry.type === "in"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          {entry.type === "in" ? (
                            <>
                              <ArrowUpRight className="h-3 w-3" /> Masuk
                            </>
                          ) : (
                            <>
                              <ArrowDownRight className="h-3 w-3" /> Keluar
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-sm text-ink-600">{entry.category}</td>
                      <td className="py-3 px-3 text-sm text-ink-700">{entry.description}</td>
                      <td className="py-3 px-3 text-sm font-bold text-right tabular-nums">
                        <span className={entry.type === "in" ? "text-emerald-600" : "text-red-600"}>
                          {entry.type === "in" ? "+" : "-"}{formatCurrency(entry.amount)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(entry)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(entry.id)}>
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
