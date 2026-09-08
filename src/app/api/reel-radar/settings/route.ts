import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const [{ data: settings, error: e1 }, { data: voice, error: e2 }] = await Promise.all([
    supabaseAdmin.from("settings").select("*").eq("id", 1).single(),
    supabaseAdmin.from("voice_profile").select("*").eq("id", 1).single(),
  ]);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  return NextResponse.json({ settings, voiceProfile: voice });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { useMyTone, ...settingsPatch } = body;

  if (Object.keys(settingsPatch).length > 0) {
    const { error } = await supabaseAdmin
      .from("settings")
      .update({ ...settingsPatch, updated_at: new Date().toISOString() })
      .eq("id", 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (typeof useMyTone === "boolean") {
    const { error } = await supabaseAdmin.from("voice_profile").update({ enabled: useMyTone }).eq("id", 1);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
