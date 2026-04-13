import * as React from "react";
import {
  initialOptionRevealState,
  initialOptionRevealTick,
} from "@/app/pathforger/_consts/consts";
import { getPathForgerOpenAIKey } from "@/app/pathforger/_utils/openAIKey";
import { buildPitchCoverCacheKey } from "@/app/pathforger/_utils/pitchHelpers";
import {
  runPathForgerChapterCoreStage,
  runPathForgerCoverFromPitchStage,
  runPathForgerImageStage,
  runPathForgerPitchStage,
  runPathForgerPipeline,
} from "@/app/pathforger/_utils/pipeline";
import {
  PathForgerBranchChoice,
  PathForgerImageType,
  PathForgerGeneratedImage,
  PathForgerPipelineResult,
  PathForgerPitchResult,
  PathForgerChapterResult,
} from "../_types/pipeline";
import { PathForgerPitchChoice } from "../_types/pitch";

type ActiveRunAction =
  | "name"
  | "premise"
  | "style"
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
  adventureLength:
    | "Very short (1-2 lines)"
    | "Short"
    | "Medium"
    | "Long"
    | "Very long";
  protagonistPreference: string;
  premise: string;
  visualStyle: string;
  romanceMode: "No romance" | "Optional romance" | "Romance-forward";
  allowPermanentDeath: boolean;
  personalizedImages: boolean;
  ageRating: string;
};

type UsePathForgerPitchChapterActionsArgs = {
  buildOnboardingPayload: () => OnboardingPayload;
  resolvedDefaultModel: string;
  textModel: string;
  imageModel: string;
  selectedPitch: "auto" | PathForgerPitchChoice;
  selectedPitchRef: React.MutableRefObject<"auto" | PathForgerPitchChoice>;
  selectedBranch: "" | PathForgerBranchChoice;
  selfieDataUrl?: string;
  renderImages: Record<PathForgerImageType, boolean>;
  imagePromptOverrides: Partial<Record<PathForgerImageType, string>>;
  coverImageByPitchKey: Record<string, PathForgerGeneratedImage>;
  result: PathForgerPipelineResult | null;
  visiblePitches: PathForgerPitchResult | null;
  visibleChapter: PathForgerChapterResult | null;
  activeOptionBranch: PathForgerBranchChoice | null;
  forgedOutcomes: Partial<Record<PathForgerBranchChoice, string>>;
  createStoryInputSignature: string;

  chapterImageGenerationRunIdRef: React.MutableRefObject<number>;
  coverImageGenerationRunIdRef: React.MutableRefObject<number>;

  enqueueStatusMessage: (message: string) => void;
  clearStatusMessages: () => void;

  setApiKeyReady: (value: boolean) => void;
  setErrorMessage: (value: string) => void;
  setIsGeneratingChapterImages: (value: boolean) => void;
  setActiveOptionBranch: React.Dispatch<
    React.SetStateAction<PathForgerBranchChoice | null>
  >;
  setRevealedOptionBranches: React.Dispatch<
    React.SetStateAction<Record<PathForgerBranchChoice, boolean>>
  >;
  setOptionRevealTick: React.Dispatch<
    React.SetStateAction<Record<PathForgerBranchChoice, number>>
  >;
  setForgedOutcomes: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerBranchChoice, string>>>
  >;
  setForgedOutcomeImages: React.Dispatch<
    React.SetStateAction<
      Partial<Record<PathForgerBranchChoice, PathForgerGeneratedImage>>
    >
  >;
  setIsRunning: (value: boolean) => void;
  setActiveRunAction: (value: ActiveRunAction) => void;
  setPitchOnlyResult: (value: PathForgerPitchResult | null) => void;
  setPitchInputSignature: (value: string | null) => void;
  setSelectedPitch: (value: "auto" | PathForgerPitchChoice) => void;
  setPitchModalOpen: (value: boolean) => void;
  setChapterOnlyResult: React.Dispatch<
    React.SetStateAction<PathForgerChapterResult | null>
  >;
  setImagePromptDrafts: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerImageType, string>>>
  >;
  setImagePromptOverrides: React.Dispatch<
    React.SetStateAction<Partial<Record<PathForgerImageType, string>>>
  >;
  setSelectedBranch: React.Dispatch<
    React.SetStateAction<"" | PathForgerBranchChoice>
  >;
  setContinueModalOpen: (value: boolean) => void;
  setChapterOutcomeModalOpen: (value: boolean) => void;
  setResult: React.Dispatch<
    React.SetStateAction<PathForgerPipelineResult | null>
  >;
  setCoverImageByPitchKey: React.Dispatch<
    React.SetStateAction<Record<string, PathForgerGeneratedImage>>
  >;
};

