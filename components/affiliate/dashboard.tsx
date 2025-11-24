"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubmitOrder } from "./submit-order";
import { OrdersList } from "./orders-list";
import { CommissionBalance } from "./commission-balance";
import { WithdrawalsList } from "./withdrawals-list";
import { ShareableLink } from "./shareable-link";

export function AffiliateDashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Affiliate Dashboard</h1>

      <CommissionBalance />

      <div className="mt-8">
        <ShareableLink />
      </div>

      <Tabs defaultValue="submit" className="w-full mt-8">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="submit">Submit Order</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
        </TabsList>

        <TabsContent value="submit">
          <SubmitOrder />
        </TabsContent>

        <TabsContent value="orders">
          <OrdersList />
        </TabsContent>

        <TabsContent value="withdrawals">
          <WithdrawalsList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
