import type { SequenceAnalysisRecipeKind } from "./sequenceUtils";
import type {
  SequenceAnalysisLegacyPreset,
  SequenceAnalysisPreset,
  SequenceAnalysisRecipeState,
} from "../_types/analysisPresets";

export const DNA_ANALYSIS_RECIPE_OPTIONS: SequenceAnalysisRecipeKind[] = [
  "motif-scan",
  "gc-anomaly-scan",
  "orf-scan",
];

export const DNA_ANALYSIS_RECIPE_LABELS: Record<SequenceAnalysisRecipeKind, string> = {
  "motif-scan": "Motif Scan",
  "gc-anomaly-scan": "GC Anomaly Scan",
  "orf-scan": "ORF Scan",
};

export const DNA_ANALYSIS_PRESET_STORAGE_KEY = "dna-analysis-recipes-v2";
export const DNA_ANALYSIS_LEGACY_PRESET_STORAGE_KEY = "dna-analysis-recipes-v1";
export const DNA_ANALYSIS_SHARE_STATE_PARAM_KEY = "dnaRecipePreset";

const DNA_ANALYSIS_PRESET_LIMIT = 10;
const MIN_GC_WINDOW_SIZE = 8;
const MIN_GC_THRESHOLD = 1;
const MIN_ORF_CODONS = 5;
const MAX_INTEGER_INPUT = 1_000_000;

const RECIPE_KIND_SET = new Set<SequenceAnalysisRecipeKind>(DNA_ANALYSIS_RECIPE_OPTIONS);

export const DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE: SequenceAnalysisRecipeState = {
  activeRecipeKind: "motif-scan",
  selectedRecipeKinds: [...DNA_ANALYSIS_RECIPE_OPTIONS],
  motif: "ATG",
  gcWindowSize: 24,
  gcThresholdPct: 15,
  minOrfCodons: 10,
};

export type LoadedSequenceAnalysisPresets = {
  presets: SequenceAnalysisPreset[];
  migratedFromLegacyStorage: boolean;
};

const isObject = (candidate: unknown): candidate is Record<string, unknown> =>
  typeof candidate === "object" && candidate !== null;

const isRecipeKind = (candidate: unknown): candidate is SequenceAnalysisRecipeKind =>
  typeof candidate === "string" && RECIPE_KIND_SET.has(candidate as SequenceAnalysisRecipeKind);

const clampInteger = (
  candidate: unknown,
  fallback: number,
  minimum: number,
  maximum = MAX_INTEGER_INPUT,
): number => {
  const parsed = Number(candidate);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(minimum, Math.min(maximum, Math.floor(parsed)));
};

const normalizeMotif = (candidate: unknown, fallback: string): string => {
  if (typeof candidate !== "string") {
    return fallback;
  }
  const normalized = candidate
    .toUpperCase()
    .split("")
    .filter((base) => ["A", "C", "G", "T", "U"].includes(base))
    .join("");
  return normalized.length > 0 ? normalized : fallback;
};

const normalizeRecipeKindOrder = (candidateKinds: SequenceAnalysisRecipeKind[]) =>
  DNA_ANALYSIS_RECIPE_OPTIONS.filter((kind) => candidateKinds.includes(kind));

const normalizeRecipeKindList = (
  candidate: unknown,
  fallbackKinds: SequenceAnalysisRecipeKind[],
  requiredKind: SequenceAnalysisRecipeKind,
): SequenceAnalysisRecipeKind[] => {
  const rawKinds: unknown[] = Array.isArray(candidate)
    ? candidate
    : typeof candidate === "string"
      ? candidate
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

  const mappedKinds: SequenceAnalysisRecipeKind[] = [];
  for (const rawKind of rawKinds) {
    if (!isRecipeKind(rawKind)) {
      continue;
    }
    if (!mappedKinds.includes(rawKind)) {
      mappedKinds.push(rawKind);
    }
  }

  const normalizedKinds =
    mappedKinds.length > 0 ? normalizeRecipeKindOrder(mappedKinds) : [...fallbackKinds];
  if (!normalizedKinds.includes(requiredKind)) {
    normalizedKinds.unshift(requiredKind);
  }

  return normalizeRecipeKindOrder(normalizedKinds);
};

