"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";
import AddReelModal from "./AddReelModal";

interface Reel {
  id: string;
  account: string;
  hookType: string;
  plays: string;
  score: number;
  color: string;
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
  const [scanning, setScanning] = useState(false);

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

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await fetch("/api/reel-radar/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "discover" }),
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

  const byAccount = new Map<string, { appearances: number; scoreSum: number }>();
  for (const r of reels) {
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
            onClick={handleScan}
            disabled={scanning}
            className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:opacity-90 transition disabled:opacity-60"
          >
            {scanning ? t("reelradar.scanning") : t("discover.scanButton")}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-background border border-border p-3.5 text-xs text-muted leading-relaxed mb-2">
        {t("discover.whyNoHashtag")}
      </div>
      <p className="text-[11px] text-muted mb-6">{t("discover.frequencyNote")}</p>

      <div className="mb-6">
        <p className="text-xs font-medium text-muted uppercase tracking-wide mb-2">{t("setup.keywordsTitle")}</p>
        <div className="flex flex-wrap gap-1.5">
          {keywords.map((k) => (
            <span key={k.id} className="rounded-full bg-background border border-border px-2.5 py-1 text-xs">
              {k.term}
            </span>
          ))}
        </div>
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
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold mb-3">{t("discover.foundReels")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {reels.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
                  <div
                    className="h-28 flex items-center justify-center text-white text-2xl"
                    style={{ background: `linear-gradient(160deg, ${r.color}, ${r.color}88)` }}
                  >
                    ▶
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium">{r.account}</p>
                    <p className="text-[11px] text-muted">
                      {r.hookType} · {r.plays} · {r.score}/10
                    </p>
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
