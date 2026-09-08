import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { analyzeAndStoreReel } from "@/lib/reelAnalysis";
import { ReelSource } from "@/lib/reelRadarTypes";

function shortcodeFromUrl(url: string): string {
  const match = url.match(/\/(reel|reels|p|video)\/([A-Za-z0-9_-]+)/);
  if (match) return match[2];
  return `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = String(body.url ?? "").trim();
  const account = String(body.account ?? "").trim().replace(/^@/, "");
  const text = String(body.text ?? "").trim();
  const plays = Number(body.plays) || 0;
  const likes = Number(body.likes) || 0;
  const comments = Number(body.comments) || 0;
  const source: ReelSource = ["radar", "discover", "mine"].includes(body.source) ? body.source : "radar";

  if (!url || !account || !text) {
    return NextResponse.json({ error: "url, account and text are required" }, { status: 400 });
  }

  let result;
  try {
    result = await analyzeAndStoreReel({
      shortcode: shortcodeFromUrl(url),
      url,
      account,
      text,
      plays,
      likes,
      comments,
      source,
    });
  } catch (err) {
    return NextResponse.json({ error: `AI 分析失败: ${(err as Error).message}` }, { status: 502 });
  }

  const { data: run } = await supabaseAdmin
    .from("scan_runs")
    .insert({
      type: source,
      status: "done",
      phase: "manual_add",
      total: 1,
      done: 1,
      cost_usd: result.costUsd,
      finished_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (run) {
    await supabaseAdmin.from("scan_items").insert({
      run_id: run.id,
      shortcode: result.reel.shortcode,
      owner_username: account,
      stage: "analyze",
      status: "done",
      reel_id: result.reel.id,
      human_message: `手动添加并分析了 @${account} 的一条 Reel`,
    });
  }

  return NextResponse.json({ reel: result.reel, analysis: result.analysis });
}
