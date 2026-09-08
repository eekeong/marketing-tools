"use client";

import { useMemo, useState } from "react";
import { AssetStatus, Post } from "@/lib/types";
import { useConfig } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { usePosts } from "@/lib/postsStore";
import Pill from "@/components/Pill";
import MediaPicker from "@/components/MediaPicker";

interface FlatAsset {
  id: string;
  name: string;
  requestedFrom: string;
  status: AssetStatus;
  dueDate: string;
  post: Post;
}

export default function AssetsPage() {
  const { assetStatuses, departments } = useConfig();
  const { lang, t } = useLanguage();
  const { posts, updateAssetStatus, attachMedia } = usePosts();
  const [filter, setFilter] = useState<AssetStatus | "all">("all");
  const [dept, setDept] = useState<string>("all");
  const [pickerForAsset, setPickerForAsset] = useState<string | null>(null);

  const filters: { key: AssetStatus | "all"; label: string }[] = [
    { key: "all", label: t("assets.all") },
    { key: "pending", label: t("assets.pending") },
    { key: "overdue", label: t("assets.overdue") },
    { key: "provided", label: t("assets.provided") },
  ];

  const flatAssets: FlatAsset[] = useMemo(() => {
    return posts
      .flatMap((post) => post.assets.map((a) => ({ ...a, post })))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [posts]);

  const allDepartments = useMemo(() => {
    const fromData = flatAssets.map((a) => a.requestedFrom);
    return Array.from(new Set([...departments, ...fromData]));
  }, [flatAssets, departments]);

  const filtered = flatAssets.filter((a) => {
    if (filter !== "all" && a.status !== filter) return false;
    if (dept !== "all" && a.requestedFrom !== dept) return false;
    return true;
  });

  const counts = {
    pending: flatAssets.filter((a) => a.status === "pending").length,
    overdue: flatAssets.filter((a) => a.status === "overdue").length,
    provided: flatAssets.filter((a) => a.status === "provided").length,
  };

  const markProvided = (assetId: string) => updateAssetStatus(assetId, "provided");

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">{t("assets.title")}</h1>
        <p className="text-sm text-muted mt-1">{t("assets.subtitle")}</p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted mb-1">{t("assets.pending")}</p>
          <p className="text-2xl font-semibold" style={{ color: assetStatuses.pending.color }}>
            {counts.pending}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted mb-1">{t("assets.overdue")}</p>
          <p className="text-2xl font-semibold" style={{ color: assetStatuses.overdue.color }}>
            {counts.overdue}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs text-muted mb-1">{t("assets.provided")}</p>
          <p className="text-2xl font-semibold" style={{ color: assetStatuses.provided.color }}>
            {counts.provided}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              filter === f.key ? "brand-gradient text-white border-transparent" : "text-muted border-border hover:bg-background"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        <select
          value={dept}
          onChange={(e) => setDept(e.target.value)}
          className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted bg-surface focus:outline-none"
        >
          <option value="all">{t("assets.allDepartments")}</option>
          {allDepartments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-border bg-surface overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead>
            <tr className="border-b border-border bg-background/60 text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium whitespace-nowrap">{t("assets.colAsset")}</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">{t("assets.colPost")}</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">{t("assets.colDept")}</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">{t("assets.colDue")}</th>
              <th className="px-4 py-3 font-medium whitespace-nowrap">{t("assets.colStatus")}</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted text-sm">
                  {t("assets.noResults")}
                </td>
              </tr>
            )}
            {filtered.map((a) => {
              const meta = assetStatuses[a.status];
              return (
                <tr key={a.id} className="border-b border-border last:border-b-0 hover:bg-background/40">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">{a.name}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {a.post.title}
                    <span className="block text-[11px]">{a.post.date}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{a.requestedFrom}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{a.dueDate}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <Pill label={meta[lang]} color={meta.color} bg={meta.bg} />
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {a.status !== "provided" && (
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => setPickerForAsset(a.id)}
                          className="text-xs font-medium text-muted hover:text-brand-pink"
                        >
                          {t("assets.pickFromLibrary")}
                        </button>
                        <button
                          onClick={() => markProvided(a.id)}
                          className="text-xs font-medium text-brand-pink hover:underline"
                        >
                          {t("assets.markProvided")}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {pickerForAsset && (
        <MediaPicker
          onClose={() => setPickerForAsset(null)}
          onSelect={(url) => {
            attachMedia(pickerForAsset, url);
            setPickerForAsset(null);
          }}
        />
      )}
    </div>
  );
}
