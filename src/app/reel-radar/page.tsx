"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { useLanguage } from "@/lib/i18n";
import { HookType } from "@/lib/reelRadarData";
import RadarTab from "@/components/reelradar/RadarTab";
import DiscoverTab from "@/components/reelradar/DiscoverTab";
import PatternsTab from "@/components/reelradar/PatternsTab";
import ScriptsTab from "@/components/reelradar/ScriptsTab";
import AccountTab from "@/components/reelradar/AccountTab";
import SetupTab from "@/components/reelradar/SetupTab";
import ActivityPanel from "@/components/reelradar/ActivityPanel";

type Tab = "radar" | "discover" | "patterns" | "scripts" | "account" | "setup";

export default function ReelRadarPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<Tab>("radar");
  const [hookFilter, setHookFilter] = useState<HookType | "all">("all");
  const [activityOpen, setActivityOpen] = useState(false);

  const tabs: { key: Tab; labelKey: string }[] = [
    { key: "radar", labelKey: "reelradar.tab.radar" },
    { key: "discover", labelKey: "reelradar.tab.discover" },
    { key: "patterns", labelKey: "reelradar.tab.patterns" },
    { key: "scripts", labelKey: "reelradar.tab.scripts" },
    { key: "account", labelKey: "reelradar.tab.account" },
    { key: "setup", labelKey: "reelradar.tab.setup" },
  ];

  const handleJumpToHook = (hook: HookType) => {
    setHookFilter(hook);
    setTab("radar");
  };

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader title={t("reelradar.title")} />

      <div className="flex flex-wrap gap-2 mb-6">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium border transition ${
              tab === tb.key ? "brand-gradient text-white border-transparent" : "text-muted border-border hover:bg-background"
            }`}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </div>

      {tab === "radar" && (
        <RadarTab onOpenActivity={() => setActivityOpen(true)} hookFilter={hookFilter} setHookFilter={setHookFilter} />
      )}
      {tab === "discover" && <DiscoverTab />}
      {tab === "patterns" && <PatternsTab onJumpToHook={handleJumpToHook} />}
      {tab === "scripts" && <ScriptsTab />}
      {tab === "account" && <AccountTab />}
      {tab === "setup" && <SetupTab />}

      {activityOpen && <ActivityPanel onClose={() => setActivityOpen(false)} />}
    </div>
  );
}
