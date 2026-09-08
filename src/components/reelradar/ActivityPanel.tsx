"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

interface LogEntry {
  id: string;
  time: string;
  summary: string;
}

export default function ActivityPanel({ onClose }: { onClose: () => void }) {
  const { t } = useLanguage();
  const [log, setLog] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reel-radar/activity")
      .then((r) => r.json())
      .then((json) => {
        setLog(json.entries ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-surface shadow-xl flex flex-col">
        <div className="brand-gradient px-5 py-5 text-white">
          <button onClick={onClose} className="text-white/80 hover:text-white text-sm mb-3">
            {t("detail.close")}
          </button>
          <h2 className="text-lg font-semibold">{t("reelradar.activityLog")}</h2>
          <p className="text-xs text-white/80 mt-1">{t("reelradar.activityDesc")}</p>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {loading ? (
            <p className="text-sm text-muted">{t("reelradar.loading")}</p>
          ) : log.length === 0 ? (
            <p className="text-sm text-muted">{t("reelradar.empty")}</p>
          ) : (
            log.map((entry) => (
              <div key={entry.id} className="rounded-xl border border-border p-3.5">
                <p className="text-[11px] text-muted mb-1">{entry.time}</p>
                <p className="text-sm leading-relaxed">{entry.summary}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
