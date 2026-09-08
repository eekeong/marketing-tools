"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useConfig } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { Platform } from "@/lib/types";

const HASHTAGS: Record<Platform, string> = {
  facebook: "#英雄教育 #EduHero",
  instagram: "#英雄教育 #EduHero #招生 #教育",
  tiktok: "#英雄教育 #EduHero #fyp",
  whatsapp: "",
  xiaohongshu: "#英雄教育 #教育分享 #家长必看",
  website: "",
};

const LIMITS: Record<Platform, number> = {
  facebook: 500,
  instagram: 300,
  tiktok: 150,
  whatsapp: 1000,
  xiaohongshu: 200,
  website: 2000,
};

function adapt(text: string, platform: Platform) {
  const limit = LIMITS[platform];
  const trimmed = text.length > limit ? text.slice(0, limit - 1) + "…" : text;
  const tags = HASHTAGS[platform];
  return tags ? `${trimmed}\n\n${tags}` : trimmed;
}

export default function MultiPlatformPage() {
  const { t, lang } = useLanguage();
  const { platforms } = useConfig();
  const allPlatforms = Object.keys(platforms) as Platform[];

  const [input, setInput] = useState("");
  const [adapted, setAdapted] = useState<Record<Platform, string> | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleAdapt = () => {
    const result = {} as Record<Platform, string>;
    allPlatforms.forEach((pf) => {
      result[pf] = adapt(input, pf);
    });
    setAdapted(result);
  };

  const handleCopy = (pf: Platform, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedKey(pf);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title={t("multiplatform.title")} subtitle={t("multiplatform.subtitle")} />

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-4 mb-6">
        <label className="text-xs font-medium text-muted block">{t("multiplatform.inputLabel")}</label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          placeholder={t("multiplatform.inputPlaceholder")}
          className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
        />
        <button
          onClick={handleAdapt}
          disabled={!input.trim()}
          className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 disabled:opacity-40"
        >
          {t("multiplatform.adapt")}
        </button>
      </div>

      {adapted && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {allPlatforms.map((pf) => {
            const meta = platforms[pf];
            const text = adapted[pf];
            return (
              <div key={pf} className="rounded-2xl border border-border bg-surface p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ color: meta.color, backgroundColor: meta.bg }}
                  >
                    {meta[lang]}
                  </span>
                  <span className="text-[11px] text-muted">
                    {text.length}/{LIMITS[pf]} {t("multiplatform.charCount")}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">{text}</p>
                <button
                  onClick={() => handleCopy(pf, text)}
                  className="text-xs font-medium text-brand-pink hover:underline"
                >
                  {copiedKey === pf ? t("copywriter.copied") : t("multiplatform.copy")}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-5">
        <p className="text-sm font-medium mb-1">{t("multiplatform.scheduleTitle")}</p>
        <p className="text-sm text-muted mb-4">{t("multiplatform.scheduleNote")}</p>
        <button
          disabled
          className="rounded-xl border border-border text-muted text-sm font-medium px-4 py-2.5 cursor-not-allowed"
        >
          {t("multiplatform.scheduleButton")}
        </button>
      </div>
    </div>
  );
}
