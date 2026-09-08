"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { AssetStatus, Post, PostPerformance, PostStatus } from "./types";
import { mockPosts } from "./mockData";

interface PostsContextValue {
  posts: Post[];
  addPost: (post: Post) => void;
  removePosts: (ids: string[]) => void;
  updatePostStatus: (postId: string, status: PostStatus) => void;
  updateAssetStatus: (assetId: string, status: AssetStatus) => void;
  updatePostPerformance: (postId: string, patch: PostPerformance) => void;
  setPostApproved: (postId: string, approved: boolean) => void;
  attachMedia: (assetId: string, mediaUrl: string) => void;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export function PostsProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<Post[]>(mockPosts);

  const value: PostsContextValue = {
    posts,
    addPost: (post) => setPosts((prev) => [...prev, post]),
    removePosts: (ids) => setPosts((prev) => prev.filter((p) => !ids.includes(p.id))),
    updatePostStatus: (postId, status) =>
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status } : p))),
    updateAssetStatus: (assetId, status) =>
      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          assets: post.assets.map((a) => (a.id === assetId ? { ...a, status } : a)),
        }))
      ),
    updatePostPerformance: (postId, patch) =>
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, performance: { ...p.performance, ...patch } } : p))
      ),
    setPostApproved: (postId, approved) =>
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, approved } : p))),
    attachMedia: (assetId, mediaUrl) =>
      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          assets: post.assets.map((a) => (a.id === assetId ? { ...a, mediaUrl, status: "provided" as AssetStatus } : a)),
        }))
      ),
  };

  return <PostsContext.Provider value={value}>{children}</PostsContext.Provider>;
}

export function usePosts() {
  const ctx = useContext(PostsContext);
  if (!ctx) throw new Error("usePosts must be used within PostsProvider");
  return ctx;
}
