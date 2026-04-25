import {
  DEFAULT_IMAGE_MODEL_ID,
  DEFAULT_ONE_OFF_MODEL_ID,
  DEFAULT_TEXT_MODEL_ID,
  DEV_MODE,
  imageTypeOrder,
  pathForgerRecoveryTimelineLimit,
  pathForgerSampleImageByType,
  pathForgerSampleStorageArtifactPath,
  pathForgerSaveSlotLimit,
  pathForgerStateStorageKey,
  pitchCacheStorageKey,
} from "@/app/pathforger/_consts/consts";
import type {
  PathForgerChapterResult,
  PathForgerGeneratedImage,
  PathForgerImageType,
  PathForgerPitchResult,
} from "@/app/pathforger/_types/pipeline";
import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";
import type {
  PathForgerPersistedEnvelopeV2,
  PathForgerPersistedStateV1,
  PathForgerRecoveryTimelineEntry,
  PathForgerSaveSlot,
} from "@/app/pathforger/_types/persistence";
import { isPathForgerPitchResult } from "@/app/pathforger/_utils/pitchHelpers";
import { withBasePath } from "@/utils/basePath";

export const dangerLevelValues = ["Forgiving", "Risky", "Deadly"] as const;
export const adventureLengthValues = [
  "Very short (1-2 lines)",
  "Short",
  "Medium",
  "Long",
  "Very long",
] as const;
export const romanceModeValues = ["No romance", "Optional romance", "Romance-forward"] as const;

function isImageModelId(value: string): boolean {
  return /^gpt-image/i.test(value.trim());
}

export function sanitizeDefaultModel(value: string): string {
  const normalized = value.trim();
  if (!normalized || isImageModelId(normalized)) {
    return DEFAULT_ONE_OFF_MODEL_ID;
  }

  return normalized;
}

export function sanitizeTextModel(value: string): string {
  const normalized = value.trim();
  if (!normalized || isImageModelId(normalized)) {
    return DEFAULT_TEXT_MODEL_ID;
  }

  return normalized;
}

