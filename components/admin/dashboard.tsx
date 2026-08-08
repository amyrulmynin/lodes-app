"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DessertsManager } from "./desserts-manager";
import { OrdersManager } from "./orders-manager";
import { WithdrawalsManager } from "./withdrawals-manager";
import { AffiliatesManager } from "./affiliates-manager";
import { PaymentSettings } from "./payment-settings";
import { FinancialOverview } from "./financial-overview";

export function AdminDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      {/* Financial Overview - Always visible at top */}
      <div className="mb-8">
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
