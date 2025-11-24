"use client";

import { useEffect, useState } from "react";
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
}

export function OrdersList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Orders</h2>

      <div className="space-y-4">
        {orders.map((order) => (
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
                  <p className="text-sm font-medium text-gray-500">Jumlah</p>
                  <p className="font-bold text-lg">{formatCurrency(order.totalPrice)}</p>
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

              <div className="pt-4 border-t">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">Komisen Anda</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(order.commissionAmount)}
                  </p>
                </div>
                {order.status === "pending" && (
                  <p className="text-sm text-gray-500 mt-2">
                    Komisen akan dikreditkan setelah order diterima oleh admin
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              Tiada order lagi. Mulakan dengan submit order pertama anda!
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
