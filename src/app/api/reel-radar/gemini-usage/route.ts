import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Gemini has no API-key-based usage/billing endpoint (unlike Apify) — real numbers
// only live in Google Cloud Console under OAuth/service-account billing APIs, a much
// heavier integration than this app's simple API-key auth. This is our own estimate,
// summed from the cost_usd we already record per Gemini call (token counts x the
// rough per-token prices in src/lib/gemini.ts) — not Google's official bill.
export async function GET() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const since = monthStart.toISOString();

  const [{ data: analyses }, { data: scripts }, { data: diagnoses }] = await Promise.all([
    supabaseAdmin.from("reel_analysis").select("cost_usd").gte("analyzed_at", since),
    supabaseAdmin.from("scripts").select("cost_usd").gte("created_at", since),
    supabaseAdmin.from("account_diagnosis").select("cost_usd").gte("generated_at", since),
  ]);

  const sum = (rows: { cost_usd: number | null }[] | null) => (rows ?? []).reduce((s, r) => s + Number(r.cost_usd ?? 0), 0);
  const costUsd = sum(analyses) + sum(scripts) + sum(diagnoses);

  return NextResponse.json({ costUsd, since });
}
