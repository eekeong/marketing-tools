import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateJSON } from "@/lib/gemini";
import { HOOK_TYPES_DB, DbHookType, ReelSource } from "@/lib/reelRadarTypes";

interface AnalysisResult {
  hookType: DbHookType;
  hookText: string;
  structure: string[];
  ctaText: string;
  whyScored: string;
  relevanceScore: number;
}

export interface ReelInput {
  shortcode: string;
  url: string;
  account: string;
  ownerFullName?: string | null;
  text: string;
  plays: number;
  likes: number;
  comments: number;
  durationSec?: number | null;
  postedAt?: string | null;
  source: ReelSource;
}

export async function analyzeAndStoreReel(input: ReelInput) {
  const { data: settings } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();

  const prompt = `你是一个短视频营销分析师，帮马来西亚的教育机构「英雄教育」拆解竞品/参考短视频，判断它值不值得模仿。

机构背景：${settings?.niche_description ?? "补习教育机构"}
卖点：${settings?.what_i_sell ?? ""}

要分析的视频信息：
账号：@${input.account}
文案/转写内容：
${input.text}

数据：播放 ${input.plays}，点赞 ${input.likes}，评论 ${input.comments}

请用中文输出结构化拆解：
1. hookType：从这些选项里选最贴切的一个：${HOOK_TYPES_DB.join(", ")}
2. hookText：开场钩子的原句或概括（中文，一句话）
3. structure：整支视频的叙事结构，拆成 3-5 个阶段，每个阶段一句话描述（例如"亮结果"、"家长口述转折"、"老师出镜背书"、"CTA 引导私讯"）
4. ctaText：结尾的行动号召文案
5. whyScored：结合上面机构背景，用 2-3 句话说明这支视频为什么值得英雄教育参考、能不能用、为什么打这个分
6. relevanceScore：1-10 分，评估这支视频的结构/钩子对英雄教育的招生内容有多大参考价值`;

  const schema = {
    type: "object",
    properties: {
      hookType: { type: "string", enum: HOOK_TYPES_DB },
      hookText: { type: "string" },
      structure: { type: "array", items: { type: "string" } },
      ctaText: { type: "string" },
      whyScored: { type: "string" },
      relevanceScore: { type: "integer" },
    },
    required: ["hookType", "hookText", "structure", "ctaText", "whyScored", "relevanceScore"],
  };

  const analysis = await generateJSON<AnalysisResult>({ prompt, schema, temperature: 0.6 });

  const { data: reel, error: reelErr } = await supabaseAdmin
    .from("reels")
    .insert({
      shortcode: input.shortcode,
      ig_url: input.url,
      owner_username: input.account,
      owner_full_name: input.ownerFullName ?? null,
      caption: input.text.slice(0, 2000),
      duration_sec: input.durationSec ?? null,
      posted_at: input.postedAt ?? null,
      play_count: input.plays,
      like_count: input.likes,
      comment_count: input.comments,
      source: input.source,
    })
    .select()
    .single();
  if (reelErr) throw new Error(reelErr.message);

  const { data: analysisRow, error: analysisErr } = await supabaseAdmin
    .from("reel_analysis")
    .insert({
      reel_id: reel.id,
      transcript: input.text,
      has_speech: true,
      relevance_score: Math.max(1, Math.min(10, Math.round(analysis.data.relevanceScore))),
      hook_type: analysis.data.hookType,
      hook_text: analysis.data.hookText,
      structure: analysis.data.structure,
      cta_text: analysis.data.ctaText,
      why_scored: analysis.data.whyScored,
      model: analysis.model,
      input_tokens: analysis.inputTokens,
      output_tokens: analysis.outputTokens,
      cost_usd: analysis.costUsd,
    })
    .select()
    .single();
  if (analysisErr) throw new Error(analysisErr.message);

  return { reel, analysis: analysisRow, costUsd: analysis.costUsd };
}