export function sanitizeImageModel(value: string): string {
  const normalized = value.trim();
  if (!normalized || isImageModelId(normalized)) {
    return DEFAULT_IMAGE_MODEL_ID;
  }

  return normalized;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function sanitizeImagePromptMap(
  value: unknown,
): Partial<Record<PathForgerImageType, string>> {
  if (!isRecord(value)) {
    return {};
  }

  const next: Partial<Record<PathForgerImageType, string>> = {};
  for (const key of imageTypeOrder) {
    const candidate = value[key];
    if (typeof candidate === "string") {
      next[key] = candidate;
    }
  }

  return next;
}

export function sanitizeRenderImages(value: unknown): Record<PathForgerImageType, boolean> | null {
  if (!isRecord(value)) {
    return null;
  }

  const next = {} as Record<PathForgerImageType, boolean>;
  for (const key of imageTypeOrder) {
    const candidate = value[key];
    if (typeof candidate !== "boolean") {
      return null;
    }
    next[key] = candidate;
  }

  return next;
}

export function isValidChapterResult(value: unknown): value is PathForgerChapterResult {
  if (!isRecord(value)) {
    return false;
  }

  if (
    typeof value.chapterNumber !== "number" ||
    !Number.isInteger(value.chapterNumber) ||
    value.chapterNumber < 1
  ) {
    return false;
  }

  if (
    typeof value.chapterTitle !== "string" ||
    typeof value.chapterMarkdown !== "string" ||
    typeof value.pathLedgerMarkdown !== "string" ||
    typeof value.outcomeAMarkdown !== "string" ||
    typeof value.outcomeBMarkdown !== "string" ||
    typeof value.continuePromptMarkdown !== "string"
  ) {
    return false;
  }

  if (!Array.isArray(value.choices) || value.choices.length < 2) {
    return false;
  }

  const imagePrompts = value.imagePrompts;
  if (!isRecord(imagePrompts)) {
    return false;
  }

  for (const key of imageTypeOrder) {
    if (typeof imagePrompts[key] !== "string") {
      return false;
    }
  }

  return value.choices.every(
    (choice) =>
      isRecord(choice) &&
      (choice.id === "A" || choice.id === "B" || choice.id === "C") &&
      typeof choice.label === "string" &&
      typeof choice.description === "string" &&
      typeof choice.riskHudMarkdown === "string",
  );
}

export function buildFallbackPitchResultFromChapter(
  chapter: PathForgerChapterResult,
  selectedPitch: "auto" | PathForgerPitchChoice,
): PathForgerPitchResult {
  const recommendedPitch: PathForgerPitchChoice = selectedPitch === "auto" ? "A" : selectedPitch;
  const chapterTitle = chapter.chapterTitle?.trim() || "Restored Adventure";
  const teaser = chapter.continuePromptMarkdown?.trim() || chapterTitle;

  return {
    adventureTitle: chapterTitle,
    protagonistName: "Protagonist",
    onboardingRecapMarkdown: "Restored PathForger session.",
    pitches: [
      { id: "A", title: chapterTitle, markdown: teaser },
      { id: "B", title: `${chapterTitle} II`, markdown: teaser },
      { id: "C", title: `${chapterTitle} III`, markdown: teaser },
    ],
    recommendedPitch,
    choosePromptMarkdown: "Select your adventure.",
  };
}

export function isPersistedStateV1Like(value: unknown): value is PathForgerPersistedStateV1 {
  return isRecord(value) && value.version === 1 && isRecord(value.form) && isRecord(value.story);
}

export function isPersistedEnvelopeV2Like(value: unknown): value is PathForgerPersistedEnvelopeV2 {
  return (
    isRecord(value) &&
    value.version === 2 &&
    typeof value.sessionId === "string" &&
    typeof value.revision === "number" &&
    Number.isFinite(value.revision) &&
    typeof value.updatedAt === "number" &&
    Number.isFinite(value.updatedAt) &&
    isPersistedStateV1Like(value.state)
  );
}

export function extractPersistedStateSnapshot(value: unknown): {
  state: PathForgerPersistedStateV1;
  envelope: PathForgerPersistedEnvelopeV2 | null;
} | null {
  if (isPersistedEnvelopeV2Like(value)) {
    return {
      state: value.state,
      envelope: value,
    };
  }

  if (isPersistedStateV1Like(value)) {
    return {
      state: value,
      envelope: null,
    };
  }

  return null;
}

export function createPersistenceId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isSaveSlotLike(value: unknown): value is PathForgerSaveSlot {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.createdAt === "number" &&
    typeof value.updatedAt === "number" &&
    typeof value.revision === "number" &&
    isPersistedStateV1Like(value.snapshot)
  );
}

export function sanitizeSaveSlots(value: unknown): PathForgerSaveSlot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is PathForgerSaveSlot => isSaveSlotLike(entry))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, pathForgerSaveSlotLimit);
}

function isRecoveryTimelineEntryLike(value: unknown): value is PathForgerRecoveryTimelineEntry {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.createdAt === "number" &&
    typeof value.label === "string" &&
    typeof value.reason === "string" &&
    (value.chapterNumber === null || typeof value.chapterNumber === "number") &&
    (value.selectedPitch === "auto" ||
      value.selectedPitch === "A" ||
      value.selectedPitch === "B" ||
      value.selectedPitch === "C") &&
    isPersistedStateV1Like(value.snapshot)
  );
}

export function sanitizeRecoveryTimeline(value: unknown): PathForgerRecoveryTimelineEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is PathForgerRecoveryTimelineEntry => isRecoveryTimelineEntryLike(entry))
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, pathForgerRecoveryTimelineLimit);
}

export function buildAutoCheckpointSignature(state: PathForgerPersistedStateV1): string {
  return JSON.stringify({
    pitchInputSignature: state.story.pitchInputSignature ?? "",
    chapterNumber: state.story.chapterOnlyResult?.chapterNumber ?? null,
    chapterTitle: state.story.chapterOnlyResult?.chapterTitle ?? "",
    pathLedgerMarkdown: state.story.chapterOnlyResult?.pathLedgerMarkdown ?? "",
    forgedOutcomeA: state.story.forgedOutcomes.A ?? "",
    forgedOutcomeB: state.story.forgedOutcomes.B ?? "",
    selectedBranch: state.form.selectedBranch,
  });
}

export function buildCheckpointLabel(state: PathForgerPersistedStateV1): string {
  const chapterNumber = state.story.chapterOnlyResult?.chapterNumber;
  if (typeof chapterNumber === "number" && Number.isFinite(chapterNumber)) {
    return `Checkpoint · Chapter ${chapterNumber}`;
  }

  if (state.story.pitchOnlyResult) {
    return "Checkpoint · Pitch selected";
  }

  return "Checkpoint · In-progress";
}

