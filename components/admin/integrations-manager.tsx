"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  Send,
  QrCode,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Plug,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type TestState = {
  status: "idle" | "testing" | "ok" | "fail";
  message?: string;
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors duration-200 cursor-pointer flex-shrink-0 ${
        checked ? "bg-primary-500" : "bg-ink-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SecretInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-ink-800">{label}</label>
      <div className="relative">
        <Input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-11 font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 cursor-pointer"
          aria-label={show ? "Sembunyi" : "Tunjuk"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

function TestResult({ state }: { state: TestState }) {
  if (state.status === "idle") return null;
  if (state.status === "testing") {
    return (
      <p className="text-sm text-ink-500 flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" /> Menguji sambungan...
      </p>
    );
  }
  if (state.status === "ok") {
    return (
      <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center gap-2 font-medium">
        <CheckCircle className="h-4 w-4" /> {state.message || "Berjaya disambung!"}
      </p>
    );
  }
  return (
    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5 flex items-start gap-2 font-medium">
      <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> {state.message}
    </p>
  );
}

export function IntegrationsManager() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // AI state
  const [ai, setAi] = useState({ baseUrl: "", apiKey: "", model: "" });
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiTest, setAiTest] = useState<TestState>({ status: "idle" });

  // Telegram state
  const [tg, setTg] = useState({ botToken: "", chatId: "" });
  const [tgEnabled, setTgEnabled] = useState(false);
  const [tgFlags, setTgFlags] = useState({
    notifyOrders: true,
    notifyReviews: true,
    notifyWithdrawals: true,
    notifyStock: true,
  });
  const [tgTest, setTgTest] = useState<TestState>({ status: "idle" });

  // MudahPay state
  const [mp, setMp] = useState({ apiKey: "", webhookSecret: "" });
  const [mpEnabled, setMpEnabled] = useState(false);
  const [mpTest, setMpTest] = useState<TestState>({ status: "idle" });

  useEffect(() => {
    fetch("/api/admin/integrations")
      .then((r) => r.json())
      .then((data) => {
        if (data.ai) {
          setAi({
            baseUrl: data.ai.baseUrl || "",
            apiKey: data.ai.apiKey || "",
            model: data.ai.model || "",
          });
          setAiEnabled(!!data.ai.isEnabled);
        }
        if (data.telegram) {
          setTg({
            botToken: data.telegram.botToken || "",
            chatId: data.telegram.chatId || "",
          });
          setTgEnabled(!!data.telegram.isEnabled);
          setTgFlags({
            notifyOrders: data.telegram.notifyOrders !== false,
            notifyReviews: data.telegram.notifyReviews !== false,
            notifyWithdrawals: data.telegram.notifyWithdrawals !== false,
            notifyStock: data.telegram.notifyStock !== false,
          });
        }
        if (data.mudahpay) {
          setMp({
            apiKey: data.mudahpay.apiKey || "",
            webhookSecret: data.mudahpay.webhookSecret || "",
          });
          setMpEnabled(!!data.mudahpay.isEnabled);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const test = async (
    key: string,
    config: any,
    setState: (s: TestState) => void
  ) => {
    setState({ status: "testing" });
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, config }),
      });
      const data = await res.json();
      if (data.ok) {
        setState({
          status: "ok",
          message: data.botName
            ? `Bersambung ke ${data.botName}`
            : data.model
            ? `Model ${data.model} berfungsi`
            : "Bersambung!",
        });
      } else {
        setState({ status: "fail", message: data.error || "Gagal disambung" });
      }
    } catch {
      setState({ status: "fail", message: "Ralat rangkaian" });
    }
  };

  const save = async (
    key: string,
    config: any,
    isEnabled: boolean
  ) => {
    setSaving(key);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, config, isEnabled }),
      });
      if (res.ok) {
        const data = await res.json();
        // reload masked values
        if (key === "ai" && data.config) {
          setAi((p) => ({ ...p, apiKey: data.config.apiKey }));
        }
        if (key === "telegram" && data.config) {
          setTg((p) => ({ ...p, botToken: data.config.botToken }));
        }
        if (key === "mudahpay" && data.config) {
          setMp((p) => ({
            ...p,
            apiKey: data.config.apiKey,
            webhookSecret: data.config.webhookSecret,
          }));
        }
        alert("Settings disimpan!");
      } else {
        alert("Gagal menyimpan");
      }
    } catch {
      alert("Ralat rangkaian");
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-64" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ===== AI (9router) ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-primary-400">
                <Bot className="h-5 w-5" />
              </span>
              AI (9router)
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-500">
                {aiEnabled ? "Aktif" : "Tidak aktif"}
              </span>
              <Toggle checked={aiEnabled} onChange={setAiEnabled} />
            </div>
          </div>
          <p className="text-sm text-ink-500">
            Analisis jualan, review & resit menggunakan AI
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-800">Base URL</label>
            <Input
              value={ai.baseUrl}
              onChange={(e) => setAi({ ...ai, baseUrl: e.target.value })}
              placeholder="https://your-9router.example/v1"
              className="font-mono text-sm"
            />
          </div>
          <SecretInput
            label="API Key"
            value={ai.apiKey}
            onChange={(v) => setAi({ ...ai, apiKey: v })}
            placeholder="sk-..."
          />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-800">Model</label>
            <Input
              value={ai.model}
              onChange={(e) => setAi({ ...ai, model: e.target.value })}
              placeholder="cbcn/kimi-k3"
              className="font-mono text-sm"
            />
          </div>
          <TestResult state={aiTest} />
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => test("ai", ai, setAiTest)}
              disabled={aiTest.status === "testing"}
            >
              <Plug className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            <Button
              onClick={() => save("ai", ai, aiEnabled)}
              disabled={saving === "ai"}
            >
              {saving === "ai" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== Telegram ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-primary-400">
                <Send className="h-5 w-5" />
              </span>
              Telegram Bot
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-500">
                {tgEnabled ? "Aktif" : "Tidak aktif"}
              </span>
              <Toggle checked={tgEnabled} onChange={setTgEnabled} />
            </div>
          </div>
          <p className="text-sm text-ink-500">
            Notifikasi order, review & withdrawal terus ke Telegram admin
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SecretInput
            label="Bot Token"
            value={tg.botToken}
            onChange={(v) => setTg({ ...tg, botToken: v })}
            placeholder="123456:ABC-DEF..."
          />
          <div className="space-y-2">
            <label className="text-sm font-semibold text-ink-800">Chat ID</label>
            <Input
              value={tg.chatId}
              onChange={(e) => setTg({ ...tg, chatId: e.target.value })}
              placeholder="123456789 atau -100xxxxxxxxxx (group)"
              className="font-mono text-sm"
            />
            <p className="text-xs text-ink-400">
              Dapatkan dari @userinfobot (personal) atau tambah bot ke group
            </p>
          </div>

          <div className="border-t border-ink-100 pt-4">
            <p className="text-sm font-semibold text-ink-800 mb-3">
              Hantar notifikasi untuk:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  ["notifyOrders", "Order baru"],
                  ["notifyReviews", "Review baru"],
                  ["notifyWithdrawals", "Withdrawal baru"],
                  ["notifyStock", "Stok rendah"],
                ] as const
              ).map(([flag, label]) => (
                <label
                  key={flag}
                  className="flex items-center justify-between bg-ink-50 rounded-xl px-4 py-3 cursor-pointer"
                >
                  <span className="text-sm font-medium text-ink-700">{label}</span>
                  <Toggle
                    checked={tgFlags[flag]}
                    onChange={(v) => setTgFlags({ ...tgFlags, [flag]: v })}
                  />
                </label>
              ))}
            </div>
          </div>

          <TestResult state={tgTest} />
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => test("telegram", tg, setTgTest)}
              disabled={tgTest.status === "testing"}
            >
              <Plug className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            <Button
              onClick={() =>
                save("telegram", { ...tg, ...tgFlags }, tgEnabled)
              }
              disabled={saving === "telegram"}
            >
              {saving === "telegram" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ===== MudahPay ===== */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-950 text-primary-400">
                <QrCode className="h-5 w-5" />
              </span>
              MudahPay (DuitNow QR)
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-ink-500">
                {mpEnabled ? "Aktif" : "Tidak aktif"}
              </span>
              <Toggle checked={mpEnabled} onChange={setMpEnabled} />
            </div>
          </div>
          <p className="text-sm text-ink-500">
            Terima bayaran QR DuitNow dengan pengesahan automatik
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <SecretInput
            label="API Key (Secret)"
            value={mp.apiKey}
            onChange={(v) => setMp({ ...mp, apiKey: v })}
            placeholder="mp_sk_..."
          />
          <SecretInput
            label="Webhook Secret"
            value={mp.webhookSecret}
            onChange={(v) => setMp({ ...mp, webhookSecret: v })}
            placeholder="Webhook signing secret"
          />
          <p className="text-xs text-ink-400">
            Webhook URL untuk dashboard MudahPay:{" "}
            <code className="bg-ink-100 px-1.5 py-0.5 rounded font-mono">
              /api/webhooks/mudahpay
            </code>
          </p>
          <TestResult state={mpTest} />
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => test("mudahpay", mp, setMpTest)}
              disabled={mpTest.status === "testing"}
            >
              <Plug className="h-4 w-4 mr-2" />
              Test Connection
            </Button>
            <Button
              onClick={() => save("mudahpay", mp, mpEnabled)}
              disabled={saving === "mudahpay"}
            >
              {saving === "mudahpay" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
