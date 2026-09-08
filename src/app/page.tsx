"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import MonthCalendar from "@/components/calendar/MonthCalendar";
import PostDetailPanel from "@/components/calendar/PostDetailPanel";
import NewPostPanel from "@/components/calendar/NewPostPanel";
import Pill from "@/components/Pill";
import { Post } from "@/lib/types";
import { useConfig } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";
import { usePosts } from "@/lib/postsStore";

const MONTH_NAMES: Record<"zh" | "en", string[]> = {
  zh: ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export default function CalendarPage() {
  return (
    <Suspense fallback={null}>
      <CalendarPageInner />
    </Suspense>
  );
}

function CalendarPageInner() {
  const { platforms, statuses, salesReps } = useConfig();
  const { lang, t } = useLanguage();
  const { posts, addPost, updatePostStatus, updatePostPerformance, setPostApproved, attachMedia } = usePosts();
  const searchParams = useSearchParams();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [newPostDate, setNewPostDate] = useState<string | null>(null);

  const selectedPost = posts.find((p) => p.id === selectedPostId) ?? null;

  useEffect(() => {
    const postId = searchParams.get("post");
    if (!postId) return;
    const target = posts.find((p) => p.id === postId);
    if (target) {
      const d = new Date(target.date);
      setYear(d.getFullYear());
      setMonth(d.getMonth());
      setSelectedPostId(postId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const goPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const monthPosts = useMemo(
    () =>
      posts.filter((p) => {
        const d = new Date(p.date);
        return d.getFullYear() === year && d.getMonth() === month;
      }),
    [posts, year, month]
  );

  const needsAssets = monthPosts.filter((p) => p.status === "assets_needed").length;

  const workload = useMemo(() => {
    const counts = new Map<string, number>();
    let unassigned = 0;
    monthPosts.forEach((p) => {
      if (p.salesRepId) counts.set(p.salesRepId, (counts.get(p.salesRepId) ?? 0) + 1);
      else unassigned += 1;
    });
    return { counts, unassigned };
  }, [monthPosts]);

  const performanceSummary = useMemo(() => {
    const published = monthPosts.filter((p) => p.status === "published" && p.performance);
    const totalLeads = published.reduce((s, p) => s + (p.performance?.leads ?? 0), 0);
    const totalConversions = published.reduce((s, p) => s + (p.performance?.conversions ?? 0), 0);
    const top = [...published].sort((a, b) => (b.performance?.leads ?? 0) - (a.performance?.leads ?? 0))[0];
    return { totalLeads, totalConversions, top, hasData: published.length > 0 };
  }, [monthPosts]);

  const handleCreatePost = (post: Post) => {
    addPost(post);
    setNewPostDate(null);
  };

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">{t("calendar.title")}</h1>
          <p className="text-sm text-muted mt-1">{t("calendar.subtitle")}</p>
        </div>
        <button
          onClick={() =>
            setNewPostDate(
              `${year}-${String(month + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`
            )
          }
          className="rounded-xl brand-gradient text-white text-sm font-medium px-4 py-2.5 shadow-sm hover:opacity-90 transition"
        >
          {t("calendar.addSchedule")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-2 py-1.5">
          <button onClick={goPrevMonth} className="w-7 h-7 rounded-lg hover:bg-background text-sm">
            ←
          </button>
          <span className="text-sm font-medium min-w-[110px] text-center">
            {lang === "zh" ? `${year} 年 ${MONTH_NAMES.zh[month]}` : `${MONTH_NAMES.en[month]} ${year}`}
          </span>
          <button onClick={goNextMonth} className="w-7 h-7 rounded-lg hover:bg-background text-sm">
            →
          </button>
        </div>
        <button
          onClick={() => {
            setYear(today.getFullYear());
            setMonth(today.getMonth());
          }}
          className="text-sm text-brand-pink font-medium hover:underline"
        >
          {t("calendar.backToToday")}
        </button>

        <div className="flex-1" />

        {needsAssets > 0 && (
          <Pill
            label={`${needsAssets} ${t("calendar.assetsShortage")}`}
            color={statuses.assets_needed.color}
            bg={statuses.assets_needed.bg}
          />
        )}
      </div>

      <div className="mb-5 flex flex-wrap gap-x-6 gap-y-3">
        <div>
          <p className="text-xs font-medium text-muted mb-1.5">{t("calendar.platformsLegend")}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(platforms).map(([key, meta]) => (
              <Pill key={key} label={meta[lang]} color={meta.color} bg={meta.bg} />
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-medium text-muted mb-1.5">{t("calendar.statusLegend")}</p>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(statuses).map(([key, meta]) => (
              <Pill key={key} label={meta[lang]} color={meta.color} bg={meta.bg} />
            ))}
          </div>
        </div>
      </div>

      <MonthCalendar
        year={year}
        month={month}
        posts={monthPosts}
        onDayClick={(dateKey) => setNewPostDate(dateKey)}
        onPostClick={(post) => setSelectedPostId(post.id)}
      />

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">{t("calendar.workloadTitle")}</p>
          {monthPosts.length === 0 ? (
            <p className="text-sm text-muted italic">{t("calendar.workloadEmpty")}</p>
          ) : (
            <div className="space-y-2">
              {salesReps.map((rep) => {
                const count = workload.counts.get(rep.id) ?? 0;
                if (count === 0) return null;
                return (
                  <div key={rep.id} className="flex items-center justify-between text-sm">
                    <span>{rep.name}</span>
                    <span className="text-muted">{count}</span>
                  </div>
                );
              })}
              {workload.unassigned > 0 && (
                <div className="flex items-center justify-between text-sm text-muted">
                  <span>{t("calendar.workloadUnassigned")}</span>
                  <span>{workload.unassigned}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-muted uppercase tracking-wide mb-3">{t("calendar.overviewTitle")}</p>
          {!performanceSummary.hasData ? (
            <p className="text-sm text-muted italic">{t("calendar.noPerformanceData")}</p>
          ) : (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">{t("calendar.totalLeads")}</span>
                <span className="font-medium">{performanceSummary.totalLeads}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">{t("calendar.totalConversions")}</span>
                <span className="font-medium">{performanceSummary.totalConversions}</span>
              </div>
              {performanceSummary.top && (
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-muted">{t("calendar.topPost")}</span>
                  <span className="font-medium truncate max-w-[60%]">{performanceSummary.top.title}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {selectedPost && (
        <PostDetailPanel
          post={selectedPost}
          onClose={() => setSelectedPostId(null)}
          onUpdateStatus={updatePostStatus}
          onUpdatePerformance={updatePostPerformance}
          onSetApproved={setPostApproved}
          onAttachMedia={attachMedia}
        />
      )}

      {newPostDate && (
        <NewPostPanel date={newPostDate} onClose={() => setNewPostDate(null)} onCreate={handleCreatePost} />
      )}
    </div>
  );
}
