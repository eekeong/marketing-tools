"use client";

import { useState } from "react";
import { Post, PostStatus } from "@/lib/types";
import { useConfig } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import Pill from "@/components/Pill";
import MediaPicker from "@/components/MediaPicker";

export default function PostDetailPanel({
  post,
  onClose,
  onUpdateStatus,
  onAttachMedia,
  onEdit,
  onDelete,
}: {
  post: Post;
  onClose: () => void;
  onUpdateStatus: (postId: string, status: PostStatus) => void;
  onAttachMedia: (assetId: string, mediaUrl: string) => void;
  onEdit: (post: Post) => void;
  onDelete: (postId: string) => void;
}) {
  const { platforms, statuses, assetStatuses, salesReps } = useConfig();
  const { lang, t } = useLanguage();
  const salesRep = salesReps.find((r) => r.id === post.salesRepId);
  const [pickerForAsset, setPickerForAsset] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-surface shadow-xl flex flex-col">
        <div className="brand-gradient px-5 py-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <button onClick={onClose} className="text-white/80 hover:text-white text-sm">
              {t("detail.close")}
            </button>
            {confirmingDelete ? (
              <div className="flex items-center gap-3">
                <span className="text-white text-sm">{t("detail.deleteConfirm")}</span>
                <button
                  onClick={() => onDelete(post.id)}
                  className="text-white font-semibold text-sm underline"
                >
                  {t("detail.deleteConfirmYes")}
                </button>
                <button onClick={() => setConfirmingDelete(false)} className="text-white/80 hover:text-white text-sm">
                  {t("detail.deleteConfirmNo")}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button onClick={() => onEdit(post)} className="text-white/80 hover:text-white text-sm">
                  {t("detail.edit")}
                </button>
                <button onClick={() => setConfirmingDelete(true)} className="text-white/80 hover:text-white text-sm">
                  {t("detail.delete")}
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-white/80">{post.date}</p>
          <h2 className="text-lg font-semibold mt-1">{post.title}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div>
            <p className="text-[14px] font-bold text-foreground">
              {t("detail.owner")}
              {post.owner}
            </p>
            <p className="text-[14px] font-bold text-foreground mt-0.5">
              {t("detail.salesRep")}：{salesRep ? `${salesRep.name} · ${salesRep.phone}` : t("detail.salesRepNone")}
            </p>
          </div>

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
                        <a
                          href={asset.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-brand-pink hover:underline break-all"
                        >
                          🔗 {asset.mediaUrl}
                        </a>
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
                return (
                  <button
                    key={s}
                    onClick={() => onUpdateStatus(post.id, s)}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium border transition"
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

          {post.notes && (
            <div>
              <p className="text-xs font-medium text-muted mb-2">{t("detail.notes")}</p>
              <p className="text-sm text-foreground/80 bg-background rounded-lg p-3">{post.notes}</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
