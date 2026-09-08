"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePosts } from "@/lib/postsStore";
import { useLanguage } from "@/lib/i18n";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

interface NotificationItem {
  id: string;
  postId: string;
  type: "overdue" | "dueSoon" | "publishToday" | "unapproved";
  text: string;
}

export default function NotificationBell() {
  const { posts } = usePosts();
  const { t } = useLanguage();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const today = todayStr();
  const soon = addDays(today, 2);

  const items: NotificationItem[] = [];

  posts.forEach((post) => {
    post.assets.forEach((asset) => {
      if (asset.status === "provided") return;
      if (asset.dueDate < today) {
        items.push({
          id: `overdue_${asset.id}`,
          postId: post.id,
          type: "overdue",
          text: `${t("notif.overduePrefix")} "${asset.name}"（${post.title}）`,
        });
      } else if (asset.dueDate <= soon) {
        items.push({
          id: `soon_${asset.id}`,
          postId: post.id,
          type: "dueSoon",
          text: `${t("notif.dueSoonPrefix")} "${asset.name}"（${post.title}）· ${asset.dueDate}`,
        });
      }
    });

    if ((post.date === today || post.date === addDays(today, 1)) && post.status !== "published") {
      items.push({
        id: `publish_${post.id}`,
        postId: post.id,
        type: "publishToday",
        text: `${post.date === today ? t("notif.publishTodayPrefix") : t("notif.publishTomorrowPrefix")} "${post.title}"`,
      });
    }

    if (post.date <= addDays(today, 3) && post.date >= today && !post.approved && post.status !== "published") {
      items.push({
        id: `approve_${post.id}`,
        postId: post.id,
        type: "unapproved",
        text: `${t("notif.unapprovedPrefix")} "${post.title}"`,
      });
    }
  });

  const handleClick = (postId: string) => {
    setOpen(false);
    router.push(`/?post=${postId}`);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
        className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-base hover:bg-border/60 transition relative"
      >
        🔔
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-pink text-white text-[10px] font-semibold flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 bottom-11 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl border border-border bg-surface shadow-xl">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold">{t("notif.title")}</p>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-muted p-4 italic">{t("notif.empty")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => handleClick(item.postId)}
                      className="w-full text-left px-4 py-2.5 text-xs hover:bg-background transition flex items-start gap-2"
                    >
                      <span>
                        {item.type === "overdue" && "🔴"}
                        {item.type === "dueSoon" && "🟡"}
                        {item.type === "publishToday" && "🚀"}
                        {item.type === "unapproved" && "⚠️"}
                      </span>
                      <span className="text-foreground/90 leading-relaxed">{item.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