export function usePathForgerPitchChapterActions(
  args: UsePathForgerPitchChapterActionsArgs,
) {
  const {
    buildOnboardingPayload,
    resolvedDefaultModel,
    textModel,
    imageModel,
    selectedPitch,
    selectedPitchRef,
    selectedBranch,
    selfieDataUrl,
    renderImages,
    imagePromptOverrides,
    coverImageByPitchKey,
    result,
    visiblePitches,
    visibleChapter,
    activeOptionBranch,
    forgedOutcomes,
    createStoryInputSignature,
    chapterImageGenerationRunIdRef,
    coverImageGenerationRunIdRef,
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
    setPitchModalOpen,
    setChapterOnlyResult,
    setImagePromptDrafts,
    setImagePromptOverrides,
    setSelectedBranch,
    setContinueModalOpen,
    setChapterOutcomeModalOpen,
    setResult,
    setCoverImageByPitchKey,
  } = args;

  const resolveCurrentPitchSelection = (
    pitches: PathForgerPitchResult,
  ): PathForgerPitchChoice => {
    const currentSelection = selectedPitchRef.current;
    return currentSelection === "auto"
      ? pitches.recommendedPitch
      : currentSelection;
  };

  const handlePitchMe = async (options?: { forceRefresh?: boolean }) => {
    const forceRefresh = options?.forceRefresh ?? false;
    setErrorMessage("");
    clearStatusMessages();
    chapterImageGenerationRunIdRef.current += 1;
    setIsGeneratingChapterImages(false);

    if (!forceRefresh && visiblePitches) {
      const resolvedPitchChoice = resolveCurrentPitchSelection(visiblePitches);
      setSelectedPitch(resolvedPitchChoice);
      selectedPitchRef.current = resolvedPitchChoice;
      setPitchModalOpen(true);
      return;
    }

    const apiKey = getPathForgerOpenAIKey().trim();
    if (!apiKey) {
      setErrorMessage("OpenAI API key is required.");
      setApiKeyReady(false);
      return;
    }

    const onboardingPayload = buildOnboardingPayload();
    if (!onboardingPayload.premise.trim()) {
      setErrorMessage("Please provide a premise to start the story pipeline.");
      return;
    }

    setActiveOptionBranch(null);
    setRevealedOptionBranches(initialOptionRevealState);
    setOptionRevealTick(initialOptionRevealTick);
    setForgedOutcomes({});
    setForgedOutcomeImages({});
    setIsRunning(true);
    setActiveRunAction("pitch");

    try {
      const pitchStageResult = await runPathForgerPitchStage(
        {
          apiKey,
          onboarding: onboardingPayload,
          defaultModel: resolvedDefaultModel,
          textModel,
        },
        (progress) => {
          enqueueStatusMessage(progress.message);
        },
      );

      setPitchOnlyResult(pitchStageResult.pitches);
      setPitchInputSignature(createStoryInputSignature);
      const resolvedPitchChoice = resolveCurrentPitchSelection(
        pitchStageResult.pitches,
      );
      setSelectedPitch(resolvedPitchChoice);
      selectedPitchRef.current = resolvedPitchChoice;
      setPitchModalOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Pitch generation failed.",
      );
    } finally {
      clearStatusMessages();
      setIsRunning(false);
      setActiveRunAction(null);
    }
  };

  const handleGenerateChapterPackageForPitch = async (
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
  ) => {
    setErrorMessage("");
    clearStatusMessages();
    chapterImageGenerationRunIdRef.current += 1;
    coverImageGenerationRunIdRef.current += 1;
    setIsGeneratingChapterImages(false);

    const apiKey = getPathForgerOpenAIKey().trim();
    if (!apiKey) {
      setErrorMessage("OpenAI API key is required.");
      setApiKeyReady(false);
      return;
    }

    const onboardingPayload = buildOnboardingPayload();
    if (!onboardingPayload.premise.trim()) {
      setErrorMessage("Please provide a premise to start the story pipeline.");
      return;
    }

    const chapterNumber = options?.chapterNumber ?? 1;
    const selectedBranchForGeneration =
      (options?.selectedBranch ?? selectedBranch) || undefined;
    const targetCoverKey = buildPitchCoverCacheKey({
      pitchResult: pitchSource,
      selectedPitch: pitchChoice,
    });
    const currentResultCoverKey = result
      ? buildPitchCoverCacheKey({
          pitchResult: result.pitches,
          selectedPitch: result.selectedPitch,
        })
      : "";
    const carriedCoverImage =
      coverImageByPitchKey[targetCoverKey] ??
      (currentResultCoverKey === targetCoverKey
        ? result?.images.cover
        : undefined);
    let resolvedCoverForPitch = carriedCoverImage;
    let backgroundImagesStarted = false;

    setIsRunning(true);
    setActiveRunAction(options?.activeRunAction ?? "chapter");
    setResult(null);
    setChapterOnlyResult(null);

    const shouldGenerateCoverFromPitch =
      renderImages.cover && !resolvedCoverForPitch;
    if (shouldGenerateCoverFromPitch) {
      const coverRunId = coverImageGenerationRunIdRef.current;
      void (async () => {
        try {
          const coverResult = await runPathForgerCoverFromPitchStage({
            apiKey,
            onboarding: onboardingPayload,
            pitchResult: pitchSource,
            selectedPitch: pitchChoice,
            defaultModel: resolvedDefaultModel,
            imageModel,
            selfieDataUrl,
          });

          if (coverImageGenerationRunIdRef.current !== coverRunId) {
            return;
          }

          resolvedCoverForPitch = coverResult.image;
          setCoverImageByPitchKey((prev) => ({
            ...prev,
            [targetCoverKey]: coverResult.image,
          }));
          setResult((prev) =>
            prev
              ? (() => {
                  const nextImageErrors = { ...prev.imageErrors };
                  delete nextImageErrors.cover;
                  return {
                    ...prev,
                    images: {
                      ...prev.images,
                      cover: coverResult.image,
                    },
                    imageErrors: nextImageErrors,
                    imageModel: coverResult.imageModel,
                  };
                })()
              : prev,
          );
        } catch (error) {
          if (coverImageGenerationRunIdRef.current !== coverRunId) {
            return;
          }

          setResult((prev) =>
            prev
              ? {
                  ...prev,
                  imageErrors: {
                    ...prev.imageErrors,
                    cover:
                      error instanceof Error
                        ? error.message
                        : "Cover image generation failed.",
                  },
                }
              : prev,
          );
        }
      })();
    }

    try {
      const chapterStageResult = await runPathForgerChapterCoreStage(
        {
          apiKey,
          onboarding: onboardingPayload,
          pitchResult: pitchSource,
          selectedPitch: pitchChoice,
          selectedBranch: selectedBranchForGeneration,
          chapterNumber,
          previousChapterMarkdown: options?.previousChapterMarkdown,
          previousOutcomeMarkdown: options?.previousOutcomeMarkdown,
          currentPathLedgerMarkdown: options?.currentPathLedgerMarkdown,
          defaultModel: resolvedDefaultModel,
          textModel,
        },
        (progress) => {
          enqueueStatusMessage(progress.message);
        },
      );

      setSelectedPitch(chapterStageResult.selectedPitch);
      selectedPitchRef.current = chapterStageResult.selectedPitch;
      setChapterOnlyResult(chapterStageResult.chapter);
      setImagePromptDrafts(chapterStageResult.chapter.imagePrompts);
      setImagePromptOverrides({});
      setActiveOptionBranch(null);
      setSelectedBranch(
        options?.resetBranchSelection
          ? ""
          : (selectedBranchForGeneration ?? ""),
      );
      setRevealedOptionBranches(initialOptionRevealState);
      setOptionRevealTick(initialOptionRevealTick);
      setForgedOutcomes({});
      setForgedOutcomeImages({});
      setContinueModalOpen(false);
      setChapterOutcomeModalOpen(false);
      setResult({
        pitches: pitchSource,
        chapter: chapterStageResult.chapter,
        selectedPitch: chapterStageResult.selectedPitch,
        images: resolvedCoverForPitch ? { cover: resolvedCoverForPitch } : {},
        imageErrors: {},
        textModel: chapterStageResult.textModel,
        imageModel,
      });

      const imageRunId = chapterImageGenerationRunIdRef.current + 1;
      chapterImageGenerationRunIdRef.current = imageRunId;
      setIsGeneratingChapterImages(true);
      backgroundImagesStarted = true;

      void (async () => {
        try {
          const imageStageResult = await runPathForgerImageStage(
            {
              apiKey,
              onboarding: onboardingPayload,
              imagePrompts: chapterStageResult.chapter.imagePrompts,
              selectedBranch: selectedBranchForGeneration,
              selfieDataUrl,
              defaultModel: resolvedDefaultModel,
              imageModel,
              imagePromptOverrides: {},
              renderImages: {
                ...renderImages,
                cover: false,
              },
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
                if (!prev) {
                  return prev;
                }

                if (update.status === "success" && update.image) {
                  const nextImageErrors = { ...prev.imageErrors };
                  delete nextImageErrors[update.type];

                  return {
                    ...prev,
                    images: {
                      ...prev.images,
                      [update.type]: update.image,
                    },
                    imageErrors: nextImageErrors,
                  };
                }

                if (update.status === "error") {
                  return {
                    ...prev,
                    imageErrors: {
                      ...prev.imageErrors,
                      [update.type]:
                        update.errorMessage ?? "Image generation failed.",
                    },
                  };
                }

                return prev;
              });
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
          if (chapterImageGenerationRunIdRef.current !== imageRunId) {
            return;
          }

          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Background image generation failed.",
          );
        } finally {
          if (chapterImageGenerationRunIdRef.current !== imageRunId) {
            return;
          }

          clearStatusMessages();
          setIsGeneratingChapterImages(false);
        }
      })();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Chapter package generation failed.",
      );
    } finally {
      if (!backgroundImagesStarted) {
        clearStatusMessages();
      }
      setIsRunning(false);
      setActiveRunAction(null);
    }
  };

  const handleGenerateNextChapter = async () => {
    if (!visiblePitches || !visibleChapter || !activeOptionBranch) {
      return;
    }

    const currentPitchSelection = resolveCurrentPitchSelection(visiblePitches);
    const resolvedOutcomeMarkdown = forgedOutcomes[activeOptionBranch]?.trim();

    if (!resolvedOutcomeMarkdown) {
      setErrorMessage(
        `Please forge Option ${activeOptionBranch} before continuing.`,
      );
      return;
    }

    setChapterOutcomeModalOpen(false);

    await handleGenerateChapterPackageForPitch(
      currentPitchSelection,
      visiblePitches,
      {
        activeRunAction: "nextChapter",
        chapterNumber: visibleChapter.chapterNumber + 1,
        selectedBranch: activeOptionBranch,
        previousChapterMarkdown: visibleChapter.chapterMarkdown,
        previousOutcomeMarkdown: resolvedOutcomeMarkdown,
        currentPathLedgerMarkdown: visibleChapter.pathLedgerMarkdown,
        resetBranchSelection: true,
      },
    );
  };

  const handlePitchModalOk = async () => {
    setPitchModalOpen(false);

    if (!visiblePitches) {
      return;
    }

    const currentPitchSelection = resolveCurrentPitchSelection(visiblePitches);

    await handleGenerateChapterPackageForPitch(
      currentPitchSelection,
      visiblePitches,
    );
  };

  const handleRunPipeline = async () => {
    setErrorMessage("");
    setResult(null);
    setChapterOnlyResult(null);
    clearStatusMessages();
    chapterImageGenerationRunIdRef.current += 1;
    coverImageGenerationRunIdRef.current += 1;
    setIsGeneratingChapterImages(false);
    setRevealedOptionBranches(initialOptionRevealState);
    setOptionRevealTick(initialOptionRevealTick);
    setForgedOutcomes({});
    setForgedOutcomeImages({});

    const apiKey = getPathForgerOpenAIKey().trim();
    if (!apiKey) {
      setErrorMessage("OpenAI API key is required.");
      setApiKeyReady(false);
      return;
    }

    const onboardingPayload = buildOnboardingPayload();
    if (!onboardingPayload.premise.trim()) {
      setErrorMessage("Please provide a premise to start the story pipeline.");
      return;
    }

    if (onboardingPayload.personalizedImages && !selfieDataUrl) {
      setErrorMessage(
        "Personalized images are enabled. Please upload a selfie/headshot or disable personalization.",
      );
      return;
    }

    setIsRunning(true);
    setActiveRunAction("pipeline");

    try {
      const pipelineResult = await runPathForgerPipeline(
        {
          apiKey,
          onboarding: onboardingPayload,
          selectedPitch: selectedPitch === "auto" ? undefined : selectedPitch,
          selectedBranch: selectedBranch || undefined,
          selfieDataUrl,
          defaultModel: resolvedDefaultModel,
          textModel,
          imageModel,
          imagePromptOverrides,
          renderImages,
        },
        (progress) => {
          enqueueStatusMessage(progress.message);
        },
      );

      setResult(pipelineResult);
      setPitchOnlyResult(pipelineResult.pitches);
      setPitchInputSignature(createStoryInputSignature);
      setImagePromptDrafts(pipelineResult.chapter.imagePrompts);
      setImagePromptOverrides({});
      setSelectedPitch(pipelineResult.selectedPitch);
      selectedPitchRef.current = pipelineResult.selectedPitch;
      setActiveOptionBranch(selectedBranch || null);
      if (pipelineResult.images.cover) {
        const coverKey = buildPitchCoverCacheKey({
          pitchResult: pipelineResult.pitches,
          selectedPitch: pipelineResult.selectedPitch,
        });
        setCoverImageByPitchKey((prev) => ({
          ...prev,
          [coverKey]: pipelineResult.images.cover as PathForgerGeneratedImage,
        }));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "PathForger pipeline failed.",
      );
    } finally {
      clearStatusMessages();
      setIsRunning(false);
      setActiveRunAction(null);
    }
  };

  const handleSelectPitchFromModal = (pitchChoice: PathForgerPitchChoice) => {
    setSelectedPitch(pitchChoice);
    selectedPitchRef.current = pitchChoice;
  };

  return {
    handlePitchMe,
    handleGenerateChapterPackageForPitch,
    handleGenerateNextChapter,
    handlePitchModalOk,
    handleRunPipeline,
    handleSelectPitchFromModal,
    resolveCurrentPitchSelection,
  };
}
