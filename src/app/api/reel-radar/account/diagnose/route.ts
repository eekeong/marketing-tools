import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateJSON } from "@/lib/gemini";
import { hookTypeFromDb, formatStructureStep, StructureStep } from "@/lib/reelRadarTypes";

// Needs enough reels for a top-vs-bottom split to mean anything — below this,
// the report falls back to the simple hook-usage summary instead of a contrast.
const MIN_FOR_CONTRAST = 5;
const TOP_PCT = 0.2;
const BOTTOM_PCT = 0.4;

export async function POST() {
  const [{ data: mine }, { data: settings }] = await Promise.all([
    supabaseAdmin
      .from("reels")
      .select(
        "id, owner_username, play_count, caption, reel_analysis(hook_type, relevance_score, structure, has_speech, language, cta_text, topic_title)",
      )
      .eq("source", "mine"),
    supabaseAdmin.from("settings").select("*").eq("id", 1).single(),
  ]);

  const rows = mine ?? [];
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "还没有任何标记为「我的账号」来源的 Reel，先扫描/添加几条自己发布过的视频再生成诊断。" },
      { status: 400 },
    );
  }

  const sumPlays = rows.reduce((s, r) => s + r.play_count, 0);
  const enriched = rows
    .map((r) => {
      const a = Array.isArray(r.reel_analysis) ? r.reel_analysis[0] : r.reel_analysis;
      const avgOthers = rows.length > 1 ? (sumPlays - r.play_count) / (rows.length - 1) : 0;
      const engagementMultiple = avgOthers > 0 ? Math.round((r.play_count / avgOthers) * 10) / 10 : 0;
      const structure = (a?.structure ?? []) as (string | StructureStep)[];
      return {
        plays: r.play_count,
        engagementMultiple,
        hookType: hookTypeFromDb(a?.hook_type ?? null),
        topicTitle: a?.topic_title ?? null,
        structureTitles: structure.map((s) => formatStructureStep(s).title),
        hasSpeech: a?.has_speech ?? false,
        language: a?.language ?? null,
        ctaText: a?.cta_text ?? "",
      };
    })
    .sort((a, b) => b.plays - a.plays);

  const hookUsage: Record<string, number> = {};
  for (const r of enriched) hookUsage[r.hookType] = (hookUsage[r.hookType] ?? 0) + 1;
  const plays = rows.map((r) => r.play_count);
  const median = [...plays].sort((a, b) => a - b)[Math.floor(plays.length / 2)] ?? 0;

  const n = enriched.length;
  const topCount = Math.max(1, Math.round(n * TOP_PCT));
  const bottomCount = Math.max(1, Math.round(n * BOTTOM_PCT));
  const hasContrast = n >= MIN_FOR_CONTRAST && topCount + bottomCount <= n;

  const describeCohort = (cohort: typeof enriched) =>
    cohort
      .map(
        (r, i) =>
          `${i + 1}. [播放是平均的 ${r.engagementMultiple}x] 主题：${r.topicTitle ?? "—"} / 开场：${r.hookType} / 结构：${
            r.structureTitles.join(" → ") || "—"
          } / 口播：${r.hasSpeech ? "有" : "无"} / 语言：${r.language ?? "—"} / CTA：${r.ctaText || "—"}`,
      )
      .join("\n");

  const topCohort = enriched.slice(0, topCount);
  const bottomCohort = hasContrast ? enriched.slice(n - bottomCount) : [];

  const contrastBlock = hasContrast
    ? `

爆款组（播放最高的 ${topCount} 条，按互动倍数排序）：
${describeCohort(topCohort)}

平庸组（播放最低的 ${bottomCount} 条）：
${describeCohort(bottomCohort)}

请重点对比这两组之间，在开场类型、叙事结构安排、口播有无、语言、CTA 风格上有什么系统性差异——这是整份报告最重要的部分，必须具体点名差异（例如"爆款组 3/4 条都用了故事开场，平庸组全部是直接卖课"），不能只说"内容质量更好"这种空话。`
    : `

视频数量还不够多（${n} 条，至少要 ${MIN_FOR_CONTRAST} 条才能做爆款/平庸款对比），这次先给基础诊断，样本更多后可以重新生成会更准。`;

  const reportStructure = hasContrast
    ? `1. 总体印象（1段）
2. 强项——结合爆款组的具体数据说明好在哪（1段）
3. 弱点与漏洞——结合平庸组数据 + 完全没用过的钩子类型（1段）
4. 爆款组 vs 平庸组的关键差异（1段，必须具体点名差异，这段最重要）
5. 接下来 30 天的 3 个具体行动建议，必须直接对应上面发现的差异（编号列表）`
    : `1. 总体印象（1段）
2. 强项（1段）
3. 弱点与漏洞——重点指出完全没用过的钩子类型（1段）
4. 接下来 30 天的 3 个具体行动建议（编号列表）`;

  const prompt = `你是英雄教育的短视频账号顾问。基于以下真实数据，给出一份账号诊断报告（中文，用换行分段，可以直接展示给运营团队看）。

机构背景：${settings?.niche_description ?? ""}
已收集的自家视频数：${n}
播放中位数：${median}
各钩子类型使用次数：${JSON.stringify(hookUsage)}${contrastBlock}

报告结构：
${reportStructure}`;

  const schema = { type: "object", properties: { report: { type: "string" } }, required: ["report"] };

  let result;
  try {
    result = await generateJSON<{ report: string }>({ prompt, schema, temperature: 0.7 });
  } catch (err) {
    return NextResponse.json({ error: `AI 生成失败: ${(err as Error).message}` }, { status: 502 });
  }

  const { data: row, error } = await supabaseAdmin
    .from("account_diagnosis")
    .insert({
      report_md: result.data.report,
      stats: { collected: n, median, hookUsage, hasContrast, topCohort, bottomCohort },
      model: result.model,
      cost_usd: result.costUsd,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ diagnosis: row.report_md });
}
