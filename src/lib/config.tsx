"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Platform, PostStatus, AssetStatus } from "./types";

export interface MetaEntry {
  zh: string;
  en: string;
  color: string;
  bg: string;
}

export interface ImageAsset {
  id: string;
  name: string;
  url: string;
}

export interface IconAsset {
  id: string;
  key: string;
  label: string;
  emoji: string;
}

export interface AssetTemplateItem {
  id: string;
  name: string;
  department: string;
  daysBefore: number;
}

export interface SalesRep {
  id: string;
  name: string;
  phone: string;
}

export interface EventStep {
  taskZh: string;
  taskEn: string;
  daysBefore: number;
}

export interface EventTemplate {
  id: string;
  icon: string;
  titleZh: string;
  titleEn: string;
  steps: EventStep[];
}

export const DEFAULT_PLATFORMS: Record<Platform, MetaEntry> = {
  facebook: { zh: "Facebook", en: "Facebook", color: "#1877F2", bg: "#EAF2FE" },
  instagram: { zh: "Instagram", en: "Instagram", color: "#D6249F", bg: "#FCEAF6" },
  tiktok: { zh: "TikTok", en: "TikTok", color: "#111111", bg: "#EEEEEE" },
  whatsapp: { zh: "WhatsApp", en: "WhatsApp", color: "#25D366", bg: "#E9FBEF" },
  xiaohongshu: { zh: "小红书", en: "Xiaohongshu", color: "#FF2442", bg: "#FFEAEC" },
  website: { zh: "网站", en: "Website", color: "#7C25D9", bg: "#F2E9FC" },
};

export const DEFAULT_STATUSES: Record<PostStatus, MetaEntry> = {
  idea: { zh: "构思中", en: "Idea", color: "#837C8D", bg: "#F1EFF3" },
  draft: { zh: "草稿", en: "Draft", color: "#B45309", bg: "#FEF3C7" },
  assets_needed: { zh: "缺素材", en: "Needs Assets", color: "#DC2626", bg: "#FEE2E2" },
  ready: { zh: "待发布", en: "Ready", color: "#2563EB", bg: "#DBEAFE" },
  scheduled: { zh: "已排程", en: "Scheduled", color: "#7C25D9", bg: "#F2E9FC" },
  published: { zh: "已发布", en: "Published", color: "#16A34A", bg: "#DCFCE7" },
};

export const DEFAULT_ASSET_STATUSES: Record<AssetStatus, MetaEntry> = {
  pending: { zh: "待提供", en: "Pending", color: "#B45309", bg: "#FEF3C7" },
  provided: { zh: "已提供", en: "Provided", color: "#16A34A", bg: "#DCFCE7" },
  overdue: { zh: "已逾期", en: "Overdue", color: "#DC2626", bg: "#FEE2E2" },
};

const DEFAULT_DEPARTMENTS = ["设计部", "教学部", "教务处", "行政部"];
const DEFAULT_OWNERS = ["Amy", "Kevin", "Siew Ling"];

const DEFAULT_SALES_REPS: SalesRep[] = [
  { id: "sr1", name: "Michelle", phone: "+60 12-345 6701" },
  { id: "sr2", name: "Daniel", phone: "+60 12-345 6702" },
  { id: "sr3", name: "Farah", phone: "+60 12-345 6703" },
];

const DEFAULT_IMAGES: ImageAsset[] = [{ id: "logo", name: "主 Logo / Main Logo", url: "/brand/logo.png" }];

const DEFAULT_ICONS: IconAsset[] = [
  { id: "ic1", key: "calendar", label: "营销日历", emoji: "📅" },
  { id: "ic2", key: "assets", label: "素材中心", emoji: "🗂️" },
  { id: "ic9", key: "medialibrary", label: "媒体库", emoji: "🖼️" },
  { id: "ic3", key: "copywriter", label: "AI 文案生成器", emoji: "✍️" },
  { id: "ic4", key: "multiplatform", label: "多平台发帖助手", emoji: "🚀" },
  { id: "ic5", key: "reelradar", label: "爆点雷达", emoji: "📡" },
  { id: "ic7", key: "eventsop", label: "活动 SOP 生成器", emoji: "🎯" },
  { id: "ic8", key: "cms", label: "内容管理", emoji: "🎛️" },
];

