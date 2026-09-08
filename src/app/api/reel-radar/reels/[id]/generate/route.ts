import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateJSON } from "@/lib/gemini";
import { formatStructureStep } from "@/lib/reelRadarTypes";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const mode: "rewrite" | "remix" = body.mode === "remix" ? "remix" : "rewrite";

  const [{ data: reel, error: reelErr }, { data: settings }, { data: voice }] = await Promise.all([
    supabaseAdmin.from("reels").select("*, reel_analysis(*)").eq("id", id).single(),
    supabaseAdmin.from("settings").select("*").eq("id", 1).single(),
    supabaseAdmin.from("voice_profile").select("*").eq("id", 1).single(),
  ]);
  if (reelErr || !reel) return NextResponse.json({ error: reelErr?.message ?? "reel not found" }, { status: 404 });

  const analysis = Array.isArray(reel.reel_analysis) ? reel.reel_analysis[0] : reel.reel_analysis;
  const toneNote =
    voice?.enabled && voice?.profile_text
      ? `请贴合英雄教育以下的语气风格：${voice.profile_text}`
      : "请用亲切、可信、口语化的中文语气。";

  const task =
    mode === "rewrite"
      ? "在保留原视频的钩子类型和叙事结构的前提下，换成全新的角度、案例和用词——不是照抄，是同结构的原创改写。"
      : "尽量贴近原视频的具体表达方式和节奏，只把案例、数字、人物换成英雄教育的场景——是仿写/移植，不是重新发明。";

  const prompt = `你是英雄教育（马来西亚补习中心）的短视频文案负责人。参考下面这支表现好的竞品视频，${task}

机构背景：${settings?.niche_description ?? ""}
卖点：${settings?.what_i_sell ?? ""}
${toneNote}

参考视频：
账号：${reel.owner_username}
钩子类型：${analysis?.hook_type ?? ""}
开场钩子：${analysis?.hook_text ?? ""}
结构：${((analysis?.structure ?? []) as (string | { title: string; description: string })[])
    .map((s) => formatStructureStep(s).title)
    .join(" → ")}
CTA：${analysis?.cta_text ?? ""}
原文案/转写：${analysis?.transcript ?? reel.caption ?? ""}

输出一段完整的新文案草稿，包含：开场钩子、分段内容要点、结尾 CTA、以及配 3-5 个中文 hashtag（含 #英雄教育 #EduHero）。用换行分段，直接输出可以发布的文案全文，不要加多余说明。`;

  const schema = {
    type: "object",
    properties: { fullText: { type: "string" } },
    required: ["fullText"],
  };

  let result;
  try {
    result = await generateJSON<{ fullText: string }>({ prompt, schema, temperature: 0.9 });
  } catch (err) {
    return NextResponse.json({ error: `AI 生成失败: ${(err as Error).message}` }, { status: 502 });
  }

  const scriptMode = mode === "rewrite" ? "rewrite_structure" : "copy_script";
  const { data: script, error: scriptErr } = await supabaseAdmin
    .from("scripts")
    .insert({
      title: `${mode === "rewrite" ? "改写" : "仿写"} · @${reel.owner_username}`,
      caption: result.data.fullText,
      mode: scriptMode,
      source_reel_id: reel.id,
      status: "draft",
      model: result.model,
      cost_usd: result.costUsd,
    })
    .select()
    .single();
  if (scriptErr) return NextResponse.json({ error: scriptErr.message }, { status: 500 });

  return NextResponse.json({ text: result.data.fullText, script });
}
