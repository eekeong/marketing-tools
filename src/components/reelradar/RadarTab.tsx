"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StatCard from "@/components/StatCard";
import { useLanguage } from "@/lib/i18n";
import { HOOK_TYPES, HookType } from "@/lib/reelRadarData";
import { formatCount } from "@/lib/reelRadarTypes";
import ReelThumb from "./ReelThumb";
import ScanProgressBar from "./ScanProgressBar";
import SignalMeter from "./SignalMeter";
import { useScan } from "./useScan";

interface Reel {
  id: string;
  account: string;
  hookType: HookType;
  plays: string;
  playsNum: number;
  likes: string;
  comments: string;
  score: number;
  viralMultiple: number | null;
  isNew: boolean;
  color: string;
  hasSpeech: boolean;
  language: string | null;
  caption: string;
  thumbnailUrl: string | null;
  igUrl: string;
}

function pillClass(active: boolean) {
  return `rounded-full px-3 py-1.5 text-xs font-medium border transition ${
    active ? "brand-gradient text-white border-transparent" : "text-muted border-border hover:bg-background"
  }`;
}

export default function RadarTab({
  onOpenActivity,
  hookFilter,
  setHookFilter,
}: {
  onOpenActivity: () => void;
  hookFilter: HookType | "all";
  setHookFilter: (h: HookType | "all") => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [reels, setReels] = useState<Reel[]>([]);
  const [accountCount, setAccountCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "score" | "views">("score");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(20);
  const [showLowScore, setShowLowScore] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [quickUrl, setQuickUrl] = useState("");
  const [quickBusy, setQuickBusy] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  const load = async () => {
    const [reelsRes, compRes] = await Promise.all([
      fetch("/api/reel-radar/reels?source=radar").then((r) => r.json()),
      fetch("/api/reel-radar/competitors").then((r) => r.json()),
    ]);
    setReels(reelsRes.reels ?? []);
    setAccountCount((compRes.competitors ?? []).length);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const { progress, error: scanError, start: startScan, cancel: cancelScan, scanning } = useScan("radar", load);

  const languages = Array.from(new Set(reels.map((r) => r.language).filter((l): l is string => !!l)));
  const filtered = reels.filter(
    (r) =>
      (hookFilter === "all" || r.hookType === hookFilter) &&
      (languageFilter === "all" || r.language === languageFilter) &&
      (showLowScore || r.score > 3),
  );
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "score") return b.score - a.score;
    if (sort === "views") return b.playsNum - a.playsNum;
    return a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1;
  });
  const visible = sorted.slice(0, visibleCount);

  const totalViews = reels.reduce((s, r) => s + r.playsNum, 0);
  const hookCounts = new Map<string, number>();
  for (const r of reels) hookCounts.set(r.hookType, (hookCounts.get(r.hookType) ?? 0) + 1);
  const topHook = [...hookCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteMany = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    await fetch("/api/reel-radar/reels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setSelected(new Set());
    setSelectMode(false);
    load();
  };

  const handleDeleteOne = async (id: string) => {
    await fetch("/api/reel-radar/reels", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    });
    load();
  };

  const handleQuickAdd = async () => {
    if (!quickUrl.trim()) return;
    setQuickBusy(true);
    setQuickError(null);
    try {
      const res = await fetch("/api/reel-radar/reels/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: quickUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      router.push(`/reel-radar/reel/${json.reelId}`);
    } catch (err) {
      setQuickError((err as Error).message);
    } finally {
      setQuickBusy(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-muted max-w-2xl mb-4">{t("reelradar.subtitle")}</p>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">{t("reelradar.overviewTitle")}</h2>
        <button onClick={onOpenActivity} className="text-xs font-medium text-muted hover:text-brand-pink transition">
          {t("reelradar.activityLog")} →
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
        <StatCard label={t("reelradar.statAccounts")} value={accountCount} />
        <StatCard label={t("reelradar.statAnalyzed")} value={reels.length} />
        <StatCard label={t("reelradar.statViews")} value={formatCount(totalViews)} />
        <StatCard label={t("reelradar.statTopHook")} value={topHook} />
      </div>

      <button
        onClick={startScan}
        disabled={scanning}
        className="w-full rounded-2xl brand-gradient text-white text-base font-semibold py-4 shadow-sm hover:opacity-90 transition disabled:opacity-60"
      >
        {scanning ? t("reelradar.scanning") : t("reelradar.scanNowButton")}
      </button>
      {!scanning && <p className="text-xs text-muted text-center mt-2 mb-6">{t("reelradar.scanCostHint")}</p>}
      {scanning && (
        <div className="mt-4 mb-6">
          <ScanProgressBar progress={progress} onCancel={cancelScan} />
        </div>
      )}
      {scanError && <p className="text-xs text-red-500 mb-4">{scanError}</p>}

      <div className="rounded-2xl border border-border bg-surface p-4 mb-8">
        <p className="text-sm font-semibold mb-1">{t("reelradar.quickAddTitle")}</p>
        <p className="text-xs text-muted mb-3">{t("reelradar.quickAddDesc")}</p>
        <div className="flex gap-2">
          <input
            value={quickUrl}
            onChange={(e) => setQuickUrl(e.target.value)}
            placeholder={t("reelradar.quickAddPlaceholder")}
            className="flex-1 rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
          />
          <button
            onClick={handleQuickAdd}
            disabled={quickBusy || !quickUrl.trim()}
            className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-2 disabled:opacity-50 shrink-0"
          >
            {quickBusy ? t("reelradar.quickAddAnalyzing") : t("reelradar.quickAddButton")}
          </button>
        </div>
        {quickError && <p className="text-xs text-red-500 mt-2">{quickError}</p>}
        <p className="text-[11px] text-muted mt-2">{t("reelradar.quickAddHint")}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {(
          [
            { key: "newest", label: t("reelradar.sortNewest") },
            { key: "score", label: t("reelradar.sortTopScore") },
            { key: "views", label: t("reelradar.sortMostViews") },
          ] as const
        ).map((opt) => (
          <button key={opt.key} onClick={() => setSort(opt.key)} className={pillClass(sort === opt.key)}>
            {opt.label}
          </button>
        ))}
        {languages.length > 0 && (
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted bg-surface focus:outline-none"
          >
            <option value="all">{t("reelradar.allLanguages")}</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
        <button onClick={() => setShowLowScore((v) => !v)} className={pillClass(showLowScore)}>
          {showLowScore ? t("reelradar.hideLowScoreAgain") : t("reelradar.lowScoreHidden")}
        </button>
        <div className="flex-1" />
        {selectMode ? (
          <>
            <span className="text-xs text-muted">
              {t("reelradar.selected")} {selected.size}
            </span>
            <button
              onClick={handleDeleteMany}
              disabled={selected.size === 0}
              className="rounded-full px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 disabled:opacity-40"
            >
              {t("reelradar.deleteSelected")}
            </button>
            <button
              onClick={() => {
                setSelectMode(false);
                setSelected(new Set());
              }}
              className="text-xs font-medium text-muted"
            >
              {t("reelradar.cancelSelect")}
            </button>
          </>
        ) : (
          <button onClick={() => setSelectMode(true)} className="text-xs font-medium text-muted hover:text-brand-pink">
            {t("reelradar.select")}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setHookFilter("all")} className={pillClass(hookFilter === "all")}>
          {t("reelradar.allHooks")}
        </button>
        {HOOK_TYPES.map((h) => (
          <button key={h} onClick={() => setHookFilter(h)} className={pillClass(hookFilter === h)}>
            {h}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t("reelradar.loading")}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">{t("reelradar.empty")}</p>
      ) : (
        <div className="space-y-3">
          {visible.map((reel) => (
            <div key={reel.id} className="rounded-2xl border border-border bg-surface p-3.5 flex items-start gap-3">
              {selectMode && (
                <input
                  type="checkbox"
                  checked={selected.has(reel.id)}
                  onChange={() => toggleSelected(reel.id)}
                  className="w-4 h-4 mt-1 shrink-0"
                />
              )}
              <button
                onClick={() => router.push(`/reel-radar/reel/${reel.id}`)}
                className="flex items-start gap-3 flex-1 min-w-0 text-left"
              >
                <ReelThumb thumbnailUrl={reel.thumbnailUrl} igUrl={reel.igUrl} color={reel.color} className="w-16 h-16 rounded-xl text-lg shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    <span className="text-sm font-semibold">{reel.account}</span>
                    {reel.viralMultiple && (
                      <span className="rounded-full bg-yellow-400 text-[10px] font-semibold px-2 py-0.5 text-black">
                        {t("reelradar.viral")} ×{reel.viralMultiple}
                      </span>
                    )}
                    {reel.isNew && (
                      <span className="rounded-full bg-brand-pink/15 text-brand-pink text-[10px] font-semibold px-2 py-0.5">
                        {t("reelradar.new")}
                      </span>
                    )}
                    {!reel.hasSpeech && (
                      <span className="rounded-full bg-border text-muted text-[10px] font-semibold px-2 py-0.5">
                        {t("reelradar.captionOnly")}
                      </span>
                    )}
                  </div>
                  <span className="inline-block rounded-full bg-background border border-border text-[11px] px-2 py-0.5 text-muted mb-1">
                    {reel.hookType}
                  </span>
                  {reel.caption && <p className="text-xs text-foreground/70 line-clamp-2 mb-1">{reel.caption}</p>}
                  <p className="text-[11px] text-muted">
                    ▶ {reel.plays} · ♥ {reel.likes} · 💬 {reel.comments}
                  </p>
                </div>
              </button>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <SignalMeter score={reel.score} />
                <button onClick={() => handleDeleteOne(reel.id)} className="text-[11px] text-muted hover:text-red-500 transition">
                  {t("action.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {visibleCount < sorted.length && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setVisibleCount((v) => v + 20)}
            className="rounded-xl border border-border text-sm font-medium px-4 py-2 hover:bg-background transition"
          >
            {t("reelradar.loadMore")}
          </button>
        </div>
      )}
    </div>
  );
}
