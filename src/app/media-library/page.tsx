"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useMedia } from "@/lib/mediaStore";
import { useLanguage } from "@/lib/i18n";

export default function MediaLibraryPage() {
  const { items, addMedia, removeMedia } = useMedia();
  const { t } = useLanguage();
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [type, setType] = useState<"image" | "video">("image");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const allTags = useMemo(() => Array.from(new Set(items.flatMap((i) => i.tags))), [items]);

  const filtered = items.filter((i) => tagFilter === "all" || i.tags.includes(tagFilter));

  const handleAdd = () => {
    if (!name.trim() || !url.trim()) return;
    addMedia({
      name: name.trim(),
      url: url.trim(),
      type,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      uploadedBy: "Admin",
    });
    setName("");
    setUrl("");
    setTags("");
    setShowForm(false);
  };

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title={t("medialibrary.title")}
        subtitle={t("medialibrary.subtitle")}
        action={
          <button
            onClick={() => setShowForm((s) => !s)}
            className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:opacity-90 transition"
          >
            {t("medialibrary.addButton")}
          </button>
        }
      />

      {showForm && (
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("medialibrary.nameLabel")}
              className="rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "image" | "video")}
              className="rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm"
            >
              <option value="image">{t("medialibrary.typeImage")}</option>
              <option value="video">{t("medialibrary.typeVideo")}</option>
            </select>
          </div>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("medialibrary.urlLabel")}
            className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t("medialibrary.tagsLabel")}
            className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim() || !url.trim()}
            className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
          >
            {t("action.add")}
          </button>
        </div>
      )}

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setTagFilter("all")}
            className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
              tagFilter === "all" ? "brand-gradient text-white border-transparent" : "text-muted border-border"
            }`}
          >
            {t("medialibrary.allTags")}
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium border transition ${
                tagFilter === tag ? "brand-gradient text-white border-transparent" : "text-muted border-border"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 flex items-center justify-center text-sm text-muted text-center px-8">
          {t("medialibrary.empty")}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="h-28 bg-background flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.name} className="max-w-full max-h-full object-contain" />
              </div>
              <div className="p-3 space-y-1.5">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-[11px] text-muted">
                  {t("medialibrary.uploadedBy")}: {item.uploadedBy} · {item.uploadedAt}
                </p>
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] rounded-full bg-background px-2 py-0.5 text-muted">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => handleCopy(item.id, item.url)}
                    className="text-[11px] font-medium text-brand-pink hover:underline"
                  >
                    {copiedId === item.id ? t("medialibrary.copied") : t("medialibrary.copyLink")}
                  </button>
                  <button
                    onClick={() => removeMedia(item.id)}
                    className="text-[11px] font-medium text-muted hover:text-red-500"
                  >
                    {t("action.delete")}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
