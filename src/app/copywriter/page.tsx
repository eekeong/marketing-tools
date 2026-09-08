"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import Pill from "@/components/Pill";
import { useConfig } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { Platform } from "@/lib/types";

const TONES = ["friendly", "professional", "promo", "playful"] as const;

const SAMPLE_DRAFTS = [
  "🎓 中秋团圆，也是孩子学习冲刺的好时机！即日起报名享 20% 折扣，名额有限，8月底截止 —— 立即私讯我们抢位！",
  "开学在即，你还在犹豫吗？现在报名立省 20%，让孩子赢在新学期起跑线。名额有限，先到先得，8月底截止报名。",
  "教育投资，越早越值得。中秋优惠：即刻报名可享 20% 折扣，专业师资 + 小班教学，帮孩子打好基础。截止日期：8月31日。",
];

export default function CopywriterPage() {
  const { t, lang } = useLanguage();
  const { platforms } = useConfig();
  const allPlatforms = Object.keys(platforms) as Platform[];

  const [input, setInput] = useState("");
  const [tone, setTone] = useState<(typeof TONES)[number]>("friendly");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["facebook", "instagram"]);
  const [drafts, setDrafts] = useState<string[] | null>(null);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const togglePlatform = (pf: Platform) => {
    setSelectedPlatforms((prev) => (prev.includes(pf) ? prev.filter((p) => p !== pf) : [...prev, pf]));
  };

  const handleGenerate = () => {
    setDrafts(SAMPLE_DRAFTS);
  };

  const handleCopy = (idx: number, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title={t("copywriter.title")} subtitle={t("copywriter.subtitle")} />

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-5 h-fit">
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("copywriter.inputLabel")}</label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              placeholder={t("copywriter.inputPlaceholder")}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("copywriter.toneLabel")}</label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tn) => (
                <button
                  key={tn}
                  onClick={() => setTone(tn)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                    tone === tn ? "brand-gradient text-white border-transparent" : "text-muted border-border"
                  }`}
                >
                  {t(`copywriter.tone.${tn}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("copywriter.platformLabel")}</label>
            <div className="flex flex-wrap gap-2">
              {allPlatforms.map((pf) => {
                const meta = platforms[pf];
                const active = selectedPlatforms.includes(pf);
                return (
                  <button
                    key={pf}
                    onClick={() => togglePlatform(pf)}
                    className="rounded-full px-3 py-1.5 text-xs font-medium border transition"
                    style={
                      active
                        ? { backgroundColor: meta.bg, color: meta.color, borderColor: meta.color }
                        : { borderColor: "var(--border)", color: "var(--muted)" }
                    }
                  >
                    {meta[lang]}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!input.trim()}
            className="w-full rounded-xl brand-gradient text-white text-sm font-medium py-2.5 disabled:opacity-40"
          >
            {t("copywriter.generate")}
          </button>
        </div>

        <div>
          {!drafts ? (
            <div className="rounded-2xl border border-dashed border-border h-full min-h-[240px] flex items-center justify-center text-sm text-muted p-8 text-center">
              {t("common.comingSoonNote")}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{t("copywriter.resultsTitle")}</p>
                <button onClick={handleGenerate} className="text-xs font-medium text-brand-pink hover:underline">
                  {t("copywriter.regenerate")}
                </button>
              </div>
              {drafts.map((draft, idx) => (
                <div key={idx} className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                  <div className="flex flex-wrap gap-1.5">
                    {selectedPlatforms.map((pf) => (
                      <Pill key={pf} label={platforms[pf][lang]} color={platforms[pf].color} bg={platforms[pf].bg} />
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{draft}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                      {draft.length} {t("multiplatform.charCount")}
                    </span>
                    <button
                      onClick={() => handleCopy(idx, draft)}
                      className="text-xs font-medium text-brand-pink hover:underline"
                    >
                      {copiedIdx === idx ? t("copywriter.copied") : t("copywriter.copy")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
