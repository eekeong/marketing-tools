import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { colorForHandle, formatCount, formatStructureStep, hookTypeFromDb, ReelSource } from "@/lib/reelRadarTypes";

const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
const VIRAL_MULTIPLE_THRESHOLD = 1.5;

export async function GET(req: NextRequest) {
  const source = (req.nextUrl.searchParams.get("source") ?? "radar") as ReelSource;

  const { data, error } = await supabaseAdmin
    .from("reels")
    .select("*, reel_analysis(*), scripts(id, mode, caption, created_at)")
    .eq("source", source)
    .order("first_seen_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const rows = data ?? [];
  const avgByOwner = new Map<string, { sum: number; count: number }>();
  for (const r of rows) {
    const cur = avgByOwner.get(r.owner_username) ?? { sum: 0, count: 0 };
    cur.sum += r.play_count;
    cur.count += 1;
    avgByOwner.set(r.owner_username, cur);
  }

  const reels = rows.map((r) => {
    const analysis = Array.isArray(r.reel_analysis) ? r.reel_analysis[0] : r.reel_analysis;
    const scripts = (r.scripts ?? []) as { mode: string; caption: string | null; created_at: string }[];
    const latestOf = (mode: string) =>
      scripts
        .filter((s) => s.mode === mode)
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]?.caption ?? null;

    const ownerStats = avgByOwner.get(r.owner_username);
    const avgOthers = ownerStats && ownerStats.count > 1 ? (ownerStats.sum - r.play_count) / (ownerStats.count - 1) : 0;
    const rawMultiple = avgOthers > 0 ? Math.round((r.play_count / avgOthers) * 10) / 10 : 0;
    const viralMultiple = rawMultiple >= VIRAL_MULTIPLE_THRESHOLD ? rawMultiple : null;

    return {
      id: r.id,
      account: `@${r.owner_username}`,
      hookType: hookTypeFromDb(analysis?.hook_type ?? null),
      plays: formatCount(r.play_count),
      playsNum: r.play_count,
      likes: formatCount(r.like_count),
      comments: formatCount(r.comment_count),
      score: analysis?.relevance_score ?? 0,
      viralMultiple,
      isNew: Date.now() - new Date(r.first_seen_at).getTime() < FORTY_EIGHT_HOURS_MS,
      color: colorForHandle(r.owner_username),
      whyScored: analysis?.why_scored ?? "",
      hook: analysis?.hook_text ?? "",
      structure: ((analysis?.structure ?? []) as Parameters<typeof formatStructureStep>[0][])
        .map((s) => formatStructureStep(s).title)
        .join(" → "),
      cta: analysis?.cta_text ?? "",
      transcript: analysis?.transcript ?? r.caption ?? "",
      hasSpeech: analysis?.has_speech ?? true,
      language: analysis?.language ?? null,
      caption: r.caption ?? "",
      rewrite: latestOf("rewrite_structure"),
      remix: latestOf("copy_script"),
      discoveredVia: r.discovered_via ?? null,
      thumbnailUrl: r.thumbnail_url ?? null,
      videoUrl: r.video_url ?? null,
      igUrl: r.ig_url,
    };
  });

  return NextResponse.json({ reels });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const ids: string[] = Array.isArray(body.ids) ? body.ids : [];
  if (ids.length === 0) return NextResponse.json({ error: "ids is required" }, { status: 400 });
  const { error } = await supabaseAdmin.from("reels").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
