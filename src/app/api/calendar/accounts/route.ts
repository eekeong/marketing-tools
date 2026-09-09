import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("social_accounts")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const displayName = String(body.displayName ?? "").trim();
  if (!displayName) return NextResponse.json({ error: "displayName is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("social_accounts")
    .insert({ display_name: displayName, platform: body.platform ?? null })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: data });
}
