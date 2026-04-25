import * as React from "react";
import { initialOptionRevealState, initialOptionRevealTick } from "@/app/pathforger/_consts/consts";
import type { ActiveRunAction } from "@/app/pathforger/_types/persistence";
import type {
  PathForgerBranchChoice,
  PathForgerChapterResult,
  PathForgerGeneratedImage,
  PathForgerImageType,
  PathForgerPipelineResult,
  PathForgerPitchResult,
} from "@/app/pathforger/_types/pipeline";
import type {
  PathForgerPipelineReplayCheckpoint,
  PathForgerPipelineRunDiagnostics,
} from "@/app/pathforger/_types/pipelineRunInspector";
import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";
import { getPathForgerOpenAIKey } from "@/app/pathforger/_utils/openAIKey";
import { runPathForgerImageStage } from "@/app/pathforger/_utils/pipeline";
import { buildPitchCoverCacheKey } from "@/app/pathforger/_utils/pitchHelpers";

type ReplayHandlerArgs = {
  buildOnboardingPayload: () => {
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
  normalizeOnboardingForPipeline: (
    payload: ReturnType<ReplayHandlerArgs["buildOnboardingPayload"]>,
  ) => ReturnType<ReplayHandlerArgs["buildOnboardingPayload"]>;
  resolvedDefaultModel: string;
  imageModel: string;
  selfieDataUrl?: string;
  renderImages: Record<PathForgerImageType, boolean>;
  coverImageByPitchKey: Record<string, PathForgerGeneratedImage>;
  createStoryInputSignature: string;
  chapterImageGenerationRunIdRef: React.MutableRefObject<number>;
  selectedPitchRef: React.MutableRefObject<"auto" | PathForgerPitchChoice>;
  handleGenerateChapterPackageForPitch: (
    pitchChoice: PathForgerPitchChoice,
    pitchSource: PathForgerPitchResult,
    options?: {
      activeRunAction?: "chapter" | "nextChapter";
      chapterNumber?: number;
      selectedBranch?: PathForgerBranchChoice;
      previousChapterMarkdown?: string;
      previousOutcomeMarkdown?: string;
      currentPathLedgerMarkdown?: string;
      resetBranchSelection?: boolean;
    },
  ) => Promise<boolean>;
  enqueueStatusMessage: (message: string) => void;
  clearStatusMessages: () => void;
  setApiKeyReady: (value: boolean) => void;
  setErrorMessage: (value: string) => void;
  setIsGeneratingChapterImages: (value: boolean) => void;
  setActiveOptionBranch: React.Dispatch<React.SetStateAction<PathForgerBranchChoice | null>>;
  setRevealedOptionBranches: React.Dispatch<
    React.SetStateAction<Record<PathForgerBranchChoice, boolean>>
  >;
  setOptionRevealTick: React.Dispatch<React.SetStateAction<Record<PathForgerBranchChoice, number>>>;
  setForgedOutcomes: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerBranchChoice, string>>>
  >;
  setForgedOutcomeImages: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerBranchChoice, PathForgerGeneratedImage>>>
  >;
  setIsRunning: (value: boolean) => void;
  setActiveRunAction: (value: ActiveRunAction) => void;
  setPitchOnlyResult: (value: PathForgerPitchResult | null) => void;
  setPitchInputSignature: (value: string | null) => void;
  setSelectedPitch: (value: "auto" | PathForgerPitchChoice) => void;
  setChapterOnlyResult: React.Dispatch<React.SetStateAction<PathForgerChapterResult | null>>;
  setImagePromptDrafts: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerImageType, string>>>
  >;
  setImagePromptOverrides: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerImageType, string>>>
  >;
  setSelectedBranch: React.Dispatch<React.SetStateAction<"" | PathForgerBranchChoice>>;
  setContinueModalOpen: (value: boolean) => void;
  setChapterOutcomeModalOpen: (value: boolean) => void;
  setResult: React.Dispatch<React.SetStateAction<PathForgerPipelineResult | null>>;
};

export function usePathForgerReplayFromCheckpoint(args: ReplayHandlerArgs) {
  const {
    buildOnboardingPayload,
    normalizeOnboardingForPipeline,
    resolvedDefaultModel,
    imageModel,
    selfieDataUrl,
    renderImages,
    coverImageByPitchKey,
    createStoryInputSignature,
    chapterImageGenerationRunIdRef,
    selectedPitchRef,
    handleGenerateChapterPackageForPitch,
    enqueueStatusMessage,
    clearStatusMessages,
    setApiKeyReady,
    setErrorMessage,
    setIsGeneratingChapterImages,
    setActiveOptionBranch,
    setRevealedOptionBranches,
    setOptionRevealTick,
    setForgedOutcomes,
    setForgedOutcomeImages,
    setIsRunning,
    setActiveRunAction,
    setPitchOnlyResult,
    setPitchInputSignature,
    setSelectedPitch,
    setChapterOnlyResult,
    setImagePromptDrafts,
    setImagePromptOverrides,
    setSelectedBranch,
    setContinueModalOpen,
    setChapterOutcomeModalOpen,
    setResult,
  } = args;

  return React.useCallback(
    async (
      checkpoint: PathForgerPipelineReplayCheckpoint,
      runDiagnostics: PathForgerPipelineRunDiagnostics,
    ) => {
      const apiKey = getPathForgerOpenAIKey().trim();
      if (!apiKey) {
        setErrorMessage("OpenAI API key is required.");
        setApiKeyReady(false);
        return;
      }

      if (checkpoint.stageKey === "loadKnowledge") {
        setErrorMessage("Knowledge checkpoint cannot be replayed directly.");
        return;
      }

      if (checkpoint.stageKey === "generatePitches") {
        if (!checkpoint.pitches) {
          setErrorMessage("Checkpoint is missing pitch data.");
          return;
        }

        const selectedPitchFromCheckpoint =
          checkpoint.selectedPitch ?? checkpoint.pitches.recommendedPitch;
        await handleGenerateChapterPackageForPitch(
          selectedPitchFromCheckpoint,
          checkpoint.pitches,
          {
            activeRunAction: "chapter",
            selectedBranch: checkpoint.selectedBranch,
          },
        );
        return;
      }

      if (!checkpoint.chapter || !checkpoint.pitches || !checkpoint.selectedPitch) {
        setErrorMessage("Checkpoint is missing chapter replay data.");
        return;
      }

      const onboardingPayload = normalizeOnboardingForPipeline(buildOnboardingPayload());
      if (!onboardingPayload.premise) {
        setErrorMessage("Please provide a premise to replay this checkpoint.");
        return;
      }

      setErrorMessage("");
      clearStatusMessages();
      chapterImageGenerationRunIdRef.current += 1;
      setIsGeneratingChapterImages(true);
      setIsRunning(true);
      setActiveRunAction("chapter");

      setPitchOnlyResult(checkpoint.pitches);
      setPitchInputSignature(createStoryInputSignature);
      setSelectedPitch(checkpoint.selectedPitch);
      selectedPitchRef.current = checkpoint.selectedPitch;
      setChapterOnlyResult(checkpoint.chapter);
      setImagePromptDrafts(checkpoint.chapter.imagePrompts);
      setImagePromptOverrides({});
      setSelectedBranch(checkpoint.selectedBranch ?? "");
      setActiveOptionBranch(checkpoint.selectedBranch ?? null);
      setRevealedOptionBranches(initialOptionRevealState);
      setOptionRevealTick(initialOptionRevealTick);
      setForgedOutcomes({});
      setForgedOutcomeImages({});
      setContinueModalOpen(false);
      setChapterOutcomeModalOpen(false);

      const coverCacheKey = buildPitchCoverCacheKey({
        pitchResult: checkpoint.pitches,
        selectedPitch: checkpoint.selectedPitch,
      });
      const cachedCoverImage = coverImageByPitchKey[coverCacheKey];

      setResult({
        pitches: checkpoint.pitches,
        chapter: checkpoint.chapter,
        selectedPitch: checkpoint.selectedPitch,
        images: cachedCoverImage ? { cover: cachedCoverImage } : {},
        imageErrors: {},
        textModel: runDiagnostics.resolvedTextModel,
        imageModel: runDiagnostics.resolvedImageModel,
      });

      const imageRunId = chapterImageGenerationRunIdRef.current;

      try {
        const imageStageResult = await runPathForgerImageStage(
          {
            apiKey,
            onboarding: onboardingPayload,
            imagePrompts: checkpoint.chapter.imagePrompts,
            selectedBranch: checkpoint.selectedBranch,
            selfieDataUrl,
            defaultModel: resolvedDefaultModel,
            imageModel,
            imagePromptOverrides: {},
            renderImages,
          },
          (progress) => {
            if (chapterImageGenerationRunIdRef.current !== imageRunId) {
              return;
            }
            enqueueStatusMessage(progress.message);
          },
        );

        if (chapterImageGenerationRunIdRef.current !== imageRunId) {
          return;
        }

        setImagePromptDrafts(imageStageResult.resolvedImagePrompts);
        setResult((prev) =>
          prev
            ? {
                ...prev,
                chapter: {
                  ...prev.chapter,
                  imagePrompts: imageStageResult.resolvedImagePrompts,
                },
                images: {
                  ...prev.images,
                  ...imageStageResult.images,
                },
                imageErrors: imageStageResult.imageErrors,
                imageModel: imageStageResult.imageModel,
              }
            : prev,
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to replay PathForger checkpoint.",
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
    },
    [
      buildOnboardingPayload,
      chapterImageGenerationRunIdRef,
      clearStatusMessages,
      coverImageByPitchKey,
      createStoryInputSignature,
      enqueueStatusMessage,
      handleGenerateChapterPackageForPitch,
      imageModel,
      normalizeOnboardingForPipeline,
      renderImages,
      resolvedDefaultModel,
      selfieDataUrl,
      selectedPitchRef,
      setActiveOptionBranch,
      setActiveRunAction,
      setApiKeyReady,
      setChapterOnlyResult,
      setChapterOutcomeModalOpen,
      setContinueModalOpen,
      setErrorMessage,
      setForgedOutcomeImages,
      setForgedOutcomes,
      setImagePromptDrafts,
      setImagePromptOverrides,
      setIsGeneratingChapterImages,
      setIsRunning,
      setOptionRevealTick,
      setPitchInputSignature,
      setPitchOnlyResult,
      setResult,
      setRevealedOptionBranches,
      setSelectedBranch,
      setSelectedPitch,
    ],
  );
}
