"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import SignalMeter from "./SignalMeter";

interface GridReel {
  id: string;
  account: string;
  hookType: string;
  plays: string;
  likes: string;
  comments: string;
  score: number;
  viralMultiple: number | null;
  isNew: boolean;
  color: string;
  caption: string;
  topicTitle: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  igUrl: string;
}

export default function ReelGridCard({
  reel,
  selectMode,
  selected,
  onToggleSelect,
  onDelete,
}: {
  reel: GridReel;
  selectMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [imgFailed, setImgFailed] = useState(false);
  const [playing, setPlaying] = useState(false);

  const showImage = reel.thumbnailUrl && !imgFailed;

  const openDetail = () => {
    if (playing) return;
    router.push(`/reel-radar/reel/${reel.id}`);
  };

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (reel.videoUrl) {
      setPlaying((v) => !v);
    } else {
      window.open(reel.igUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      onClick={openDetail}
      className="flex flex-col rounded-2xl border border-border bg-surface overflow-hidden cursor-pointer hover:border-brand-pink transition"
    >
      <div className="relative aspect-[9/16] shrink-0 bg-[#2a2333]">
        {selectMode && (
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={onToggleSelect}
            className="absolute z-20 top-2 left-2 w-4 h-4"
          />
        )}

        {playing && reel.videoUrl ? (
          <video
            src={reel.videoUrl}
            controls
            autoPlay
            onClick={(e) => e.stopPropagation()}
            onEnded={() => setPlaying(false)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            {showImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={reel.thumbnailUrl!}
                alt=""
                onError={() => setImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(160deg, ${reel.color}, ${reel.color}88)` }}
              />
            )}

            <div className="absolute top-1.5 right-1.5 z-10 rounded-full bg-black/55 backdrop-blur-sm px-2 py-1 text-white">
              <SignalMeter score={reel.score} />
            </div>

            {reel.viralMultiple && (
              <span className="absolute top-1.5 left-1.5 z-10 rounded-full bg-yellow-400 text-[9.5px] font-bold px-2 py-0.5 text-black">
                {t("reelradar.viral")} ×{reel.viralMultiple}
              </span>
            )}
            {!reel.viralMultiple && reel.isNew && (
              <span className="absolute top-1.5 left-1.5 z-10 rounded-full bg-brand-pink text-[9.5px] font-bold px-2 py-0.5 text-white">
                {t("reelradar.new")}
              </span>
            )}

            <button
              onClick={togglePlay}
              className="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-[1px] text-white text-sm flex items-center justify-center opacity-80 hover:opacity-100 hover:!bg-brand-pink hover:scale-110 transition"
            >
              ▶
            </button>

            <div className="absolute inset-x-0 bottom-0 px-2 pt-4 pb-1.5 text-white text-[11px] font-bold truncate bg-gradient-to-t from-black/70 to-transparent">
              {reel.account}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-col gap-1 p-2.5 flex-1">
        <span className="brand-gradient-soft w-fit rounded-full text-brand-purple text-[9.5px] font-semibold px-2 py-0.5">
          {reel.hookType}
        </span>
        {reel.topicTitle && (
          <p className="text-[11.5px] font-bold text-foreground leading-snug line-clamp-2">{reel.topicTitle}</p>
        )}
        {reel.caption && <p className="text-[11px] text-foreground/70 leading-snug line-clamp-2">{reel.caption}</p>}
        <div className="mt-auto flex items-center justify-between pt-1">
          <p className="text-[10px] font-medium text-muted">
            ▶ {reel.plays} · ♥ {reel.likes}
          </p>
          {!selectMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-[10px] text-muted hover:text-red-500 transition shrink-0"
            >
              {t("action.delete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
