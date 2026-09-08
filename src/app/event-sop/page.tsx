"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useLanguage } from "@/lib/i18n";
import { useConfig } from "@/lib/config";

export default function EventSopPage() {
  const { t, lang } = useLanguage();
  const { eventTemplates } = useConfig();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [added, setAdded] = useState(false);

  const selected = eventTemplates.find((tpl) => tpl.id === selectedId) ?? null;

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title={t("eventsop.title")} subtitle={t("eventsop.subtitle")} />

      <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">{t("eventsop.selectPrompt")}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {eventTemplates.map((tpl) => (
          <button
            key={tpl.id}
            onClick={() => {
              setSelectedId(tpl.id);
              setAdded(false);
            }}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedId === tpl.id ? "border-brand-pink bg-brand-pink/5" : "border-border bg-surface hover:bg-background"
            }`}
          >
            <span className="text-2xl">{tpl.icon}</span>
            <p className="text-sm font-medium mt-2">{lang === "zh" ? tpl.titleZh : tpl.titleEn}</p>
          </button>
        ))}

        <a
          href="/cms"
          className="rounded-2xl border border-dashed border-border p-4 text-left text-muted hover:border-brand-pink hover:text-brand-pink transition flex flex-col justify-center items-start"
        >
          <span className="text-2xl">＋</span>
          <p className="text-sm font-medium mt-2">{t("cms.eventTemplates.addTemplate")}</p>
        </a>
      </div>

      {selected && (
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-semibold">
              {selected.icon} {lang === "zh" ? selected.titleZh : selected.titleEn}
            </p>
            <button
              onClick={() => setAdded(true)}
              className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2 hover:opacity-90 transition"
            >
              {added ? "✓" : t("eventsop.addToCalendar")}
            </button>
          </div>
          {selected.steps.length === 0 ? (
            <p className="text-sm text-muted italic">{t("cms.images.empty")}</p>
          ) : (
            <ol className="border-l border-border ml-2 space-y-5">
              {selected.steps.map((step, idx) => (
                <li key={idx} className="relative pl-5">
                  <span className="absolute left-0 top-1.5 -translate-x-1/2 w-2.5 h-2.5 rounded-full brand-gradient" />
                  <p className="text-sm font-medium">{lang === "zh" ? step.taskZh : step.taskEn}</p>
                  <p className="text-[11px] text-muted">
                    {step.daysBefore > 0
                      ? `${step.daysBefore} ${t("eventsop.daysBefore")}`
                      : step.daysBefore === 0
                      ? lang === "zh"
                        ? "活动当天"
                        : "Event day"
                      : lang === "zh"
                      ? `活动后 ${Math.abs(step.daysBefore)} 天`
                      : `${Math.abs(step.daysBefore)} days after`}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
