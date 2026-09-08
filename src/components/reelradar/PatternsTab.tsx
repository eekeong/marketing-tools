"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { HookType } from "@/lib/reelRadarData";

interface HookStat {
  hook: HookType;
  medianViews: string;
  samples: number;
  avgRelevance: number;
}

interface DarkHorse {
  id: string;
  account: string;
  hookType: HookType;
  multiple: number;
  color: string;
}

function viewsToNum(v: string): number {
  if (v.endsWith("M")) return parseFloat(v) * 1_000_000;
  if (v.endsWith("K")) return parseFloat(v) * 1_000;
  return parseFloat(v) || 0;
}

export default function PatternsTab({ onJumpToHook }: { onJumpToHook: (hook: HookType) => void }) {
  const { t } = useLanguage();
  const [hookStats, setHookStats] = useState<HookStat[]>([]);
  const [darkHorses, setDarkHorses] = useState<DarkHorse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reel-radar/patterns")
      .then((r) => r.json())
      .then((json) => {
        setHookStats(json.hookStats ?? []);
        setDarkHorses(json.darkHorses ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="text-sm text-muted">{t("reelradar.loading")}</p>;

  if (hookStats.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-lg font-semibold">{t("patterns.title")}</h2>
          <p className="text-sm text-muted mt-1 max-w-2xl">{t("patterns.subtitle")}</p>
        </div>
        <p className="text-sm text-muted">{t("reelradar.empty")}</p>
      </div>
    );
  }

  const top = hookStats[0];
  const maxMedian = Math.max(...hookStats.map((h) => viewsToNum(h.medianViews)));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold">{t("patterns.title")}</h2>
        <p className="text-sm text-muted mt-1 max-w-2xl">{t("patterns.subtitle")}</p>
      </div>

      {darkHorses.length > 0 && (
        <div className="mb-8">
          <p className="text-sm font-semibold mb-1">{t("patterns.darkHorse")}</p>
          <p className="text-xs text-muted mb-3">{t("patterns.darkHorseDesc")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {darkHorses.map((d) => (
              <div key={d.id} className="rounded-xl border border-border bg-surface p-3.5 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-lg shrink-0"
                  style={{ background: `linear-gradient(160deg, ${d.color}, ${d.color}88)` }}
                >
                  ▶
                </div>
                <div>
                  <p className="text-sm font-medium">{d.account}</p>
                  <p className="text-[11px] text-muted">
                    {d.hookType} · <span className="text-yellow-600 font-medium">×{d.multiple}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => onJumpToHook(top.hook)}
        className="w-full text-left rounded-xl brand-gradient-soft border border-brand-pink/20 p-4 mb-8 hover:opacity-90 transition"
      >
        <p className="text-sm">
          {t("patterns.conclusionCard", { hook: top.hook, views: top.medianViews, count: String(top.samples) })}
        </p>
      </button>

      <div>
        <p className="text-sm font-semibold mb-3">{t("patterns.barChartTitle")}</p>
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
          {hookStats.map((h) => (
            <button key={h.hook} onClick={() => onJumpToHook(h.hook)} className="w-full text-left group">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium group-hover:text-brand-pink transition">{h.hook}</span>
                <span className="text-muted">
                  {h.medianViews} · {h.samples} {t("patterns.samples")} · {t("patterns.avgRelevance")} {h.avgRelevance}
                </span>
              </div>
              <div className="h-2 rounded-full bg-background overflow-hidden">
                <div
                  className="h-full brand-gradient rounded-full transition-all"
                  style={{ width: `${(viewsToNum(h.medianViews) / maxMedian) * 100}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
