import * as React from "react";
import {
  DEFAULT_IMAGE_MODEL_ID,
  DEV_MODE,
  imageTypeOrder,
  pathForgerSampleImageByType,
  pathForgerSampleStorageArtifactPath,
  pathForgerStateStorageKey,
  pitchCacheStorageKey,
} from "@/app/pathforger/_consts/consts";
import { withBasePath } from "@/utils/basePath";
import { getPathForgerOpenAIKey } from "@/app/pathforger/_utils/openAIKey";
import { isPathForgerPitchResult } from "@/app/pathforger/_utils/pitchHelpers";
import { runPathForgerImageStage } from "@/app/pathforger/_utils/pipeline";
import type {
  PathForgerBranchChoice,
  PathForgerChapterResult,
  PathForgerGeneratedImage,
  PathForgerImageType,
  PathForgerPipelineResult,
  PathForgerPitchResult,
} from "@/app/pathforger/_types/pipeline";
import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";

type BranchRevealState = Record<PathForgerBranchChoice, boolean>;
type BranchRevealTickState = Record<PathForgerBranchChoice, number>;
type ActiveRunAction =
  | "name"
  | "premise"
  | "style"
  | "tone"
  | "pitch"
  | "chapter"
  | "nextChapter"
  | "pipeline"
  | "forgePath"
  | null;
type OnboardingPayload = {
  genre: string;
  tone: string;
  dangerLevel: "Forgiving" | "Risky" | "Deadly";
  adventureLength: "Very short (1-2 lines)" | "Short" | "Medium" | "Long" | "Very long";
  protagonistPreference: string;
  premise: string;
  visualStyle: string;
  romanceMode: "No romance" | "Optional romance" | "Romance-forward";
  allowPermanentDeath: boolean;
  personalizedImages: boolean;
  ageRating: string;
};

type PathForgerPersistedStateV1 = {
  version: 1;
  form: {
    genre: string;
    tone: string;
    dangerLevel: "Forgiving" | "Risky" | "Deadly";
    adventureLength: "Very short (1-2 lines)" | "Short" | "Medium" | "Long" | "Very long";
    protagonistPreference: string;
    recentGeneratedProtagonistNames: string[];
    recentGeneratedPremises: string[];
    premise: string;
    visualStyle: string;
    romanceMode: "No romance" | "Optional romance" | "Romance-forward";
    allowPermanentDeath: boolean;
    ageRating: string;
    personalizedImages: boolean;
    selectedPitch: "auto" | PathForgerPitchChoice;
    selectedBranch: "" | PathForgerBranchChoice;
    defaultModel: string;
    textModel: string;
    imageModel: string;
    renderImages: Record<PathForgerImageType, boolean>;
    selfieDataUrl?: string;
    selfieName: string;
  };
  story: {
    pitchInputSignature: string | null;
    pitchOnlyResult: PathForgerPitchResult | null;
    chapterOnlyResult: PathForgerChapterResult | null;
    imagePromptDrafts: Partial<Record<PathForgerImageType, string>>;
    imagePromptOverrides: Partial<Record<PathForgerImageType, string>>;
    activeOptionBranch: PathForgerBranchChoice | null;
    revealedOptionBranches: Record<PathForgerBranchChoice, boolean>;
    optionRevealTick: Record<PathForgerBranchChoice, number>;
    forgedOutcomes: Partial<Record<PathForgerBranchChoice, string>>;
    journeyTabValue: string;
    lastForgedLedgerTransition: {
      chapterNumber: number;
      previousMarkdown: string;
      nextMarkdown: string;
    } | null;
  };
};

