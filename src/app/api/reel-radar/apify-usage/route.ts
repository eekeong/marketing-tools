import { NextResponse } from "next/server";
import { getAccountUsage } from "@/lib/apify";

export async function GET() {
  try {
    const usage = await getAccountUsage();
    return NextResponse.json(usage);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
