import { HOOK_TYPES, HookType } from "./reelRadarData";

export type DbHookType =
  | "direct_question"
  | "counterintuitive"
  | "pain_point"
  | "curiosity_gap"
  | "result_first"
  | "promise_teach"
  | "trend_jack"
  | "story"
  | "warning"
  | "comparison"
  | "other";

// Chinese display label <-> DB enum. Index-aligned with HOOK_TYPES in reelRadarData.ts.
const DB_HOOK_TYPES: DbHookType[] = [
  "direct_question",
  "counterintuitive",
  "pain_point",
  "curiosity_gap",
  "result_first",
  "promise_teach",
  "trend_jack",
  "story",
  "warning",
  "comparison",
  "other",
];

const ZH_TO_DB = new Map<HookType, DbHookType>(HOOK_TYPES.map((zh, i) => [zh, DB_HOOK_TYPES[i]]));
const DB_TO_ZH = new Map<DbHookType, HookType>(DB_HOOK_TYPES.map((db, i) => [db, HOOK_TYPES[i]]));

export function hookTypeToDb(zh: HookType): DbHookType {
  return ZH_TO_DB.get(zh) ?? "other";
}

export function hookTypeFromDb(db: DbHookType | null): HookType {
  if (!db) return "其他";
  return DB_TO_ZH.get(db) ?? "其他";
}

export const HOOK_TYPES_DB = DB_HOOK_TYPES;

export type ReelSource = "radar" | "discover" | "mine";
export type ScriptMode = "rewrite_structure" | "copy_script" | "weekly_idea";
export type ScriptStatus = "draft" | "filmed" | "archived";

export interface ReelRow {
  id: string;
  shortcode: string;
  ig_url: string;
  owner_username: string;
  owner_full_name: string | null;
  caption: string | null;
  play_count: number;
  like_count: number;
  comment_count: number;
  source: ReelSource;
  first_seen_at: string;
}

export interface ReelAnalysisRow {
  reel_id: string;
  transcript: string | null;
  relevance_score: number | null;
  hook_type: DbHookType | null;
  hook_text: string | null;
  structure: string[];
  cta_text: string | null;
  why_scored: string | null;
}

export interface StructureStep {
  title: string;
  description: string;
}

// Older analyzed reels stored `structure` as plain one-line strings; newer ones
// store {title, description} pairs. Handle both so nothing crashes on old data.
export function formatStructureStep(step: string | StructureStep): StructureStep {
  if (typeof step === "string") return { title: step, description: "" };
  return step;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Deterministic pastel-ish color from a handle so cards look distinct without storing color.
const PALETTE = ["#fc0c97", "#7c25d9", "#2563EB", "#16A34A", "#DC2626", "#EA580C", "#0891B2", "#9333EA"];
export function colorForHandle(handle: string): string {
  let hash = 0;
  for (let i = 0; i < handle.length; i++) hash = (hash * 31 + handle.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}
