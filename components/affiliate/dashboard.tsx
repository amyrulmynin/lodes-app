"use client";

import { useState } from "react";
import { FileText, ShoppingCart, Wallet, Menu, X } from "lucide-react";
import { SubmitOrder } from "./submit-order";
import { OrdersList } from "./orders-list";
import { CommissionBalance } from "./commission-balance";
import { WithdrawalsList } from "./withdrawals-list";
import { ShareableLink } from "./shareable-link";
import { Button } from "@/components/ui/button";

type MenuItem = "submit" | "orders" | "withdrawals";

export function AffiliateDashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuItem>("submit");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: "submit" as MenuItem, label: "Submit Order", icon: FileText },
    { id: "orders" as MenuItem, label: "My Orders", icon: ShoppingCart },
    { id: "withdrawals" as MenuItem, label: "Withdrawals", icon: Wallet },
  ];

  const handleMenuClick = (menuId: MenuItem) => {
    setActiveMenu(menuId);
    setMobileMenuOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Affiliate Dashboard</h1>

      <CommissionBalance />

      <div className="mt-8">
        <ShareableLink />
      </div>

      <div className="mt-8 flex flex-col lg:flex-row gap-6">
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between"
            variant="outline"
          >
            <span className="flex items-center gap-2">
              {menuItems.find((item) => item.id === activeMenu)?.icon &&
                (() => {
                  const Icon = menuItems.find((item) => item.id === activeMenu)!.icon;
                  return <Icon className="h-5 w-5" />;
                })()}
              {menuItems.find((item) => item.id === activeMenu)?.label}
            </span>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="mt-2 bg-white rounded-lg shadow-lg border">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                      activeMenu === item.id
                        ? "bg-primary-50 text-primary-700 font-semibold"
                        : "text-gray-700"
                    } ${item.id === "submit" ? "rounded-t-lg" : ""} ${
                      item.id === "withdrawals" ? "rounded-b-lg" : ""
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Side Menu */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow-sm border">
            {menuItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                    activeMenu === item.id
                      ? "bg-primary-600 text-white font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  } ${index === 0 ? "rounded-t-lg" : ""} ${
                    index === menuItems.length - 1 ? "rounded-b-lg" : ""
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-lg shadow-sm border p-6">
          {activeMenu === "submit" && <SubmitOrder />}
          {activeMenu === "orders" && <OrdersList />}
          {activeMenu === "withdrawals" && <WithdrawalsList />}
        </div>
      </div>
    </div>
  );
}
