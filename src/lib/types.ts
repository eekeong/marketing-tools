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

export type PostCategory = "organic" | "ads";

export type AccountStatus = "connected" | "not_connected" | "token_expired";

export interface SocialAccount {
  id: string;
  platform: Platform | null; // null = not yet classified to a specific platform
  displayName: string;
  status: AccountStatus;
  connectedAt?: string;
  externalAccountId?: string; // reserved for future real OAuth integration
}

export interface AssetRequest {
  id: string;
  name: string;
  requestedFrom: string;
  status: AssetStatus;
  dueDate: string;
  mediaUrl?: string;
}

export type PublishStatus = "draft" | "manually_published" | "failed";

export interface PostPlatformContent {
  id: string;
  postId: string;
  platform: Platform;
  caption: string;
  mediaUrl?: string;
  accountId?: string;
  publishStatus: PublishStatus;
  publishedAt?: string;
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
  approved?: boolean;
  category?: PostCategory; // organic vs paid ads content
  accountId?: string; // which SocialAccount (page/persona) this content is attributed to
  adCopy?: string; // ad copy / CTA text shown to the audience
  leadMagnetUrl?: string; // link/file given away in exchange for engagement
  purpose?: string; // campaign goal, e.g. "推广FAST", "见证", "科普"
  platformContent: PostPlatformContent[]; // one entry per platform in `platforms`
}
