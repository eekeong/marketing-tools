import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { analyzeAndStoreReel } from "@/lib/reelAnalysis";
import { ApifyReelItem } from "@/lib/apify";

export const maxDuration = 60;

// Recomputed from scan_items each time instead of read-modify-write incrementing
// scan_runs.done/failed — the after()-chained self-calls can overlap in flight,
// and incrementing a value read at the top of the request loses updates under
// that race (observed for real: a 377-item run showed done=185 despite all 377
// actually completing). Counting current rows is race-free by construction.
async function getRunProgress(runId: string): Promise<{ done: number; failed: number; costUsd: number }> {
  const [{ count: done }, { count: failed }, { data: doneItems }] = await Promise.all([
    supabaseAdmin.from("scan_items").select("id", { count: "exact", head: true }).eq("run_id", runId).eq("status", "done"),
    supabaseAdmin.from("scan_items").select("id", { count: "exact", head: true }).eq("run_id", runId).eq("status", "failed"),
    supabaseAdmin.from("scan_items").select("reel_id").eq("run_id", runId).eq("status", "done").not("reel_id", "is", null),
  ]);

  const reelIds = (doneItems ?? []).map((i) => i.reel_id as string);
  let costUsd = 0;
  if (reelIds.length > 0) {
    const { data: costs } = await supabaseAdmin.from("reel_analysis").select("cost_usd").in("reel_id", reelIds);
    costUsd = (costs ?? []).reduce((s, c) => s + Number(c.cost_usd ?? 0), 0);
  }

  return { done: done ?? 0, failed: failed ?? 0, costUsd };
}

// Processes exactly one queued scan_item per call — kept to one item so a call
// comfortably fits inside maxDuration even with Phase B's video download+analyze
// step. The client polls this in a loop; after() also fires one more self-call
// server-side as a best-effort nudge so a closed tab doesn't fully stall progress.
export async function POST(req: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;

  const { data: run } = await supabaseAdmin.from("scan_runs").select("*").eq("id", runId).single();
  if (!run) return NextResponse.json({ error: "scan run not found" }, { status: 404 });

  if (run.status === "cancelled") {
    const { done, failed } = await getRunProgress(runId);
    return NextResponse.json({ done, failed, total: run.total, finished: true, cancelled: true });
  }
  if (run.phase !== "analyzing") {
    return NextResponse.json({ done: run.done, failed: run.failed, total: run.total, finished: false });
  }

  const { data: candidates } = await supabaseAdmin
    .from("scan_items")
    .select("*")
    .eq("run_id", runId)
    .eq("status", "queued")
    .order("created_at", { ascending: true })
    .limit(1);
  const claim = candidates?.[0];

  if (!claim) {
    const { count: remaining } = await supabaseAdmin
      .from("scan_items")
      .select("id", { count: "exact", head: true })
      .eq("run_id", runId)
      .eq("status", "queued");
    const { done, failed, costUsd } = await getRunProgress(runId);
    if (!remaining) {
      await supabaseAdmin
        .from("scan_runs")
        .update({ status: "done", phase: "done", done, failed, cost_usd: costUsd, finished_at: new Date().toISOString() })
        .eq("id", runId);
      return NextResponse.json({ done, failed, total: run.total, finished: true });
    }
    return NextResponse.json({ done, failed, total: run.total, finished: false });
  }

  // Best-effort claim: only flip queued -> running if it's still queued, so the
  // client loop and the self-chained after() call below can't double-process it.
  const { data: claimed } = await supabaseAdmin
    .from("scan_items")
    .update({ status: "running" })
    .eq("id", claim.id)
    .eq("status", "queued")
    .select()
    .maybeSingle();

  if (!claimed) {
    const { done, failed } = await getRunProgress(runId);
    return NextResponse.json({ done, failed, total: run.total, finished: false });
  }

  const item = claimed.payload as ApifyReelItem;

  try {
    const result = await analyzeAndStoreReel({
      shortcode: claimed.shortcode as string,
      url: item.url,
      account: claimed.owner_username ?? item.ownerUsername ?? "unknown",
      ownerFullName: item.ownerFullName,
      text: (item.caption ?? "").trim(),
      plays: item.videoPlayCount ?? item.videoViewCount ?? 0,
      likes: item.likesCount ?? 0,
      comments: item.commentsCount ?? 0,
      durationSec: item.videoDuration ?? null,
      postedAt: item.timestamp ?? null,
      source: run.type,
      discoveredVia: null,
      thumbnailUrl: item.displayUrl ?? null,
      videoUrl: item.videoUrl ?? null,
      raw: item,
    });
    await supabaseAdmin
      .from("scan_items")
      .update({
        status: "done",
        reel_id: result.reel.id,
        human_message: `分析了 @${claimed.owner_username} 的一条 Reel，打了 ${result.analysis.relevance_score} 分`,
      })
      .eq("id", claimed.id);
  } catch (err) {
    await supabaseAdmin
      .from("scan_items")
      .update({
        status: "failed",
        error_message: (err as Error).message,
        human_message: `@${claimed.owner_username} 的这条分析失败：${(err as Error).message}`,
      })
      .eq("id", claimed.id);
  }

  const { done, failed, costUsd } = await getRunProgress(runId);
  const finished = done + failed >= run.total;
  if (finished) {
    await supabaseAdmin
      .from("scan_runs")
      .update({ status: "done", phase: "done", done, failed, cost_usd: costUsd, finished_at: new Date().toISOString() })
      .eq("id", runId);
  } else {
    await supabaseAdmin.from("scan_runs").update({ done, failed, cost_usd: costUsd }).eq("id", runId);
    after(async () => {
      try {
        await fetch(new URL(`/api/reel-radar/scan/${runId}/continue`, req.nextUrl.origin), { method: "POST" });
      } catch {}
    });
  }

  return NextResponse.json({ done, failed, total: run.total, finished });
}
