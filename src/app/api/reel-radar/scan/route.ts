import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { startActorRun, buildRadarInput, buildDiscoverInput } from "@/lib/apify";
import { ReelSource } from "@/lib/reelRadarTypes";

export const maxDuration = 60;

// "我的账号" isn't a discovery feed you want capped — it's your own finite history,
// and you genuinely want it all covered eventually. Decoupled from reels_per_account
// (which stays the per-competitor/discover cap) so raising one doesn't also make
// every competitor scan pull hundreds of posts. Already-collected reels are skipped
// by the shortcode dedupe in status/route.ts, so re-scanning after the first full
// backfill only costs for genuinely new videos.
const MY_ACCOUNT_RESULTS_LIMIT = 500;

// Starts a scan and returns immediately with a runId — the actual scrape (which can
// take much longer than a single request should block on) runs on Apify's side, and
// analysis happens incrementally via /scan/[runId]/continue. See status/route.ts for
// how the client drives the rest of the pipeline.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const type: ReelSource = ["radar", "discover", "mine"].includes(body.type) ? body.type : "radar";

  const { data: existingRunning } = await supabaseAdmin
    .from("scan_runs")
    .select("id")
    .eq("type", type)
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existingRunning) {
    return NextResponse.json({ runId: existingRunning.id, resumed: true });
  }

  const { data: settings } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();
  const resultsLimit = settings?.reels_per_account || 10;

  let input: Record<string, unknown>;
  let scannedUsernames: string[] = [];

  if (type === "radar") {
    const { data: competitors } = await supabaseAdmin.from("competitors").select("*").eq("status", "active");
    if (!competitors || competitors.length === 0) {
      return NextResponse.json({ error: "还没有任何竞品账号，先在设置里添加。" }, { status: 400 });
    }
    scannedUsernames = competitors.map((c) => c.ig_username);
    input = buildRadarInput(scannedUsernames, resultsLimit);
  } else if (type === "discover") {
    const { data: keywords } = await supabaseAdmin.from("keywords").select("*").eq("status", "active");
    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ error: "还没有任何探索关键词，先在设置里添加。" }, { status: 400 });
    }
    input = buildDiscoverInput(keywords.map((k) => k.term));
  } else {
    if (!settings?.my_ig_username) {
      return NextResponse.json({ error: "还没有设置你自己的 IG 账号，先在设置里填写。" }, { status: 400 });
    }
    scannedUsernames = [settings.my_ig_username];
    input = buildRadarInput(scannedUsernames, MY_ACCOUNT_RESULTS_LIMIT);
  }

  let handle;
  try {
    handle = await startActorRun(input);
  } catch (err) {
    return NextResponse.json({ error: `启动抓取失败: ${(err as Error).message}` }, { status: 502 });
  }

  const { data: run, error } = await supabaseAdmin
    .from("scan_runs")
    .insert({
      type,
      status: "running",
      phase: "collecting",
      apify_run_id: handle.runId,
      apify_dataset_id: handle.datasetId,
    })
    .select()
    .single();
  if (error || !run) {
    return NextResponse.json({ error: error?.message ?? "failed to create scan run" }, { status: 500 });
  }

  if (type === "radar") {
    await supabaseAdmin.from("competitors").update({ last_scanned_at: new Date().toISOString() }).in("ig_username", scannedUsernames);
  }

  return NextResponse.json({ runId: run.id });
}

// Marks a running scan cancelled — the continue loop checks this before claiming
// each next item, so an in-flight item finishes but no further ones start.
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const runId = String(body.runId ?? "");
  if (!runId) return NextResponse.json({ error: "runId is required" }, { status: 400 });
  const { error } = await supabaseAdmin
    .from("scan_runs")
    .update({ status: "cancelled", finished_at: new Date().toISOString() })
    .eq("id", runId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
