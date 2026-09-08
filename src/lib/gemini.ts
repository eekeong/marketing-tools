const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Rough public flash-tier pricing estimate — used only to populate the cost_usd
// columns for visibility in the Activity log, not for billing.
const PRICE_PER_M_INPUT = 0.1;
const PRICE_PER_M_OUTPUT = 0.4;

const MAX_RETRIES = 4;

interface GenerateJSONResult<T> {
  data: T;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// The free tier caps requests per minute; 429/503 responses are transient and
// worth retrying — Google's error body often includes how long to wait.
function parseRetryDelayMs(bodyText: string): number | null {
  const match = bodyText.match(/"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  if (!match) return null;
  return Math.ceil(parseFloat(match[1]) * 1000);
}

export async function generateJSON<T>({
  prompt,
  schema,
  temperature = 0.8,
  video,
}: {
  prompt: string;
  schema: Record<string, unknown>;
  temperature?: number;
  // Optional inline video (base64 data + mime type) so the same call can watch/listen
  // to the reel instead of only reading its caption. Kept inline (not the Files API)
  // since reels are short — well under the ~100MB inline request limit.
  video?: { base64: string; mimeType: string };
}): Promise<GenerateJSONResult<T>> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.6-flash";
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const parts: Record<string, unknown>[] = video
    ? [{ inline_data: { mime_type: video.mimeType, data: video.base64 } }, { text: prompt }]
    : [{ text: prompt }];

  let lastError = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(`${API_URL}/${model}:generateContent`, {
      method: "POST",
      headers: {
        "x-goog-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature,
          responseMimeType: "application/json",
          responseSchema: schema,
          thinkingConfig: { thinkingLevel: "low" },
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      lastError = `Gemini API error ${res.status}: ${text.slice(0, 500)}`;
      if ((res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
        const delay = parseRetryDelayMs(text) ?? (res.status === 429 ? 20000 : 6000);
        await sleep(Math.min(delay, 65000));
        continue;
      }
      throw new Error(lastError);
    }

    const json = await res.json();
    const text = json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";
    if (!text) throw new Error("Gemini returned an empty response");

    let data: T;
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 300)}`);
    }

    const inputTokens = json.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = json.usageMetadata?.candidatesTokenCount ?? 0;
    const costUsd = (inputTokens / 1_000_000) * PRICE_PER_M_INPUT + (outputTokens / 1_000_000) * PRICE_PER_M_OUTPUT;

    return { data, model, inputTokens, outputTokens, costUsd };
  }

  throw new Error(lastError);
}
