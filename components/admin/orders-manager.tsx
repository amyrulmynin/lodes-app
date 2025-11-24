"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Order {
  id: number;
  quantity: number;
  totalPrice: string;
  commissionAmount: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string | null;
  notes: string | null;
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
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  useEffect(() => {
    fetchOrders();
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

  const handleUpdateStatus = async (orderId: number, status: "accepted" | "rejected") => {
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
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Orders</h2>
        <div className="flex gap-2">
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
          <Card key={order.id}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Order #{order.id}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(new Date(order.submittedAt))}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : order.status === "accepted"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Dessert</p>
                  <p className="font-medium">{order.dessert.name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Kuantiti</p>
                  <p className="font-medium">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Customer</p>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Affiliate</p>
                  <p className="font-medium">{order.affiliate.name}</p>
                  <p className="text-sm text-gray-600">{order.affiliate.email}</p>
                </div>
              </div>

              {order.customerAddress && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Alamat</p>
                  <p className="text-sm">{order.customerAddress}</p>
                </div>
              )}

              {order.notes && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-500">Nota</p>
                  <p className="text-sm">{order.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Jumlah</p>
                  <p className="text-xl font-bold text-primary-600">
                    {formatCurrency(order.totalPrice)}
                  </p>
                  <p className="text-sm text-green-600">
                    Komisen: {formatCurrency(order.commissionAmount)}
                  </p>
                </div>

                {order.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleUpdateStatus(order.id, "accepted")}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Terima
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleUpdateStatus(order.id, "rejected")}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Tolak
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredOrders.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Tiada order {filter !== "all" && filter}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
