"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import AddReelModal from "./AddReelModal";
import ReelThumb from "./ReelThumb";
import ScanProgressBar from "./ScanProgressBar";
import { useScan } from "./useScan";

interface Reel {
  id: string;
  account: string;
  hookType: string;
  plays: string;
  score: number;
  color: string;
  discoveredVia: string | null;
  caption: string;
  language: string | null;
  thumbnailUrl: string | null;
  igUrl: string;
}

interface Keyword {
  id: string;
  term: string;
}

export default function DiscoverTab() {
  const { t } = useLanguage();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [addedHandles, setAddedHandles] = useState<Set<string>>(new Set());
  const [showLowScore, setShowLowScore] = useState(false);

  const load = async () => {
    const [kwRes, reelsRes] = await Promise.all([
      fetch("/api/reel-radar/keywords").then((r) => r.json()),
      fetch("/api/reel-radar/reels?source=discover").then((r) => r.json()),
    ]);
    setKeywords(kwRes.keywords ?? []);
    setReels(reelsRes.reels ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const { progress, error: scanError, start: startScan, cancel: cancelScan, scanning } = useScan("discover", load);

  const languages = Array.from(new Set(reels.map((r) => r.language).filter((l): l is string => !!l)));
  const filteredReels = reels.filter(
    (r) => (languageFilter === "all" || r.language === languageFilter) && (showLowScore || r.score > 3),
  );

  const handleAddToList = async (handle: string) => {
    // A duplicate (already-tracked) handle 500s on the unique constraint — that
    // still means "it's on the list", so mark it added either way.
    await fetch("/api/reel-radar/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: handle.replace(/^@/, "") }),
    }).catch(() => {});
    setAddedHandles((prev) => new Set(prev).add(handle));
  };

  const byAccount = new Map<string, { appearances: number; scoreSum: number }>();
  for (const r of filteredReels) {
    const cur = byAccount.get(r.account) ?? { appearances: 0, scoreSum: 0 };
    cur.appearances += 1;
    cur.scoreSum += r.score;
    byAccount.set(r.account, cur);
  }
  const accounts = Array.from(byAccount.entries())
    .map(([handle, s]) => ({ handle, appearances: s.appearances, avgScore: Math.round((s.scoreSum / s.appearances) * 10) / 10 }))
    .sort((a, b) => b.avgScore - a.avgScore);

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-semibold">{t("discover.title")}</h2>
          <p className="text-sm text-muted mt-1 max-w-2xl">{t("discover.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setModalOpen(true)}
            className="rounded-xl border border-border text-sm font-medium px-4 py-2.5 hover:bg-background transition"
          >
            {t("discover.startButton")}
          </button>
          <button
            onClick={startScan}
            disabled={scanning}
            className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {scanning ? t("reelradar.scanning") : t("discover.scanButton")}
          </button>
        </div>
      </div>

      {scanning && <ScanProgressBar progress={progress} onCancel={cancelScan} />}
      {scanError && <p className="text-xs text-red-500 mb-4">{scanError}</p>}

      <div className="rounded-xl bg-background border border-border p-3.5 text-xs text-muted leading-relaxed mb-2">
        {t("discover.whyNoHashtag")}
      </div>
      <p className="text-[11px] text-muted mb-6">{t("discover.frequencyNote")}</p>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">{t("setup.keywordsTitle")}</p>
          <div className="flex flex-wrap gap-1.5">
            {keywords.map((k) => (
              <span key={k.id} className="rounded-full bg-background border border-border px-2.5 py-1 text-xs">
                {k.term}
              </span>
            ))}
          </div>
        </div>
        {languages.length > 0 && (
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted bg-surface focus:outline-none shrink-0"
          >
            <option value="all">{t("reelradar.allLanguages")}</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t("reelradar.loading")}</p>
      ) : reels.length === 0 ? (
        <p className="text-sm text-muted">{t("reelradar.empty")}</p>
      ) : (
        <>
          <div className="mb-8">
            <p className="text-sm font-semibold mb-1">{t("discover.newAccountsTitle")}</p>
            <p className="text-xs text-muted mb-3">{t("discover.newAccountsDesc")}</p>
            <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
              {accounts.map((acc) => (
                <div key={acc.handle} className="flex items-center justify-between gap-3 p-3.5">
                  <div>
                    <p className="text-sm font-medium">{acc.handle}</p>
                    <p className="text-[11px] text-muted">
                      {acc.appearances} {t("discover.appearances")} · {t("discover.avgScore")} {acc.avgScore}/10
                    </p>
                  </div>
                  <button
                    onClick={() => handleAddToList(acc.handle)}
                    disabled={addedHandles.has(acc.handle)}
                    className="shrink-0 rounded-lg border border-border text-xs font-medium px-3 py-1.5 hover:bg-background transition disabled:opacity-50"
                  >
                    {addedHandles.has(acc.handle) ? t("discover.added") : t("discover.addToList")}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">{t("discover.foundReels")}</p>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-muted">{t("reelradar.lowScoreHidden")}</p>
                <button onClick={() => setShowLowScore((v) => !v)} className="text-[11px] font-medium text-brand-pink hover:opacity-80 transition">
                  {showLowScore ? t("reelradar.hideLowScoreAgain") : t("reelradar.showLowScore")}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {filteredReels.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <ReelThumb thumbnailUrl={r.thumbnailUrl} igUrl={r.igUrl} color={r.color} className="h-28 w-full text-2xl" />
                  <div className="p-3">
                    <a href={r.igUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:text-brand-pink">
                      {r.account}
                    </a>
                    <p className="text-[11px] text-muted">
                      {r.hookType} · {r.plays} · {r.score}/10
                    </p>
                    {r.caption && <p className="text-[11px] text-foreground/70 mt-1 line-clamp-2">{r.caption}</p>}
                    {r.discoveredVia && (
                      <p className="text-[11px] text-brand-pink mt-1">#{r.discoveredVia}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {modalOpen && <AddReelModal source="discover" onClose={() => setModalOpen(false)} onAdded={load} />}
    </div>
  );
}
