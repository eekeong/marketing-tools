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

function credentials(): { token: string; actorId: string } {
  const token = process.env.APIFY_API_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;
  if (!token || !actorId) throw new Error("APIFY_API_TOKEN / APIFY_ACTOR_ID is not set");
  return { token, actorId };
}

async function runSync<T>(input: Record<string, unknown>): Promise<T[]> {
  const { token, actorId } = credentials();
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

// Async variants — used by the resumable scan pipeline so the "collect" step
// doesn't block a single HTTP request for as long as the actor takes to scrape.
export interface ActorRunHandle {
  runId: string;
  datasetId: string;
}

export async function startActorRun(input: Record<string, unknown>): Promise<ActorRunHandle> {
  const { token, actorId } = credentials();
  const res = await fetch(`${API_URL}/${actorId}/runs?token=${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify error ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = await res.json();
  return { runId: json.data.id, datasetId: json.data.defaultDatasetId };
}

export type ActorRunStatus = "READY" | "RUNNING" | "SUCCEEDED" | "FAILED" | "TIMED-OUT" | "ABORTED" | "ABORTING";

export async function getActorRunStatus(runId: string): Promise<{ status: ActorRunStatus; datasetId: string }> {
  const { token } = credentials();
  const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${token}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify error ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = await res.json();
  return { status: json.data.status, datasetId: json.data.defaultDatasetId };
}

export async function getDatasetItems<T>(datasetId: string): Promise<T[]> {
  const { token } = credentials();
  const res = await fetch(`https://api.apify.com/v2/datasets/${datasetId}/items?token=${token}&clean=true`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Apify error ${res.status}: ${text.slice(0, 500)}`);
  }
  return res.json();
}

export function buildRadarInput(usernames: string[], resultsLimit: number): Record<string, unknown> {
  return { directUrls: usernames.map((u) => `https://www.instagram.com/${u}/`), resultsType: "reels", resultsLimit };
}

// The actor's `search` + searchType:"hashtag" field resolves keywords via a fuzzy
// Google-assisted lookup that frequently maps them to unrelated, empty hashtags
// (verified: every one of a real 7-keyword batch resolved to a 0-post garbage tag).
// searchType:"user" instead finds creator profiles matching the keywords and pulls
// their recent reels — this is the "search like a real user would" mode the actor
// actually supports; hitting /explore/tags/<hashtag>/ pages directly was a stopgap
// while that wasn't known, and IG capping hashtags to 5/post (Dec 2025) makes those
// pages a dead end anyway.
// Kept deliberately small: a live test with searchLimit scaled by keyword count
// (7 keywords -> searchLimit 21) came back with 215 reels — the actor doesn't seem
// to split a comma-joined `search` list's limit evenly per term, so a flat, modest
// cap keeps Discover a "once a month" check rather than a 200+ item analysis bill.
export function buildDiscoverInput(keywords: string[]): Record<string, unknown> {
  return {
    search: keywords.join(","),
    searchType: "user",
    searchLimit: 6,
    resultsType: "reels",
    resultsLimit: 2,
  };
}

export async function scrapeReelsByUrls(directUrls: string[], resultsLimit: number): Promise<ApifyReelItem[]> {
  return runSync<ApifyReelItem>(buildRadarInput(directUrls, resultsLimit));
}

export async function scrapeReelsByKeywords(keywords: string[]): Promise<ApifyReelItem[]> {
  return runSync<ApifyReelItem>(buildDiscoverInput(keywords));
}
