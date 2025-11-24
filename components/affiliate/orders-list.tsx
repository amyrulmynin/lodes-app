"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

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

  // Pagination logic
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Orders</h2>
        {orders.length > 0 && (
          <p className="text-sm text-gray-600">
            Total: {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {currentOrders.map((order) => (
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

      {/* Pagination */}
      {orders.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="flex items-center gap-2 px-3">
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
