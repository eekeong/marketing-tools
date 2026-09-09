"use client";

import { useState } from "react";
import { AssetRequest, Platform, Post } from "@/lib/types";
import { useConfig } from "@/lib/config";
import { useSocialAccounts } from "@/lib/accountsStore";
import { useLanguage } from "@/lib/i18n";

export default function NewPostPanel({
  date,
  post,
  onClose,
  onCreate,
  onUpdate,
}: {
  date: string;
  post?: Post;
  onClose: () => void;
  onCreate?: (post: Post) => void;
  onUpdate?: (
    postId: string,
    patch: Partial<Pick<Post, "title" | "date" | "platforms" | "owner" | "salesRepId" | "notes" | "adCopy" | "accountId">>
  ) => void;
}) {
  const { platforms, owners, salesReps } = useConfig();
  const { accounts } = useSocialAccounts();
  const { lang, t } = useLanguage();
  const allPlatforms = Object.keys(platforms) as Platform[];
  const isEditing = !!post;

  const [title, setTitle] = useState(post?.title ?? "");
  const [postDate, setPostDate] = useState(post?.date ?? date);
  const [accountId, setAccountId] = useState(post?.accountId ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(post?.platforms ?? []);
  const [owner, setOwner] = useState(post?.owner ?? owners[0]);
  const [salesRepId, setSalesRepId] = useState(post?.salesRepId ?? "");
  const [notes, setNotes] = useState(post?.notes ?? "");
  const [adCopy, setAdCopy] = useState(post?.adCopy ?? "");
  const [assetLink, setAssetLink] = useState("");

  const togglePlatform = (pf: Platform) => {
    setSelectedPlatforms((prev) => (prev.includes(pf) ? prev.filter((p) => p !== pf) : [...prev, pf]));
  };

  const canSubmit = title.trim().length > 0 && selectedPlatforms.length > 0 && postDate.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    if (isEditing && post) {
      onUpdate?.(post.id, {
        title: title.trim(),
        date: postDate,
        platforms: selectedPlatforms,
        owner,
        salesRepId: salesRepId || undefined,
        accountId: accountId || undefined,
        notes: notes.trim() || undefined,
        adCopy: adCopy.trim() || undefined,
      });
      return;
    }

    const assets: AssetRequest[] = assetLink.trim()
      ? [
          {
            id: `a_link_${Date.now()}`,
            name: "素材",
            requestedFrom: "",
            status: "provided",
            dueDate: postDate,
            mediaUrl: assetLink.trim(),
          },
        ]
      : [];

    onCreate?.({
      id: `p_${Date.now()}`,
      title: title.trim(),
      date: postDate,
      platforms: selectedPlatforms,
      status: "idea",
      owner,
      salesRepId: salesRepId || undefined,
      accountId: accountId || undefined,
      notes: notes.trim() || undefined,
      adCopy: adCopy.trim() || undefined,
      assets,
      platformContent: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-surface shadow-xl flex flex-col">
        <div className="brand-gradient px-5 py-5 text-white">
          <button onClick={onClose} className="text-white/80 hover:text-white text-sm mb-3">
            {t("newpost.cancel")}
          </button>
          <p className="text-xs text-white/80">{postDate}</p>
          <h2 className="text-lg font-semibold mt-1">{isEditing ? t("newpost.editTitle") : t("newpost.title")}</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.titleLabel")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("newpost.titlePlaceholder")}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.dateLabel")}</label>
            <input
              type="date"
              value={postDate}
              onChange={(e) => setPostDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.accountLabel")}</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
            >
              <option value="">{t("newpost.accountNone")}</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.displayName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.platformsLabel")}</label>
            <div className="flex flex-wrap gap-2">
              {allPlatforms.map((pf) => {
                const active = selectedPlatforms.includes(pf);
                const meta = platforms[pf];
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

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.ownerLabel")}</label>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
            >
              {owners.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.salesRepLabel")}</label>
            <select
              value={salesRepId}
              onChange={(e) => setSalesRepId(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
            >
              <option value="">{t("newpost.salesRepNone")}</option>
              {salesReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} · {r.phone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.notesLabel")}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder={t("newpost.notesPlaceholder")}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.adCopyLabel")}</label>
            <textarea
              value={adCopy}
              onChange={(e) => setAdCopy(e.target.value)}
              rows={2}
              placeholder={t("newpost.adCopyPlaceholder")}
              className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
            />
          </div>

          {!isEditing && (
            <div>
              <label className="text-xs font-medium text-muted mb-1.5 block">{t("newpost.assetLabel")}</label>
              <input
                value={assetLink}
                onChange={(e) => setAssetLink(e.target.value)}
                placeholder={t("newpost.assetPlaceholder")}
                className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
              />
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl brand-gradient text-white text-sm font-medium py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isEditing ? t("newpost.save") : t("newpost.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
