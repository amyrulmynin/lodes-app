"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ShoppingBag } from "lucide-react";
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

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    accepted: "bg-emerald-50 text-emerald-700",
    pending: "bg-primary-100 text-primary-800",
    rejected: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
        styles[status] || "bg-ink-100 text-ink-600"
      }`}
    >
      {status}
    </span>
  );
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
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-44" />
        ))}
      </div>
    );
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
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-ink-950">
            My Orders
          </h2>
          {orders.length > 0 && (
            <p className="text-sm text-ink-500 mt-1">
              Total: {orders.length} order{orders.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {currentOrders.map((order) => (
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
                    Jumlah
                  </p>
                  <p className="font-bold text-lg text-ink-950 tabular-nums">
                    {formatCurrency(order.totalPrice)}
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

              {order.notes && (
                <div className="mb-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-400 mb-1">
                    Nota
                  </p>
                  <p className="text-sm text-ink-700">{order.notes}</p>
                </div>
              )}

              <div className="pt-5 border-t border-ink-100">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-ink-500">
                    Komisen Anda
                  </p>
                  <p className="text-xl font-bold tracking-tight text-emerald-600 tabular-nums">
                    {formatCurrency(order.commissionAmount)}
                  </p>
                </div>
                {order.status === "pending" && (
                  <p className="text-sm text-ink-400 mt-2">
                    Komisen akan dikreditkan setelah order diterima oleh admin
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-10 w-10 text-ink-300 mx-auto mb-3" />
              <p className="text-ink-400">
                Tiada order lagi. Mulakan dengan submit order pertama anda!
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {orders.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t border-ink-100 pt-4">
          <p className="text-sm text-ink-500">
            Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of{" "}
            {orders.length}
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
            <div className="flex items-center px-3">
              <span className="text-sm font-semibold text-ink-700">
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
