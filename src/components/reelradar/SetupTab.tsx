"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

interface Competitor {
  id: string;
  ig_username: string;
  status: "active" | "paused";
  last_scanned_at: string | null;
}

interface Keyword {
  id: string;
  term: string;
}

interface Settings {
  niche_description: string;
  what_i_sell: string;
  reels_per_account: number;
  my_ig_username: string | null;
}

export default function SetupTab() {
  const { t } = useLanguage();
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [useMyTone, setUseMyToneState] = useState(true);
  const [loading, setLoading] = useState(true);

  const [newHandle, setNewHandle] = useState("");
  const [newKeyword, setNewKeyword] = useState("");

  const load = async () => {
    const [compRes, kwRes, settingsRes] = await Promise.all([
      fetch("/api/reel-radar/competitors").then((r) => r.json()),
      fetch("/api/reel-radar/keywords").then((r) => r.json()),
      fetch("/api/reel-radar/settings").then((r) => r.json()),
    ]);
    setCompetitors(compRes.competitors ?? []);
    setKeywords(kwRes.keywords ?? []);
    setSettings(settingsRes.settings ?? null);
    setUseMyToneState(settingsRes.voiceProfile?.enabled ?? true);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addCompetitor = async () => {
    if (!newHandle.trim()) return;
    await fetch("/api/reel-radar/competitors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle: newHandle }),
    });
    setNewHandle("");
    load();
  };

  const togglePause = async (c: Competitor) => {
    await fetch(`/api/reel-radar/competitors/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: c.status === "paused" ? "active" : "paused" }),
    });
    load();
  };

  const removeCompetitor = async (id: string) => {
    await fetch(`/api/reel-radar/competitors/${id}`, { method: "DELETE" });
    load();
  };

  const addKeyword = async () => {
    if (!newKeyword.trim()) return;
    await fetch("/api/reel-radar/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ term: newKeyword }),
    });
    setNewKeyword("");
    load();
  };

  const removeKeyword = async (id: string) => {
    await fetch(`/api/reel-radar/keywords?id=${id}`, { method: "DELETE" });
    load();
  };

  const toggleTone = async () => {
    const next = !useMyTone;
    setUseMyToneState(next);
    await fetch("/api/reel-radar/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ useMyTone: next }),
    });
  };

  const saveSettings = async (patch: Partial<Settings>) => {
    setSettings((s) => (s ? { ...s, ...patch } : s));
    await fetch("/api/reel-radar/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  if (loading || !settings) return <p className="text-sm text-muted">{t("reelradar.loading")}</p>;

  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold mb-1">{t("setup.title")}</h2>
        <p className="text-sm text-muted">{t("setup.subtitle")}</p>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">{t("setup.competitorsTitle")}</p>
        <p className="text-xs text-muted mb-3">{t("setup.competitorsDesc", { count: String(competitors.length) })}</p>
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
          {competitors.map((acc) => (
            <div key={acc.id} className="flex items-center justify-between gap-3 p-3.5">
              <div>
                <p className={`text-sm font-medium ${acc.status === "paused" ? "text-muted line-through" : ""}`}>
                  @{acc.ig_username}
                </p>
                <p className="text-[11px] text-muted">
                  {t("setup.lastScan")}: {acc.last_scanned_at ? acc.last_scanned_at.replace("T", " ").slice(0, 16) : "—"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => togglePause(acc)} className="text-xs font-medium text-muted hover:text-brand-pink">
                  {acc.status === "paused" ? t("setup.resume") : t("setup.pause")}
                </button>
                <button onClick={() => removeCompetitor(acc.id)} className="text-xs font-medium text-muted hover:text-red-500">
                  {t("action.delete")}
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <input
            value={newHandle}
            onChange={(e) => setNewHandle(e.target.value)}
            placeholder={t("setup.addCompetitor")}
            className="flex-1 rounded-lg border border-border bg-surface text-foreground px-3 py-1.5 text-sm"
          />
          <button
            onClick={addCompetitor}
            disabled={!newHandle.trim()}
            className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-1.5 disabled:opacity-40"
          >
            {t("action.add")}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">{t("setup.keywordsTitle")}</p>
        <p className="text-xs text-muted mb-3">{t("setup.keywordsDesc", { count: String(keywords.length) })}</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {keywords.map((k) => (
            <span key={k.id} className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1.5 text-sm">
              {k.term}
              <button onClick={() => removeKeyword(k.id)} className="text-muted hover:text-red-500">
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newKeyword}
            onChange={(e) => setNewKeyword(e.target.value)}
            placeholder={t("setup.addKeyword")}
            className="flex-1 max-w-xs rounded-lg border border-border bg-surface text-foreground px-3 py-1.5 text-sm"
          />
          <button
            onClick={addKeyword}
            disabled={!newKeyword.trim()}
            className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-1.5 disabled:opacity-40"
          >
            {t("action.add")}
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-1">{t("setup.toneTitle")}</p>
        <p className="text-xs text-muted mb-3">{t("setup.toneDesc")}</p>
        <div className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{t("setup.toneToggle")}</p>
            <p className="text-[11px] text-muted mt-0.5">{t("setup.toneOffNote")}</p>
          </div>
          <button
            onClick={toggleTone}
            className={`w-11 h-6 rounded-full transition relative shrink-0 ${useMyTone ? "brand-gradient" : "bg-border"}`}
          >
            <span
              className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
                useMyTone ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-3">{t("setup.scanTitle")}</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("setup.domainLabel")}</label>
            <textarea
              value={settings.niche_description}
              onChange={(e) => setSettings((s) => (s ? { ...s, niche_description: e.target.value } : s))}
              onBlur={(e) => saveSettings({ niche_description: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("setup.sellingPointLabel")}</label>
            <textarea
              value={settings.what_i_sell}
              onChange={(e) => setSettings((s) => (s ? { ...s, what_i_sell: e.target.value } : s))}
              onBlur={(e) => saveSettings({ what_i_sell: e.target.value })}
              rows={2}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("setup.reelsPerAccountLabel")}</label>
            <input
              type="number"
              value={settings.reels_per_account}
              onChange={(e) => setSettings((s) => (s ? { ...s, reels_per_account: Number(e.target.value) || 0 } : s))}
              onBlur={(e) => saveSettings({ reels_per_account: Number(e.target.value) || 0 })}
              className="w-24 rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("setup.myIgLabel")}</label>
            <input
              value={settings.my_ig_username ?? ""}
              onChange={(e) => setSettings((s) => (s ? { ...s, my_ig_username: e.target.value } : s))}
              onBlur={(e) => saveSettings({ my_ig_username: e.target.value.trim().replace(/^@/, "") || null })}
              placeholder="smartkids.edu"
              className="w-full max-w-xs rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
