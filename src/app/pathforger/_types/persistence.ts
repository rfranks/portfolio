import * as React from "react";
import type {
  PathForgerBranchChoice,
  PathForgerChapterResult,
  PathForgerImageType,
  PathForgerPipelineResult,
  PathForgerPitchResult,
} from "@/app/pathforger/_types/pipeline";
import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";

export type BranchRevealState = Record<PathForgerBranchChoice, boolean>;
export type BranchRevealTickState = Record<PathForgerBranchChoice, number>;
export type ActiveRunAction =
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

export type OnboardingPayload = {
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

export type PathForgerPersistedStateV1 = {
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

export type PathForgerPersistedEnvelopeV2 = {
  version: 2;
  sessionId: string;
  revision: number;
  updatedAt: number;
  state: PathForgerPersistedStateV1;
};

export type PathForgerRecoveryReason =
  | "auto-checkpoint"
  | "save-slot"
  | "restore-slot"
  | "restore-timeline"
  | "resume-conflict";

export type PathForgerRecoveryTimelineEntry = {
  id: string;
  createdAt: number;
  label: string;
  reason: PathForgerRecoveryReason;
  chapterNumber: number | null;
  selectedPitch: "auto" | PathForgerPitchChoice;
  snapshot: PathForgerPersistedStateV1;
};

export type PathForgerSaveSlot = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  revision: number;
  snapshot: PathForgerPersistedStateV1;
};

export type PathForgerCreateSaveSlotOptions = {
  overwriteSlotId?: string;
};

export type PathForgerResumeConflict = {
  incomingUpdatedAt: number;
  incomingRevision: number;
  incomingSessionId: string;
};

export type UsePathForgerPersistenceArgs = {
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
  openHydratedChapterFlow: () => void;
  openCreateStoryFlow: () => void;
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

export type UsePathForgerPersistenceResult = {
  saveSlots: PathForgerSaveSlot[];
  recoveryTimeline: PathForgerRecoveryTimelineEntry[];
  resumeConflict: PathForgerResumeConflict | null;
  createSaveSlot: (name: string, options?: PathForgerCreateSaveSlotOptions) => void;
  restoreSaveSlot: (slotId: string) => void;
  deleteSaveSlot: (slotId: string) => void;
  restoreTimelineEntry: (entryId: string) => void;
  clearRecoveryTimeline: () => void;
  acceptIncomingResumeConflict: () => void;
  keepLocalResumeState: () => void;
};
