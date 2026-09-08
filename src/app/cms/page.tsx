"use client";

import { useState } from "react";
import { useConfig, EventStep } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { Platform, PostStatus, AssetStatus } from "@/lib/types";
import PageHeader from "@/components/PageHeader";

type Tab = "images" | "icons" | "platforms" | "statuses" | "team" | "salesReps" | "assetTemplates" | "eventTemplates";

export default function CmsPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("images");

  const tabs: { key: Tab; label: string }[] = [
    { key: "images", label: t("cms.tab.images") },
    { key: "icons", label: t("cms.tab.icons") },
    { key: "platforms", label: t("cms.tab.platforms") },
    { key: "statuses", label: t("cms.tab.statuses") },
    { key: "team", label: t("cms.tab.team") },
    { key: "salesReps", label: t("cms.tab.salesReps") },
    { key: "assetTemplates", label: t("cms.tab.assetTemplates") },
    { key: "eventTemplates", label: t("cms.tab.eventTemplates") },
  ];

  return (
    <div className="p-8 max-w-4xl">
      <PageHeader title={t("cms.title")} subtitle={t("cms.subtitle")} />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition ${
              tab === tb.key ? "brand-gradient text-white border-transparent" : "text-muted border-border hover:bg-background"
            }`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "images" && <ImagesTab />}
      {tab === "icons" && <IconsTab />}
      {tab === "platforms" && <PlatformsTab />}
      {tab === "statuses" && <StatusesTab />}
      {tab === "team" && <TeamTab />}
      {tab === "salesReps" && <SalesRepsTab />}
      {tab === "assetTemplates" && <AssetTemplatesTab />}
      {tab === "eventTemplates" && <EventTemplatesTab />}
    </div>
  );
}

function ImagesTab() {
  const { images, addImage, removeImage } = useConfig();
  const { t } = useLanguage();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");

  const handleAdd = () => {
    if (!url.trim()) return;
    addImage({ name: name.trim() || url.trim(), url: url.trim() });
    setUrl("");
    setName("");
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{t("cms.images.desc")}</p>

      <div className="rounded-2xl border border-border bg-surface p-4">
        {images.length === 0 ? (
          <p className="text-sm text-muted italic">{t("cms.images.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {images.map((img) => (
              <div key={img.id} className="rounded-xl border border-border p-3 flex flex-col items-center gap-2">
                <div className="w-16 h-16 relative flex items-center justify-center bg-background rounded-lg overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.name} className="max-w-full max-h-full object-contain" />
                </div>
                <p className="text-xs text-center truncate w-full">{img.name}</p>
                {img.id !== "logo" && (
                  <button
                    onClick={() => removeImage(img.id)}
                    className="text-[11px] text-red-500 hover:underline"
                  >
                    {t("action.delete")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 space-y-3">
        <p className="text-xs font-medium text-muted">{t("cms.images.add")}</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("cms.images.nameLabel")}
          className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
        />
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("cms.images.urlLabel")}
          className="w-full rounded-lg border border-border bg-surface text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-pink/40"
        />
        <button
          onClick={handleAdd}
          disabled={!url.trim()}
          className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-2 disabled:opacity-40"
        >
          {t("action.add")}
        </button>
      </div>
    </div>
  );
}

function IconsTab() {
  const { icons, updateIcon } = useConfig();
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("cms.icons.desc")}</p>
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
        {icons.map((icon) => (
          <div key={icon.id} className="flex items-center justify-between gap-3 p-3.5">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-lg bg-background flex items-center justify-center text-lg">
                {icon.emoji}
              </span>
              <span className="text-sm font-medium">{icon.label}</span>
            </div>
            {editingId === icon.id ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="w-16 rounded-lg border border-border bg-surface text-foreground px-2 py-1 text-center text-lg"
                />
                <button
                  onClick={() => {
                    if (draft.trim()) updateIcon(icon.id, draft.trim());
                    setEditingId(null);
                  }}
                  className="text-xs font-medium text-brand-pink hover:underline"
                >
                  {t("action.save")}
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingId(icon.id);
                  setDraft(icon.emoji);
                }}
                className="text-xs font-medium text-brand-pink hover:underline"
              >
                {t("cms.icons.change")}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ColorSwatchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 rounded-md border border-border cursor-pointer bg-surface"
      />
      <span className="text-[11px] text-muted font-mono">{value}</span>
    </div>
  );
}

function PlatformsTab() {
  const { platforms, updatePlatform } = useConfig();
  const { t } = useLanguage();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("cms.platforms.desc")}</p>
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
        {(Object.keys(platforms) as Platform[]).map((key) => {
          const meta = platforms[key];
          return (
            <div key={key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 sm:items-center p-3.5">
              <input
                value={meta.zh}
                onChange={(e) => updatePlatform(key, { zh: e.target.value })}
                className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
              />
              <input
                value={meta.en}
                onChange={(e) => updatePlatform(key, { en: e.target.value })}
                className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
              />
              <ColorSwatchInput value={meta.color} onChange={(v) => updatePlatform(key, { color: v })} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusesTab() {
  const { statuses, updateStatus, assetStatuses, updateAssetStatus } = useConfig();
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <p className="text-sm text-muted">{t("cms.statuses.desc")}</p>
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
          {(Object.keys(statuses) as PostStatus[]).map((key) => {
            const meta = statuses[key];
            return (
              <div key={key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 sm:items-center p-3.5">
                <input
                  value={meta.zh}
                  onChange={(e) => updateStatus(key, { zh: e.target.value })}
                  className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
                />
                <input
                  value={meta.en}
                  onChange={(e) => updateStatus(key, { en: e.target.value })}
                  className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
                />
                <ColorSwatchInput value={meta.color} onChange={(v) => updateStatus(key, { color: v })} />
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{t("assets.title")}</p>
        <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
          {(Object.keys(assetStatuses) as AssetStatus[]).map((key) => {
            const meta = assetStatuses[key];
            return (
              <div key={key} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 sm:items-center p-3.5">
                <input
                  value={meta.zh}
                  onChange={(e) => updateAssetStatus(key, { zh: e.target.value })}
                  className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
                />
                <input
                  value={meta.en}
                  onChange={(e) => updateAssetStatus(key, { en: e.target.value })}
                  className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
                />
                <ColorSwatchInput value={meta.color} onChange={(v) => updateAssetStatus(key, { color: v })} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TeamTab() {
  const { departments, addDepartment, removeDepartment, owners, addOwner, removeOwner } = useConfig();
  const { t } = useLanguage();
  const [newDept, setNewDept] = useState("");
  const [newOwner, setNewOwner] = useState("");

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{t("cms.team.departments")}</p>
        <p className="text-sm text-muted">{t("cms.team.deptDesc")}</p>
        <div className="flex flex-wrap gap-2">
          {departments.map((d) => (
            <span
              key={d}
              className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1.5 text-sm"
            >
              {d}
              <button onClick={() => removeDepartment(d)} className="text-muted hover:text-red-500">
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
            placeholder={t("cms.team.addDept")}
            className="rounded-lg border border-border bg-surface text-foreground px-3 py-1.5 text-sm flex-1 max-w-xs"
          />
          <button
            onClick={() => {
              addDepartment(newDept);
              setNewDept("");
            }}
            disabled={!newDept.trim()}
            className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-1.5 disabled:opacity-40"
          >
            {t("action.add")}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted uppercase tracking-wide">{t("cms.team.owners")}</p>
        <p className="text-sm text-muted">{t("cms.team.ownerDesc")}</p>
        <div className="flex flex-wrap gap-2">
          {owners.map((o) => (
            <span
              key={o}
              className="inline-flex items-center gap-1.5 rounded-full bg-background border border-border px-3 py-1.5 text-sm"
            >
              {o}
              <button onClick={() => removeOwner(o)} className="text-muted hover:text-red-500">
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            placeholder={t("cms.team.addOwner")}
            className="rounded-lg border border-border bg-surface text-foreground px-3 py-1.5 text-sm flex-1 max-w-xs"
          />
          <button
            onClick={() => {
              addOwner(newOwner);
              setNewOwner("");
            }}
            disabled={!newOwner.trim()}
            className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-1.5 disabled:opacity-40"
          >
            {t("action.add")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SalesRepsTab() {
  const { salesReps, addSalesRep, updateSalesRep, removeSalesRep } = useConfig();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("cms.salesReps.desc")}</p>
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
        {salesReps.map((rep) => (
          <div key={rep.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 sm:items-center p-3.5">
            <input
              value={rep.name}
              onChange={(e) => updateSalesRep(rep.id, { name: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
            />
            <input
              value={rep.phone}
              onChange={(e) => updateSalesRep(rep.id, { phone: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
            />
            <button onClick={() => removeSalesRep(rep.id)} className="text-xs font-medium text-muted hover:text-red-500">
              {t("action.delete")}
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2.5 sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("cms.salesReps.nameLabel")}
          className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("cms.salesReps.phoneLabel")}
          className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            addSalesRep({ name: name.trim(), phone: phone.trim() });
            setName("");
            setPhone("");
          }}
          disabled={!name.trim()}
          className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-1.5 disabled:opacity-40"
        >
          {t("action.add")}
        </button>
      </div>
    </div>
  );
}

function AssetTemplatesTab() {
  const { assetTemplates, addAssetTemplate, updateAssetTemplate, removeAssetTemplate, departments } = useConfig();
  const { t } = useLanguage();
  const [name, setName] = useState("");
  const [department, setDepartment] = useState(departments[0] ?? "");
  const [daysBefore, setDaysBefore] = useState(3);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("cms.assetTemplates.desc")}</p>
      <div className="rounded-2xl border border-border bg-surface divide-y divide-border">
        {assetTemplates.map((item) => (
          <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_auto] gap-2.5 sm:items-center p-3.5">
            <input
              value={item.name}
              onChange={(e) => updateAssetTemplate(item.id, { name: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
            />
            <select
              value={item.department}
              onChange={(e) => updateAssetTemplate(item.id, { department: e.target.value })}
              className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={item.daysBefore}
              onChange={(e) => updateAssetTemplate(item.id, { daysBefore: Number(e.target.value) || 0 })}
              className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
            />
            <button onClick={() => removeAssetTemplate(item.id)} className="text-xs font-medium text-muted hover:text-red-500">
              {t("action.delete")}
            </button>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_100px_auto] gap-2.5 sm:items-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("cms.assetTemplates.nameLabel")}
          className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
        />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
        >
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={daysBefore}
          onChange={(e) => setDaysBefore(Number(e.target.value) || 0)}
          className="w-full min-w-0 rounded-lg border border-border bg-surface text-foreground px-2.5 py-1.5 text-sm"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            addAssetTemplate({ name: name.trim(), department, daysBefore });
            setName("");
            setDaysBefore(3);
          }}
          disabled={!name.trim()}
          className="rounded-lg brand-gradient text-white text-sm font-medium px-4 py-1.5 disabled:opacity-40"
        >
          {t("action.add")}
        </button>
      </div>
    </div>
  );
}

function EventTemplatesTab() {
  const { eventTemplates, addEventTemplate, updateEventTemplate, removeEventTemplate } = useConfig();
  const { t } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);

  const addStep = (id: string, steps: EventStep[]) => {
    updateEventTemplate(id, { steps: [...steps, { taskZh: "", taskEn: "", daysBefore: 1 }] });
  };
  const updateStep = (id: string, steps: EventStep[], idx: number, patch: Partial<EventStep>) => {
    const next = [...steps];
    next[idx] = { ...next[idx], ...patch };
    updateEventTemplate(id, { steps: next });
  };
  const removeStep = (id: string, steps: EventStep[], idx: number) => {
    updateEventTemplate(id, { steps: steps.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t("cms.eventTemplates.desc")}</p>
      <div className="space-y-3">
        {eventTemplates.map((tpl) => {
          const open = openId === tpl.id;
          return (
            <div key={tpl.id} className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="flex items-center gap-3 p-3.5">
                <input
                  value={tpl.icon}
                  onChange={(e) => updateEventTemplate(tpl.id, { icon: e.target.value })}
                  className="w-12 rounded-lg border border-border bg-surface text-center px-2 py-1.5 text-lg"
                />
                <input
                  value={tpl.titleZh}
                  onChange={(e) => updateEventTemplate(tpl.id, { titleZh: e.target.value })}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
                />
                <input
                  value={tpl.titleEn}
                  onChange={(e) => updateEventTemplate(tpl.id, { titleEn: e.target.value })}
                  className="flex-1 min-w-0 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm"
                />
                <button
                  onClick={() => setOpenId(open ? null : tpl.id)}
                  className="text-xs font-medium text-brand-pink shrink-0"
                >
                  {open ? t("cms.eventTemplates.hideSteps") : t("cms.eventTemplates.editSteps", { count: String(tpl.steps.length) })}
                </button>
                <button
                  onClick={() => removeEventTemplate(tpl.id)}
                  className="text-xs font-medium text-muted hover:text-red-500 shrink-0"
                >
                  {t("action.delete")}
                </button>
              </div>
              {open && (
                <div className="border-t border-border p-3.5 space-y-2 bg-background/40">
                  {tpl.steps.map((step, idx) => (
                    <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_90px_auto] gap-2">
                      <input
                        value={step.taskZh}
                        onChange={(e) => updateStep(tpl.id, tpl.steps, idx, { taskZh: e.target.value })}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                        placeholder={t("cms.labelZh")}
                      />
                      <input
                        value={step.taskEn}
                        onChange={(e) => updateStep(tpl.id, tpl.steps, idx, { taskEn: e.target.value })}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                        placeholder={t("cms.labelEn")}
                      />
                      <input
                        type="number"
                        value={step.daysBefore}
                        onChange={(e) =>
                          updateStep(tpl.id, tpl.steps, idx, { daysBefore: Number(e.target.value) || 0 })
                        }
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs"
                      />
                      <button
                        onClick={() => removeStep(tpl.id, tpl.steps, idx)}
                        className="text-xs text-muted hover:text-red-500"
                      >
                        {t("action.delete")}
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addStep(tpl.id, tpl.steps)}
                    className="text-xs font-medium text-brand-pink hover:underline"
                  >
                    {t("cms.eventTemplates.addStep")}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <button
        onClick={() =>
          addEventTemplate({ icon: "🎯", titleZh: "新模板", titleEn: "New Template", steps: [] })
        }
        className="rounded-lg border border-border text-sm font-medium px-4 py-2 hover:bg-background"
      >
        {t("cms.eventTemplates.addTemplate")}
      </button>
    </div>
  );
}
