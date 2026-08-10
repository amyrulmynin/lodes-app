"use client";

import { useEffect, useState } from "react";
import { Check, X, FileText, MapPin, Truck, PackageCheck, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  generateOrderInvoicePDF,
  type InvoicePaymentSettings,
} from "@/lib/invoice-generator";
import { StatusBadge } from "./financial-overview";
import { FeedbackActions } from "./feedback-actions";

interface Order {
  id: number;
  quantity: number;
  totalPrice: string;
  commissionAmount: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  notes: string | null;
  latitude: string | null;
  longitude: string | null;
  locationAccuracy: string | null;
  driverToken: string | null;
  deliveryProofUrl: string | null;
  status: string;
  submittedAt: Date;
  dessert: {
    name: string;
  };
  affiliate: {
    name: string;
    email: string;
  };
}

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentSettings, setPaymentSettings] =
    useState<InvoicePaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("all");

  useEffect(() => {
    fetchOrders();
    fetchPaymentSettings();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const res = await fetch("/api/payment-settings");
      const data = await res.json();
      setPaymentSettings(data || null);
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    try {
      generateOrderInvoicePDF(order, paymentSettings);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Gagal menjana invoice. Sila cuba lagi.");
    }
  };

  const handleShareDriverLink = async (order: Order) => {
    if (!order.driverToken) {
      alert("Tiada driver token untuk order ini");
      return;
    }
    const url = `${window.location.origin}/drive/${order.driverToken}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Link driver disalin! Hantar kepada rider melalui WhatsApp.");
    } catch {
      prompt("Copy link driver:", url);
    }
  };

  const handleUpdateStatus = async (
    orderId: number,
    status: "accepted" | "rejected" | "out_for_delivery" | "delivered"
  ) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === "all") return true;
    return order.status === filter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-44" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-950">
            Senarai Orders
          </h2>
          <p className="text-sm text-ink-500 mt-1">
            {orders.length} order direkodkan
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            Semua ({orders.length})
          </Button>
          <Button
            size="sm"
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending ({orders.filter((o) => o.status === "pending").length})
          </Button>
          <Button
            size="sm"
            variant={filter === "accepted" ? "default" : "outline"}
            onClick={() => setFilter("accepted")}
          >
            Accepted ({orders.filter((o) => o.status === "accepted").length})
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.map((order) => (
          <Card key={order.id} className="hover:shadow-lift">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-bold text-lg text-ink-950">
                    Order #{order.id}
                  </h3>
                  <p className="text-sm text-ink-400">
                    {formatDate(new Date(order.submittedAt))}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Dessert
                  </p>
                  <p className="font-semibold text-ink-900">
                    {order.dessert.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Kuantiti
                  </p>
                  <p className="font-semibold text-ink-900 tabular-nums">
                    {order.quantity}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Customer
                  </p>
                  <p className="font-semibold text-ink-900">
                    {order.customerName}
                  </p>
                  <p className="text-sm text-ink-500">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Affiliate
                  </p>
                  <p className="font-semibold text-ink-900">
                    {order.affiliate.name}
                  </p>
                  <p className="text-sm text-ink-500">
                    {order.affiliate.email}
                  </p>
                </div>
              </div>

              {order.customerAddress && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Alamat
                  </p>
                  <p className="text-sm text-ink-700">
                    {order.customerAddress}
                  </p>
                </div>
              )}

              {/* Proof of delivery photo (from rider) */}
              {order.deliveryProofUrl && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-2">
                    Bukti Penghantaran
                  </p>
                  <img
                    src={order.deliveryProofUrl}
                    alt="Bukti penghantaran"
                    className="max-w-[200px] rounded-xl border border-ink-200"
                  />
                </div>
              )}

              {/* Delivery location (GPS pin from customer) */}
              {order.latitude && order.longitude && (
                <div className="mb-5">
                  <a
                    href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-ink-950 text-primary-400 font-semibold text-sm hover:bg-ink-900 transition-colors"
                  >
                    <MapPin className="h-4 w-4" />
                    Lokasi Delivery (GPS)
                    {order.locationAccuracy && (
                      <span className="text-xs text-ink-400 font-normal">
                        ±{Math.round(parseFloat(order.locationAccuracy))}m
                      </span>
                    )}
                  </a>
                </div>
              )}

              {order.notes && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Nota
                  </p>
                  <p className="text-sm text-ink-700">{order.notes}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-5 border-t border-ink-100">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                    Jumlah
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-ink-950 tabular-nums">
                    {formatCurrency(order.totalPrice)}
                  </p>
                  <p className="text-sm font-medium text-emerald-600 tabular-nums">
                    Komisen: {formatCurrency(order.commissionAmount)}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadInvoice(order)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Invoice
                  </Button>
                    <FeedbackActions orderId={order.id} orderStatus={order.status} />
                  {order.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(order.id, "accepted")
                        }
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Terima
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(order.id, "rejected")
                        }
                      >
                        <X className="h-4 w-4 mr-2" />
                        Tolak
                      </Button>
                    </>
                  )}

                  {/* Delivery progression */}
                  {order.status === "accepted" && order.driverToken && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareDriverLink(order)}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Link Driver
                    </Button>
                  )}
                  {order.status === "accepted" && (
                    <Button
                      size="sm"
                      onClick={() =>
                        handleUpdateStatus(order.id, "out_for_delivery")
                      }
                      className="bg-primary-500 text-ink-950 hover:bg-primary-400"
                    >
                      <Truck className="h-4 w-4 mr-2" />
                      Hantar
                    </Button>
                  )}
                  {order.status === "out_for_delivery" && (
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus(order.id, "delivered")}
                      className="bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Sampai
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-ink-400">
                Tiada order {filter !== "all" && filter}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}




