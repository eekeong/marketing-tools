"use client";

import { Post } from "@/lib/types";
import { useConfig } from "@/lib/config";
import { useSocialAccounts } from "@/lib/accountsStore";
import { useLanguage } from "@/lib/i18n";
import Pill from "@/components/Pill";

export default function ListView({
  posts,
  onPostClick,
}: {
  posts: Post[];
  onPostClick: (post: Post) => void;
}) {
  const { platforms, statuses } = useConfig();
  const { accounts } = useSocialAccounts();
  const { lang, t } = useLanguage();
  const accountNames = Object.fromEntries(accounts.map((a) => [a.id, a.displayName]));

  const sorted = [...posts].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-8 text-center">
        <p className="text-sm text-muted italic">{t("listview.empty")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border bg-background/60">
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.date")}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.titleCol")}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.platformsCol")}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.accountCol")}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.adCopyCol")}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.assetCol")}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.purposeCol")}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.ownerCol")}</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-muted whitespace-nowrap">{t("listview.statusCol")}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((post) => {
              const status = statuses[post.status];
              const assetLink = post.assets.find((a) => a.mediaUrl)?.mediaUrl;
              return (
                <tr
                  key={post.id}
                  onClick={() => onPostClick(post)}
                  className="border-b border-border last:border-0 cursor-pointer hover:bg-background/60 transition"
                >
                  <td className="px-3 py-2 whitespace-nowrap text-muted">{post.date}</td>
                  <td className="px-3 py-2 max-w-[220px] truncate font-medium" title={post.title}>
                    {post.title}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {post.platforms.length === 0 ? (
                        <span className="text-muted">—</span>
                      ) : (
                        post.platforms.map((pf) => (
                          <Pill key={pf} label={platforms[pf][lang]} color={platforms[pf].color} bg={platforms[pf].bg} />
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted">
                    {post.accountId ? accountNames[post.accountId] ?? "—" : "—"}
                  </td>
                  <td className="px-3 py-2 max-w-[200px] truncate text-muted" title={post.adCopy}>
                    {post.adCopy || "—"}
                  </td>
                  <td className="px-3 py-2 max-w-[140px]">
                    {assetLink ? (
                      <a
                        href={assetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-brand-pink hover:underline whitespace-nowrap"
                      >
                        🔗 {t("listview.openLink")}
                      </a>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 max-w-[160px] truncate text-muted" title={post.purpose}>
                    {post.purpose || "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-muted">{post.owner}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <Pill label={status[lang]} color={status.color} bg={status.bg} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
