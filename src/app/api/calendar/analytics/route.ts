import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const from = sp.get("from");
  const to = sp.get("to");
  const groupBy = sp.get("groupBy"); // "platform" | "owner" | "status" | "category"

  let postsQuery = supabaseAdmin.from("posts").select("id,date,platforms,owner,status,category");
  if (from) postsQuery = postsQuery.gte("date", from);
  if (to) postsQuery = postsQuery.lte("date", to);
  const { data: posts, error: postsError } = await postsQuery;
  if (postsError) return NextResponse.json({ error: postsError.message }, { status: 500 });

  const { count: pendingAssets, error: assetsError } = await supabaseAdmin
    .from("asset_requests")
    .select("id", { count: "exact", head: true })
    .neq("status", "provided");
  if (assetsError) return NextResponse.json({ error: assetsError.message }, { status: 500 });

  const { count: connectedAccounts, error: accountsError } = await supabaseAdmin
    .from("social_accounts")
    .select("id", { count: "exact", head: true })
    .eq("status", "connected");
  if (accountsError) return NextResponse.json({ error: accountsError.message }, { status: 500 });

  const rows = posts ?? [];
  const postsPublished = rows.filter((p) => p.status === "published").length;

  let groups: { key: string; posts: number }[] | undefined;
  if (groupBy === "owner" || groupBy === "status" || groupBy === "category") {
    const map = new Map<string, number>();
    for (const p of rows) {
      const key = String(p[groupBy as "owner" | "status" | "category"] ?? "未分类");
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    groups = Array.from(map.entries()).map(([key, posts]) => ({ key, posts }));
  } else if (groupBy === "platform") {
    const map = new Map<string, number>();
    for (const p of rows) {
      const platforms = p.platforms?.length ? p.platforms : ["未分类"];
      for (const platform of platforms) {
        map.set(platform, (map.get(platform) ?? 0) + 1);
      }
    }
    groups = Array.from(map.entries()).map(([key, posts]) => ({ key, posts }));
  }

  return NextResponse.json({
    postsPublished,
    pendingAssets: pendingAssets ?? 0,
    connectedAccounts: connectedAccounts ?? 0,
    groups,
  });
}
