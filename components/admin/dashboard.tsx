"use client";

import { useSession } from "next-auth/react";
import { Download } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DessertsManager } from "./desserts-manager";
import { OrdersManager } from "./orders-manager";
import { WithdrawalsManager } from "./withdrawals-manager";
import { AffiliatesManager } from "./affiliates-manager";
import { PaymentSettings } from "./payment-settings";
import { FinancialOverview } from "./financial-overview";

export function AdminDashboard() {
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(" ")[0] || "Admin";

  const handleExport = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome header */}
      <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-up">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-950">
            Welcome, {firstName}
          </h1>
          <p className="mt-1 text-ink-500">
            An overview of sales performance, commissions, and affiliate
            analytics.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Financial Overview - Always visible at top */}
      <div className="mb-10">
        <FinancialOverview />
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="desserts" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="desserts">Desserts</TabsTrigger>
          <TabsTrigger value="affiliates">Affiliates</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
        </TabsList>

        <TabsContent value="desserts">
          <DessertsManager />
        </TabsContent>

        <TabsContent value="affiliates">
          <AffiliatesManager />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersManager />
        </TabsContent>

        <TabsContent value="withdrawals">
          <WithdrawalsManager />
        </TabsContent>

        <TabsContent value="payment">
          <PaymentSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
