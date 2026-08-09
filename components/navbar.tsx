"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, CakeSlice } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOut } from "next-auth/react";

interface NavbarProps {
  userName: string;
  role: string;
}

export function Navbar({ userName, role }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/login");
  };

  const dashboardPath = role === "admin" ? "/admin" : "/affiliate";

  return (
    <nav className="sticky top-0 z-50 bg-ink-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={dashboardPath} className="flex items-center gap-3 group">
            <span className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary-500 text-ink-950 transition-transform duration-200 group-hover:-rotate-6">
              <CakeSlice className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-xl font-bold tracking-tight">
              Lodes
              <span className="text-primary-400">.</span>
            </span>
            <span className="ml-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-primary-500/15 text-primary-400 border border-primary-500/25">
              {role === "admin" ? "Admin" : "Elite Affiliate"}
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-sm text-ink-300">
              {userName}
            </span>
            <Button
              size="sm"
              onClick={handleLogout}
              className="bg-white/10 text-white hover:bg-white/15 hover:text-primary-300 border border-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
