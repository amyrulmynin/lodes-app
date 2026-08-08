"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, User, Phone, Mail, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";

interface Affiliate {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  bankName: string | null;
  bankAccount: string | null;
  commissionBalance: string;
  createdAt: string;
}

export function AffiliatesManager() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bankName: "",
    bankAccount: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const fetchAffiliates = async () => {
    try {
      const res = await fetch("/api/affiliates");
      if (res.ok) {
        const data = await res.json();
        setAffiliates(data);
      }
    } catch (error) {
      console.error("Error fetching affiliates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setShowForm(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          phone: "",
          bankName: "",
          bankAccount: "",
        });
        fetchAffiliates();
      } else {
        setError(data.error || "Gagal membuat affiliate");
      }
    } catch (error) {
      console.error("Error creating affiliate:", error);
      setError("Ralat semasa membuat affiliate");
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Affiliates</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Affiliate
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Affiliate Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Nama Penuh *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Contoh: Ahmad bin Abdullah"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email *
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contoh@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium block mb-2">
                    Password *
                  </label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    placeholder="Minimum 6 aksara"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium block mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    No. Telefon
                  </label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="0123456789"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Maklumat Bank (Opsional)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      Nama Bank
                    </label>
                    <Input
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder="Contoh: Maybank, CIMB"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium block mb-2">
                      No. Akaun Bank
                    </label>
                    <Input
                      value={formData.bankAccount}
                      onChange={(e) =>
                        setFormData({ ...formData, bankAccount: e.target.value })
                      }
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit">
                  <Plus className="h-4 w-4 mr-2" />
                  Simpan Affiliate
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setError("");
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {affiliates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Tiada affiliate lagi. Klik &quot;Tambah Affiliate&quot; untuk mula.
          </div>
        ) : (
          affiliates.map((affiliate) => (
            <Card key={affiliate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{affiliate.name}</h3>
                      <p className="text-sm text-gray-500">ID: {affiliate.id}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    {affiliate.email}
                  </div>
                  
                  {affiliate.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 text-gray-400" />
                      {affiliate.phone}
                    </div>
                  )}

                  {affiliate.bankName && affiliate.bankAccount && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CreditCard className="h-4 w-4 mr-2 text-gray-400" />
                      {affiliate.bankName} - {affiliate.bankAccount}
                    </div>
                  )}
                </div>

                <div className="bg-green-50 rounded-lg p-3 mb-4">
                  <p className="text-xs text-gray-600 mb-1">Baki Komisen</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(affiliate.commissionBalance)}
                  </p>
                </div>

                <div className="text-xs text-gray-500">
                  Didaftar: {new Date(affiliate.createdAt).toLocaleDateString('ms-MY', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
