"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CakeSlice, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email atau password salah");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      setError("Terjadi kesalahan. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-ink-950 text-white p-12 relative overflow-hidden">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary-500/20 blur-3xl pointer-events-none"
        />
        <div
          aria-hidden
          className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl pointer-events-none"
        />

        <div className="relative flex items-center gap-3">
          <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary-500 text-ink-950">
            <CakeSlice className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="text-2xl font-bold tracking-tight">
            Lodes<span className="text-primary-400">.</span>
          </span>
        </div>

        <div className="relative max-w-md animate-fade-up">
          <h1 className="text-5xl font-bold tracking-tighter leading-[1.05]">
            Dessert terbaik,
            <br />
            <span className="text-primary-400">komisen setiap jualan.</span>
          </h1>
          <p className="mt-6 text-lg text-ink-300 leading-relaxed">
            Portal affiliate rasmi Lodes Desserts. Hantar order, pantau komisen,
            dan keluarkan pendapatan anda — semua dalam satu tempat.
          </p>
        </div>

        <p className="relative text-sm text-ink-500">
          &copy; {new Date().getFullYear()} Lodes Desserts
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-ink-50 p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <span className="flex items-center justify-center h-10 w-10 rounded-xl bg-ink-950 text-primary-400">
              <CakeSlice className="h-5 w-5" strokeWidth={2} />
            </span>
            <span className="text-2xl font-bold tracking-tight text-ink-950">
              Lodes<span className="text-primary-600">.</span>
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight text-ink-950">
            Selamat kembali
          </h2>
          <p className="mt-2 text-ink-500">
            Log masuk ke akaun affiliate anda
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div
                role="alert"
                className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium"
              >
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-semibold text-ink-800">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-semibold text-ink-800">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Logging in...
                </>
              ) : (
                <>
                  Log Masuk
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
