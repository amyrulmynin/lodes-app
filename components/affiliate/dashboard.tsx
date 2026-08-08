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

  const activeItem = menuItems.find((item) => item.id === activeMenu);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-10 animate-fade-up">
        <h1 className="text-3xl font-bold tracking-tight text-ink-950">
          Affiliate Dashboard
        </h1>
        <p className="mt-1 text-ink-500">
          Hantar order dan pantau pendapatan komisen anda
        </p>
      </div>

      <CommissionBalance />

      <div className="mt-6">
        <ShareableLink />
      </div>

      <div className="mt-10 flex flex-col lg:flex-row gap-6">
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <Button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between"
            variant="outline"
          >
            <span className="flex items-center gap-2">
              {activeItem && <activeItem.icon className="h-5 w-5" />}
              {activeItem?.label}
            </span>
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </Button>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div className="mt-2 bg-white rounded-2xl shadow-lift border border-ink-200/70 overflow-hidden animate-fade-up">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleMenuClick(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer ${
                      activeMenu === item.id
                        ? "bg-ink-950 text-primary-400 font-semibold"
                        : "text-ink-700 hover:bg-ink-50"
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
          <div className="bg-white rounded-2xl shadow-card border border-ink-200/70 p-2 space-y-1 sticky top-28">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuClick(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-ink-950 text-primary-400"
                      : "text-ink-600 hover:bg-ink-50 hover:text-ink-950"
                  }`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-2xl shadow-card border border-ink-200/70 p-6 sm:p-8">
          {activeMenu === "submit" && <SubmitOrder />}
          {activeMenu === "orders" && <OrdersList />}
          {activeMenu === "withdrawals" && <WithdrawalsList />}
        </div>
      </div>
    </div>
  );
}
