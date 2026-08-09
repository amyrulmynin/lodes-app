"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LogOut,
  LayoutDashboard,
  FileText,
  ArrowLeftRight,
  CakeSlice,
  Cake,
  Users,
  ShoppingCart,
  Wallet,
  MessageSquareQuote,
  CreditCard,
  Package,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

interface AdminSidebarProps {
  userName: string;
}

const mainMenu = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
];

const manageMenu = [
  { href: "/admin/desserts", label: "Desserts", icon: Cake },
  { href: "/admin/affiliates", label: "Affiliates", icon: Users },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: Wallet },
  { href: "/admin/payment", label: "Payment", icon: CreditCard },
  { href: "/admin/stock", label: "Stock", icon: Package },
  { href: "/admin/settings", label: "Integrations", icon: Settings },
];

export function AdminSidebar({ userName }: AdminSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const renderLink = (
    item: { href: string; label: string; icon: any },
    indented = false
  ) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
          indented ? "px-4 py-2.5" : "px-4 py-3"
        } ${
          isActive
            ? "bg-primary-500 text-ink-950"
            : "text-ink-300 hover:text-white hover:bg-white/5"
        }`}
      >
        <Icon className={indented ? "h-4 w-4" : "h-5 w-5"} strokeWidth={2} />
        {item.label}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/10 flex-shrink-0">
        <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary-500 text-ink-950">
          <CakeSlice className="h-5 w-5" strokeWidth={2} />
        </span>
        <span className="text-xl font-bold tracking-tight text-white">
          Lodes<span className="text-primary-400">.</span>
        </span>
        <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-primary-500/15 text-primary-400 border border-primary-500/25">
          Admin
        </span>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {mainMenu.map((item) => renderLink(item))}

        {/* Sub-menu: Pengurusan */}
        <p className="px-4 pt-5 pb-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-500">
          Pengurusan
        </p>
        {manageMenu.map((item) => renderLink(item))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 mb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-primary-400 font-bold text-sm">
            {userName.charAt(0).toUpperCase()}
          </span>
          <p className="text-sm font-medium text-white truncate">{userName}</p>
        </div>
        <Button
          onClick={handleLogout}
          className="w-full bg-white/10 text-white hover:bg-white/15 hover:text-primary-300 border border-white/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-ink-950 text-white flex items-center gap-3 h-16 px-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Buka menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2">
          <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary-500 text-ink-950">
            <CakeSlice className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="text-lg font-bold tracking-tight">
            Lodes<span className="text-primary-400">.</span>
          </span>
        </span>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-72 bg-ink-950 animate-fade-up">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-lg text-ink-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer z-10"
              aria-label="Tutup menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed inset-y-0 left-0 w-64 bg-ink-950 z-40">
        {sidebarContent}
      </aside>
    </>
  );
}

