import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { ReelSource } from "@/lib/reelRadarTypes";

// Lets a tab check, on mount, whether a scan of its type is already running (e.g.
// started before the tab was closed/reloaded) so it can resume showing progress
// instead of a fresh "开始扫描" button.
export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as ReelSource | null;
  if (!type || !["radar", "discover", "mine"].includes(type)) return NextResponse.json({ runId: null });

  const { data } = await supabaseAdmin
    .from("scan_runs")
    .select("id")
    .eq("type", type)
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ runId: data?.id ?? null });
}