export const normalizeSequenceAnalysisRecipeState = (
  candidate: Partial<SequenceAnalysisRecipeState> | undefined,
  fallbackState: SequenceAnalysisRecipeState = DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
): SequenceAnalysisRecipeState => {
  const normalizedCandidate = candidate || {};
  const activeRecipeKind = isRecipeKind(normalizedCandidate.activeRecipeKind)
    ? normalizedCandidate.activeRecipeKind
    : fallbackState.activeRecipeKind;

  return {
    activeRecipeKind,
    selectedRecipeKinds: normalizeRecipeKindList(
      normalizedCandidate.selectedRecipeKinds,
      fallbackState.selectedRecipeKinds,
      activeRecipeKind,
    ),
    motif: normalizeMotif(normalizedCandidate.motif, fallbackState.motif),
    gcWindowSize: clampInteger(
      normalizedCandidate.gcWindowSize,
      fallbackState.gcWindowSize,
      MIN_GC_WINDOW_SIZE,
    ),
    gcThresholdPct: clampInteger(
      normalizedCandidate.gcThresholdPct,
      fallbackState.gcThresholdPct,
      MIN_GC_THRESHOLD,
    ),
    minOrfCodons: clampInteger(
      normalizedCandidate.minOrfCodons,
      fallbackState.minOrfCodons,
      MIN_ORF_CODONS,
    ),
  };
};

const normalizePreset = (candidate: unknown): SequenceAnalysisPreset | null => {
  if (!isObject(candidate)) {
    return null;
  }

  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  if (!name) {
    return null;
  }

  const state = normalizeSequenceAnalysisRecipeState(
    isObject(candidate.state)
      ? (candidate.state as Partial<SequenceAnalysisRecipeState>)
      : undefined,
  );

  const createdAtIso =
    typeof candidate.createdAtIso === "string" && candidate.createdAtIso.trim()
      ? candidate.createdAtIso
      : new Date(0).toISOString();
  const updatedAtIso =
    typeof candidate.updatedAtIso === "string" && candidate.updatedAtIso.trim()
      ? candidate.updatedAtIso
      : createdAtIso;

  return {
    schemaVersion: 2,
    name,
    state,
    createdAtIso,
    updatedAtIso,
  };
};

const normalizeLegacyPreset = (candidate: unknown): SequenceAnalysisLegacyPreset | null => {
  if (!isObject(candidate)) {
    return null;
  }

  const name = typeof candidate.name === "string" ? candidate.name.trim() : "";
  const recipeKind = candidate.recipeKind;
  if (!name || !isRecipeKind(recipeKind)) {
    return null;
  }

  return {
    name,
    recipeKind,
    motif: normalizeMotif(candidate.motif, DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.motif),
    gcWindowSize: clampInteger(
      candidate.gcWindowSize,
      DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.gcWindowSize,
      MIN_GC_WINDOW_SIZE,
    ),
    gcThresholdPct: clampInteger(
      candidate.gcThresholdPct,
      DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.gcThresholdPct,
      MIN_GC_THRESHOLD,
    ),
    minOrfCodons: clampInteger(
      candidate.minOrfCodons,
      DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.minOrfCodons,
      MIN_ORF_CODONS,
    ),
  };
};

