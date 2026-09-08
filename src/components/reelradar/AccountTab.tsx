"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import { useLanguage } from "@/lib/i18n";
import AddReelModal from "./AddReelModal";

interface Hit {
  id: string;
  title: string;
  plays: string;
  multiple: number;
  color: string;
}

interface HookStat {
  hook: string;
  medianViews: string;
  samples: number;
  avgRelevance: number;
}

export default function AccountTab() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({ collected: 0, median: "0", max: "0", voiceoverPct: 0 });
  const [myHits, setMyHits] = useState<Hit[]>([]);
  const [hookUsage, setHookUsage] = useState<Record<string, number>>({});
  const [top5Hooks, setTop5Hooks] = useState<HookStat[]>([]);
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    const [accRes, patternsRes] = await Promise.all([
      fetch("/api/reel-radar/account").then((r) => r.json()),
      fetch("/api/reel-radar/patterns").then((r) => r.json()),
    ]);
    setStats(accRes.stats ?? { collected: 0, median: "0", max: "0", voiceoverPct: 0 });
    setMyHits(accRes.myHits ?? []);
    setHookUsage(accRes.hookUsage ?? {});
    setDiagnosis(accRes.diagnosis ?? null);
    setTop5Hooks((patternsRes.hookStats ?? []).slice(0, 5));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/reel-radar/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "mine" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      alert(t("reelradar.scanDone", { done: String(json.done), failed: String(json.failed) }));
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setScanning(false);
    }
  };

  const handleDiagnose = async () => {
    setDiagnosing(true);
    try {
      const res = await fetch("/api/reel-radar/account/diagnose", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setDiagnosis(json.diagnosis);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDiagnosing(false);
    }
  };

  if (loading) return <p className="text-sm text-muted">{t("reelradar.loading")}</p>;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold">{t("account.title")}</h2>
          <p className="text-sm text-muted mt-1 max-w-2xl">{t("account.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-xl border border-border text-sm font-medium px-4 py-2.5 hover:bg-background transition"
          >
            {t("account.rescan")}
          </button>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {scanning ? t("reelradar.scanning") : t("account.scanButton")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <StatCard label={t("account.statCollected")} value={stats.collected} />
        <StatCard label={t("account.statMedian")} value={stats.median} />
        <StatCard label={t("account.statMax")} value={stats.max} />
        <StatCard label={t("account.statVoiceover")} value={`${stats.voiceoverPct}%`} />
      </div>

      {myHits.length > 0 && (
        <div className="mb-8">
          <p className="text-sm font-semibold mb-1">{t("account.myHits")}</p>
          <p className="text-xs text-muted mb-3">{t("account.myHitsDesc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {myHits.map((hit) => (
              <div key={hit.id} className="rounded-xl border border-border bg-surface p-3.5 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg shrink-0"
                  style={{ background: `linear-gradient(160deg, ${hit.color}, ${hit.color}88)` }}
                >
                  ▶
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{hit.title}</p>
                  <p className="text-[11px] text-muted">
                    {hit.plays} · <span className="text-yellow-600 font-medium">×{hit.multiple}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {top5Hooks.length > 0 && (
        <div className="mb-8">
          <p className="text-sm font-semibold mb-1">{t("account.hookComparison")}</p>
          <p className="text-xs text-muted mb-3">{t("account.hookComparisonDesc")}</p>
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
            {top5Hooks.map((h) => {
              const used = hookUsage[h.hook] ?? 0;
              return (
                <div key={h.hook} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{h.hook}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted">{used === 0 ? "" : `× ${used}`}</span>
                    {used === 0 && (
                      <span className="rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-semibold px-2 py-0.5">
                        {t("account.notTriedYet")}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold">{t("account.diagnosis")}</p>
          {!diagnosis && (
            <button
              onClick={handleDiagnose}
              disabled={diagnosing}
              className="rounded-lg border border-border text-xs font-medium px-3 py-1.5 hover:bg-background disabled:opacity-60"
            >
              {diagnosing ? t("account.diagnosing") : t("account.generateDiagnosis")}
            </button>
          )}
        </div>
        {diagnosis && (
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{diagnosis}</p>
          </div>
        )}
      </div>

      {modalOpen && <AddReelModal source="mine" onClose={() => setModalOpen(false)} onAdded={load} />}
    </div>
  );
}
