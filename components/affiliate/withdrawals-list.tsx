"use client";

import { useEffect, useState } from "react";
import { DollarSign, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateCommissionStatementPDF } from "@/lib/pdf-generator";

interface Withdrawal {
  id: number;
  amount: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  status: string;
  requestedAt: Date;
  notes: string | null;
}

export function WithdrawalsList() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bankName: "",
    bankAccount: "",
    accountHolder: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
    fetchProfile();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch("/api/withdrawals");
      const data = await res.json();
      setWithdrawals(data);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);
      if (data.bankName && data.bankAccount) {
        setFormData((prev) => ({
          ...prev,
          bankName: data.bankName,
          bankAccount: data.bankAccount,
          accountHolder: data.name,
        }));
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(formData.amount);

    if (amount < 10) {
      alert("Minimum withdrawal adalah RM10");
      return;
    }

    if (profile && parseFloat(profile.commissionBalance) < amount) {
      alert("Balance tidak mencukupi");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        alert("Withdrawal request berjaya disubmit!");
        setShowForm(false);
        setFormData({
          amount: "",
          bankName: formData.bankName,
          bankAccount: formData.bankAccount,
          accountHolder: formData.accountHolder,
        });
        fetchWithdrawals();
        fetchProfile();
      } else {
        const error = await res.json();
        alert(error.error || "Gagal submit withdrawal");
      }
    } catch (error) {
      console.error("Error submitting withdrawal:", error);
      alert("Terjadi kesalahan. Sila cuba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = (withdrawal: Withdrawal) => {
    if (!profile) {
      alert("Profile data tidak tersedia");
      return;
    }

    generateCommissionStatementPDF(withdrawal, {
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      commissionBalance: profile.commissionBalance,
    });
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Withdrawals</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          <DollarSign className="h-4 w-4 mr-2" />
          Request Withdrawal
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Request Withdrawal</CardTitle>
            <p className="text-sm text-gray-600">
              Balance tersedia: {formatCurrency(profile?.commissionBalance || 0)}
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Jumlah (RM)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="10"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="Minimum RM10"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nama Bank</label>
                <Input
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData({ ...formData, bankName: e.target.value })
                  }
                  placeholder="Contoh: Maybank"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nombor Akaun</label>
                <Input
                  value={formData.bankAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAccount: e.target.value })
                  }
                  placeholder="1234567890"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Nama Pemegang Akaun</label>
                <Input
                  value={formData.accountHolder}
                  onChange={(e) =>
                    setFormData({ ...formData, accountHolder: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {withdrawals.map((withdrawal) => (
          <Card key={withdrawal.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Withdrawal #{withdrawal.id}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(new Date(withdrawal.requestedAt))}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    withdrawal.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : withdrawal.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {withdrawal.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Jumlah</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {formatCurrency(withdrawal.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Bank</p>
                  <p className="font-medium">{withdrawal.bankName}</p>
                  <p className="text-sm text-gray-600">{withdrawal.bankAccount}</p>
                </div>
              </div>

              {withdrawal.notes && (
                <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-gray-700">Nota Admin:</p>
                  <p className="text-sm text-gray-600">{withdrawal.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <Button
                  onClick={() => handleDownloadPDF(withdrawal)}
                  variant="outline"
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Commission Statement (PDF)
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {withdrawals.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Tiada withdrawal request lagi
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
