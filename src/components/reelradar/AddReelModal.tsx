"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n";
import { ReelSource } from "@/lib/reelRadarTypes";

export default function AddReelModal({
  source,
  onClose,
  onAdded,
}: {
  source: ReelSource;
  onClose: () => void;
  onAdded: () => void;
}) {
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [account, setAccount] = useState("");
  const [text, setText] = useState("");
  const [plays, setPlays] = useState("");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = url.trim() && account.trim() && text.trim() && !submitting;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reel-radar/reels/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, account, text, plays, likes, comments, source }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      onAdded();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface border border-border p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{t("reelradar.addReelTitle")}</h3>
          <p className="text-xs text-muted mt-1">{t("reelradar.addReelDesc")}</p>
        </div>

        <div>
          <label className="text-xs font-medium text-muted mb-1 block">{t("reelradar.addReelUrl")}</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.instagram.com/reel/..."
            className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted mb-1 block">{t("reelradar.addReelAccount")}</label>
          <input
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            placeholder="smartkids.edu"
            className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted mb-1 block">{t("reelradar.addReelText")}</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            placeholder={t("reelradar.addReelTextPlaceholder")}
            className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">{t("reelradar.addReelPlays")}</label>
            <input
              type="number"
              value={plays}
              onChange={(e) => setPlays(e.target.value)}
              className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">{t("reelradar.addReelLikes")}</label>
            <input
              type="number"
              value={likes}
              onChange={(e) => setLikes(e.target.value)}
              className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted mb-1 block">{t("reelradar.addReelComments")}</label>
            <input
              type="number"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full rounded-lg border border-border bg-background text-foreground px-3 py-2 text-sm"
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button onClick={onClose} className="text-sm font-medium text-muted px-3 py-2">
            {t("action.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 disabled:opacity-50"
          >
            {submitting ? t("reelradar.addReelAnalyzing") : t("reelradar.addReelSubmit")}
          </button>
        </div>
      </div>
    </div>
  );
}