const dangerLevelValues = ["Forgiving", "Risky", "Deadly"] as const;
const adventureLengthValues = [
  "Very short (1-2 lines)",
  "Short",
  "Medium",
  "Long",
  "Very long",
] as const;
const romanceModeValues = ["No romance", "Optional romance", "Romance-forward"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function sanitizeImagePromptMap(value: unknown): Partial<Record<PathForgerImageType, string>> {
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

function sanitizeRenderImages(value: unknown): Record<PathForgerImageType, boolean> | null {
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

function isValidChapterResult(value: unknown): value is PathForgerChapterResult {
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

function buildFallbackPitchResultFromChapter(
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

function isPersistedStateV1Like(value: unknown): value is PathForgerPersistedStateV1 {
  return isRecord(value) && value.version === 1 && isRecord(value.form) && isRecord(value.story);
}

async function loadDevSampleStorageArtifactIfNeeded(): Promise<void> {
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
      if (!isPersistedStateV1Like(parsedUnknown)) {
        return;
      }

      const persisted = parsedUnknown;
      const legacyDefaultImageModel =
        persisted.form.imageModel === "gpt-4.1" &&
        persisted.form.defaultModel === "gpt-4.1-mini" &&
        persisted.form.textModel === "gpt-4.1-mini";
      if (!legacyDefaultImageModel) {
        return;
      }

      const migrated: PathForgerPersistedStateV1 = {
        ...persisted,
        form: {
          ...persisted.form,
          imageModel: DEFAULT_IMAGE_MODEL_ID,
        },
      };
      window.localStorage.setItem(pathForgerStateStorageKey, JSON.stringify(migrated));
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

    if (
      !hasPersistedState &&
      isPersistedStateV1Like(sampleState) &&
      isValidChapterResult(sampleState.story.chapterOnlyResult) &&
      (sampleState.story.pitchOnlyResult === null ||
        isPathForgerPitchResult(sampleState.story.pitchOnlyResult))
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

function buildDevSampleImages(args: {
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

type UsePathForgerPersistenceArgs = {
  ready: boolean;
  setReady: (value: boolean) => void;
  apiKeyReady: boolean;
  setApiKeyReady: (value: boolean) => void;
  setDraftKey: (value: string) => void;
  createStoryInputSignature: string;
  buildOnboardingPayload: () => OnboardingPayload;
  resolvedDefaultModel: string;
  textModel: string;
  imageModel: string;
  selectedPitch: "auto" | PathForgerPitchChoice;
  selectedPitchRef: React.MutableRefObject<"auto" | PathForgerPitchChoice>;
  selectedBranch: "" | PathForgerBranchChoice;
  selfieDataUrl?: string;
  personalizedImages: boolean;
  renderImages: Record<PathForgerImageType, boolean>;
  imagePromptOverrides: Partial<Record<PathForgerImageType, string>>;
  isRunning: boolean;
  isGeneratingChapterImages: boolean;
  chapterImageGenerationRunIdRef: React.MutableRefObject<number>;
  result: PathForgerPipelineResult | null;
  pitchOnlyResult: PathForgerPitchResult | null;
  chapterOnlyResult: PathForgerChapterResult | null;
  pitchInputSignature: string | null;
  journeyTabValue: string;
  lastForgedLedgerTransition: {
    chapterNumber: number;
    previousMarkdown: string;
    nextMarkdown: string;
  } | null;

  genre: string;
  tone: string;
  dangerLevel: "Forgiving" | "Risky" | "Deadly";
  adventureLength: "Very short (1-2 lines)" | "Short" | "Medium" | "Long" | "Very long";
  protagonistPreference: string;
  recentGeneratedProtagonistNames: string[];
  recentGeneratedPremises: string[];
  premise: string;
  visualStyle: string;
  romanceMode: "No romance" | "Optional romance" | "Romance-forward";
  allowPermanentDeath: boolean;
  ageRating: string;
  defaultModel: string;
  selfieName: string;
  activeOptionBranch: PathForgerBranchChoice | null;
  revealedOptionBranches: BranchRevealState;
  optionRevealTick: BranchRevealTickState;
  forgedOutcomes: Partial<Record<PathForgerBranchChoice, string>>;
  imagePromptDrafts: Partial<Record<PathForgerImageType, string>>;

  enqueueStatusMessage: (message: string) => void;
  clearStatusMessages: () => void;

  setErrorMessage: (value: string) => void;
  setIsRunning: (value: boolean) => void;
  setActiveRunAction: (value: ActiveRunAction) => void;
  setIsGeneratingChapterImages: (value: boolean) => void;
  setSelectedPitch: (value: "auto" | PathForgerPitchChoice) => void;
  setSelectedBranch: React.Dispatch<React.SetStateAction<"" | PathForgerBranchChoice>>;
  setPitchInputSignature: (value: string | null) => void;
  setPitchOnlyResult: (value: PathForgerPitchResult | null) => void;
  setChapterOnlyResult: React.Dispatch<React.SetStateAction<PathForgerChapterResult | null>>;
  setImagePromptDrafts: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerImageType, string>>>
  >;
  setImagePromptOverrides: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerImageType, string>>>
  >;
  setActiveOptionBranch: React.Dispatch<React.SetStateAction<PathForgerBranchChoice | null>>;
  setRevealedOptionBranches: React.Dispatch<React.SetStateAction<BranchRevealState>>;
  setOptionRevealTick: React.Dispatch<React.SetStateAction<BranchRevealTickState>>;
  setForgedOutcomes: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerBranchChoice, string>>>
  >;
  setJourneyTabValue: (value: string) => void;
  setLastForgedLedgerTransition: React.Dispatch<
    React.SetStateAction<{
      chapterNumber: number;
      previousMarkdown: string;
      nextMarkdown: string;
    } | null>
  >;
  setResult: React.Dispatch<React.SetStateAction<PathForgerPipelineResult | null>>;
  setCreateStoryPanelOpen: (value: boolean) => void;
  setChapterModalOpen: (value: boolean) => void;
  setContinueModalOpen: (value: boolean) => void;
  setChapterOutcomeModalOpen: (value: boolean) => void;
  setGenre: (value: string) => void;
  setTone: (value: string) => void;
  setDangerLevel: (value: "Forgiving" | "Risky" | "Deadly") => void;
  setAdventureLength: (
    value: "Very short (1-2 lines)" | "Short" | "Medium" | "Long" | "Very long",
  ) => void;
  setProtagonistPreference: (value: string) => void;
  setRecentGeneratedProtagonistNames: React.Dispatch<React.SetStateAction<string[]>>;
  setRecentGeneratedPremises: React.Dispatch<React.SetStateAction<string[]>>;
  setPremise: (value: string) => void;
  setVisualStyle: (value: string) => void;
  setRomanceMode: (value: "No romance" | "Optional romance" | "Romance-forward") => void;
  setAllowPermanentDeath: (value: boolean) => void;
  setAgeRating: (value: string) => void;
  setPersonalizedImages: (value: boolean) => void;
  setDefaultModel: (value: string) => void;
  setTextModel: (value: string) => void;
  setImageModel: (value: string) => void;
  setRenderImages: React.Dispatch<React.SetStateAction<Record<PathForgerImageType, boolean>>>;
  setSelfieDataUrl: (value: string | undefined) => void;
  setSelfieName: (value: string) => void;
};

export function usePathForgerPersistence(args: UsePathForgerPersistenceArgs) {
  const {
    ready,
    setReady,
    apiKeyReady,
    setApiKeyReady,
    setDraftKey,
    createStoryInputSignature,
    buildOnboardingPayload,
    resolvedDefaultModel,
    textModel,
    imageModel,
    selectedPitch,
    selectedPitchRef,
    selectedBranch,
    selfieDataUrl,
    personalizedImages,
    renderImages,
    imagePromptOverrides,
    isRunning,
    isGeneratingChapterImages,
    chapterImageGenerationRunIdRef,
    result,
    pitchOnlyResult,
    chapterOnlyResult,
    pitchInputSignature,
    journeyTabValue,
    lastForgedLedgerTransition,
    genre,
    tone,
    dangerLevel,
    adventureLength,
    protagonistPreference,
    recentGeneratedProtagonistNames,
    recentGeneratedPremises,
    premise,
    visualStyle,
    romanceMode,
    allowPermanentDeath,
    ageRating,
    defaultModel,
    selfieName,
    activeOptionBranch,
    revealedOptionBranches,
    optionRevealTick,
    forgedOutcomes,
    imagePromptDrafts,
    enqueueStatusMessage,
    clearStatusMessages,
    setErrorMessage,
    setIsRunning,
    setActiveRunAction,
    setIsGeneratingChapterImages,
    setSelectedPitch,
    setSelectedBranch,
    setPitchInputSignature,
    setPitchOnlyResult,
    setChapterOnlyResult,
    setImagePromptDrafts,
    setImagePromptOverrides,
    setActiveOptionBranch,
    setRevealedOptionBranches,
    setOptionRevealTick,
    setForgedOutcomes,
    setJourneyTabValue,
    setLastForgedLedgerTransition,
    setResult,
    setCreateStoryPanelOpen,
    setChapterModalOpen,
    setContinueModalOpen,
    setChapterOutcomeModalOpen,
    setGenre,
    setTone,
    setDangerLevel,
    setAdventureLength,
    setProtagonistPreference,
    setRecentGeneratedProtagonistNames,
    setRecentGeneratedPremises,
    setPremise,
    setVisualStyle,
    setRomanceMode,
    setAllowPermanentDeath,
    setAgeRating,
    setPersonalizedImages,
    setDefaultModel,
    setTextModel,
    setImageModel,
    setRenderImages,
    setSelfieDataUrl,
    setSelfieName,
  } = args;

  const didHydratePersistedStateRef = React.useRef(false);
  const didRestorePitchFromPersistedStateRef = React.useRef(false);
  const didRegenerateHydratedImagesRef = React.useRef(false);
  const didRestoreChapterFromPersistedStateRef = React.useRef(false);
  const useDevSampleForHydratedImageRestoreRef = React.useRef(false);
  const [pendingRestoredChapterImageRefresh, setPendingRestoredChapterImageRefresh] =
    React.useState(false);

  React.useEffect(() => {
    let isCancelled = false;

    const hydratePersistedState = async () => {
      const key = getPathForgerOpenAIKey();
      if (isCancelled) {
        return;
      }
      useDevSampleForHydratedImageRestoreRef.current = false;
      setDraftKey(key);
      setApiKeyReady(key.length > 0);
      let shouldAutoShowCreateStoryPanel = true;

      if (typeof window !== "undefined") {
        if (DEV_MODE) {
          await loadDevSampleStorageArtifactIfNeeded();
          if (isCancelled) {
            return;
          }
        }

        try {
          const persistedRaw = window.localStorage.getItem(pathForgerStateStorageKey);
          if (persistedRaw) {
            const parsedUnknown: unknown = JSON.parse(persistedRaw);
            if (isPersistedStateV1Like(parsedUnknown)) {
              const persisted = parsedUnknown;
              const { form, story } = persisted;

              if (typeof form.genre === "string") {
                setGenre(form.genre);
              }
              if (typeof form.tone === "string") {
                setTone(form.tone);
              }
              if (dangerLevelValues.includes(form.dangerLevel)) {
                setDangerLevel(form.dangerLevel);
              }
              if (adventureLengthValues.includes(form.adventureLength)) {
                setAdventureLength(form.adventureLength);
              }
              if (typeof form.protagonistPreference === "string") {
                setProtagonistPreference(form.protagonistPreference);
              }
              if (isStringArray(form.recentGeneratedProtagonistNames)) {
                setRecentGeneratedProtagonistNames(
                  form.recentGeneratedProtagonistNames.slice(0, 20),
                );
              }
              if (isStringArray(form.recentGeneratedPremises)) {
                setRecentGeneratedPremises(form.recentGeneratedPremises.slice(0, 20));
              }
              if (typeof form.premise === "string") {
                setPremise(form.premise);
              }
              if (typeof form.visualStyle === "string") {
                setVisualStyle(form.visualStyle);
              }
              if (romanceModeValues.includes(form.romanceMode)) {
                setRomanceMode(form.romanceMode);
              }
              if (typeof form.allowPermanentDeath === "boolean") {
                setAllowPermanentDeath(form.allowPermanentDeath);
              }
              if (typeof form.ageRating === "string") {
                setAgeRating(form.ageRating);
              }
              if (typeof form.personalizedImages === "boolean") {
                setPersonalizedImages(form.personalizedImages);
              }
              if (
                form.selectedPitch === "auto" ||
                form.selectedPitch === "A" ||
                form.selectedPitch === "B" ||
                form.selectedPitch === "C"
              ) {
                setSelectedPitch(form.selectedPitch);
                selectedPitchRef.current = form.selectedPitch;
              }
              if (
                form.selectedBranch === "" ||
                form.selectedBranch === "A" ||
                form.selectedBranch === "B"
              ) {
                setSelectedBranch(form.selectedBranch);
              }
              if (typeof form.defaultModel === "string") {
                setDefaultModel(form.defaultModel);
              }
              if (typeof form.textModel === "string") {
                setTextModel(form.textModel);
              }
              if (typeof form.imageModel === "string") {
                setImageModel(form.imageModel);
              }
              const nextRenderImages = sanitizeRenderImages(form.renderImages);
              if (nextRenderImages) {
                setRenderImages(nextRenderImages);
              }
              if (typeof form.selfieDataUrl === "string") {
                setSelfieDataUrl(form.selfieDataUrl);
              } else {
                setSelfieDataUrl(undefined);
              }
              if (typeof form.selfieName === "string") {
                setSelfieName(form.selfieName);
              }

              if (story.pitchInputSignature === null) {
                setPitchInputSignature(null);
              } else if (typeof story.pitchInputSignature === "string") {
                setPitchInputSignature(story.pitchInputSignature);
              }

              const hasValidPitchResult = isPathForgerPitchResult(story.pitchOnlyResult);
              if (hasValidPitchResult) {
                setPitchOnlyResult(story.pitchOnlyResult);
                didRestorePitchFromPersistedStateRef.current = true;
              }

              const hasValidChapterResult = isValidChapterResult(story.chapterOnlyResult);
              if (hasValidChapterResult) {
                setChapterOnlyResult(story.chapterOnlyResult);
                didRestoreChapterFromPersistedStateRef.current = true;
                setPendingRestoredChapterImageRefresh(true);
                useDevSampleForHydratedImageRestoreRef.current = DEV_MODE;
              }

              const hasPersistedStoryInProgress =
                hasValidPitchResult ||
                hasValidChapterResult ||
                (isRecord(story.forgedOutcomes) &&
                  (typeof story.forgedOutcomes.A === "string" ||
                    typeof story.forgedOutcomes.B === "string"));
              shouldAutoShowCreateStoryPanel = !hasPersistedStoryInProgress;

              setImagePromptDrafts(sanitizeImagePromptMap(story.imagePromptDrafts));
              setImagePromptOverrides(sanitizeImagePromptMap(story.imagePromptOverrides));

              if (
                story.activeOptionBranch === null ||
                story.activeOptionBranch === "A" ||
                story.activeOptionBranch === "B"
              ) {
                setActiveOptionBranch(story.activeOptionBranch);
              }

              if (isRecord(story.revealedOptionBranches)) {
                const revealedA = story.revealedOptionBranches.A;
                const revealedB = story.revealedOptionBranches.B;
                if (typeof revealedA === "boolean" && typeof revealedB === "boolean") {
                  setRevealedOptionBranches({ A: revealedA, B: revealedB });
                }
              }

              if (isRecord(story.optionRevealTick)) {
                const tickA = story.optionRevealTick.A;
                const tickB = story.optionRevealTick.B;
                if (typeof tickA === "number" && typeof tickB === "number") {
                  setOptionRevealTick({
                    A: Number.isFinite(tickA) ? tickA : 0,
                    B: Number.isFinite(tickB) ? tickB : 0,
                  });
                }
              }

              if (isRecord(story.forgedOutcomes)) {
                const nextForgedOutcomes: Partial<Record<PathForgerBranchChoice, string>> = {};
                if (typeof story.forgedOutcomes.A === "string") {
                  nextForgedOutcomes.A = story.forgedOutcomes.A;
                }
                if (typeof story.forgedOutcomes.B === "string") {
                  nextForgedOutcomes.B = story.forgedOutcomes.B;
                }
                setForgedOutcomes(nextForgedOutcomes);
              }

              if (typeof story.journeyTabValue === "string") {
                setJourneyTabValue(story.journeyTabValue);
              }

              if (
                isRecord(story.lastForgedLedgerTransition) &&
                typeof story.lastForgedLedgerTransition.chapterNumber === "number" &&
                typeof story.lastForgedLedgerTransition.previousMarkdown === "string" &&
                typeof story.lastForgedLedgerTransition.nextMarkdown === "string"
              ) {
                setLastForgedLedgerTransition({
                  chapterNumber: story.lastForgedLedgerTransition.chapterNumber,
                  previousMarkdown: story.lastForgedLedgerTransition.previousMarkdown,
                  nextMarkdown: story.lastForgedLedgerTransition.nextMarkdown,
                });
              }

              if (hasValidChapterResult) {
                setCreateStoryPanelOpen(false);
                setChapterModalOpen(true);
                setContinueModalOpen(false);
                setChapterOutcomeModalOpen(false);
              }
            }
          }
        } catch {
          // Ignore malformed storage values.
        }
      }

      if (shouldAutoShowCreateStoryPanel) {
        setCreateStoryPanelOpen(true);
      }

      didHydratePersistedStateRef.current = true;
      if (!isCancelled) {
        setReady(true);
      }
    };

    void hydratePersistedState();
    return () => {
      isCancelled = true;
    };
  }, [
    selectedPitchRef,
    setActiveOptionBranch,
    setAdventureLength,
    setAgeRating,
    setPersonalizedImages,
    setAllowPermanentDeath,
    setChapterModalOpen,
    setChapterOnlyResult,
    setContinueModalOpen,
    setCreateStoryPanelOpen,
    setDangerLevel,
    setDefaultModel,
    setGenre,
    setImageModel,
    setImagePromptDrafts,
    setImagePromptOverrides,
    setJourneyTabValue,
    setLastForgedLedgerTransition,
    setOptionRevealTick,
    setPitchInputSignature,
    setPitchOnlyResult,
    setPremise,
    setRecentGeneratedPremises,
    setRecentGeneratedProtagonistNames,
    setRenderImages,
    setRevealedOptionBranches,
    setRomanceMode,
    setSelectedBranch,
    setSelectedPitch,
    setSelfieDataUrl,
    setSelfieName,
    setTextModel,
    setTone,
    setVisualStyle,
    setForgedOutcomes,
    setProtagonistPreference,
    setChapterOutcomeModalOpen,
    setReady,
    setApiKeyReady,
    setDraftKey,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if (didRestorePitchFromPersistedStateRef.current || pitchOnlyResult) {
      return;
    }

    try {
      const cachedRaw = window.localStorage.getItem(pitchCacheStorageKey);
      if (!cachedRaw) {
        return;
      }

      const parsed: unknown = JSON.parse(cachedRaw);
      if (!isPathForgerPitchResult(parsed)) {
        return;
      }

      setPitchOnlyResult(parsed);
      setPitchInputSignature(createStoryInputSignature);
    } catch {
      // Ignore malformed storage values.
    }
  }, [createStoryInputSignature, pitchOnlyResult, setPitchInputSignature, setPitchOnlyResult]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !ready) {
      return;
    }
    if (!didHydratePersistedStateRef.current) {
      return;
    }

    const persistedState: PathForgerPersistedStateV1 = {
      version: 1,
      form: {
        genre,
        tone,
        dangerLevel,
        adventureLength,
        protagonistPreference,
        recentGeneratedProtagonistNames,
        recentGeneratedPremises,
        premise,
        visualStyle,
        romanceMode,
        allowPermanentDeath,
        ageRating,
        personalizedImages,
        selectedPitch,
        selectedBranch,
        defaultModel,
        textModel,
        imageModel,
        renderImages,
        selfieDataUrl,
        selfieName,
      },
      story: {
        pitchInputSignature,
        pitchOnlyResult,
        chapterOnlyResult,
        imagePromptDrafts,
        imagePromptOverrides,
        activeOptionBranch,
        revealedOptionBranches,
        optionRevealTick,
        forgedOutcomes,
        journeyTabValue,
        lastForgedLedgerTransition,
      },
    };

    try {
      window.localStorage.setItem(pathForgerStateStorageKey, JSON.stringify(persistedState));
    } catch {
      // Ignore storage write failures (quota, privacy mode, etc.).
    }
  }, [
    activeOptionBranch,
    adventureLength,
    ageRating,
    allowPermanentDeath,
    chapterOnlyResult,
    dangerLevel,
    defaultModel,
    forgedOutcomes,
    genre,
    imageModel,
    imagePromptDrafts,
    imagePromptOverrides,
    journeyTabValue,
    lastForgedLedgerTransition,
    optionRevealTick,
    personalizedImages,
    pitchInputSignature,
    pitchOnlyResult,
    premise,
    protagonistPreference,
    ready,
    recentGeneratedPremises,
    recentGeneratedProtagonistNames,
    renderImages,
    revealedOptionBranches,
    romanceMode,
    selectedBranch,
    selectedPitch,
    selfieDataUrl,
    selfieName,
    textModel,
    tone,
    visualStyle,
  ]);

  React.useEffect(() => {
    if (!ready || !apiKeyReady) {
      return;
    }
    if (!didRestoreChapterFromPersistedStateRef.current) {
      return;
    }
    if (!pendingRestoredChapterImageRefresh) {
      return;
    }
    if (!didHydratePersistedStateRef.current) {
      return;
    }
    if (didRegenerateHydratedImagesRef.current) {
      return;
    }
    if (!chapterOnlyResult) {
      return;
    }
    if (isRunning || isGeneratingChapterImages) {
      return;
    }

    const hasAnyRenderedImage =
      Boolean(result?.images.cover) ||
      Boolean(result?.images.chapterSpread) ||
      Boolean(result?.images.choicePreviewA) ||
      Boolean(result?.images.choicePreviewB) ||
      Boolean(result?.images.outcomeA) ||
      Boolean(result?.images.outcomeB);
    if (hasAnyRenderedImage) {
      didRegenerateHydratedImagesRef.current = true;
      setPendingRestoredChapterImageRefresh(false);
      return;
    }

    const restoredPitchResult =
      pitchOnlyResult ?? buildFallbackPitchResultFromChapter(chapterOnlyResult, selectedPitch);
    if (!pitchOnlyResult) {
      setPitchOnlyResult(restoredPitchResult);
    }

    if (DEV_MODE && useDevSampleForHydratedImageRestoreRef.current) {
      useDevSampleForHydratedImageRestoreRef.current = false;
      didRegenerateHydratedImagesRef.current = true;
      setPendingRestoredChapterImageRefresh(false);
      clearStatusMessages();
      enqueueStatusMessage("Restoring chapter visuals from dev samples...");
      setIsRunning(true);
      setActiveRunAction("chapter");
      setIsGeneratingChapterImages(true);

      const sampleImages = buildDevSampleImages({
        chapter: chapterOnlyResult,
        renderImages,
      });

      setResult((prev) => {
        const baseResult =
          prev ??
          ({
            pitches: restoredPitchResult,
            chapter: chapterOnlyResult,
            selectedPitch:
              selectedPitch === "auto" ? restoredPitchResult.recommendedPitch : selectedPitch,
            images: {},
            imageErrors: {},
            textModel,
            imageModel,
          } as PathForgerPipelineResult);

        return {
          ...baseResult,
          images: {
            ...baseResult.images,
            ...sampleImages,
          },
          imageErrors: {},
        };
      });

      clearStatusMessages();
      setIsGeneratingChapterImages(false);
      setIsRunning(false);
      setActiveRunAction(null);
      return;
    }

    const apiKey = getPathForgerOpenAIKey().trim();
    if (!apiKey) {
      return;
    }

    didRegenerateHydratedImagesRef.current = true;
    setPendingRestoredChapterImageRefresh(false);
    clearStatusMessages();
    enqueueStatusMessage("Restoring chapter visuals...");
    setIsRunning(true);
    setActiveRunAction("chapter");
    const imageRunId = chapterImageGenerationRunIdRef.current + 1;
    chapterImageGenerationRunIdRef.current = imageRunId;
    setIsGeneratingChapterImages(true);

    void (async () => {
      try {
        const onboardingPayload = buildOnboardingPayload();
        const canUsePersonalizedImages =
          onboardingPayload.personalizedImages && Boolean(selfieDataUrl);
        const restoredSelectedPitch =
          selectedPitch === "auto" ? restoredPitchResult.recommendedPitch : selectedPitch;
        const restoredSelectedPitchTitle =
          restoredPitchResult.pitches.find((pitch) => pitch.id === restoredSelectedPitch)?.title ??
          restoredPitchResult.adventureTitle;
        const imageStageResult = await runPathForgerImageStage(
          {
            apiKey,
            onboarding: {
              ...onboardingPayload,
              personalizedImages: canUsePersonalizedImages,
            },
            imagePrompts: chapterOnlyResult.imagePrompts,
            coverTitle: restoredSelectedPitchTitle,
            selectedBranch: selectedBranch || undefined,
            selfieDataUrl: canUsePersonalizedImages ? selfieDataUrl : undefined,
            defaultModel: resolvedDefaultModel,
            imageModel,
            imagePromptOverrides,
            renderImages,
          },
          (progress) => {
            if (chapterImageGenerationRunIdRef.current !== imageRunId) {
              return;
            }
            enqueueStatusMessage(progress.message);
          },
          (update) => {
            if (chapterImageGenerationRunIdRef.current !== imageRunId) {
              return;
            }

            setResult((prev) => {
              const baseResult =
                prev ??
                ({
                  pitches: restoredPitchResult,
                  chapter: chapterOnlyResult,
                  selectedPitch:
                    selectedPitch === "auto" ? restoredPitchResult.recommendedPitch : selectedPitch,
                  images: {},
                  imageErrors: {},
                  textModel,
                  imageModel,
                } as PathForgerPipelineResult);

              if (update.status === "success" && update.image) {
                const nextImageErrors = { ...baseResult.imageErrors };
                delete nextImageErrors[update.type];

                return {
                  ...baseResult,
                  images: {
                    ...baseResult.images,
                    [update.type]: update.image,
                  },
                  imageErrors: nextImageErrors,
                };
              }

              if (update.status === "error") {
                return {
                  ...baseResult,
                  imageErrors: {
                    ...baseResult.imageErrors,
                    [update.type]: update.errorMessage ?? "Image generation failed.",
                  },
                };
              }

              return baseResult;
            });
          },
        );

        if (chapterImageGenerationRunIdRef.current !== imageRunId) {
          return;
        }

        setImagePromptDrafts(imageStageResult.resolvedImagePrompts);
        setResult((prev) => {
          const baseResult =
            prev ??
            ({
              pitches: restoredPitchResult,
              chapter: chapterOnlyResult,
              selectedPitch:
                selectedPitch === "auto" ? restoredPitchResult.recommendedPitch : selectedPitch,
              images: {},
              imageErrors: {},
              textModel,
              imageModel,
            } as PathForgerPipelineResult);

          return {
            ...baseResult,
            chapter: {
              ...baseResult.chapter,
              imagePrompts: imageStageResult.resolvedImagePrompts,
            },
            images: {
              ...baseResult.images,
              ...imageStageResult.images,
            },
            imageErrors: imageStageResult.imageErrors,
            imageModel: imageStageResult.imageModel,
          };
        });
      } catch (error) {
        if (chapterImageGenerationRunIdRef.current !== imageRunId) {
          return;
        }

        setErrorMessage(
          error instanceof Error ? error.message : "Restoring chapter images failed.",
        );
      } finally {
        if (chapterImageGenerationRunIdRef.current !== imageRunId) {
          return;
        }

        clearStatusMessages();
        setIsGeneratingChapterImages(false);
        setIsRunning(false);
        setActiveRunAction(null);
      }
    })();
  }, [
    apiKeyReady,
    buildOnboardingPayload,
    chapterImageGenerationRunIdRef,
    chapterOnlyResult,
    clearStatusMessages,
    enqueueStatusMessage,
    imageModel,
    imagePromptOverrides,
    isGeneratingChapterImages,
    isRunning,
    pendingRestoredChapterImageRefresh,
    personalizedImages,
    pitchOnlyResult,
    ready,
    renderImages,
    resolvedDefaultModel,
    result?.images.chapterSpread,
    result?.images.choicePreviewA,
    result?.images.choicePreviewB,
    result?.images.cover,
    result?.images.outcomeA,
    result?.images.outcomeB,
    selectedBranch,
    selectedPitch,
    selfieDataUrl,
    setErrorMessage,
    setIsRunning,
    setActiveRunAction,
    setImagePromptDrafts,
    setPitchOnlyResult,
    setIsGeneratingChapterImages,
    setResult,
    setPendingRestoredChapterImageRefresh,
    textModel,
  ]);
}
