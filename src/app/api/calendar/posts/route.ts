import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const POST_SELECT = "*, asset_requests(*), post_platform_content(*)";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const platform = sp.get("platform");
  const owner = sp.get("owner");
  const status = sp.get("status");

  let query = supabaseAdmin.from("posts").select(POST_SELECT).order("date", { ascending: true });
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);
  if (owner) query = query.eq("owner", owner);
  if (status) query = query.eq("status", status);
  if (platform) query = query.contains("platforms", [platform]);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const title = String(body.title ?? "").trim();
  const date = String(body.date ?? "").trim();
  const owner = String(body.owner ?? "").trim();
  if (!title) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });
  if (!owner) return NextResponse.json({ error: "owner is required" }, { status: 400 });

  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .insert({
      title,
      date,
      owner,
      status: body.status ?? "idea",
      notes: body.notes ?? null,
      sales_rep_id: body.salesRepId ?? null,
      platforms: body.platforms ?? [],
      category: body.category ?? "organic",
      account_id: body.accountId ?? null,
      ad_copy: body.adCopy ?? null,
      lead_magnet_url: body.leadMagnetUrl ?? null,
      purpose: body.purpose ?? null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const assets = Array.isArray(body.assets) ? body.assets : [];
  if (assets.length > 0) {
    const { error: assetsError } = await supabaseAdmin.from("asset_requests").insert(
      assets.map((a: { name: string; requestedFrom?: string; dueDate?: string; status?: string; mediaUrl?: string }) => ({
        post_id: post.id,
        name: a.name,
        requested_from: a.requestedFrom ?? null,
        due_date: a.dueDate ?? null,
        status: a.status ?? "pending",
        media_url: a.mediaUrl ?? null,
      }))
    );
    if (assetsError) return NextResponse.json({ error: assetsError.message }, { status: 500 });
  }

  const platforms: string[] = Array.isArray(body.platforms) ? body.platforms : [];
  if (platforms.length > 0) {
    const { error: contentError } = await supabaseAdmin.from("post_platform_content").insert(
      platforms.map((platform) => ({ post_id: post.id, platform, caption: "" }))
    );
    if (contentError) return NextResponse.json({ error: contentError.message }, { status: 500 });
  }

  const { data: full, error: fullError } = await supabaseAdmin
    .from("posts")
    .select(POST_SELECT)
    .eq("id", post.id)
    .single();
  if (fullError) return NextResponse.json({ error: fullError.message }, { status: 500 });
  return NextResponse.json({ post: full });
}