const parsePresetArray = (raw: string | null): unknown[] => {
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const serializeSequenceAnalysisPresets = (presets: SequenceAnalysisPreset[]): string =>
  JSON.stringify(presets.slice(0, DNA_ANALYSIS_PRESET_LIMIT));

export const loadStoredSequenceAnalysisPresets = (
  readStorage: (storageKey: string) => string | null,
  nowIso = new Date().toISOString(),
): LoadedSequenceAnalysisPresets => {
  const v2Candidates = parsePresetArray(readStorage(DNA_ANALYSIS_PRESET_STORAGE_KEY));
  const v2Presets = v2Candidates
    .map((candidate) => normalizePreset(candidate))
    .filter((preset): preset is SequenceAnalysisPreset => preset !== null)
    .slice(0, DNA_ANALYSIS_PRESET_LIMIT);
  if (v2Presets.length > 0) {
    return {
      presets: v2Presets,
      migratedFromLegacyStorage: false,
    };
  }

  const legacyCandidates = parsePresetArray(readStorage(DNA_ANALYSIS_LEGACY_PRESET_STORAGE_KEY));
  const migratedPresets = legacyCandidates
    .map((candidate) => normalizeLegacyPreset(candidate))
    .filter((preset): preset is SequenceAnalysisLegacyPreset => preset !== null)
    .map(
      (legacyPreset): SequenceAnalysisPreset => ({
        schemaVersion: 2,
        name: legacyPreset.name,
        createdAtIso: nowIso,
        updatedAtIso: nowIso,
        state: normalizeSequenceAnalysisRecipeState({
          activeRecipeKind: legacyPreset.recipeKind,
          selectedRecipeKinds: [legacyPreset.recipeKind],
          motif: legacyPreset.motif,
          gcWindowSize: legacyPreset.gcWindowSize,
          gcThresholdPct: legacyPreset.gcThresholdPct,
          minOrfCodons: legacyPreset.minOrfCodons,
        }),
      }),
    )
    .slice(0, DNA_ANALYSIS_PRESET_LIMIT);

  return {
    presets: migratedPresets,
    migratedFromLegacyStorage: migratedPresets.length > 0,
  };
};

export const upsertSequenceAnalysisPreset = (
  presets: SequenceAnalysisPreset[],
  presetName: string,
  recipeState: SequenceAnalysisRecipeState,
  nowIso = new Date().toISOString(),
): SequenceAnalysisPreset[] => {
  const normalizedPresetName = presetName.trim();
  if (!normalizedPresetName) {
    return presets;
  }

  const normalizedState = normalizeSequenceAnalysisRecipeState(recipeState);
  const existingPreset = presets.find(
    (preset) => preset.name.toLowerCase() === normalizedPresetName.toLowerCase(),
  );

  const nextPreset: SequenceAnalysisPreset = {
    schemaVersion: 2,
    name: normalizedPresetName,
    createdAtIso: existingPreset?.createdAtIso ?? nowIso,
    updatedAtIso: nowIso,
    state: normalizedState,
  };

  return [
    nextPreset,
    ...presets.filter((preset) => preset.name.toLowerCase() !== normalizedPresetName.toLowerCase()),
  ].slice(0, DNA_ANALYSIS_PRESET_LIMIT);
};

const decodeSharePresetState = (
  encodedPresetState: string,
): Partial<SequenceAnalysisRecipeState> | undefined => {
  try {
    const decodedState = decodeURIComponent(encodedPresetState);
    const parsedState = JSON.parse(decodedState) as unknown;
    if (!isObject(parsedState)) {
      return undefined;
    }
    return parsedState as Partial<SequenceAnalysisRecipeState>;
  } catch {
    return undefined;
  }
};

const parseLegacyShareParams = (params: URLSearchParams): Partial<SequenceAnalysisRecipeState> => {
  const result: Partial<SequenceAnalysisRecipeState> = {};

  const recipe = params.get("dnaRecipe");
  if (isRecipeKind(recipe)) {
    result.activeRecipeKind = recipe;
  }

  const motif = params.get("dnaMotif");
  if (typeof motif === "string" && motif.trim()) {
    result.motif = motif;
  }

  const selectedRecipeKinds = params.get("dnaSelectedRecipes");
  if (selectedRecipeKinds) {
    result.selectedRecipeKinds = normalizeRecipeKindList(
      selectedRecipeKinds,
      DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.selectedRecipeKinds,
      result.activeRecipeKind ?? DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE.activeRecipeKind,
    );
  }

  const gcWindowSize = Number(params.get("dnaWindow"));
  if (Number.isFinite(gcWindowSize) && gcWindowSize > 0) {
    result.gcWindowSize = gcWindowSize;
  }

  const gcThresholdPct = Number(params.get("dnaGcThreshold"));
  if (Number.isFinite(gcThresholdPct) && gcThresholdPct > 0) {
    result.gcThresholdPct = gcThresholdPct;
  }

  const minOrfCodons = Number(params.get("dnaMinOrfCodons"));
  if (Number.isFinite(minOrfCodons) && minOrfCodons > 0) {
    result.minOrfCodons = minOrfCodons;
  }

  return result;
};

export const resolveSequenceAnalysisStateFromSearch = (
  search: string,
  fallbackState: SequenceAnalysisRecipeState = DEFAULT_SEQUENCE_ANALYSIS_RECIPE_STATE,
): SequenceAnalysisRecipeState => {
  const params = new URLSearchParams(search);
  const encodedPresetState = params.get(DNA_ANALYSIS_SHARE_STATE_PARAM_KEY);
  const decodedPresetState = encodedPresetState
    ? decodeSharePresetState(encodedPresetState)
    : undefined;
  const legacyShareState = parseLegacyShareParams(params);

  return normalizeSequenceAnalysisRecipeState(
    {
      ...fallbackState,
      ...(decodedPresetState || {}),
      ...legacyShareState,
    },
    fallbackState,
  );
};

export const buildSequenceAnalysisShareUrl = (
  currentHref: string,
  recipeState: SequenceAnalysisRecipeState,
): string => {
  const normalizedState = normalizeSequenceAnalysisRecipeState(recipeState);
  const url = new URL(currentHref);
  const encodedState = encodeURIComponent(JSON.stringify(normalizedState));
  url.searchParams.set(DNA_ANALYSIS_SHARE_STATE_PARAM_KEY, encodedState);
  url.searchParams.set("dnaRecipe", normalizedState.activeRecipeKind);
  url.searchParams.set("dnaSelectedRecipes", normalizedState.selectedRecipeKinds.join(","));
  url.searchParams.set("dnaMotif", normalizedState.motif);
  url.searchParams.set("dnaWindow", String(normalizedState.gcWindowSize));
  url.searchParams.set("dnaGcThreshold", String(normalizedState.gcThresholdPct));
  url.searchParams.set("dnaMinOrfCodons", String(normalizedState.minOrfCodons));
  return url.toString();
};
