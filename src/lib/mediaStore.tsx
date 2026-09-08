"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: "image" | "video";
  tags: string[];
  uploadedBy: string;
  uploadedAt: string;
}

const DEFAULT_MEDIA: MediaItem[] = [
  {
    id: "m1",
    name: "开放日 2026 - 场地布置",
    url: "/brand/logo.png",
    type: "image",
    tags: ["开放日", "场地"],
    uploadedBy: "Kevin",
    uploadedAt: "2026-07-20",
  },
  {
    id: "m2",
    name: "老师团队合照",
    url: "/brand/logo.png",
    type: "image",
    tags: ["老师", "团队"],
    uploadedBy: "Amy",
    uploadedAt: "2026-06-15",
  },
  {
    id: "m3",
    name: "招生海报模板 (1080x1080)",
    url: "/brand/logo.png",
    type: "image",
    tags: ["海报", "模板", "招生"],
    uploadedBy: "Siew Ling",
    uploadedAt: "2026-05-02",
  },
];

interface MediaContextValue {
  items: MediaItem[];
  addMedia: (item: Omit<MediaItem, "id" | "uploadedAt">) => void;
  removeMedia: (id: string) => void;
}

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MediaItem[]>(DEFAULT_MEDIA);

  const value: MediaContextValue = {
    items,
    addMedia: (item) =>
      setItems((prev) => [
        { ...item, id: `media_${Date.now()}`, uploadedAt: new Date().toISOString().slice(0, 10) },
        ...prev,
      ]),
    removeMedia: (id) => setItems((prev) => prev.filter((i) => i.id !== id)),
  };

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) throw new Error("useMedia must be used within MediaProvider");
  return ctx;
}
