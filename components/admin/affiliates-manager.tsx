"use client";

import { useEffect, useState } from "react";
import { Plus, User, Phone, Mail, CreditCard, Users } from "lucide-react";
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

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  bankName: "",
  bankAccount: "",
};

export function AffiliatesManager() {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
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
        setFormData(emptyForm);
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
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-56" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-950">
            Manage Affiliates
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            Daftar dan pantau akaun affiliate anda
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Affiliate
        </Button>
      </div>

      {showForm && (
        <Card className="animate-fade-up">
          <CardHeader>
            <CardTitle className="text-lg">Tambah Affiliate Baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div
                  role="alert"
                  className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
                >
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                    <User className="h-4 w-4 text-ink-400" />
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                    <Mail className="h-4 w-4 text-ink-400" />
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
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800">
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

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-ink-400" />
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

              <div className="border-t border-ink-100 pt-5">
                <h3 className="text-sm font-semibold text-ink-800 mb-4 flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-ink-400" />
                  Maklumat Bank (Opsional)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink-800">
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

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-ink-800">
                      No. Akaun Bank
                    </label>
                    <Input
                      value={formData.bankAccount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bankAccount: e.target.value,
                        })
                      }
                      placeholder="1234567890"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
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
          <Card className="col-span-full">
            <CardContent className="py-12 text-center">
              <Users className="h-10 w-10 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-400">
                Tiada affiliate lagi. Klik &quot;Tambah Affiliate&quot; untuk
                mula.
              </p>
            </CardContent>
          </Card>
        ) : (
          affiliates.map((affiliate) => (
            <Card key={affiliate.id} className="hover:shadow-lift">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-12 w-12 rounded-xl bg-ink-950 flex items-center justify-center text-primary-400 font-bold text-lg">
                    {affiliate.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-ink-950">{affiliate.name}</h3>
                    <p className="text-xs text-ink-400">ID: {affiliate.id}</p>
                  </div>
                </div>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center text-sm text-ink-600">
                    <Mail className="h-4 w-4 mr-2 text-ink-300" />
                    {affiliate.email}
                  </div>

                  {affiliate.phone && (
                    <div className="flex items-center text-sm text-ink-600">
                      <Phone className="h-4 w-4 mr-2 text-ink-300" />
                      {affiliate.phone}
                    </div>
                  )}

                  {affiliate.bankName && affiliate.bankAccount && (
                    <div className="flex items-center text-sm text-ink-600">
                      <CreditCard className="h-4 w-4 mr-2 text-ink-300" />
                      {affiliate.bankName} - {affiliate.bankAccount}
                    </div>
                  )}
                </div>

                <div className="bg-primary-50 border border-primary-200/60 rounded-xl p-4 mb-4">
                  <p className="text-xs font-medium text-ink-500 mb-1">
                    Baki Komisen
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                    {formatCurrency(affiliate.commissionBalance)}
                  </p>
                </div>

                <p className="text-xs text-ink-400">
                  Didaftar:{" "}
                  {new Date(affiliate.createdAt).toLocaleDateString("ms-MY", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