const DEFAULT_ASSET_TEMPLATES: AssetTemplateItem[] = [
  { id: "at1", name: "海报 / 封面图", department: "设计部", daysBefore: 3 },
  { id: "at2", name: "视频 / 影片素材", department: "教学部", daysBefore: 5 },
  { id: "at3", name: "讲师 / 老师简介", department: "教学部", daysBefore: 4 },
  { id: "at4", name: "活动现场照片", department: "行政部", daysBefore: 2 },
  { id: "at5", name: "家长 / 学生授权书", department: "教务处", daysBefore: 7 },
];

const DEFAULT_EVENT_TEMPLATES: EventTemplate[] = [
  {
    id: "et1",
    icon: "🏫",
    titleZh: "开放日",
    titleEn: "Open Day",
    steps: [
      { taskZh: "确定场地与时间", taskEn: "Confirm venue & time", daysBefore: 21 },
      { taskZh: "设计邀请函 / 海报", taskEn: "Design invite / poster", daysBefore: 14 },
      { taskZh: "各平台预告贴文", taskEn: "Post teaser on all platforms", daysBefore: 10 },
      { taskZh: "确认讲师与流程表", taskEn: "Confirm speakers & run sheet", daysBefore: 7 },
      { taskZh: "提醒贴文 + WhatsApp 群发", taskEn: "Reminder post + WhatsApp blast", daysBefore: 2 },
      { taskZh: "活动当天拍照录影", taskEn: "Photo/video on the day", daysBefore: 0 },
      { taskZh: "花絮 Reel + 感谢贴文", taskEn: "Recap reel + thank-you post", daysBefore: -2 },
    ],
  },
  {
    id: "et2",
    icon: "📝",
    titleZh: "招生日",
    titleEn: "Enrollment Day",
    steps: [
      { taskZh: "确认优惠方案", taskEn: "Confirm promo offer", daysBefore: 14 },
      { taskZh: "招生海报 + 文案", taskEn: "Enrollment poster + captions", daysBefore: 10 },
      { taskZh: "多平台同步发布", taskEn: "Publish across all platforms", daysBefore: 7 },
      { taskZh: "跟进未报名家长", taskEn: "Follow up with interested parents", daysBefore: 3 },
      { taskZh: "截止倒数提醒", taskEn: "Deadline countdown reminder", daysBefore: 1 },
    ],
  },
  {
    id: "et3",
    icon: "🏷️",
    titleZh: "促销活动",
    titleEn: "Promotion",
    steps: [
      { taskZh: "确定折扣与条款", taskEn: "Finalize discount & terms", daysBefore: 7 },
      { taskZh: "设计促销图", taskEn: "Design promo graphic", daysBefore: 5 },
      { taskZh: "发布促销贴文", taskEn: "Publish promo post", daysBefore: 3 },
      { taskZh: "最后一天冲刺提醒", taskEn: "Last-day push reminder", daysBefore: 0 },
    ],
  },
  {
    id: "et4",
    icon: "🎤",
    titleZh: "免费讲座",
    titleEn: "Free Talk",
    steps: [
      { taskZh: "确认讲师与主题", taskEn: "Confirm speaker & topic", daysBefore: 10 },
      { taskZh: "讲座封面图 + 简介", taskEn: "Cover image + description", daysBefore: 7 },
      { taskZh: "开放报名贴文", taskEn: "Registration open post", daysBefore: 6 },
      { taskZh: "提醒贴文", taskEn: "Reminder post", daysBefore: 1 },
    ],
  },
];

interface ConfigValue {
  platforms: Record<Platform, MetaEntry>;
  statuses: Record<PostStatus, MetaEntry>;
  assetStatuses: Record<AssetStatus, MetaEntry>;
  departments: string[];
  owners: string[];
  images: ImageAsset[];
  icons: IconAsset[];
  updatePlatform: (key: Platform, patch: Partial<MetaEntry>) => void;
  updateStatus: (key: PostStatus, patch: Partial<MetaEntry>) => void;
  updateAssetStatus: (key: AssetStatus, patch: Partial<MetaEntry>) => void;
  addDepartment: (name: string) => void;
  removeDepartment: (name: string) => void;
  addOwner: (name: string) => void;
  removeOwner: (name: string) => void;

  salesReps: SalesRep[];
  addSalesRep: (rep: Omit<SalesRep, "id">) => void;
  updateSalesRep: (id: string, patch: Partial<SalesRep>) => void;
  removeSalesRep: (id: string) => void;

