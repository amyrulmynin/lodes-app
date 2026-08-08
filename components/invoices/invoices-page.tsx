"use client";

import { useEffect, useState } from "react";
import { Download, Search, ChevronLeft, ChevronRight, FileText } from "lucide-react";
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

export function InvoicesPage({ role }: InvoicesPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [paymentSettings, setPaymentSettings] =
    useState<InvoicePaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
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
  const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6">
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
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Invoices
          </h2>
          <p className="text-sm text-gray-500 mt-1">
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
            Accepted ({orders.filter((o) => o.status === "accepted").length})
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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari nama customer, telefon, dessert atau no. invoice..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {currentOrders.map((order) => (
          <Card key={order.id}>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-bold">
                      INV-{String(order.id).padStart(5, "0")}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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
                  <p className="text-sm text-gray-600 mt-1">
                    {order.customerName} • {order.customerPhone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.dessert.name} x{order.quantity} •{" "}
                    {formatDate(new Date(order.submittedAt))}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <p className="font-bold text-lg text-primary-600 whitespace-nowrap">
                    {formatCurrency(order.totalPrice)}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => handleDownloadInvoice(order)}
                    disabled={downloadingId === order.id}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloadingId === order.id ? "Menjana..." : "Invoice PDF"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {currentOrders.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              {search
                ? "Tiada invoice sepadan dengan carian anda"
                : "Tiada order untuk dijadikan invoice"}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {filteredOrders.length > itemsPerPage && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-600">
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
              <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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
