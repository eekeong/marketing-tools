import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("scan_runs")
    .select("*, scan_items(human_message, status)")
    .order("started_at", { ascending: false })
    .limit(30);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const entries = (data ?? []).map((run) => {
    const items = (run.scan_items ?? []) as { human_message: string | null; status: string }[];
    const failed = items.filter((i) => i.status === "failed").length;
    const summary =
      items.map((i) => i.human_message).filter(Boolean).join("；") ||
      `${run.type} 扫描：完成 ${run.done}/${run.total}${failed ? `，失败 ${failed}` : ""}`;
    return {
      id: run.id,
      time: (run.started_at as string).replace("T", " ").slice(0, 16),
      summary: run.cost_usd > 0 ? `${summary}，花费约 $${Number(run.cost_usd).toFixed(4)}` : summary,
    };
  });

  return NextResponse.json({ entries });
}
