import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const platform = String(body.platform ?? "").trim();
  if (!platform) return NextResponse.json({ error: "platform is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("post_platform_content")
    .upsert(
      {
        post_id: id,
        platform,
        caption: body.caption ?? "",
        media_url: body.mediaUrl ?? null,
        account_id: body.accountId ?? null,
      },
      { onConflict: "post_id,platform" }
    )
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data });
}
