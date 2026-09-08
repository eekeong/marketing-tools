"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import { useLanguage } from "@/lib/i18n";
import { HOOK_TYPES, HookType } from "@/lib/reelRadarData";
import { formatCount } from "@/lib/reelRadarTypes";
import AddReelModal from "./AddReelModal";
import ReelThumb from "./ReelThumb";

interface Reel {
  id: string;
  account: string;
  hookType: HookType;
  plays: string;
  playsNum: number;
  likes: string;
  score: number;
  viralMultiple: number | null;
  isNew: boolean;
  color: string;
  whyScored: string;
  hook: string;
  structure: string;
  cta: string;
  transcript: string;
  caption: string;
  rewrite: string | null;
  remix: string | null;
  thumbnailUrl: string | null;
  igUrl: string;
}

function ScoreRing({ score }: { score: number }) {
  const pct = (score / 10) * 100;
  return (
    <div
      className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
      style={{ background: `conic-gradient(var(--brand-pink) ${pct}%, var(--border) ${pct}%)` }}
    >
      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center">{score}</div>
    </div>
  );
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
  const [reels, setReels] = useState<Reel[]>([]);
  const [accountCount, setAccountCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"newest" | "score" | "views">("score");
  const [modalOpen, setModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [genShown, setGenShown] = useState<Record<string, "rewrite" | "remix">>({});
  const [transcriptOpen, setTranscriptOpen] = useState<Record<string, boolean>>({});
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [visibleCount, setVisibleCount] = useState(3);

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

  const filtered = reels.filter((r) => hookFilter === "all" || r.hookType === hookFilter);
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

  const handleGenerate = async (id: string, mode: "rewrite" | "remix") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/reel-radar/reels/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setReels((prev) => prev.map((r) => (r.id === id ? { ...r, [mode === "rewrite" ? "rewrite" : "remix"]: json.text } : r)));
      setGenShown((prev) => ({ ...prev, [id]: mode }));
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/reel-radar/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "radar" }),
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

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <p className="text-sm text-muted max-w-2xl">{t("reelradar.subtitle")}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={onOpenActivity} className="text-xs font-medium text-muted hover:text-brand-pink transition">
            {t("reelradar.activityLog")}
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-xl border border-border text-sm font-medium px-4 py-2.5 hover:bg-background transition"
          >
            {t("reelradar.scanButton")}
          </button>
          <button
            onClick={handleScan}
            disabled={scanning}
            className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {scanning ? t("reelradar.scanning") : t("reelradar.scanNowButton")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label={t("reelradar.statAccounts")} value={accountCount} />
        <StatCard label={t("reelradar.statAnalyzed")} value={reels.length} />
        <StatCard label={t("reelradar.statViews")} value={formatCount(totalViews)} />
        <StatCard label={t("reelradar.statTopHook")} value={topHook} />
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-2">
        {(
          [
            { key: "newest", label: t("reelradar.sortNewest") },
            { key: "score", label: t("reelradar.sortTopScore") },
            { key: "views", label: t("reelradar.sortMostViews") },
          ] as const
        ).map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSort(opt.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              sort === opt.key ? "brand-gradient text-white border-transparent" : "text-muted border-border"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <select
          value={hookFilter}
          onChange={(e) => setHookFilter(e.target.value as HookType | "all")}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted bg-surface focus:outline-none"
        >
          <option value="all">{t("reelradar.allHooks")}</option>
          {HOOK_TYPES.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
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
      <p className="text-[11px] text-muted mb-4">{t("reelradar.lowScoreHidden")}</p>

      {loading ? (
        <p className="text-sm text-muted">{t("reelradar.loading")}</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted">{t("reelradar.empty")}</p>
      ) : (
        <div className="space-y-4">
          {visible.map((reel) => {
            const showTranscript = transcriptOpen[reel.id];
            const genMode = genShown[reel.id];
            const genText = genMode === "rewrite" ? reel.rewrite : genMode === "remix" ? reel.remix : null;
            return (
              <div key={reel.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="sm:w-44 h-56 sm:h-auto shrink-0 relative">
                    <ReelThumb thumbnailUrl={reel.thumbnailUrl} igUrl={reel.igUrl} color={reel.color} className="w-full h-full">
                      <div className="absolute top-2 left-2 flex gap-1 z-10">
                        {reel.isNew && (
                          <span className="rounded-full bg-white/90 text-[10px] font-semibold px-2 py-0.5 text-foreground">
                            {t("reelradar.new")}
                          </span>
                        )}
                        {reel.viralMultiple && (
                          <span className="rounded-full bg-yellow-400 text-[10px] font-semibold px-2 py-0.5 text-black">
                            {t("reelradar.viral")} ×{reel.viralMultiple}
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-2 left-2 text-[11px] bg-black/40 rounded-full px-2 py-0.5 z-10">
                        ▶ {reel.plays} · ♥ {reel.likes}
                      </div>
                    </ReelThumb>
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selected.has(reel.id)}
                        onChange={() => toggleSelected(reel.id)}
                        className="absolute top-2 right-2 w-4 h-4 z-20"
                      />
                    )}
                  </div>

                  <div className="flex-1 p-4 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <a
                          href={reel.igUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-semibold hover:text-brand-pink transition"
                        >
                          {reel.account}
                        </a>
                        <p className="text-xs text-muted">{reel.hookType}</p>
                        {reel.caption && <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{reel.caption}</p>}
                      </div>
                      <ScoreRing score={reel.score} />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="font-medium text-muted mb-0.5">{t("reelradar.whyScored")}</p>
                        <p className="text-foreground/80 leading-relaxed">{reel.whyScored}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted mb-0.5">{t("reelradar.hook")}</p>
                        <p className="text-foreground/80 leading-relaxed">{reel.hook}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted mb-0.5">{t("reelradar.structure")}</p>
                        <p className="text-foreground/80 leading-relaxed">{reel.structure}</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted mb-0.5">{t("reelradar.cta")}</p>
                        <p className="text-foreground/80 leading-relaxed">{reel.cta}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setTranscriptOpen((prev) => ({ ...prev, [reel.id]: !prev[reel.id] }))}
                      className="text-[11px] font-medium text-muted hover:text-brand-pink transition"
                    >
                      {showTranscript ? t("reelradar.hideTranscript") : t("reelradar.showTranscript")}
                    </button>
                    {showTranscript && (
                      <p className="text-xs text-foreground/70 leading-relaxed bg-background rounded-lg p-3">{reel.transcript}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleGenerate(reel.id, "rewrite")}
                        disabled={busyId === reel.id}
                        className="rounded-lg border border-border text-xs font-medium px-3 py-1.5 hover:bg-background transition disabled:opacity-60"
                      >
                        {busyId === reel.id ? t("reelradar.rewriting") : t("reelradar.rewrite")}
                      </button>
                      <button
                        onClick={() => handleGenerate(reel.id, "remix")}
                        disabled={busyId === reel.id}
                        className="rounded-lg border border-border text-xs font-medium px-3 py-1.5 hover:bg-background transition disabled:opacity-60"
                      >
                        {busyId === reel.id ? t("reelradar.rewriting") : t("reelradar.remix")}
                      </button>
                    </div>

                    {genText && (
                      <div className="rounded-xl brand-gradient-soft border border-brand-pink/20 p-3 text-xs">
                        <p className="font-medium text-brand-pink mb-1">
                          {genMode === "rewrite" ? t("reelradar.rewriteResultTitle") : t("reelradar.remix")}
                        </p>
                        <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{genText}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {visibleCount < sorted.length && (
        <div className="mt-5 text-center">
          <button
            onClick={() => setVisibleCount((v) => v + 3)}
            className="rounded-xl border border-border text-sm font-medium px-4 py-2 hover:bg-background transition"
          >
            {t("reelradar.loadMore")}
          </button>
        </div>
      )}

      {modalOpen && <AddReelModal source="radar" onClose={() => setModalOpen(false)} onAdded={load} />}
    </div>
  );
}
