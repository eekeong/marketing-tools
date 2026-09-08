"use client";

import { useLanguage } from "@/lib/i18n";
import { ScanProgress } from "./useScan";

export default function ScanProgressBar({ progress, onCancel }: { progress: ScanProgress; onCancel: () => void }) {
  const { t } = useLanguage();
  const pct = progress.total > 0 ? Math.round(((progress.done + progress.failed) / progress.total) * 100) : progress.phase === "collecting" ? 15 : 0;

  return (
    <div className="rounded-xl border border-border bg-surface p-3.5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-sm font-medium">
          {progress.phase === "collecting"
            ? t("reelradar.phaseCollecting")
            : t("reelradar.phaseAnalyzing", { done: String(progress.done), total: String(progress.total) })}
        </p>
        <button onClick={onCancel} className="text-xs font-medium text-muted hover:text-red-500 transition shrink-0">
          {t("reelradar.cancelScan")}
        </button>
      </div>
      <div className="h-2 rounded-full bg-background overflow-hidden">
        <div className="h-full brand-gradient rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[11px] text-muted mt-2">{t("reelradar.canCloseTab")}</p>
    </div>
  );
}
