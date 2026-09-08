import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { colorForHandle, formatCount, hookTypeFromDb } from "@/lib/reelRadarTypes";

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export async function GET() {
  const [{ data: mine, error }, { data: diagnosis }] = await Promise.all([
    supabaseAdmin
      .from("reels")
      .select("id, owner_username, play_count, reel_analysis(hook_type, has_speech)")
      .eq("source", "mine")
      .order("play_count", { ascending: false }),
    supabaseAdmin.from("account_diagnosis").select("*").order("generated_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = mine ?? [];
  const plays = rows.map((r) => r.play_count);
  const withSpeech = rows.filter((r) => {
    const a = Array.isArray(r.reel_analysis) ? r.reel_analysis[0] : r.reel_analysis;
    return a?.has_speech;
  }).length;

  const hookUsage: Record<string, number> = {};
  for (const r of rows) {
    const a = Array.isArray(r.reel_analysis) ? r.reel_analysis[0] : r.reel_analysis;
    const zh = hookTypeFromDb(a?.hook_type ?? null);
    hookUsage[zh] = (hookUsage[zh] ?? 0) + 1;
  }

  const avg = plays.length ? plays.reduce((s, v) => s + v, 0) / plays.length : 0;
  const myHits = rows.slice(0, 2).map((r) => ({
    id: r.id,
    title: `@${r.owner_username}`,
    plays: formatCount(r.play_count),
    multiple: avg > 0 ? Math.round((r.play_count / avg) * 10) / 10 : 0,
    color: colorForHandle(r.owner_username),
  }));

  return NextResponse.json({
    stats: {
      collected: rows.length,
      median: formatCount(median(plays)),
      max: formatCount(plays.length ? Math.max(...plays) : 0),
      voiceoverPct: rows.length ? Math.round((withSpeech / rows.length) * 100) : 0,
    },
    myHits,
    hookUsage,
    diagnosis: diagnosis?.report_md ?? null,
  });
}
