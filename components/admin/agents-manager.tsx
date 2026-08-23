"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Agent {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  isActive: number;
  createdAt: string;
}

export function AgentsManager() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/agents");
      if (res.ok) {
        const data = await res.json();
        setAgents(data);
      }
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editing ? `/api/admin/agents/${editing.id}` : "/api/admin/agents";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setShowForm(false);
        setEditing(null);
        setForm({ name: "", phone: "", email: "", address: "", notes: "" });
        fetchAgents();
      }
    } catch (error) {
      console.error("Error saving agent:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Padam agent ini?")) return;
    try {
      const res = await fetch(`/api/admin/agents/${id}`, { method: "DELETE" });
      if (res.ok) fetchAgents();
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  };

  const openEdit = (agent: Agent) => {
    setEditing(agent);
    setForm({
      name: agent.name,
      phone: agent.phone || "",
      email: agent.email || "",
      address: agent.address || "",
      notes: agent.notes || "",
    });
    setShowForm(true);
  };

  const filtered = agents.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.phone || "").includes(search) ||
    (a.email || "").toLowerCase().includes(search.toLowerCase())
  );

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
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Cari agent..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-11"
          />
        </div>
        <Button onClick={() => { setEditing(null); setForm({ name: "", phone: "", email: "", address: "", notes: "" }); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Agent
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{editing ? "Edit Agent" : "Tambah Agent Baru"}</h3>
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-ink-700">Nama *</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Telefon</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Email</label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink-700">Alamat</label>
                <Input
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
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

      {/* Agents Table */}
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-ink-100">
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Nama</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Telefon</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Email</th>
                  <th className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Status</th>
                  <th className="text-right py-3 px-3 text-xs font-semibold uppercase tracking-wider text-ink-400">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-ink-400">
                      Tiada agent dijumpai
                    </td>
                  </tr>
                ) : (
                  filtered.map((agent) => (
                    <tr key={agent.id} className="border-b border-ink-100 last:border-0 hover:bg-ink-50">
                      <td className="py-3 px-3 text-sm font-medium text-ink-900">{agent.name}</td>
                      <td className="py-3 px-3 text-sm text-ink-600">{agent.phone || "-"}</td>
                      <td className="py-3 px-3 text-sm text-ink-600">{agent.email || "-"}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          agent.isActive ? "bg-emerald-50 text-emerald-700" : "bg-ink-100 text-ink-500"
                        }`}>
                          {agent.isActive ? "Aktif" : "Tidak Aktif"}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(agent)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(agent.id)}>
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
