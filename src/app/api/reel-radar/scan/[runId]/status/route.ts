import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getActorRunStatus, getDatasetItems, ApifyReelItem } from "@/lib/apify";

export const maxDuration = 60;

// Polled by the client while a scan is running. While phase is "collecting" this
// checks in on the async Apify run; once it succeeds, this is also where the
// dedupe/blocklist/empty-caption pre-checks run and scan_items get queued for
// /continue to work through one at a time.
export async function GET(_req: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const { data: run, error } = await supabaseAdmin.from("scan_runs").select("*").eq("id", runId).single();
  if (error || !run) return NextResponse.json({ error: "scan run not found" }, { status: 404 });

  if (run.status === "cancelled" || run.status === "done" || run.status === "failed") {
    return NextResponse.json({
      phase: run.phase,
      status: run.status,
      done: run.done,
      failed: run.failed,
      total: run.total,
      finished: true,
    });
  }

  // Self-heal rows left "running" by the pre-resumable-scan code path (no
  // apify_run_id, phase not one of the current three) — without this, a stale row
  // like that gets picked up by the client's resume-on-mount check and polled
  // forever, since its phase never matches "collecting"/"analyzing"/"done".
  if (!["collecting", "analyzing", "done"].includes(run.phase ?? "")) {
    await supabaseAdmin
      .from("scan_runs")
      .update({ status: "failed", error: "stale run from a previous version — auto-closed", finished_at: new Date().toISOString() })
      .eq("id", runId);
    return NextResponse.json({ phase: run.phase, status: "failed", done: run.done, failed: run.failed, total: run.total, finished: true });
  }

  if (run.phase === "collecting") {
    let apifyStatus;
    try {
      apifyStatus = await getActorRunStatus(run.apify_run_id);
    } catch (err) {
      await supabaseAdmin
        .from("scan_runs")
        .update({ status: "failed", error: (err as Error).message, finished_at: new Date().toISOString() })
        .eq("id", runId);
      return NextResponse.json({ phase: "collecting", status: "failed", finished: true, error: (err as Error).message });
    }

    if (apifyStatus.status === "RUNNING" || apifyStatus.status === "READY") {
      return NextResponse.json({ phase: "collecting", status: "running", done: 0, total: 0, failed: 0, finished: false });
    }
    if (apifyStatus.status !== "SUCCEEDED") {
      const msg = `抓取失败 (Apify: ${apifyStatus.status})`;
      await supabaseAdmin.from("scan_runs").update({ status: "failed", error: msg, finished_at: new Date().toISOString() }).eq("id", runId);
      return NextResponse.json({ phase: "collecting", status: "failed", finished: true, error: msg });
    }

    const items = await getDatasetItems<ApifyReelItem>(apifyStatus.datasetId);
    let queued = 0;

    for (const item of items) {
      if (item.error || !item.shortCode) {
        await supabaseAdmin.from("scan_items").insert({
          run_id: runId,
          owner_username: item.username ?? item.ownerUsername ?? null,
          stage: "fetch",
          status: "failed",
          error_message: item.errorDescription ?? item.error ?? "no data returned",
          human_message: `@${item.username ?? item.ownerUsername ?? "?"} 抓取失败：${item.errorDescription ?? item.error ?? "没有返回数据"}`,
        });
        continue;
      }
      const shortcode = item.shortCode;
      const ownerUsername = item.ownerUsername ?? "unknown";

      const { data: existingReel } = await supabaseAdmin.from("reels").select("id").eq("shortcode", shortcode).maybeSingle();
      if (existingReel) {
        await supabaseAdmin.from("scan_items").insert({
          run_id: runId,
          shortcode,
          owner_username: ownerUsername,
          stage: "analyze",
          status: "done",
          human_message: `@${ownerUsername} 的这条已经收录过，跳过`,
        });
        continue;
      }

      const { data: blocked } = await supabaseAdmin.from("blocklist").select("shortcode").eq("shortcode", shortcode).maybeSingle();
      if (blocked) continue;

      const caption = (item.caption ?? "").trim();
      if (!caption) {
        await supabaseAdmin.from("scan_items").insert({
          run_id: runId,
          shortcode,
          owner_username: ownerUsername,
          stage: "analyze",
          status: "failed",
          error_message: "empty caption",
          human_message: `@${ownerUsername} 的这条视频没有文案，AI 无法分析，跳过`,
        });
        continue;
      }

      await supabaseAdmin.from("scan_items").insert({
        run_id: runId,
        shortcode,
        owner_username: ownerUsername,
        stage: "analyze",
        status: "queued",
        payload: item,
      });
      queued += 1;
    }

    // Auto-retry: carry forward analyze-stage failures from the last run of the
    // same type, as long as no reel exists for them yet (nothing to dedupe against).
    const { data: lastRun } = await supabaseAdmin
      .from("scan_runs")
      .select("id")
      .eq("type", run.type)
      .neq("id", runId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastRun) {
      const { data: failedItems } = await supabaseAdmin
        .from("scan_items")
        .select("*")
        .eq("run_id", lastRun.id)
        .eq("stage", "analyze")
        .eq("status", "failed")
        .not("payload", "is", null);
      for (const fi of failedItems ?? []) {
        if (!fi.shortcode) continue;
        const { data: existingReel } = await supabaseAdmin.from("reels").select("id").eq("shortcode", fi.shortcode).maybeSingle();
        if (existingReel) continue;
        await supabaseAdmin.from("scan_items").insert({
          run_id: runId,
          shortcode: fi.shortcode,
          owner_username: fi.owner_username,
          stage: "analyze",
          status: "queued",
          payload: fi.payload,
        });
        queued += 1;
      }
    }

    if (queued === 0) {
      await supabaseAdmin
        .from("scan_runs")
        .update({ status: "done", phase: "done", total: 0, finished_at: new Date().toISOString() })
        .eq("id", runId);
      return NextResponse.json({ phase: "done", status: "done", done: 0, failed: 0, total: 0, finished: true });
    }

    await supabaseAdmin.from("scan_runs").update({ phase: "analyzing", total: queued }).eq("id", runId);
    return NextResponse.json({ phase: "analyzing", status: "running", done: 0, failed: 0, total: queued, finished: false });
  }

  const finished = run.phase === "done" || run.done + run.failed >= run.total;
  return NextResponse.json({ phase: run.phase, status: run.status, done: run.done, failed: run.failed, total: run.total, finished });
}
