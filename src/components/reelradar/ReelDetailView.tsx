"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import { formatStructureStep } from "@/lib/reelRadarTypes";
import SignalMeter from "./SignalMeter";

interface ReelDetail {
  id: string;
  account: string;
  igUrl: string;
  caption: string;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  postedAt: string | null;
  plays: string;
  likes: string;
  comments: string;
  color: string;
  score: number;
  hookType: string;
  hookText: string;
  structure: (string | { title: string; description: string })[];
  ctaText: string;
  whyScored: string;
  angle: string;
  transcript: string;
  hasSpeech: boolean;
  language: string | null;
  rewrite: string | null;
  remix: string | null;
}

export default function ReelDetailView({ id }: { id: string }) {
  const { t } = useLanguage();
  const [reel, setReel] = useState<ReelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [busyMode, setBusyMode] = useState<"rewrite" | "remix" | null>(null);
  const [genMode, setGenMode] = useState<"rewrite" | "remix" | null>(null);

  useEffect(() => {
    fetch(`/api/reel-radar/reels/${id}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setNotFound(true);
        } else {
          setReel(json.reel);
        }
        setLoading(false);
      });
  }, [id]);

  const handleGenerate = async (mode: "rewrite" | "remix") => {
    setBusyMode(mode);
    try {
      const res = await fetch(`/api/reel-radar/reels/${id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      setReel((prev) => (prev ? { ...prev, [mode === "rewrite" ? "rewrite" : "remix"]: json.text } : prev));
      setGenMode(mode);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setBusyMode(null);
    }
  };

  if (loading) return <p className="text-sm text-muted">{t("reelradar.loading")}</p>;
  if (notFound || !reel) return <p className="text-sm text-muted">{t("reeldetail.notFound")}</p>;

  const genText = genMode === "rewrite" ? reel.rewrite : genMode === "remix" ? reel.remix : null;
  const showVideo = reel.videoUrl && !videoFailed;
  const showImage = !showVideo && reel.thumbnailUrl && !imgFailed;

  return (
    <div>
      <Link href="/reel-radar" className="text-xs font-medium text-muted hover:text-brand-pink transition mb-4 inline-block">
        {t("reeldetail.back")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div
            className="relative rounded-2xl overflow-hidden aspect-[9/16] max-h-[560px] flex items-center justify-center text-white text-4xl"
            style={!showVideo && !showImage ? { background: `linear-gradient(160deg, ${reel.color}, ${reel.color}88)` } : undefined}
          >
            {showVideo ? (
              <video
                src={reel.videoUrl!}
                poster={reel.thumbnailUrl ?? undefined}
                controls
                onError={() => setVideoFailed(true)}
                className="absolute inset-0 w-full h-full object-cover bg-black"
              />
            ) : showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={reel.thumbnailUrl!} alt="" onError={() => setImgFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <span>▶</span>
            )}
          </div>
          {!showVideo && <p className="text-[11px] text-muted mt-2">{t("reeldetail.videoUnavailable")}</p>}

          <p className="text-xs text-muted mt-3">
            ▶ {reel.plays} · ♥ {reel.likes} · 💬 {reel.comments}
          </p>
          <a
            href={reel.igUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center rounded-xl border border-border text-sm font-medium px-4 py-2.5 hover:bg-background transition"
          >
            {t("discover.openIG")} ↗
          </a>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <a href={reel.igUrl} target="_blank" rel="noopener noreferrer" className="text-base font-semibold hover:text-brand-pink transition">
                {reel.account}
              </a>
              {reel.postedAt && (
                <p className="text-xs text-muted">
                  {t("reeldetail.postedOn")} {reel.postedAt.slice(0, 10)}
                </p>
              )}
            </div>
            <SignalMeter score={reel.score} size="lg" />
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => handleGenerate("rewrite")}
              disabled={busyMode !== null}
              className="rounded-xl brand-gradient text-white text-sm font-medium py-3 disabled:opacity-60"
            >
              {busyMode === "rewrite" ? t("reelradar.rewriting") : t("reelradar.rewrite")}
            </button>
            <button
              onClick={() => handleGenerate("remix")}
              disabled={busyMode !== null}
              className="rounded-xl border border-border text-sm font-medium py-3 hover:bg-background transition disabled:opacity-60"
            >
              {busyMode === "remix" ? t("reelradar.rewriting") : t("reelradar.remix")}
            </button>
          </div>
          <p className="text-[11px] text-muted mb-5 leading-relaxed">{t("reeldetail.rewriteExplain")}</p>

          {genText && (
            <div className="rounded-xl brand-gradient-soft border border-brand-pink/20 p-3 text-xs mb-5">
              <p className="font-medium text-brand-pink mb-1">
                {genMode === "rewrite" ? t("reelradar.rewriteResultTitle") : t("reelradar.remix")}
              </p>
              <p className="whitespace-pre-wrap leading-relaxed text-foreground/90">{genText}</p>
            </div>
          )}

          <div className="space-y-4">
            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
                {t("reeldetail.whyScoredLabel")} {reel.score}/10
              </p>
              <p className="text-sm text-foreground/80 leading-relaxed">{reel.whyScored}</p>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("reeldetail.hookLabel")}</p>
                <span className="rounded-full bg-background border border-border text-[10px] px-2 py-0.5 text-muted">{reel.hookType}</span>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed">&ldquo;{reel.hookText}&rdquo;</p>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-2">{t("reeldetail.structureLabel")}</p>
              <ol className="space-y-2">
                {reel.structure.map((step, i) => {
                  const s = formatStructureStep(step);
                  return (
                    <li key={i} className="flex gap-3">
                      <span className="w-5 h-5 rounded-full bg-background border border-border text-[11px] flex items-center justify-center shrink-0 font-medium text-muted">
                        {i + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{s.title}</p>
                        {s.description && <p className="text-xs text-foreground/70 leading-relaxed">{s.description}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </section>

            <section>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">{t("reeldetail.ctaLabel")}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{reel.ctaText}</p>
            </section>

            {reel.angle && (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">{t("reeldetail.angleLabel")}</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{reel.angle}</p>
              </section>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTranscript((v) => !v)}
                className="text-[11px] font-medium text-muted hover:text-brand-pink transition"
              >
                {showTranscript ? t("reelradar.hideTranscript") : t("reelradar.showTranscript")}
              </button>
              {reel.language && (
                <span className="text-[11px] text-muted">
                  {t("reeldetail.languageLabel")} {reel.language}
                </span>
              )}
            </div>
            {showTranscript && (
              <p className="text-xs text-foreground/70 leading-relaxed bg-background rounded-lg p-3">{reel.transcript || reel.caption}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
