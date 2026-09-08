import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { scrapeReelsByUrls } from "@/lib/apify";
import { analyzeAndStoreReel } from "@/lib/reelAnalysis";

// Powers the "贴一条链接，单独分析" box on the Radar homepage — a single URL, fetched
// and analyzed synchronously (fine at this scale, unlike the multi-account scan
// pipeline in scan/route.ts which needs the async collect/continue split).
export async function POST(req: NextRequest) {
  const body = await req.json();
  const url = String(body.url ?? "").trim();
  if (!url) return NextResponse.json({ error: "url is required" }, { status: 400 });

  let items;
  try {
    items = await scrapeReelsByUrls([url], 1);
  } catch (err) {
    return NextResponse.json({ error: `抓取失败: ${(err as Error).message}` }, { status: 502 });
  }

  const item = items[0];
  if (!item || item.error || !item.shortCode) {
    return NextResponse.json({ error: item?.errorDescription ?? item?.error ?? "没有抓到这条视频，检查链接是否正确" }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin.from("reels").select("id").eq("shortcode", item.shortCode).maybeSingle();
  if (existing) return NextResponse.json({ reelId: existing.id, alreadyExists: true });

  const { data: blocked } = await supabaseAdmin.from("blocklist").select("shortcode").eq("shortcode", item.shortCode).maybeSingle();
  if (blocked) return NextResponse.json({ error: "这条视频在黑名单里，已被永久排除" }, { status: 400 });

  const caption = (item.caption ?? "").trim();
  if (!caption) return NextResponse.json({ error: "这条视频没有文案，AI 无法分析" }, { status: 400 });

  try {
    const result = await analyzeAndStoreReel({
      shortcode: item.shortCode,
      url: item.url,
      account: item.ownerUsername ?? "unknown",
      ownerFullName: item.ownerFullName,
      text: caption,
      plays: item.videoPlayCount ?? item.videoViewCount ?? 0,
      likes: item.likesCount ?? 0,
      comments: item.commentsCount ?? 0,
      durationSec: item.videoDuration ?? null,
      postedAt: item.timestamp ?? null,
      source: "radar",
      thumbnailUrl: item.displayUrl ?? null,
      videoUrl: item.videoUrl ?? null,
      raw: item,
    });
    return NextResponse.json({ reelId: result.reel.id });
  } catch (err) {
    return NextResponse.json({ error: `AI 分析失败: ${(err as Error).message}` }, { status: 502 });
  }
}
