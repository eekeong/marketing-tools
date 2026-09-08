import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { generateJSON } from "@/lib/gemini";
import { hookTypeFromDb } from "@/lib/reelRadarTypes";

export async function POST() {
  const [{ data: mine }, { data: settings }] = await Promise.all([
    supabaseAdmin
      .from("reels")
      .select("owner_username, play_count, reel_analysis(hook_type, relevance_score)")
      .eq("source", "mine"),
    supabaseAdmin.from("settings").select("*").eq("id", 1).single(),
  ]);

  const rows = mine ?? [];
  if (rows.length === 0) {
    return NextResponse.json(
      { error: "还没有任何标记为「我的账号」来源的 Reel，先在雷达页手动添加几条自己发布过的视频再生成诊断。" },
      { status: 400 },
    );
  }

  const hookUsage: Record<string, number> = {};
  for (const r of rows) {
    const a = Array.isArray(r.reel_analysis) ? r.reel_analysis[0] : r.reel_analysis;
    const zh = hookTypeFromDb(a?.hook_type ?? null);
    hookUsage[zh] = (hookUsage[zh] ?? 0) + 1;
  }
  const plays = rows.map((r) => r.play_count);
  const median = [...plays].sort((a, b) => a - b)[Math.floor(plays.length / 2)] ?? 0;

  const prompt = `你是英雄教育的短视频账号顾问。基于以下数据，给出一份账号诊断报告（中文，用换行分段，可以直接展示给运营团队看）。

机构背景：${settings?.niche_description ?? ""}
已收集的自家视频数：${rows.length}
播放中位数：${median}
各钩子类型使用次数：${JSON.stringify(hookUsage)}

报告结构：
1. 总体印象（1段）
2. 强项（1段）
3. 弱点与漏洞——重点指出完全没用过的钩子类型（1段）
4. 接下来 30 天的 3 个具体行动建议（编号列表）`;

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
      stats: { collected: rows.length, median, hookUsage },
      model: result.model,
      cost_usd: result.costUsd,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ diagnosis: row.report_md });
}
