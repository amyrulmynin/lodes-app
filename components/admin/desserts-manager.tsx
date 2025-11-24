"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
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

export function DessertsManager() {
  const [desserts, setDesserts] = useState<Dessert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageUrl: "",
    commissionRate: "10",
  });

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
        setFormData({
          name: "",
          description: "",
          price: "",
          imageUrl: "",
          commissionRate: "10",
        });
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
    setFormData({
      name: "",
      description: "",
      price: "",
      imageUrl: "",
      commissionRate: "10",
    });
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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Desserts</h2>
        <Button onClick={() => {
          setEditingId(null);
          setFormData({
            name: "",
            description: "",
            price: "",
            imageUrl: "",
            commissionRate: "10",
          });
          setShowForm(!showForm);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Dessert
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Dessert" : "Tambah Dessert Baru"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nama</label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <Input
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Harga (RM)</label>
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

                <div>
                  <label className="text-sm font-medium">Komisen (%)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.commissionRate}
                    onChange={(e) =>
                      setFormData({ ...formData, commissionRate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Image URL</label>
                <Input
                  value={formData.imageUrl}
                  onChange={(e) =>
                    setFormData({ ...formData, imageUrl: e.target.value })
                  }
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex gap-2">
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
          <Card key={dessert.id}>
            <CardContent className="pt-6">
              {dessert.imageUrl && (
                <img
                  src={dessert.imageUrl}
                  alt={dessert.name}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="font-bold text-lg">{dessert.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{dessert.description}</p>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-bold text-primary-600">
                  {formatCurrency(dessert.price)}
                </span>
                <span className="text-sm bg-green-100 text-green-700 px-2 py-1 rounded">
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
                  <Edit2 className="h-4 w-4" />
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
    </div>
  );
}
