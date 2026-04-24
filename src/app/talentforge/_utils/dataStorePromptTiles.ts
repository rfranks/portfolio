import { v4 as uuid } from "uuid";
import { PROMPT_TILES } from "@/app/talentforge/_consts/promptTiles";
import type { PromptContext } from "./promptTypes";

export type CustomPromptPlaceholderType =
  | "shortText"
  | "longText"
  | "resume"
  | "jobApplication"
  | "offer"
  | "currentCompensation"
  | "userProfile"
  | "goals";

export interface CustomPromptPlaceholder {
  id: string;
  label: string;
  type: CustomPromptPlaceholderType;
  helperText?: string;
  required?: boolean;
}

export interface CustomPromptTile {
  id: string;
  displayName: string;
  fullText: string;
  contexts: PromptContext[];
  placeholders: CustomPromptPlaceholder[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CustomPromptTileInput extends Omit<
  CustomPromptTile,
  "id" | "createdAt" | "updatedAt"
> {
  id?: string;
}

type CustomPromptTileLike = Partial<CustomPromptTileInput> & {
  placeholders?: unknown[];
  display?: string;
  fullPrompt?: string;
  createdAt?: string;
  updatedAt?: string;
};

const KNOWN_PROMPT_CONTEXTS: readonly PromptContext[] = [
  "resume",
  "offers",
  "messaging",
  "jobSearch",
];

const CUSTOM_PLACEHOLDER_TYPES: readonly CustomPromptPlaceholderType[] = [
  "shortText",
  "longText",
  "resume",
  "jobApplication",
  "offer",
  "currentCompensation",
  "userProfile",
  "goals",
];

const DEFAULT_PROMPT_TILE_IDS = new Set(Object.keys(PROMPT_TILES).map((id) => id.toLowerCase()));
const CONTEXT_SET = new Set<PromptContext>(KNOWN_PROMPT_CONTEXTS);
const PLACEHOLDER_TYPE_SET = new Set<CustomPromptPlaceholderType>(
  CUSTOM_PLACEHOLDER_TYPES as CustomPromptPlaceholderType[],
);

function sanitizePlaceholder(value: unknown): CustomPromptPlaceholder | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Partial<CustomPromptPlaceholder> & {
    id?: string | number;
  };
  const type = candidate.type;
  if (!type || !PLACEHOLDER_TYPE_SET.has(type as CustomPromptPlaceholderType)) {
    return null;
  }
  const idValue =
    typeof candidate.id === "string"
      ? candidate.id
      : typeof candidate.id === "number"
        ? String(candidate.id)
        : "";
  const labelValue =
    typeof candidate.label === "string"
      ? candidate.label
      : typeof candidate.label === "number"
        ? String(candidate.label)
        : "";
  const id = idValue.trim().replace(/\s+/g, "_");
  const label = labelValue.trim();
  if (!id || !label) {
    return null;
  }
  const helperText =
    typeof candidate.helperText === "string" ? candidate.helperText.trim() || undefined : undefined;
  const required = candidate.required === false ? false : true;
  return {
    id,
    label,
    type: type as CustomPromptPlaceholderType,
    helperText,
    required,
  };
}

export function sanitizeCustomPromptTileInput(
  tile: CustomPromptTileLike,
  id: string,
  previous?: CustomPromptTile,
): CustomPromptTile | null {
  const displaySource =
    typeof tile.displayName === "string"
      ? tile.displayName
      : typeof tile.display === "string"
        ? tile.display
        : "";
  const displayName = displaySource.trim();
  if (!displayName) return null;

  const contextsInput = Array.isArray(tile.contexts) ? tile.contexts : [];
  const contexts = Array.from(
    new Set(
      contextsInput
        .map((ctx) => ctx as PromptContext)
        .filter((ctx): ctx is PromptContext => CONTEXT_SET.has(ctx)),
    ),
  );
  if (contexts.length === 0) {
    contexts.push("resume");
  }

  const rawPlaceholders = Array.isArray(tile.placeholders) ? tile.placeholders : [];
  const placeholders: CustomPromptPlaceholder[] = [];
  const seen = new Set<string>();
  for (const raw of rawPlaceholders) {
    const sanitized = sanitizePlaceholder(raw);
    if (!sanitized) continue;
    if (seen.has(sanitized.id)) continue;
    placeholders.push(sanitized);
    seen.add(sanitized.id);
  }
  if (placeholders.length === 0) {
    return null;
  }

  const fullTextSource =
    typeof tile.fullText === "string"
      ? tile.fullText
      : typeof tile.fullPrompt === "string"
        ? tile.fullPrompt
        : tile.fullText !== undefined && tile.fullText !== null
          ? String(tile.fullText)
          : "";

  const now = new Date().toISOString();
  const createdAt =
    typeof tile.createdAt === "string" ? tile.createdAt : (previous?.createdAt ?? now);

  const updatedAt = typeof tile.updatedAt === "string" ? tile.updatedAt : now;

  return {
    id,
    displayName,
    fullText: fullTextSource,
    contexts,
    placeholders,
    createdAt,
    updatedAt,
  };
}

export function ensureCustomPromptId(
  candidate: string,
  current: CustomPromptTile[],
  previousId?: string,
): string {
  const trimmed = candidate.trim();
  const base = trimmed || uuid();
  const previousLower = previousId ? previousId.toLowerCase() : undefined;

  const isConflict = (value: string) => {
    const lower = value.toLowerCase();
    if (previousLower && lower === previousLower) {
      return false;
    }
    if (DEFAULT_PROMPT_TILE_IDS.has(lower)) {
      return true;
    }
    return current.some((tile) => tile.id.toLowerCase() === lower);
  };

  let candidateId = base;
  let suffix = 1;
  while (isConflict(candidateId)) {
    candidateId = `${base}_${suffix}`;
    suffix += 1;
  }
  return candidateId;
}

export function migrateCustomPromptTiles(data: unknown): CustomPromptTile[] {
  if (!Array.isArray(data)) {
    return [];
  }
  const migrated: CustomPromptTile[] = [];
  for (const entry of data as unknown[]) {
    if (!entry || typeof entry !== "object") {
      continue;
    }
    const candidate = entry as CustomPromptTileLike & { id?: unknown };
    const rawId =
      typeof candidate.id === "string"
        ? candidate.id.trim()
        : typeof candidate.id === "number"
          ? String(candidate.id)
          : "";
    const baseId = rawId || uuid();
    const ensuredId = ensureCustomPromptId(baseId, migrated);
    const sanitized = sanitizeCustomPromptTileInput(
      candidate,
      ensuredId,
      candidate as CustomPromptTile,
    );
    if (sanitized) {
      migrated.push(sanitized);
    }
  }
  return migrated;
}
