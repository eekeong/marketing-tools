import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { colorForHandle, formatCount, hookTypeFromDb, HOOK_TYPES_DB } from "@/lib/reelRadarTypes";
import { HOOK_TYPES } from "@/lib/reelRadarData";

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("reels")
    .select("id, owner_username, play_count, reel_analysis(hook_type, relevance_score)")
    .eq("source", "radar");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];

  const byHook = new Map<string, { plays: number[]; relevances: number[] }>();
  for (const r of rows) {
    const a = Array.isArray(r.reel_analysis) ? r.reel_analysis[0] : r.reel_analysis;
    const hook = a?.hook_type ?? "other";
    const cur = byHook.get(hook) ?? { plays: [], relevances: [] };
    cur.plays.push(r.play_count);
    if (typeof a?.relevance_score === "number") cur.relevances.push(a.relevance_score);
    byHook.set(hook, cur);
  }

  const hookStats = HOOK_TYPES_DB.map((dbHook, i) => {
    const bucket = byHook.get(dbHook);
    return {
      hook: HOOK_TYPES[i],
      medianViews: formatCount(median(bucket?.plays ?? [])),
      samples: bucket?.plays.length ?? 0,
      avgRelevance: bucket && bucket.relevances.length
        ? Math.round((bucket.relevances.reduce((s, v) => s + v, 0) / bucket.relevances.length) * 10) / 10
        : 0,
    };
  })
    .filter((h) => h.samples > 0)
    .sort((a, b) => parseFloat(b.medianViews) - parseFloat(a.medianViews));

  const avgByOwner = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const cur = avgByOwner.get(r.owner_username) ?? { sum: 0, count: 0 };
    cur.sum += r.play_count;
    cur.count += 1;
    avgByOwner.set(r.owner_username, cur);
  }
  const darkHorses = rows
    .map((r) => {
      const stats = avgByOwner.get(r.owner_username);
      const avgOthers = stats && stats.count > 1 ? (stats.sum - r.play_count) / (stats.count - 1) : 0;
      const multiple = avgOthers > 0 ? r.play_count / avgOthers : 0;
      const a = Array.isArray(r.reel_analysis) ? r.reel_analysis[0] : r.reel_analysis;
      return {
        id: r.id,
        account: `@${r.owner_username}`,
        hookType: hookTypeFromDb(a?.hook_type ?? null),
        multiple: Math.round(multiple * 10) / 10,
        color: colorForHandle(r.owner_username),
      };
    })
    .filter((d) => d.multiple >= 1.5)
    .sort((a, b) => b.multiple - a.multiple)
    .slice(0, 4);

  return NextResponse.json({ hookStats, darkHorses });
}
