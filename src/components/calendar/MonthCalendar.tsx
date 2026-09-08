"use client";

import { Post } from "@/lib/types";
import { useConfig } from "@/lib/config";
import { useLanguage } from "@/lib/i18n";

const WEEKDAYS: Record<"zh" | "en", string[]> = {
  zh: ["一", "二", "三", "四", "五", "六", "日"],
  en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

function getMonthMatrix(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { date: Date; inMonth: boolean }[] = [];

  for (let i = startOffset; i > 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i + 1), inMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
  }
  return cells;
}

function toKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function MonthCalendar({
  year,
  month,
  posts,
  onDayClick,
  onPostClick,
}: {
  year: number;
  month: number;
  posts: Post[];
  onDayClick: (dateKey: string) => void;
  onPostClick: (post: Post) => void;
}) {
  const { platforms, statuses } = useConfig();
  const { lang } = useLanguage();
  const cells = getMonthMatrix(year, month);
  const todayKey = toKey(new Date());
  const weekdays = WEEKDAYS[lang];

  const postsByDay = posts.reduce<Record<string, Post[]>>((acc, p) => {
    (acc[p.date] ??= []).push(p);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-background/60">
        {weekdays.map((w) => (
          <div key={w} className="px-3 py-2 text-xs font-medium text-muted text-center">
            {lang === "zh" ? `周${w}` : w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map(({ date, inMonth }, idx) => {
          const key = toKey(date);
          const dayPosts = postsByDay[key] ?? [];
          const isToday = key === todayKey;
          return (
            <button
              key={idx}
              onClick={() => onDayClick(key)}
              className={`group min-h-[112px] border-b border-r border-border p-2 text-left align-top transition hover:bg-brand-pink/5 ${
                inMonth ? "bg-surface" : "bg-background/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-medium rounded-full w-6 h-6 flex items-center justify-center ${
                    isToday ? "brand-gradient text-white" : inMonth ? "text-foreground/80" : "text-muted/50"
                  }`}
                >
                  {date.getDate()}
                </span>
                {dayPosts.length > 0 && (
                  <span className="text-[10px] text-muted opacity-0 group-hover:opacity-100 transition">
                    {dayPosts.length}
                  </span>
                )}
              </div>
              <div className="mt-1.5 space-y-1">
                {dayPosts.slice(0, 3).map((post) => {
                  const status = statuses[post.status];
                  return (
                    <div
                      key={post.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPostClick(post);
                      }}
                      className="rounded-lg px-1.5 py-1 text-[11px] leading-tight cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: status.bg, color: status.color }}
                      title={post.title}
                    >
                      <div className="flex items-center gap-1">
                        <span className="flex -space-x-1">
                          {post.platforms.slice(0, 3).map((pf) => (
                            <span
                              key={pf}
                              className="w-2 h-2 rounded-full border border-white"
                              style={{ backgroundColor: platforms[pf].color }}
                            />
                          ))}
                        </span>
                        <span className="truncate">{post.title}</span>
                      </div>
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <div className="text-[10px] text-muted pl-1.5">+{dayPosts.length - 3}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
