"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, CakeSlice } from "lucide-react";
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
  isActive: number;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  commissionRate: "10",
};

export function DessertsManager() {
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

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
    try {
      const url = editingId ? `/api/desserts/${editingId}` : "/api/desserts";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingId(null);
        setFormData(emptyForm);
        fetchDesserts();
      }
    } catch (error) {
      console.error("Error saving dessert:", error);
    }
  };

  const handleEdit = (dessert: Dessert) => {
    setEditingId(dessert.id);
    setFormData({
      name: dessert.name,
      description: dessert.description || "",
      price: dessert.price,
      imageUrl: dessert.imageUrl || "",
      commissionRate: dessert.commissionRate,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Adakah anda pasti mahu memadam dessert ini?")) return;

    try {
      await fetch(`/api/desserts/${id}`, { method: "DELETE" });
      fetchDesserts();
    } catch (error) {
      console.error("Error deleting dessert:", error);
    }
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-950">
            Manage Desserts
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Tambah dan kemaskini menu dessert beserta kadar komisen
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingId(null);
            setFormData(emptyForm);
            setShowForm(!showForm);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah Dessert
        </Button>
      </div>

      {showForm && (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-lg">
              {editingId ? "Edit Dessert" : "Tambah Dessert Baru"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
                  Nama
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
                  Deskripsi
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800">
                    Harga (RM)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800">
                    Komisen (%)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commissionRate: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-ink-800">
                  Image URL
                </label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit">
                  {editingId ? "Update" : "Simpan"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {desserts.map((dessert) => (
          <Card
            key={dessert.id}
            className="overflow-hidden hover:shadow-lift group"
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
              <h3 className="font-bold text-lg text-ink-950">{dessert.name}</h3>
              <p className="text-sm text-ink-500 mt-1 line-clamp-2 min-h-[2.5rem]">
                {dessert.description}
              </p>
              <div className="flex justify-between items-center mt-4 mb-4">
                <span className="text-xl font-bold tracking-tight text-ink-950 tabular-nums">
                  {formatCurrency(dessert.price)}
                </span>
                <span className="text-xs font-semibold bg-primary-100 text-primary-800 px-2.5 py-1 rounded-full">
                  {dessert.commissionRate}% komisen
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleEdit(dessert)}
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(dessert.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {desserts.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <CakeSlice className="h-10 w-10 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-400">
              Tiada dessert lagi. Klik &quot;Tambah Dessert&quot; untuk mula.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
