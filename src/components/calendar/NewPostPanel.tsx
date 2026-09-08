"use client";

import { useState } from "react";
import { AssetRequest, Platform, Post } from "@/lib/types";
import { useConfig } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";

function subtractDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function NewPostPanel({
  date,
  onClose,
  onCreate,
}: {
  date: string;
  onClose: () => void;
  onCreate: (post: Post) => void;
}) {
  const { platforms, owners, assetTemplates, departments, salesReps } = useConfig();
  const { lang, t } = useLanguage();
  const allPlatforms = Object.keys(platforms) as Platform[];

  const [title, setTitle] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [owner, setOwner] = useState(owners[0]);
  const [salesRepId, setSalesRepId] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [customAssets, setCustomAssets] = useState<{ name: string; department: string }[]>([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDept, setCustomDept] = useState(departments[0] ?? "");

  const togglePlatform = (pf: Platform) => {
    setSelectedPlatforms((prev) => (prev.includes(pf) ? prev.filter((p) => p !== pf) : [...prev, pf]));
  };

  const toggleTemplate = (id: string) => {
    setSelectedTemplateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addCustomAsset = () => {
    if (!customName.trim()) return;
    setCustomAssets((prev) => [...prev, { name: customName.trim(), department: customDept }]);
    setCustomName("");
    setShowCustomForm(false);
  };

  const canSubmit = title.trim().length > 0 && selectedPlatforms.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const templateAssets: AssetRequest[] = assetTemplates
      .filter((tpl) => selectedTemplateIds.has(tpl.id))
      .map((tpl) => ({
        id: `a_${tpl.id}_${Date.now()}`,
        name: tpl.name,
        requestedFrom: tpl.department,
        status: "pending",
        dueDate: subtractDays(date, tpl.daysBefore),
      }));

    const customAssetRequests: AssetRequest[] = customAssets.map((a, idx) => ({
      id: `a_custom_${Date.now()}_${idx}`,
      name: a.name,
      requestedFrom: a.department,
      status: "pending",
      dueDate: date,
    }));

    onCreate({
      id: `p_${Date.now()}`,
      title: title.trim(),
      date,
      platforms: selectedPlatforms,
      status: "idea",
      owner,
      salesRepId: salesRepId || undefined,
      notes: notes.trim() || undefined,
      assets: [...templateAssets, ...customAssetRequests],
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
          <p className="text-xs text-white/80">{date}</p>
          <h2 className="text-lg font-semibold mt-1">{t("newpost.title")}</h2>
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
            <label className="text-xs font-medium text-muted mb-1 block">{t("newpost.assetsLabel")}</label>
            <p className="text-[11px] text-muted mb-2">{t("newpost.assetsHint")}</p>
            <div className="space-y-1.5">
              {assetTemplates.map((tpl) => {
                const checked = selectedTemplateIds.has(tpl.id);
                const due = subtractDays(date, tpl.daysBefore);
                return (
                  <label
                    key={tpl.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer transition ${
                      checked ? "border-brand-pink bg-brand-pink/5" : "border-border"
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input type="checkbox" checked={checked} onChange={() => toggleTemplate(tpl.id)} />
                      <span className="truncate">{tpl.name}</span>
                    </span>
                    <span className="text-[11px] text-muted shrink-0">
                      {tpl.department} · {t("newpost.dueOn")} {due}
                    </span>
                  </label>
                );
              })}

              {customAssets.map((a, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <span className="truncate">{a.name}</span>
                  <span className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-muted">{a.department}</span>
                    <button
                      onClick={() => setCustomAssets((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-muted hover:text-red-500"
                    >
                      ×
                    </button>
                  </span>
                </div>
              ))}
            </div>

            {showCustomForm ? (
              <div className="flex gap-2 mt-2">
                <input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t("newpost.customAssetName")}
                  className="flex-1 rounded-lg border border-border bg-surface text-foreground px-3 py-1.5 text-sm"
                />
                <select
                  value={customDept}
                  onChange={(e) => setCustomDept(e.target.value)}
                  className="rounded-lg border border-border bg-surface text-foreground px-2 py-1.5 text-sm"
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addCustomAsset}
                  disabled={!customName.trim()}
                  className="rounded-lg brand-gradient text-white text-sm font-medium px-3 py-1.5 disabled:opacity-40 shrink-0"
                >
                  {t("newpost.customAssetAdd")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowCustomForm(true)}
                className="text-xs font-medium text-brand-pink hover:underline mt-2"
              >
                {t("newpost.customAsset")}
              </button>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-border">
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full rounded-xl brand-gradient text-white text-sm font-medium py-2.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {t("newpost.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
