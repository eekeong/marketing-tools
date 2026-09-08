import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("competitors")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitors: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const handle = String(body.handle ?? "").trim().replace(/^@?/, "");
  if (!handle) return NextResponse.json({ error: "handle is required" }, { status: 400 });

  const { data, error } = await supabaseAdmin
    .from("competitors")
    .insert({ ig_username: handle, source: "manual" })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ competitor: data });
}
