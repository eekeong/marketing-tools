import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateJSON } from "@/lib/gemini";
import { ScriptStatus } from "@/lib/reelRadarTypes";

interface ScriptRow {
  id: string;
  title: string;
  hook_line: string | null;
  beats: { text: string; shot: string; seconds: number }[];
  cta_text: string | null;
  caption: string | null;
  status: ScriptStatus;
  created_at: string;
}

function toFrontend(s: ScriptRow) {
  return {
    id: s.id,
    title: s.title,
    hook: s.hook_line ?? "",
    date: s.created_at.slice(0, 10),
    status: s.status === "filmed" ? "shot" : s.status,
    beats: s.beats ?? [],
    cta: s.cta_text ?? "",
    caption: s.caption ?? "",
  };
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("scripts")
    .select("*")
    .eq("mode", "weekly_idea")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ scripts: (data ?? []).map(toFrontend) });
}

interface IdeaResult {
  ideas: {
    title: string;
    hook: string;
    beats: { text: string; shot: string; seconds: number }[];
    cta: string;
    caption: string;
  }[];
}

export async function POST() {
  const [{ data: settings }, { data: topReels }] = await Promise.all([
    supabaseAdmin.from("settings").select("*").eq("id", 1).single(),
    supabaseAdmin
      .from("reels")
      .select("owner_username, reel_analysis(hook_type, hook_text, structure, relevance_score)")
      .eq("source", "radar")
      .order("first_seen_at", { ascending: false })
      .limit(10),
  ]);

  const inspiration = (topReels ?? [])
    .map((r) => {
      const a = Array.isArray(r.reel_analysis) ? r.reel_analysis[0] : r.reel_analysis;
      if (!a) return null;
      return `- ${a.hook_type}：${a.hook_text}（结构：${(a.structure ?? []).join(" → ")}，分数 ${a.relevance_score}）`;
    })
    .filter(Boolean)
    .join("\n");

  const prompt = `你是英雄教育（马来西亚补习中心）的短视频内容策划。请给这周策划 3 条短视频脚本创意。

机构背景：${settings?.niche_description ?? ""}
卖点：${settings?.what_i_sell ?? ""}

${inspiration ? `参考近期竞品高分视频的钩子/结构，可以借鉴但不要照抄：\n${inspiration}` : "还没有竞品数据参考，请基于机构背景自由创作。"}

每条创意需要包含：
- title：给这支视频起的内部标题
- hook：开场 3 秒的钩子文案
- beats：3-4 个分镜节拍，每个包含 text（内容要点）、shot（画面描述）、seconds（预估秒数）
- cta：结尾行动号召
- caption：发布文案全文，末尾附 3-5 个中文 hashtag（含 #英雄教育 #EduHero）`;

  const schema = {
    type: "object",
    properties: {
      ideas: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            hook: { type: "string" },
            beats: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  shot: { type: "string" },
                  seconds: { type: "integer" },
                },
                required: ["text", "shot", "seconds"],
              },
            },
            cta: { type: "string" },
            caption: { type: "string" },
          },
          required: ["title", "hook", "beats", "cta", "caption"],
        },
      },
    },
    required: ["ideas"],
  };

  let result;
  try {
    result = await generateJSON<IdeaResult>({ prompt, schema, temperature: 0.9 });
  } catch (err) {
    return NextResponse.json({ error: `AI 生成失败: ${(err as Error).message}` }, { status: 502 });
  }

  const rows = result.data.ideas.map((idea) => ({
    title: idea.title,
    hook_line: idea.hook,
    beats: idea.beats,
    cta_text: idea.cta,
    caption: idea.caption,
    mode: "weekly_idea" as const,
    status: "draft" as const,
    model: result.model,
    cost_usd: result.costUsd / result.data.ideas.length,
  }));

  const { data: inserted, error } = await supabaseAdmin.from("scripts").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ scripts: (inserted ?? []).map(toFrontend) });
}
