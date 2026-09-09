import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const POST_SELECT = "*, asset_requests(*), post_platform_content(*)";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data, error } = await supabaseAdmin.from("posts").select(POST_SELECT).eq("id", id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const patch: Record<string, unknown> = {};
  if ("title" in body) patch.title = body.title;
  if ("date" in body) patch.date = body.date;
  if ("notes" in body) patch.notes = body.notes;
  if ("owner" in body) patch.owner = body.owner;
  if ("salesRepId" in body) patch.sales_rep_id = body.salesRepId;
  if ("platforms" in body) patch.platforms = body.platforms;
  if ("category" in body) patch.category = body.category;
  if ("accountId" in body) patch.account_id = body.accountId;
  if ("adCopy" in body) patch.ad_copy = body.adCopy;
  if ("leadMagnetUrl" in body) patch.lead_magnet_url = body.leadMagnetUrl;
  if ("purpose" in body) patch.purpose = body.purpose;

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(patch)
    .eq("id", id)
    .select(POST_SELECT)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { error } = await supabaseAdmin.from("posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
