import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getActorRunStatus, getDatasetItems, ApifyReelItem } from "@/lib/apify";

export const maxDuration = 60;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

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

    // Bulk pre-checks instead of 2-3 sequential round-trips per item — a "mine"
    // backfill can return hundreds of items (an account's full history), and
    // per-item queries at that scale risk this request running past maxDuration
    // and leaving the run stuck in "collecting" forever, same failure mode this
    // whole resumable-scan design was built to fix.
    const errorItems = items.filter((i) => i.error || !i.shortCode);
    const validItems = items.filter((i) => !i.error && i.shortCode) as (ApifyReelItem & { shortCode: string })[];
    const allShortcodes = validItems.map((i) => i.shortCode);

    const existingShortcodes = new Set<string>();
    for (const batch of chunk(allShortcodes, 200)) {
      if (batch.length === 0) continue;
      const { data } = await supabaseAdmin.from("reels").select("shortcode").in("shortcode", batch);
      for (const r of data ?? []) existingShortcodes.add(r.shortcode);
    }

    const blockedShortcodes = new Set<string>();
    for (const batch of chunk(allShortcodes, 200)) {
      if (batch.length === 0) continue;
      const { data } = await supabaseAdmin.from("blocklist").select("shortcode").in("shortcode", batch);
      for (const r of data ?? []) blockedShortcodes.add(r.shortcode);
    }

    const rowsToInsert: Record<string, unknown>[] = [];
    let queued = 0;

    for (const item of errorItems) {
      rowsToInsert.push({
        run_id: runId,
        owner_username: item.username ?? item.ownerUsername ?? null,
        stage: "fetch",
        status: "failed",
        error_message: item.errorDescription ?? item.error ?? "no data returned",
        human_message: `@${item.username ?? item.ownerUsername ?? "?"} 抓取失败：${item.errorDescription ?? item.error ?? "没有返回数据"}`,
      });
    }

    for (const item of validItems) {
      const shortcode = item.shortCode;
      const ownerUsername = item.ownerUsername ?? "unknown";

      if (existingShortcodes.has(shortcode)) {
        rowsToInsert.push({
          run_id: runId,
          shortcode,
          owner_username: ownerUsername,
          stage: "analyze",
          status: "done",
          human_message: `@${ownerUsername} 的这条已经收录过，跳过`,
        });
        continue;
      }
      if (blockedShortcodes.has(shortcode)) continue;

      const caption = (item.caption ?? "").trim();
      if (!caption) {
        rowsToInsert.push({
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

      rowsToInsert.push({
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
      const candidates = (failedItems ?? []).filter((fi) => fi.shortcode);
      const retryShortcodes = candidates.map((fi) => fi.shortcode as string);
      const alreadyExists = new Set<string>();
      for (const batch of chunk(retryShortcodes, 200)) {
        if (batch.length === 0) continue;
        const { data } = await supabaseAdmin.from("reels").select("shortcode").in("shortcode", batch);
        for (const r of data ?? []) alreadyExists.add(r.shortcode);
      }
      for (const fi of candidates) {
        if (alreadyExists.has(fi.shortcode as string)) continue;
        rowsToInsert.push({
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

    for (const batch of chunk(rowsToInsert, 200)) {
      if (batch.length === 0) continue;
      await supabaseAdmin.from("scan_items").insert(batch);
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
