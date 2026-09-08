import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateJSON } from "@/lib/gemini";
import { HOOK_TYPES_DB, DbHookType, ReelSource, StructureStep } from "@/lib/reelRadarTypes";

interface AnalysisResult {
  hookType: DbHookType;
  hookText: string;
  structure: StructureStep[];
  ctaText: string;
  whyScored: string;
  angle: string;
  relevanceScore: number;
  transcript: string;
  hasSpeech: boolean;
  language: string;
}

// Reels are short, but a video download+base64 pass through the request body still
// costs latency/memory — cap how big a file we'll bother inlining before giving up
// and falling back to caption-only analysis.
const MAX_INLINE_VIDEO_BYTES = 15 * 1024 * 1024;

async function fetchVideoInline(videoUrl: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const res = await fetch(videoUrl);
    if (!res.ok) return null;
    const contentLength = Number(res.headers.get("content-length") ?? "0");
    if (contentLength && contentLength > MAX_INLINE_VIDEO_BYTES) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_INLINE_VIDEO_BYTES) return null;
    const mimeType = res.headers.get("content-type")?.split(";")[0] || "video/mp4";
    return { base64: Buffer.from(buf).toString("base64"), mimeType };
  } catch {
    return null;
  }
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
  discoveredVia?: string | null;
  thumbnailUrl?: string | null;
  videoUrl?: string | null;
  raw?: unknown;
}

export async function analyzeAndStoreReel(input: ReelInput) {
  const { data: settings } = await supabaseAdmin.from("settings").select("*").eq("id", 1).single();

  // Manual add / any item without a reachable videoUrl falls back to caption-only,
  // same as before Phase B — a failed transcription attempt should never sink the item.
  const video = input.videoUrl ? await fetchVideoInline(input.videoUrl) : null;
  const isMine = input.source === "mine";

  const role = isMine
    ? "你是英雄教育（马来西亚教育机构）的短视频账号顾问，帮团队拆解自己发过的一支视频，做内容复盘。"
    : "你是一个短视频营销分析师，帮马来西亚的教育机构「英雄教育」拆解竞品/参考短视频，判断它值不值得模仿。";

  const videoInfo = video
    ? `要分析的视频：@${input.account}，附带的文案是：${input.text}
数据：播放 ${input.plays}，点赞 ${input.likes}，评论 ${input.comments}

请先完整看完/听完这支视频，再用中文输出结构化拆解：`
    : `要分析的视频信息（注意：视频本体拿不到，只能看文案，无法判断真实口播内容）：
账号：@${input.account}
文案：
${input.text}

数据：播放 ${input.plays}，点赞 ${input.likes}，评论 ${input.comments}

请用中文输出结构化拆解：`;

  const transcribeSteps = video
    ? `1. transcript：视频里实际说出来的口播内容，逐字转写（不是文案，是真正说话的内容）；如果全程没有人说话（纯字幕/纯背景音乐），返回空字符串
2. hasSpeech：这支视频有没有真人口播/说话
3. language：视频里主要使用的语言（例如 "zh"、"en"、"ms"、"zh+en" 混杂等）`
    : `1. transcript：拿不到视频本体，直接返回空字符串
2. hasSpeech：拿不到视频本体，无法判断，返回 false
3. language：根据文案文字判断主要语言（例如 "zh"、"en"、"ms"）`;

  const structureSteps = `4. hookType：从这些选项里选最贴切的一个：${HOOK_TYPES_DB.join(", ")}
5. hookText：开场钩子的原句或概括（中文，一句话）
6. structure：整支视频的叙事结构，拆成 3-5 个阶段，每个阶段一个 {title, description}：title 是 3-5 字的阶段名（例如"痛点举例"、"家长口述转折"、"老师出镜背书"、"转化 CTA"），description 是 1-2 句解释这个阶段具体做了什么、为什么这样安排
7. ctaText：结尾的行动号召文案`;

  const verdictSteps = isMine
    ? `8. whyScored：用 2-3 句话点评这支自家视频拍得怎么样——好在哪里、问题在哪里、为什么打这个分（这是复盘自己的内容，不是在评估要不要模仿）
9. angle：下次再拍同类内容时，具体可以怎么调整/优化这支视频的套路（给一个具体切入点，不是重复 whyScored）
10. relevanceScore：1-10 分，评估这支视频的结构/钩子有多值得当成以后拍摄的参考模板`
    : `8. whyScored：结合上面机构背景，用 2-3 句话说明这支视频为什么值得英雄教育参考、能不能用、为什么打这个分
9. angle：一个具体的内容改造角度建议——可以怎么把这支视频的套路改成英雄教育自己的内容，给一个具体切入点（不是重复 whyScored，是更落地的"怎么抄"建议）
10. relevanceScore：1-10 分，评估这支视频的结构/钩子对英雄教育的招生内容有多大参考价值`;

  const prompt = `${role}

机构背景：${settings?.niche_description ?? "补习教育机构"}
卖点：${settings?.what_i_sell ?? ""}

${videoInfo}
${transcribeSteps}
${structureSteps}
${verdictSteps}`;

  const schema = {
    type: "object",
    properties: {
      transcript: { type: "string" },
      hasSpeech: { type: "boolean" },
      language: { type: "string" },
      hookType: { type: "string", enum: HOOK_TYPES_DB },
      hookText: { type: "string" },
      structure: {
        type: "array",
        items: {
          type: "object",
          properties: { title: { type: "string" }, description: { type: "string" } },
          required: ["title", "description"],
        },
      },
      ctaText: { type: "string" },
      whyScored: { type: "string" },
      angle: { type: "string" },
      relevanceScore: { type: "integer" },
    },
    required: [
      "transcript",
      "hasSpeech",
      "language",
      "hookType",
      "hookText",
      "structure",
      "ctaText",
      "whyScored",
      "angle",
      "relevanceScore",
    ],
  };

  const analysis = await generateJSON<AnalysisResult>({ prompt, schema, temperature: 0.6, video: video ?? undefined });

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
      discovered_via: input.discoveredVia ?? null,
      thumbnail_url: input.thumbnailUrl ?? null,
      video_url: input.videoUrl ?? null,
      raw: input.raw ?? null,
    })
    .select()
    .single();
  if (reelErr) throw new Error(reelErr.message);

  const { data: analysisRow, error: analysisErr } = await supabaseAdmin
    .from("reel_analysis")
    .insert({
      reel_id: reel.id,
      transcript: analysis.data.transcript || input.text,
      has_speech: analysis.data.hasSpeech,
      language: analysis.data.language || null,
      relevance_score: Math.max(1, Math.min(10, Math.round(analysis.data.relevanceScore))),
      hook_type: analysis.data.hookType,
      hook_text: analysis.data.hookText,
      structure: analysis.data.structure,
      cta_text: analysis.data.ctaText,
      why_scored: analysis.data.whyScored,
      angle: analysis.data.angle || null,
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
