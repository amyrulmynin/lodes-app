"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Banknote,
  Search,
  X,
  Calendar,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Salary {
  id: number;
  founderName: string;
  amount: string;
  salaryMonth: string;
  paidAt: string;
  notes: string | null;
  createdAt: string;
}

export function SalaryManager() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [form, setForm] = useState({
    founderName: "",
    amount: "",
    salaryMonth: "",
    paidAt: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    fetchSalaries();
  }, []);

  const fetchSalaries = async () => {
    try {
      const res = await fetch("/api/admin/salary");
      if (res.ok) {
        const data = await res.json();
        setSalaries(data);
      }
    } catch (error) {
      console.error("Error fetching salaries:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/admin/salary/${editing.id}` : "/api/admin/salary";
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
          founderName: "",
          amount: "",
          salaryMonth: "",
          paidAt: new Date().toISOString().split("T")[0],
          notes: "",
        });
        fetchSalaries();
      }
    } catch (error) {
      console.error("Error saving salary:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Padam rekod gaji ini?")) return;
    try {
      const res = await fetch(`/api/admin/salary/${id}`, { method: "DELETE" });
      if (res.ok) fetchSalaries();
    } catch (error) {
      console.error("Error deleting salary:", error);
    }
  };

  const openEdit = (salary: Salary) => {
    setEditing(salary);
    setForm({
      founderName: salary.founderName,
      amount: salary.amount,
      salaryMonth: salary.salaryMonth,
      paidAt: salary.paidAt.split("T")[0],
      notes: salary.notes || "",
    });
    setShowForm(true);
  };

  const filtered = salaries.filter((s) =>
    s.founderName.toLowerCase().includes(search.toLowerCase()) ||
    s.salaryMonth.includes(search)
  );

  const totalPaid = filtered.reduce((sum, s) => sum + parseFloat(s.amount), 0);

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
              <Banknote className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">{salaries.length}</p>
              <p className="text-xs font-medium text-ink-500">Jumlah Rekod</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Banknote className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-red-600 tabular-nums">{formatCurrency(totalPaid)}</p>
              <p className="text-xs font-medium text-ink-500">Jumlah Dibayar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-blue-600 tabular-nums">
                {new Set(salaries.map((s) => s.founderName)).size}
              </p>
              <p className="text-xs font-medium text-ink-500">Bilangan Founder</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Cari founder atau bulan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <Button onClick={() => { setEditing(null); setForm({ founderName: "", amount: "", salaryMonth: "", paidAt: new Date().toISOString().split("T")[0], notes: "" }); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Rekod Gaji
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? "Edit Gaji" : "Rekod Gaji Founder"}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-ink-700">Nama Founder *</label>
                <Input
                  value={form.founderName}
                  onChange={(e) => setForm({ ...form, founderName: e.target.value })}
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
                <label className="text-sm font-medium text-ink-700">Bulan Gaji *</label>
                <Input
                  type="month"
                  value={form.salaryMonth}
                  onChange={(e) => setForm({ ...form, salaryMonth: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Tarikh Bayar</label>
                <Input
                  type="date"
                  value={form.paidAt}
                  onChange={(e) => setForm({ ...form, paidAt: e.target.value })}
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

      {/* Salaries Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Founder</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Bulan</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tarikh Bayar</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Jumlah</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-ink-400">
                      Tiada rekod gaji dijumpai
                    </td>
                  </tr>
                ) : (
                  filtered.map((salary) => (
                    <tr key={salary.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                      <td className="py-3 px-3 text-sm font-medium text-ink-900">{salary.founderName}</td>
                      <td className="py-3 px-3 text-sm text-ink-600">{salary.salaryMonth}</td>
                      <td className="py-3 px-3 text-sm text-ink-600">{formatDate(new Date(salary.paidAt))}</td>
                      <td className="py-3 px-3 text-sm font-bold text-right tabular-nums text-red-600">
                        -{formatCurrency(salary.amount)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(salary)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(salary.id)}>
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
