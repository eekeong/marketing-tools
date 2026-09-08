import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { scrapeReelsByUrls, scrapeReelsByKeywords, ApifyReelItem } from "@/lib/apify";
import { analyzeAndStoreReel } from "@/lib/reelAnalysis";
import { ReelSource } from "@/lib/reelRadarTypes";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const type: ReelSource = ["radar", "discover", "mine"].includes(body.type) ? body.type : "radar";

  const { data: settings } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();
  const resultsLimit = settings?.reels_per_account || 10;

  let items: ApifyReelItem[] = [];
  let scannedUsernames: string[] = [];

  try {
    if (type === "radar") {
      const { data: competitors } = await supabaseAdmin.from("competitors").select("*").eq("status", "active");
      if (!competitors || competitors.length === 0) {
        return NextResponse.json({ error: "还没有任何竞品账号，先在设置里添加。" }, { status: 400 });
      }
      scannedUsernames = competitors.map((c) => c.ig_username);
      const directUrls = scannedUsernames.map((u) => `https://www.instagram.com/${u}/`);
      items = await scrapeReelsByUrls(directUrls, resultsLimit);
    } else if (type === "discover") {
      const { data: keywords } = await supabaseAdmin.from("keywords").select("*").eq("status", "active");
      if (!keywords || keywords.length === 0) {
        return NextResponse.json({ error: "还没有任何探索关键词，先在设置里添加。" }, { status: 400 });
      }
      items = await scrapeReelsByKeywords(
        keywords.map((k) => k.term),
        resultsLimit,
      );
    } else {
      if (!settings?.my_ig_username) {
        return NextResponse.json({ error: "还没有设置你自己的 IG 账号，先在设置里填写。" }, { status: 400 });
      }
      scannedUsernames = [settings.my_ig_username];
      items = await scrapeReelsByUrls([`https://www.instagram.com/${settings.my_ig_username}/`], resultsLimit);
    }
  } catch (err) {
    return NextResponse.json({ error: `抓取失败: ${(err as Error).message}` }, { status: 502 });
  }

  const { data: run } = await supabaseAdmin
    .from("scan_runs")
    .insert({ type, status: "running", phase: "analyze", total: items.length })
    .select()
    .single();

  let done = 0;
  let failed = 0;
  let costUsd = 0;

  for (const item of items) {
    if (item.error || !item.shortCode) {
      failed += 1;
      if (run) {
        await supabaseAdmin.from("scan_items").insert({
          run_id: run.id,
          owner_username: item.username ?? item.ownerUsername ?? null,
          stage: "fetch",
          status: "failed",
          error_message: item.errorDescription ?? item.error ?? "no data returned",
          human_message: `@${item.username ?? item.ownerUsername ?? "?"} 抓取失败：${item.errorDescription ?? item.error ?? "没有返回数据"}`,
        });
      }
      continue;
    }
    const shortcode = item.shortCode;
    const ownerUsername = item.ownerUsername ?? "unknown";

    const { data: existing } = await supabaseAdmin.from("reels").select("id").eq("shortcode", shortcode).maybeSingle();
    if (existing) {
      if (run) {
        await supabaseAdmin.from("scan_items").insert({
          run_id: run.id,
          shortcode,
          owner_username: ownerUsername,
          stage: "analyze",
          status: "done",
          human_message: `@${ownerUsername} 的这条已经收录过，跳过`,
        });
      }
      continue;
    }

    const { data: blocked } = await supabaseAdmin.from("blocklist").select("shortcode").eq("shortcode", shortcode).maybeSingle();
    if (blocked) continue;

    const caption = (item.caption ?? "").trim();
    if (!caption) {
      failed += 1;
      if (run) {
        await supabaseAdmin.from("scan_items").insert({
          run_id: run.id,
          shortcode,
          owner_username: ownerUsername,
          stage: "analyze",
          status: "failed",
          error_message: "empty caption",
          human_message: `@${ownerUsername} 的这条视频没有文案，AI 无法分析，跳过`,
        });
      }
      continue;
    }

    try {
      const result = await analyzeAndStoreReel({
        shortcode,
        url: item.url,
        account: ownerUsername,
        ownerFullName: item.ownerFullName,
        text: caption,
        plays: item.videoPlayCount ?? item.videoViewCount ?? 0,
        likes: item.likesCount ?? 0,
        comments: item.commentsCount ?? 0,
        durationSec: item.videoDuration ?? null,
        postedAt: item.timestamp ?? null,
        source: type,
      });
      done += 1;
      costUsd += result.costUsd;
      if (run) {
        await supabaseAdmin.from("scan_items").insert({
          run_id: run.id,
          shortcode,
          owner_username: ownerUsername,
          stage: "analyze",
          status: "done",
          reel_id: result.reel.id,
          human_message: `分析了 @${ownerUsername} 的一条 Reel，打了 ${result.analysis.relevance_score} 分`,
        });
      }
    } catch (err) {
      failed += 1;
      if (run) {
        await supabaseAdmin.from("scan_items").insert({
          run_id: run.id,
          shortcode,
          owner_username: ownerUsername,
          stage: "analyze",
          status: "failed",
          error_message: (err as Error).message,
          human_message: `@${ownerUsername} 的这条分析失败：${(err as Error).message}`,
        });
      }
    }
  }

  if (scannedUsernames.length > 0 && type === "radar") {
    await supabaseAdmin.from("competitors").update({ last_scanned_at: new Date().toISOString() }).in("ig_username", scannedUsernames);
  }

  if (run) {
    await supabaseAdmin
      .from("scan_runs")
      .update({ status: "done", done, failed, cost_usd: costUsd, finished_at: new Date().toISOString() })
      .eq("id", run.id);
  }

  return NextResponse.json({ total: items.length, done, failed });
}
