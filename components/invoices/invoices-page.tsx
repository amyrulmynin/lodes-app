"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  generateOrderInvoicePDF,
  type InvoiceOrder,
  type InvoicePaymentSettings,
} from "@/lib/invoice-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ManualInvoiceForm } from "./manual-invoice-form";

interface Order extends InvoiceOrder {
  dessert: {
    name: string;
    price: string;
  };
}

interface InvoicesPageProps {
  role: "admin" | "affiliate";
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

export function InvoicesPage({ role }: InvoicesPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentSettings, setPaymentSettings] =
    useState<InvoicePaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<
    "all" | "pending" | "accepted" | "rejected"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, settingsRes] = await Promise.all([
        fetch("/api/orders"),
        fetch("/api/payment-settings"),
      ]);
      const ordersData = await ordersRes.json();
      const settingsData = await settingsRes.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setPaymentSettings(settingsData || null);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    setDownloadingId(order.id);
    try {
      generateOrderInvoicePDF(order, paymentSettings);
    } catch (error) {
      console.error("Error generating invoice:", error);
      alert("Gagal menjana invoice. Sila cuba lagi.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filter !== "all" && order.status !== filter) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      order.customerName.toLowerCase().includes(q) ||
      order.customerPhone.toLowerCase().includes(q) ||
      order.dessert.name.toLowerCase().includes(q) ||
      `inv-${String(order.id).padStart(5, "0")}`.includes(q) ||
      `#${order.id}`.includes(q)
    );
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentOrders = filteredOrders.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-8 max-w-md">
        <TabsTrigger value="list">Senarai Invoice</TabsTrigger>
        <TabsTrigger value="manual">Buat Invoice Manual</TabsTrigger>
      </TabsList>

      <TabsContent value="manual">
        <ManualInvoiceForm />
      </TabsContent>

      <TabsContent value="list">
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink-950 flex items-center gap-2">
                <FileText className="h-6 w-6 text-ink-400" />
                Invoices
              </h2>
              <p className="text-sm text-ink-500 mt-1">
                Download invoice PDF untuk diberikan kepada customer
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant={filter === "all" ? "default" : "outline"}
                onClick={() => handleFilterChange("all")}
              >
                Semua ({orders.length})
              </Button>
              <Button
                size="sm"
                variant={filter === "accepted" ? "default" : "outline"}
                onClick={() => handleFilterChange("accepted")}
              >
                Accepted (
                {orders.filter((o) => o.status === "accepted").length})
              </Button>
              <Button
                size="sm"
                variant={filter === "pending" ? "default" : "outline"}
                onClick={() => handleFilterChange("pending")}
              >
                Pending ({orders.filter((o) => o.status === "pending").length})
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <Input
              placeholder="Cari nama customer, telefon, dessert atau no. invoice..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-11"
            />
          </div>

          {/* Orders list */}
          <div className="space-y-3">
            {currentOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lift">
                <CardContent className="py-5">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-ink-950 tabular-nums">
                          INV-{String(order.id).padStart(5, "0")}
                        </h3>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-sm font-medium text-ink-700 mt-1.5">
                        {order.customerName} • {order.customerPhone}
                      </p>
                      <p className="text-sm text-ink-400">
                        {order.dessert.name} x{order.quantity} •{" "}
                        {formatDate(new Date(order.submittedAt))}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <p className="font-bold text-lg text-ink-950 whitespace-nowrap tabular-nums">
                        {formatCurrency(order.totalPrice)}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadInvoice(order)}
                        disabled={downloadingId === order.id}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloadingId === order.id
                          ? "Menjana..."
                          : "Invoice PDF"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {currentOrders.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 text-ink-300 mx-auto mb-3" />
                  <p className="text-ink-400">
                    {search
                      ? "Tiada invoice sepadan dengan carian anda"
                      : "Tiada order untuk dijadikan invoice"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {filteredOrders.length > itemsPerPage && (
            <div className="flex items-center justify-between border-t border-ink-100 pt-4">
              <p className="text-sm text-ink-500">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredOrders.length)} of{" "}
                {filteredOrders.length}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
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
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
