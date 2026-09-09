import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// SEAM: this stubs out account connection with a manual status flip. Once
// Meta/TikTok developer apps are approved, replace the body with a real OAuth
// redirect + token exchange — the request/response contract here should not change.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const displayName = String(body.displayName ?? "").trim();
  if (!displayName) return NextResponse.json({ error: "displayName is required" }, { status: 400 });

  const { data: existing } = await supabaseAdmin
    .from("social_accounts")
    .select("id")
    .eq("display_name", displayName)
    .maybeSingle();

  const patch = {
    display_name: displayName,
    platform: body.platform ?? null,
    status: "connected" as const,
    connected_at: new Date().toISOString(),
  };

  const { data, error } = existing
    ? await supabaseAdmin.from("social_accounts").update(patch).eq("id", existing.id).select().single()
    : await supabaseAdmin.from("social_accounts").insert(patch).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ account: data });
}
