"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  AssetStatus,
  Post,
  PostStatus,
  PostPlatformContent,
  Platform,
} from "./types";

interface PostsContextValue {
  posts: Post[];
  loading: boolean;
  error: string | null;
  addPost: (post: Post) => void;
  updatePost: (
    postId: string,
    patch: Partial<Pick<Post, "title" | "date" | "platforms" | "owner" | "salesRepId" | "notes" | "adCopy" | "accountId">>
  ) => void;
  removePosts: (ids: string[]) => void;
  updatePostStatus: (postId: string, status: PostStatus) => void;
  updateAssetStatus: (assetId: string, status: AssetStatus) => void;
  setPostApproved: (postId: string, approved: boolean) => void;
  attachMedia: (assetId: string, mediaUrl: string) => void;
  reschedulePost: (postId: string, date: string) => void;
  upsertPlatformContent: (
    postId: string,
    patch: Partial<PostPlatformContent> & { platform: Platform }
  ) => void;
}

const PostsContext = createContext<PostsContextValue | null>(null);

// Raw shapes as returned by Supabase (snake_case columns).
interface AssetRow {
  id: string;
  name: string;
  requested_from: string | null;
  status: AssetStatus;
  due_date: string | null;
  media_url: string | null;
}
interface ContentRow {
  id: string;
  post_id: string;
  platform: Platform;
  caption: string;
  media_url: string | null;
  account_id: string | null;
  publish_status: PostPlatformContent["publishStatus"];
  published_at: string | null;
}
interface PostRow {
  id: string;
  title: string;
  date: string;
  status: PostStatus;
  owner: string;
  notes: string | null;
  sales_rep_id: string | null;
  approved: boolean;
  platforms: Platform[];
  category: Post["category"];
  account_id: string | null;
  ad_copy: string | null;
  lead_magnet_url: string | null;
  purpose: string | null;
  asset_requests?: AssetRow[];
  post_platform_content?: ContentRow[];
}

function mapRowToPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    platforms: row.platforms ?? [],
    status: row.status,
    owner: row.owner,
    notes: row.notes ?? undefined,
    assets: (row.asset_requests ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      requestedFrom: a.requested_from ?? "",
      status: a.status,
      dueDate: a.due_date ?? "",
      mediaUrl: a.media_url ?? undefined,
    })),
    salesRepId: row.sales_rep_id ?? undefined,
    approved: row.approved,
    category: row.category,
    accountId: row.account_id ?? undefined,
    adCopy: row.ad_copy ?? undefined,
    leadMagnetUrl: row.lead_magnet_url ?? undefined,
    purpose: row.purpose ?? undefined,
    platformContent: (row.post_platform_content ?? []).map((c) => ({
      id: c.id,
      postId: c.post_id,
      platform: c.platform,
      caption: c.caption,
      mediaUrl: c.media_url ?? undefined,
      accountId: c.account_id ?? undefined,
      publishStatus: c.publish_status,
      publishedAt: c.published_at ?? undefined,
    })),
  };
}

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/calendar/posts");
        if (!res.ok) throw new Error((await res.json()).error);
        const { posts: rows } = await res.json();
        setPosts((rows as PostRow[]).map(mapRowToPost));
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const addPost: PostsContextValue["addPost"] = (post) => {
    const tempId = post.id;
    setPosts((prev) => [...prev, post]);
    (async () => {
      try {
        const res = await fetch("/api/calendar/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: post.title,
            date: post.date,
            owner: post.owner,
            status: post.status,
            notes: post.notes,
            salesRepId: post.salesRepId,
            platforms: post.platforms,
            category: post.category,
            accountId: post.accountId,
            adCopy: post.adCopy,
            leadMagnetUrl: post.leadMagnetUrl,
            purpose: post.purpose,
            assets: post.assets.map((a) => ({
              name: a.name,
              requestedFrom: a.requestedFrom,
              dueDate: a.dueDate,
              status: a.status,
              mediaUrl: a.mediaUrl,
            })),
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        const { post: created } = await res.json();
        setPosts((prev) => prev.map((p) => (p.id === tempId ? mapRowToPost(created) : p)));
      } catch (e) {
        setPosts((prev) => prev.filter((p) => p.id !== tempId));
        setError(String(e));
      }
    })();
  };

  const updatePost: PostsContextValue["updatePost"] = (postId, patch) => {
    const prev = posts;
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, ...patch } : x)));
    fetch(`/api/calendar/posts/${postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(async (res) => {
      if (!res.ok) {
        setPosts(prev);
        setError((await res.json()).error);
      }
    });
  };

  const removePosts: PostsContextValue["removePosts"] = (ids) => {
    const prev = posts;
    setPosts((p) => p.filter((post) => !ids.includes(post.id)));
    (async () => {
      try {
        const results = await Promise.all(
          ids.map((id) => fetch(`/api/calendar/posts/${id}`, { method: "DELETE" }))
        );
        if (results.some((r) => !r.ok)) throw new Error("delete failed");
      } catch (e) {
        setPosts(prev);
        setError(String(e));
      }
    })();
  };

  const updatePostStatus: PostsContextValue["updatePostStatus"] = (postId, status) => {
    const prev = posts;
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, status } : x)));
    fetch(`/api/calendar/posts/${postId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then(async (res) => {
      if (!res.ok) {
        setPosts(prev);
        setError((await res.json()).error);
      }
    });
  };

  const updateAssetStatus: PostsContextValue["updateAssetStatus"] = (assetId, status) => {
    const prev = posts;
    setPosts((p) =>
      p.map((post) => ({
        ...post,
        assets: post.assets.map((a) => (a.id === assetId ? { ...a, status } : a)),
      }))
    );
    fetch(`/api/calendar/assets/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).then(async (res) => {
      if (!res.ok) {
        setPosts(prev);
        setError((await res.json()).error);
      }
    });
  };

  const setPostApproved: PostsContextValue["setPostApproved"] = (postId, approved) => {
    const prev = posts;
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, approved } : x)));
    fetch(`/api/calendar/posts/${postId}/approve`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    }).then(async (res) => {
      if (!res.ok) {
        setPosts(prev);
        setError((await res.json()).error);
      }
    });
  };

  const attachMedia: PostsContextValue["attachMedia"] = (assetId, mediaUrl) => {
    const prev = posts;
    setPosts((p) =>
      p.map((post) => ({
        ...post,
        assets: post.assets.map((a) =>
          a.id === assetId ? { ...a, mediaUrl, status: "provided" as AssetStatus } : a
        ),
      }))
    );
    fetch(`/api/calendar/assets/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "provided", mediaUrl }),
    }).then(async (res) => {
      if (!res.ok) {
        setPosts(prev);
        setError((await res.json()).error);
      }
    });
  };

  const reschedulePost: PostsContextValue["reschedulePost"] = (postId, date) => {
    const prev = posts;
    setPosts((p) => p.map((x) => (x.id === postId ? { ...x, date } : x)));
    fetch(`/api/calendar/posts/${postId}/reschedule`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date }),
    }).then(async (res) => {
      if (!res.ok) {
        setPosts(prev);
        setError((await res.json()).error);
      }
    });
  };

  const upsertPlatformContent: PostsContextValue["upsertPlatformContent"] = (postId, patch) => {
    const prev = posts;
    setPosts((p) =>
      p.map((post) => {
        if (post.id !== postId) return post;
        const existing = post.platformContent.find((c) => c.platform === patch.platform);
        const nextContent: PostPlatformContent = existing
          ? { ...existing, ...patch }
          : {
              id: `temp_${patch.platform}`,
              postId,
              caption: "",
              publishStatus: "draft",
              ...patch,
            };
        return {
          ...post,
          platformContent: existing
            ? post.platformContent.map((c) => (c.platform === patch.platform ? nextContent : c))
            : [...post.platformContent, nextContent],
        };
      })
    );
    fetch(`/api/calendar/posts/${postId}/content`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    }).then(async (res) => {
      if (!res.ok) {
        setPosts(prev);
        setError((await res.json()).error);
      }
    });
  };

  const value: PostsContextValue = {
    posts,
    loading,
    error,
    addPost,
    updatePost,
    removePosts,
    updatePostStatus,
    updateAssetStatus,
    setPostApproved,
    attachMedia,
    reschedulePost,
    upsertPlatformContent,
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
