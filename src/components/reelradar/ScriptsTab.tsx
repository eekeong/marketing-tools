"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

type ScriptStatus = "draft" | "shot" | "archived";

interface Beat {
  text: string;
  shot: string;
  seconds: number;
}

interface Script {
  id: string;
  title: string;
  hook: string;
  date: string;
  status: ScriptStatus;
  beats: Beat[];
  cta: string;
  caption: string;
}

function totalDuration(script: Script) {
  return script.beats.reduce((s, b) => s + b.seconds, 3);
}

const STATUS_META: Record<ScriptStatus, { labelKey: string; color: string; bg: string }> = {
  draft: { labelKey: "scripts.statusDraft", color: "#B45309", bg: "#FEF3C7" },
  shot: { labelKey: "scripts.statusShot", color: "#16A34A", bg: "#DCFCE7" },
  archived: { labelKey: "scripts.statusArchived", color: "#837C8D", bg: "#F1EFF3" },
};

export default function ScriptsTab() {
  const { t } = useLanguage();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = async () => {
    const json = await fetch("/api/reel-radar/scripts").then((r) => r.json());
    setScripts(json.scripts ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/reel-radar/scripts", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setScripts((prev) => [...(json.scripts ?? []), ...prev]);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  const updateScript = (id: string, patch: Partial<Script>) => {
    setScripts((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const persist = (id: string, patch: Partial<Script>) => {
    fetch(`/api/reel-radar/scripts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const setStatus = (id: string, status: ScriptStatus) => {
    updateScript(id, { status });
    persist(id, { status });
  };

  const removeScript = async (id: string) => {
    setScripts((prev) => prev.filter((s) => s.id !== id));
    if (openId === id) setOpenId(null);
    await fetch(`/api/reel-radar/scripts/${id}`, { method: "DELETE" });
  };

  const open = scripts.find((s) => s.id === openId) ?? null;

  if (open) {
    const fullText = [
      open.title,
      "",
      t("scripts.hook") + "：" + open.hook,
      "",
      ...open.beats.map((b, i) => `${i + 1}. ${b.text}（${t("scripts.shotLabel")}：${b.shot}，${b.seconds}秒）`),
      "",
      t("scripts.ctaEnding") + "：" + open.cta,
      "",
      open.caption,
    ].join("\n");

    return (
      <div>
        <button
          onClick={() => {
            setOpenId(null);
            setEditing(false);
          }}
          className="text-sm font-medium text-muted hover:text-brand-pink mb-4"
        >
          {t("scripts.back")}
        </button>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] text-muted uppercase tracking-wide">{t("scripts.coverTitle")}</p>
              {editing ? (
                <input
                  value={open.title}
                  onChange={(e) => updateScript(open.id, { title: e.target.value })}
                  onBlur={(e) => persist(open.id, { title: e.target.value })}
                  className="text-xl font-semibold mt-1 w-full rounded-lg border border-border bg-surface px-2 py-1"
                />
              ) : (
                <h2 className="text-xl font-semibold mt-1">{open.title}</h2>
              )}
              <p className="text-xs text-muted mt-1">
                {t("scripts.duration")}: {totalDuration(open)}s · {open.date}
              </p>
            </div>
            <button
              onClick={() => setEditing((e) => !e)}
              className="rounded-lg border border-border text-xs font-medium px-3 py-1.5 hover:bg-background shrink-0"
            >
              {editing ? t("action.save") : t("scripts.edit")}
            </button>
          </div>

          <div>
            <p className="text-xs font-medium text-muted mb-1">{t("scripts.hook")}</p>
            {editing ? (
              <textarea
                value={open.hook}
                onChange={(e) => updateScript(open.id, { hook: e.target.value })}
                onBlur={(e) => persist(open.id, { hook: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm"
              />
            ) : (
              <p className="text-sm">{open.hook}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted mb-2">{t("scripts.beats")}</p>
            <div className="space-y-2">
              {open.beats.map((beat, idx) => (
                <div key={idx} className="rounded-lg border border-border p-3 text-sm">
                  {editing ? (
                    <>
                      <textarea
                        value={beat.text}
                        onChange={(e) => {
                          const beats = [...open.beats];
                          beats[idx] = { ...beat, text: e.target.value };
                          updateScript(open.id, { beats });
                        }}
                        onBlur={() => persist(open.id, { beats: open.beats })}
                        rows={2}
                        className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm mb-1.5"
                      />
                      <div className="flex gap-2">
                        <input
                          value={beat.shot}
                          onChange={(e) => {
                            const beats = [...open.beats];
                            beats[idx] = { ...beat, shot: e.target.value };
                            updateScript(open.id, { beats });
                          }}
                          onBlur={() => persist(open.id, { beats: open.beats })}
                          className="flex-1 rounded-md border border-border bg-surface px-2 py-1 text-xs"
                        />
                        <input
                          type="number"
                          value={beat.seconds}
                          onChange={(e) => {
                            const beats = [...open.beats];
                            beats[idx] = { ...beat, seconds: Number(e.target.value) || 0 };
                            updateScript(open.id, { beats });
                          }}
                          onBlur={() => persist(open.id, { beats: open.beats })}
                          className="w-16 rounded-md border border-border bg-surface px-2 py-1 text-xs"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p>{beat.text}</p>
                      <p className="text-[11px] text-muted mt-1">
                        {t("scripts.shotLabel")}：{beat.shot} · {beat.seconds}s
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted mb-1">{t("scripts.ctaEnding")}</p>
            {editing ? (
              <textarea
                value={open.cta}
                onChange={(e) => updateScript(open.id, { cta: e.target.value })}
                onBlur={(e) => persist(open.id, { cta: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm"
              />
            ) : (
              <p className="text-sm">{open.cta}</p>
            )}
          </div>

          <div>
            <p className="text-xs font-medium text-muted mb-1">{t("scripts.captionHashtags")}</p>
            {editing ? (
              <textarea
                value={open.caption}
                onChange={(e) => updateScript(open.id, { caption: e.target.value })}
                onBlur={(e) => persist(open.id, { caption: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-surface px-2.5 py-2 text-sm"
              />
            ) : (
              <p className="text-sm">{open.caption}</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-border">
            <p className="text-[11px] text-muted max-w-xs">{t("scripts.autosaveNote")}</p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(fullText).catch(() => {});
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 shrink-0"
            >
              {copied ? t("scripts.copied") : t("scripts.copyAll")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold">{t("scripts.title")}</h2>
          <p className="text-sm text-muted mt-1 max-w-2xl">{t("scripts.subtitle")}</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:opacity-90 transition disabled:opacity-60 shrink-0"
        >
          {generating ? t("scripts.generating") : t("scripts.generate")}
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-muted">{t("reelradar.loading")}</p>
      ) : scripts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 flex items-center justify-center text-sm text-muted text-center px-8">
          {t("reelradar.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {scripts.map((s) => {
            const meta = STATUS_META[s.status];
            return (
              <div key={s.id} className="rounded-2xl border border-border bg-surface p-4 space-y-2">
                <button onClick={() => setOpenId(s.id)} className="text-left w-full">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mb-2"
                    style={{ color: meta.color, backgroundColor: meta.bg }}
                  >
                    {t(meta.labelKey)}
                  </span>
                  <p className="text-sm font-semibold leading-snug">{s.title}</p>
                  <p className="text-xs text-muted mt-1 line-clamp-2">{s.hook}</p>
                  <p className="text-[11px] text-muted mt-2">
                    {totalDuration(s)}s · {s.date}
                  </p>
                </button>
                <div className="flex items-center gap-1 pt-2 border-t border-border text-[11px]">
                  <button onClick={() => setOpenId(s.id)} className="flex-1 text-muted hover:text-brand-pink py-1">
                    {t("scripts.edit")}
                  </button>
                  <button onClick={() => setStatus(s.id, "shot")} className="flex-1 text-muted hover:text-brand-pink py-1">
                    {t("scripts.markShot")}
                  </button>
                  <button onClick={() => setStatus(s.id, "archived")} className="flex-1 text-muted hover:text-brand-pink py-1">
                    {t("scripts.archive")}
                  </button>
                  <button onClick={() => removeScript(s.id)} className="flex-1 text-muted hover:text-red-500 py-1">
                    {t("scripts.delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