  addImage: (image: Omit<ImageAsset, "id">) => void;
  removeImage: (id: string) => void;
  updateIcon: (id: string, emoji: string) => void;
  iconFor: (key: string) => string;

  assetTemplates: AssetTemplateItem[];
  addAssetTemplate: (item: Omit<AssetTemplateItem, "id">) => void;
  updateAssetTemplate: (id: string, patch: Partial<AssetTemplateItem>) => void;
  removeAssetTemplate: (id: string) => void;

  eventTemplates: EventTemplate[];
  addEventTemplate: (tpl: Omit<EventTemplate, "id">) => void;
  updateEventTemplate: (id: string, patch: Partial<EventTemplate>) => void;
  removeEventTemplate: (id: string) => void;
}

const ConfigContext = createContext<ConfigValue | null>(null);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [platforms, setPlatforms] = useState(DEFAULT_PLATFORMS);
  const [statuses, setStatuses] = useState(DEFAULT_STATUSES);
  const [assetStatuses, setAssetStatuses] = useState(DEFAULT_ASSET_STATUSES);
  const [departments, setDepartments] = useState(DEFAULT_DEPARTMENTS);
  const [owners, setOwners] = useState(DEFAULT_OWNERS);
  const [salesReps, setSalesReps] = useState(DEFAULT_SALES_REPS);
  const [images, setImages] = useState(DEFAULT_IMAGES);
  const [icons, setIcons] = useState(DEFAULT_ICONS);
  const [assetTemplates, setAssetTemplates] = useState(DEFAULT_ASSET_TEMPLATES);
  const [eventTemplates, setEventTemplates] = useState(DEFAULT_EVENT_TEMPLATES);

  const value: ConfigValue = {
    platforms,
    statuses,
    assetStatuses,
    departments,
    owners,
    images,
    icons,
    updatePlatform: (key, patch) => setPlatforms((p) => ({ ...p, [key]: { ...p[key], ...patch } })),
    updateStatus: (key, patch) => setStatuses((p) => ({ ...p, [key]: { ...p[key], ...patch } })),
    updateAssetStatus: (key, patch) => setAssetStatuses((p) => ({ ...p, [key]: { ...p[key], ...patch } })),
    addDepartment: (name) => setDepartments((d) => (name.trim() && !d.includes(name) ? [...d, name.trim()] : d)),
    removeDepartment: (name) => setDepartments((d) => d.filter((x) => x !== name)),
    addOwner: (name) => setOwners((o) => (name.trim() && !o.includes(name) ? [...o, name.trim()] : o)),
    removeOwner: (name) => setOwners((o) => o.filter((x) => x !== name)),

    salesReps,
    addSalesRep: (rep) => setSalesReps((reps) => [...reps, { ...rep, id: `sr_${Date.now()}` }]),
    updateSalesRep: (id, patch) => setSalesReps((reps) => reps.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    removeSalesRep: (id) => setSalesReps((reps) => reps.filter((r) => r.id !== id)),

    addImage: (image) => setImages((imgs) => [...imgs, { ...image, id: `img_${Date.now()}` }]),
    removeImage: (id) => setImages((imgs) => imgs.filter((i) => i.id !== id)),
    updateIcon: (id, emoji) => setIcons((ics) => ics.map((i) => (i.id === id ? { ...i, emoji } : i))),
    iconFor: (key) => icons.find((i) => i.key === key)?.emoji ?? "•",

    assetTemplates,
    addAssetTemplate: (item) =>
      setAssetTemplates((prev) => [...prev, { ...item, id: `at_${Date.now()}` }]),
    updateAssetTemplate: (id, patch) =>
      setAssetTemplates((prev) => prev.map((a) => (a.id === id ? { ...a, ...patch } : a))),
    removeAssetTemplate: (id) => setAssetTemplates((prev) => prev.filter((a) => a.id !== id)),

    eventTemplates,
    addEventTemplate: (tpl) =>
      setEventTemplates((prev) => [...prev, { ...tpl, id: `et_${Date.now()}` }]),
    updateEventTemplate: (id, patch) =>
      setEventTemplates((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e))),
    removeEventTemplate: (id) => setEventTemplates((prev) => prev.filter((e) => e.id !== id)),
  };

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

export function useConfig() {
  const ctx = useContext(ConfigContext);
  if (!ctx) throw new Error("useConfig must be used within ConfigProvider");
  return ctx;
}
