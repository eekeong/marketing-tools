"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { useConfig } from "@/lib/config";
import NotificationBell from "@/components/NotificationBell";

const toolNav = [
  { href: "/", key: "calendar", labelKey: "nav.calendar" },
  { href: "/assets", key: "assets", labelKey: "nav.assets" },
  { href: "/media-library", key: "medialibrary", labelKey: "nav.medialibrary" },
  { href: "/copywriter", key: "copywriter", labelKey: "nav.copywriter" },
  { href: "/multiplatform", key: "multiplatform", labelKey: "nav.multiplatform" },
  { href: "/reel-radar", key: "reelradar", labelKey: "nav.reelradar" },
  { href: "/event-sop", key: "eventsop", labelKey: "nav.eventsop" },
];

const systemNav = [{ href: "/cms", key: "cms", labelKey: "nav.cms" }];

function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="inline-flex items-center rounded-full bg-background p-1 text-xs font-medium">
      <button
        onClick={() => setLang("en")}
        className={`px-2.5 py-1 rounded-full transition ${lang === "en" ? "brand-gradient text-white" : "text-muted"}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("zh")}
        className={`px-2.5 py-1 rounded-full transition ${lang === "zh" ? "brand-gradient text-white" : "text-muted"}`}
      >
        中文
      </button>
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="w-9 h-9 rounded-full bg-background flex items-center justify-center text-base hover:bg-border/60 transition"
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { iconFor } = useConfig();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-surface flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-3 px-5 py-6">
        <Image src="/brand/logo.png" alt="EduHero" width={40} height={40} priority />
        <div className="leading-tight">
          <p className="font-semibold text-[15px]">EduHero</p>
          <p className="text-xs text-muted">{t("sidebar.tagline")}</p>
        </div>
      </div>

      <nav className="px-3 flex-1 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">
          {t("nav.section.tools")}
        </p>
        <ul className="space-y-1">
          {toolNav.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "brand-gradient text-white shadow-sm" : "text-foreground/80 hover:bg-brand-pink/5"
                  }`}
                >
                  <span className="text-base">{iconFor(item.key)}</span>
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="px-3 pt-6 pb-1 text-[11px] font-medium tracking-wide text-muted uppercase">
          {t("nav.section.system")}
        </p>
        <ul className="space-y-1">
          {systemNav.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "brand-gradient text-white shadow-sm" : "text-foreground/80 hover:bg-brand-pink/5"
                  }`}
                >
                  <span className="text-base">{iconFor(item.key)}</span>
                  {t(item.labelKey)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-5 py-4 border-t border-border space-y-3">
        <p className="text-xs text-muted">{t("sidebar.role")}</p>
        <div className="flex items-center justify-between">
          <LanguageToggle />
          <div className="flex items-center gap-2">
            <NotificationBell />
            <ThemeToggle />
          </div>
        </div>
        <p className="text-[11px] text-muted">{t("sidebar.footer")}</p>
      </div>
    </aside>
  );
}
