"use client";

import { useState } from "react";
import { Post, PostPerformance, PostStatus } from "@/lib/types";
import { useConfig } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import Pill from "@/components/Pill";
import MediaPicker from "@/components/MediaPicker";

export default function PostDetailPanel({
  post,
  onClose,
  onUpdateStatus,
  onUpdatePerformance,
  onSetApproved,
  onAttachMedia,
}: {
  post: Post;
  onClose: () => void;
  onUpdateStatus: (postId: string, status: PostStatus) => void;
  onUpdatePerformance: (postId: string, patch: PostPerformance) => void;
  onSetApproved: (postId: string, approved: boolean) => void;
  onAttachMedia: (assetId: string, mediaUrl: string) => void;
}) {
  const { platforms, statuses, assetStatuses, salesReps } = useConfig();
  const { lang, t } = useLanguage();
  const salesRep = salesReps.find((r) => r.id === post.salesRepId);
  const [perf, setPerf] = useState<PostPerformance>(post.performance ?? {});
  const [pickerForAsset, setPickerForAsset] = useState<string | null>(null);

  const commitPerf = (patch: PostPerformance) => {
    const next = { ...perf, ...patch };
    setPerf(next);
    onUpdatePerformance(post.id, patch);
  };

  const assetsReady = post.assets.every((a) => a.status === "provided");
  const canPublish = assetsReady && !!post.approved;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-surface shadow-xl flex flex-col">
        <div className="brand-gradient px-5 py-5 text-white">
          <button onClick={onClose} className="text-white/80 hover:text-white text-sm mb-3">
            {t("detail.close")}
          </button>
          <p className="text-xs text-white/80">{post.date}</p>
          <h2 className="text-lg font-semibold mt-1">{post.title}</h2>
          <p className="text-xs text-white/80 mt-1">
            {t("detail.owner")}
            {post.owner}
          </p>
          <p className="text-xs text-white/80 mt-0.5">
            {t("detail.salesRep")}：{salesRep ? `${salesRep.name} · ${salesRep.phone}` : t("detail.salesRepNone")}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-xs font-medium text-muted mb-2">{t("detail.platforms")}</p>
            <div className="flex flex-wrap gap-1.5">
              {post.platforms.map((pf) => (
                <Pill key={pf} label={platforms[pf][lang]} color={platforms[pf].color} bg={platforms[pf].bg} />
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted mb-2">{t("detail.status")}</p>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(statuses) as PostStatus[]).map((s) => {
                const meta = statuses[s];
                const active = post.status === s;
                const locked = s === "published" && !canPublish && !active;
                return (
                  <button
                    key={s}
                    onClick={() => !locked && onUpdateStatus(post.id, s)}
                    disabled={locked}
                    title={locked ? t("detail.publishBlockedNote") : undefined}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition ${
                      locked ? "opacity-40 cursor-not-allowed" : ""
                    }`}
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

          <div>
            <p className="text-xs font-medium text-muted mb-2">{t("detail.publishGateTitle")}</p>
            <div className="rounded-lg border border-border p-3 space-y-2">
              <p className="text-xs flex items-center gap-1.5">
                <span>{assetsReady ? "✅" : "❌"}</span>
                <span>{assetsReady ? t("detail.assetsReady") : t("detail.assetsNotReady")}</span>
              </p>
              <label className="text-xs flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!post.approved}
                  onChange={(e) => onSetApproved(post.id, e.target.checked)}
                />
                {t("detail.approvedCheckbox")}
              </label>
              {!canPublish && <p className="text-[11px] text-muted">{t("detail.publishBlockedNote")}</p>}
            </div>
          </div>

          {post.notes && (
            <div>
              <p className="text-xs font-medium text-muted mb-2">{t("detail.notes")}</p>
              <p className="text-sm text-foreground/80 bg-background rounded-lg p-3">{post.notes}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted">{t("detail.assets")}</p>
              <span className="text-[11px] text-muted">
                {post.assets.filter((a) => a.status === "provided").length}/{post.assets.length} {t("detail.providedCount")}
              </span>
            </div>
            {post.assets.length === 0 ? (
              <p className="text-sm text-muted/70 italic">{t("detail.noAssets")}</p>
            ) : (
              <ul className="space-y-2">
                {post.assets.map((asset) => {
                  const meta = assetStatuses[asset.status];
                  return (
                    <li key={asset.id} className="rounded-lg border border-border p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{asset.name}</p>
                          <p className="text-[11px] text-muted">
                            {asset.requestedFrom} · {asset.dueDate}
                          </p>
                        </div>
                        <Pill label={meta[lang]} color={meta.color} bg={meta.bg} />
                      </div>
                      {asset.mediaUrl ? (
                        <p className="text-[11px] text-brand-pink">✓ {t("assets.attachedFile")}</p>
                      ) : (
                        <button
                          onClick={() => setPickerForAsset(asset.id)}
                          className="text-[11px] font-medium text-muted hover:text-brand-pink"
                        >
                          {t("assets.pickFromLibrary")}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {pickerForAsset && (
            <MediaPicker
              onClose={() => setPickerForAsset(null)}
              onSelect={(url) => {
                onAttachMedia(pickerForAsset, url);
                setPickerForAsset(null);
              }}
            />
          )}

          <div>
            <p className="text-xs font-medium text-muted mb-1">{t("detail.performanceTitle")}</p>
            {post.status !== "published" ? (
              <p className="text-sm text-muted/70 italic">{t("detail.performanceLocked")}</p>
            ) : (
              <>
                <p className="text-[11px] text-muted mb-2">{t("detail.performanceNote")}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-muted block mb-1">{t("detail.views")}</label>
                    <input
                      type="number"
                      value={perf.views ?? ""}
                      onChange={(e) => commitPerf({ views: e.target.value === "" ? undefined : Number(e.target.value) })}
                      className="w-full rounded-lg border border-border bg-surface text-foreground px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted block mb-1">{t("detail.leads")}</label>
                    <input
                      type="number"
                      value={perf.leads ?? ""}
                      onChange={(e) => commitPerf({ leads: e.target.value === "" ? undefined : Number(e.target.value) })}
                      className="w-full rounded-lg border border-border bg-surface text-foreground px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted block mb-1">{t("detail.conversions")}</label>
                    <input
                      type="number"
                      value={perf.conversions ?? ""}
                      onChange={(e) =>
                        commitPerf({ conversions: e.target.value === "" ? undefined : Number(e.target.value) })
                      }
                      className="w-full rounded-lg border border-border bg-surface text-foreground px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
