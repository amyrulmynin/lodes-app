"use client";

import { useState } from "react";
import { Sparkles, Loader2, Send, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AiInsights() {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [question, setQuestion] = useState("");
  const [hasRun, setHasRun] = useState(false);

  const generate = async (q?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ai-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(q ? { question: q } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        setInsight(data.insight);
        setHasRun(true);
      } else {
        setError(data.error || "Gagal menjana insight");
      }
    } catch {
      setError("Ralat rangkaian. Sila cuba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleAsk = () => {
    if (!question.trim()) return;
    generate(question.trim());
    setQuestion("");
  };

  return (
    <Card className="bg-ink-950 border-ink-950 text-white relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary-500/15 blur-3xl pointer-events-none"
      />
      <CardHeader className="relative">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg text-white flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-500 text-ink-950">
              <Sparkles className="h-5 w-5" />
            </span>
            Lodes AI Copilot
          </CardTitle>
          {hasRun && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => generate()}
              disabled={loading}
              className="bg-white/10 border-white/10 text-white hover:bg-white/15 hover:text-primary-300"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          )}
        </div>
        <p className="text-sm text-ink-300">
          Analisis bisnes pintar berdasarkan data jualan & review sebenar
        </p>
      </CardHeader>
      <CardContent className="relative space-y-4">
        {!hasRun && !loading && (
          <div className="text-center py-6">
            <p className="text-ink-300 text-sm mb-5">
              Dapatkan analisis prestasi, risiko, dan cadangan tindakan untuk
              bisnes anda
            </p>
            <Button onClick={() => generate()} disabled={loading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Business Insight
            </Button>
          </div>
        )}

        {loading && (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-400 mx-auto mb-3" />
            <p className="text-sm text-ink-300">
              AI sedang menganalisis data bisnes anda...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {insight && !loading && (
          <div className="bg-white/5 border border-white/10 rounded-xl p-5">
            <div className="prose-sm text-ink-100 leading-relaxed whitespace-pre-wrap text-sm">
              {insight}
            </div>
          </div>
        )}

        {hasRun && !loading && (
          <div className="flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Tanya AI... cth: dessert apa patut saya promote?"
              className="bg-white/10 border-white/10 text-white placeholder:text-ink-400 focus-visible:border-primary-500"
            />
            <Button
              onClick={handleAsk}
              disabled={!question.trim() || loading}
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
