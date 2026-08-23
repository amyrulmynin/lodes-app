"use client";

import { useSession } from "next-auth/react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FinancialOverview } from "./financial-overview";
import { AiInsights } from "./ai-insights";

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
            An overview of sales performance, expenses, and business
            analytics.
          </p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* AI Copilot */}
      <div className="mb-10">
        <AiInsights />
      </div>

      {/* Financial Overview */}
      <FinancialOverview />
    </div>
  );
}
