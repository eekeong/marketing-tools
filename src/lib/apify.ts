const API_URL = "https://api.apify.com/v2/acts";

export interface ApifyReelItem {
  shortCode?: string;
  url: string;
  caption?: string | null;
  ownerUsername?: string;
  ownerFullName?: string | null;
  likesCount?: number | null;
  commentsCount?: number | null;
  videoPlayCount?: number | null;
  videoViewCount?: number | null;
  videoUrl?: string | null;
  displayUrl?: string | null;
  videoDuration?: number | null;
  timestamp?: string | null;
  productType?: string;
  // Which /explore/tags/<hashtag>/ directUrl produced this item (discover scans only).
  inputUrl?: string;
  // Present instead of the fields above when the actor couldn't fetch this URL
  // (private/nonexistent account, rate limited, etc.)
  error?: string;
  errorDescription?: string;
  username?: string;
}

async function runSync<T>(input: Record<string, unknown>): Promise<T[]> {
  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;
  if (!token || !actorId) throw new Error("APIFY_API_TOKEN / APIFY_ACTOR_ID is not set");

  const res = await fetch(`${API_URL}/${actorId}/run-sync-get-dataset-items?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify error ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

export async function scrapeReelsByUrls(directUrls: string[], resultsLimit: number): Promise<ApifyReelItem[]> {
  return runSync<ApifyReelItem>({ directUrls, resultsType: "reels", resultsLimit });
}

// The actor's `search` + searchType:"hashtag" field resolves keywords via a fuzzy
// Google-assisted lookup that frequently maps them to unrelated, empty hashtags
// (verified: every one of a real 7-keyword batch resolved to a 0-post garbage tag).
// Hitting /explore/tags/<hashtag>/ directly via directUrls is reliable instead.
// resultsLimit is applied per-URL by the actor, so it's divided across keywords
// here to keep the total (and cost) roughly in line with what the caller asked for.
export async function scrapeReelsByKeywords(keywords: string[], resultsLimit: number): Promise<ApifyReelItem[]> {
  const perKeywordLimit = Math.max(2, Math.floor(resultsLimit / keywords.length));
  const directUrls = keywords.map((k) => `https://www.instagram.com/explore/tags/${encodeURIComponent(k.replace(/\s+/g, ""))}/`);
  return runSync<ApifyReelItem>({ directUrls, resultsType: "reels", resultsLimit: perKeywordLimit });
}
