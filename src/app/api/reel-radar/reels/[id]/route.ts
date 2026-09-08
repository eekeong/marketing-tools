import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { colorForHandle, formatCount, hookTypeFromDb } from "@/lib/reelRadarTypes";

// Full detail for one reel — unlike /api/reel-radar/reels (list view), this returns
// the raw structure/angle/transcript fields for the reel detail page to render,
// not the joined-string shortcuts the compact list cards use.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: reel, error } = await supabaseAdmin
    .from("reels")
    .select("*, reel_analysis(*), scripts(id, mode, caption, created_at)")
    .eq("id", id)
    .single();
  if (error || !reel) return NextResponse.json({ error: error?.message ?? "reel not found" }, { status: 404 });

  const analysis = Array.isArray(reel.reel_analysis) ? reel.reel_analysis[0] : reel.reel_analysis;
  const scripts = (reel.scripts ?? []) as { mode: string; caption: string | null; created_at: string }[];
  const latestOf = (mode: string) =>
    scripts.filter((s) => s.mode === mode).sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0]?.caption ?? null;

  return NextResponse.json({
    reel: {
      id: reel.id,
      account: `@${reel.owner_username}`,
      igUrl: reel.ig_url,
      caption: reel.caption ?? "",
      thumbnailUrl: reel.thumbnail_url ?? null,
      videoUrl: reel.video_url ?? null,
      postedAt: reel.posted_at,
      plays: formatCount(reel.play_count),
      likes: formatCount(reel.like_count),
      comments: formatCount(reel.comment_count),
      color: colorForHandle(reel.owner_username),
      score: analysis?.relevance_score ?? 0,
      hookType: hookTypeFromDb(analysis?.hook_type ?? null),
      hookText: analysis?.hook_text ?? "",
      structure: analysis?.structure ?? [],
      ctaText: analysis?.cta_text ?? "",
      whyScored: analysis?.why_scored ?? "",
      angle: analysis?.angle ?? "",
      transcript: analysis?.transcript ?? "",
      hasSpeech: analysis?.has_speech ?? false,
      language: analysis?.language ?? null,
      rewrite: latestOf("rewrite_structure"),
      remix: latestOf("copy_script"),
    },
  });
}
