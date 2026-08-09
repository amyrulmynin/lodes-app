"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CakeSlice,
  CheckCircle,
  Clock,
  XCircle,
  Package,
  CreditCard,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface TrackedOrder {
  id: number;
  dessertName: string;
  quantity: number;
  totalPrice: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  submittedAt: string;
  paidAt: string | null;
}

export default function TrackPage() {
  const params = useParams();
  const token = params.token as string;
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/public/track/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setOrder(await res.json());
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  const steps = [
    {
      label: "Order Diterima",
      done: true,
      icon: Package,
    },
    {
      label: "Pembayaran",
      done: order?.paymentStatus === "paid",
      icon: CreditCard,
    },
    {
      label: "Order Disahkan",
      done: order?.status === "accepted",
      active: order?.status === "pending",
      rejected: order?.status === "rejected",
      icon: order?.status === "rejected" ? XCircle : CheckCircle,
    },
  ];

  return (
    <div className="min-h-dvh bg-ink-50 flex flex-col">
      {/* Header */}
      <div className="bg-ink-950 text-white relative overflow-hidden">
        <div
          aria-hidden
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-primary-500/20 blur-3xl pointer-events-none"
        />
        <div className="max-w-lg mx-auto px-6 py-10 relative text-center">
          <span className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-primary-500 text-ink-950 mb-4">
            <CakeSlice className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            Lodes<span className="text-primary-400">.</span> Desserts
          </h1>
          <p className="text-sm text-ink-300 mt-1">Jejak status order anda</p>
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {loading ? (
            <div className="skeleton h-64" />
          ) : notFound || !order ? (
            <Card>
              <CardContent className="pt-10 pb-10 text-center">
                <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-ink-950 mb-2">
                  Order Tidak Dijumpai
                </h2>
                <p className="text-ink-500 text-sm">
                  Link tracking ini tidak sah atau order telah dipadam.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="animate-fade-up">
              <CardContent className="pt-8 pb-8">
                <div className="text-center mb-6">
                  <p className="text-sm text-ink-500">Order #{order.id}</p>
                  <h2 className="text-2xl font-bold text-ink-950 mt-1">
                    {order.dessertName}
                  </h2>
                  <p className="text-sm text-ink-500 mt-1">
                    x{order.quantity} • {formatCurrency(order.totalPrice)}
                  </p>
                </div>

                {/* Progress steps */}
                <div className="space-y-4 mb-6">
                  {steps.map((step, i) => {
                    const Icon = step.icon;
                    const state = step.rejected
                      ? "rejected"
                      : step.done
                      ? "done"
                      : step.active
                      ? "active"
                      : "todo";
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span
                          className={`flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0 ${
                            state === "done"
                              ? "bg-emerald-100 text-emerald-600"
                              : state === "rejected"
                              ? "bg-red-100 text-red-600"
                              : state === "active"
                              ? "bg-primary-100 text-primary-700"
                              : "bg-ink-100 text-ink-300"
                          }`}
                        >
                          {state === "active" ? (
                            <Clock className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </span>
                        <div className="flex-1">
                          <p
                            className={`font-semibold ${
                              state === "done"
                                ? "text-ink-950"
                                : state === "rejected"
                                ? "text-red-700"
                                : state === "active"
                                ? "text-ink-800"
                                : "text-ink-400"
                            }`}
                          >
                            {step.label}
                          </p>
                          {i === 1 && order.paymentStatus === "paid" && order.paidAt && (
                            <p className="text-xs text-emerald-600">
                              Dibayar {formatDate(new Date(order.paidAt))}
                            </p>
                          )}
                        </div>
                        {state === "done" && (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Status summary */}
                <div
                  className={`rounded-xl p-4 text-center font-semibold ${
                    order.status === "accepted"
                      ? "bg-emerald-50 text-emerald-700"
                      : order.status === "rejected"
                      ? "bg-red-50 text-red-700"
                      : "bg-primary-50 text-primary-800"
                  }`}
                >
                  {order.status === "accepted"
                    ? "Order anda sedang disediakan!"
                    : order.status === "rejected"
                    ? "Maaf, order anda tidak dapat diproses."
                    : "Order anda sedang menunggu pengesahan admin."}
                </div>

                <p className="text-xs text-ink-400 text-center mt-4">
                  Dibuat pada {formatDate(new Date(order.submittedAt))}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <p className="text-center text-xs text-ink-400 pb-6">
        &copy; {new Date().getFullYear()} Lodes Desserts
      </p>
    </div>
  );
}
