import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) patch.title = body.title;
  if (body.hook !== undefined) patch.hook_line = body.hook;
  if (body.beats !== undefined) patch.beats = body.beats;
  if (body.cta !== undefined) patch.cta_text = body.cta;
  if (body.caption !== undefined) patch.caption = body.caption;
  if (body.status !== undefined) patch.status = body.status === "shot" ? "filmed" : body.status;

  const { error } = await supabaseAdmin.from("scripts").update(patch).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("scripts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