export async function loadDevSampleStorageArtifactIfNeeded(): Promise<void> {
  if (typeof window === "undefined" || !DEV_MODE) {
    return;
  }

  const maybeMigrateLegacyDevImageModel = () => {
    const persistedRaw = window.localStorage.getItem(pathForgerStateStorageKey);
    if (!persistedRaw) {
      return;
    }

    try {
      const parsedUnknown: unknown = JSON.parse(persistedRaw);
      const extracted = extractPersistedStateSnapshot(parsedUnknown);
      if (!extracted) {
        return;
      }

      const persisted = extracted.state;
      const legacyDefaultImageModel =
        persisted.form.imageModel === "gpt-4.1" &&
        persisted.form.defaultModel === "gpt-4.1-mini" &&
        persisted.form.textModel === "gpt-4.1-mini";
      const unavailableDevSampleImageModel =
        persisted.form.imageModel === "gpt-image-1-mini" ||
        persisted.form.imageModel === "gpt-image-1";
      if (!legacyDefaultImageModel && !unavailableDevSampleImageModel) {
        return;
      }

      const migrated: PathForgerPersistedStateV1 = {
        ...persisted,
        form: {
          ...persisted.form,
          imageModel: DEFAULT_IMAGE_MODEL_ID,
        },
      };
      if (extracted.envelope) {
        const nextEnvelope: PathForgerPersistedEnvelopeV2 = {
          ...extracted.envelope,
          revision: extracted.envelope.revision + 1,
          updatedAt: Date.now(),
          state: migrated,
        };
        window.localStorage.setItem(pathForgerStateStorageKey, JSON.stringify(nextEnvelope));
      } else {
        window.localStorage.setItem(pathForgerStateStorageKey, JSON.stringify(migrated));
      }
    } catch {
      // Ignore malformed persisted state during migration.
    }
  };

  maybeMigrateLegacyDevImageModel();

  const hasPersistedState = Boolean(window.localStorage.getItem(pathForgerStateStorageKey));
  const hasPersistedPitchCache = Boolean(window.localStorage.getItem(pitchCacheStorageKey));
  if (hasPersistedState && hasPersistedPitchCache) {
    return;
  }

  try {
    const response = await fetch(withBasePath(pathForgerSampleStorageArtifactPath), {
      cache: "no-store",
    });
    if (!response.ok) {
      return;
    }

    const parsed = (await response.json()) as Record<string, unknown>;
    const sampleState = parsed[pathForgerStateStorageKey];
    const samplePitchCache = parsed[pitchCacheStorageKey];

    const extractedSampleState = extractPersistedStateSnapshot(sampleState);
    if (
      !hasPersistedState &&
      extractedSampleState &&
      isValidChapterResult(extractedSampleState.state.story.chapterOnlyResult) &&
      (extractedSampleState.state.story.pitchOnlyResult === null ||
        isPathForgerPitchResult(extractedSampleState.state.story.pitchOnlyResult))
    ) {
      window.localStorage.setItem(pathForgerStateStorageKey, JSON.stringify(sampleState));
    }

    if (!hasPersistedPitchCache && isPathForgerPitchResult(samplePitchCache)) {
      window.localStorage.setItem(pitchCacheStorageKey, JSON.stringify(samplePitchCache));
    }
  } catch {
    // Ignore sample artifact load failures in dev mode.
  }
}

export function buildDevSampleImages(args: {
  chapter: PathForgerChapterResult;
  renderImages: Record<PathForgerImageType, boolean>;
}): Partial<Record<PathForgerImageType, PathForgerGeneratedImage>> {
  const nextImages: Partial<Record<PathForgerImageType, PathForgerGeneratedImage>> = {};

  for (const type of imageTypeOrder) {
    if (!args.renderImages[type]) {
      continue;
    }

    nextImages[type] = {
      prompt: args.chapter.imagePrompts[type] ?? `DEV sample image for ${type}`,
      imageDataUrl: withBasePath(pathForgerSampleImageByType[type]),
      responseId: `dev-sample-${type}`,
      model: "dev-sample",
    };
  }

  return nextImages;
}
