export type Platform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "whatsapp"
  | "xiaohongshu"
  | "website";

export type PostStatus =
  | "idea"
  | "draft"
  | "assets_needed"
  | "ready"
  | "scheduled"
  | "published";

export type AssetStatus = "pending" | "provided" | "overdue";

export interface AssetRequest {
  id: string;
  name: string;
  requestedFrom: string;
  status: AssetStatus;
  dueDate: string;
  mediaUrl?: string;
}

export interface PostPerformance {
  views?: number;
  leads?: number;
  conversions?: number;
}

export interface Post {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  platforms: Platform[];
  status: PostStatus;
  owner: string;
  notes?: string;
  assets: AssetRequest[];
  salesRepId?: string;
  performance?: PostPerformance;
  approved?: boolean;
}
