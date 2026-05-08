import * as React from "react";
import {
  DEV_MODE,
  pathForgerRecoveryTimelineLimit,
  pathForgerRecoveryTimelineStorageKey,
  pathForgerSaveSlotLimit,
  pathForgerSaveSlotsStorageKey,
  pathForgerStateStorageKey,
  pitchCacheStorageKey,
} from "@/app/pathforger/_consts/consts";
import {
  getPathForgerOpenAIKey,
  getPathForgerOpenAIKeyForInterstitial,
} from "@/app/pathforger/_utils/openAIKey";
import { isPathForgerPitchResult } from "@/app/pathforger/_utils/pitchHelpers";
import { runPathForgerImageStage } from "@/app/pathforger/_utils/pipeline";
import type {
  PathForgerBranchChoice,
  PathForgerPipelineResult,
} from "@/app/pathforger/_types/pipeline";
import type {
  PathForgerCreateSaveSlotOptions,
  PathForgerPersistedEnvelopeV2,
  PathForgerPersistedStateV1,
  PathForgerRecoveryTimelineEntry,
  PathForgerResumeConflict,
  PathForgerSaveSlot,
  UsePathForgerPersistenceArgs,
  UsePathForgerPersistenceResult,
} from "@/app/pathforger/_types/persistence";
import {
  adventureLengthValues,
  buildAutoCheckpointSignature,
  buildCheckpointLabel,
  buildDevSampleImages,
  buildFallbackPitchResultFromChapter,
  createPersistenceId,
  dangerLevelValues,
  extractPersistedStateSnapshot,
  isValidChapterResult,
  loadDevSampleStorageArtifactIfNeeded,
  romanceModeValues,
  sanitizeDefaultModel,
  sanitizeImageModel,
  sanitizeImagePromptMap,
  isRecord,
  isStringArray,
  sanitizeRecoveryTimeline,
  sanitizeRenderImages,
  sanitizeSaveSlots,
  sanitizeTextModel,
} from "@/app/pathforger/_utils/persistenceHelpers";

export function usePathForgerPersistence(
  args: UsePathForgerPersistenceArgs,
): UsePathForgerPersistenceResult {
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
    openHydratedChapterFlow,
    openCreateStoryFlow,
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
  const sessionIdRef = React.useRef(createPersistenceId("pathforger-session"));
  const revisionRef = React.useRef(0);
  const lastAutoCheckpointSignatureRef = React.useRef("");
  const incomingEnvelopeRef = React.useRef<PathForgerPersistedEnvelopeV2 | null>(null);
  const [saveSlots, setSaveSlots] = React.useState<PathForgerSaveSlot[]>([]);
  const [recoveryTimeline, setRecoveryTimeline] = React.useState<PathForgerRecoveryTimelineEntry[]>(
    [],
  );
  const [resumeConflict, setResumeConflict] = React.useState<PathForgerResumeConflict | null>(null);

  const buildPersistedState = React.useCallback(
    (): PathForgerPersistedStateV1 => ({
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
    }),
    [
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
    ],
  );

  React.useEffect(() => {
    let isCancelled = false;

    const hydratePersistedState = async () => {
      const key = getPathForgerOpenAIKeyForInterstitial();
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
          const saveSlotsRaw = window.localStorage.getItem(pathForgerSaveSlotsStorageKey);
          if (saveSlotsRaw) {
            const parsedSlots: unknown = JSON.parse(saveSlotsRaw);
            setSaveSlots(sanitizeSaveSlots(parsedSlots));
          }

          const recoveryTimelineRaw = window.localStorage.getItem(
            pathForgerRecoveryTimelineStorageKey,
          );
          if (recoveryTimelineRaw) {
            const parsedTimeline: unknown = JSON.parse(recoveryTimelineRaw);
            setRecoveryTimeline(sanitizeRecoveryTimeline(parsedTimeline));
          }

          const persistedRaw = window.localStorage.getItem(pathForgerStateStorageKey);
          if (persistedRaw) {
            const parsedUnknown: unknown = JSON.parse(persistedRaw);
            const extracted = extractPersistedStateSnapshot(parsedUnknown);
            if (extracted) {
              const persisted = extracted.state;
              if (
                extracted.envelope &&
                Number.isFinite(extracted.envelope.revision) &&
                extracted.envelope.revision > revisionRef.current
              ) {
                revisionRef.current = extracted.envelope.revision;
              }
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
                setDefaultModel(sanitizeDefaultModel(form.defaultModel));
              }
              if (typeof form.textModel === "string") {
                setTextModel(sanitizeTextModel(form.textModel));
              }
              if (typeof form.imageModel === "string") {
                setImageModel(sanitizeImageModel(form.imageModel));
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
                openHydratedChapterFlow();
              }
            }
          }
        } catch {
          // Ignore malformed storage values.
        }
      }

      if (shouldAutoShowCreateStoryPanel) {
        openCreateStoryFlow();
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
    setChapterOnlyResult,
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
    openCreateStoryFlow,
    openHydratedChapterFlow,
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

    const persistedState = buildPersistedState();
    revisionRef.current += 1;
    const envelope: PathForgerPersistedEnvelopeV2 = {
      version: 2,
      sessionId: sessionIdRef.current,
      revision: revisionRef.current,
      updatedAt: Date.now(),
      state: persistedState,
    };

    try {
      window.localStorage.setItem(pathForgerStateStorageKey, JSON.stringify(envelope));
    } catch {
      // Ignore storage write failures (quota, privacy mode, etc.).
    }

    const hasStoryCheckpoint =
      Boolean(persistedState.story.pitchOnlyResult) ||
      Boolean(persistedState.story.chapterOnlyResult) ||
      Boolean(persistedState.story.forgedOutcomes.A) ||
      Boolean(persistedState.story.forgedOutcomes.B);
    if (!hasStoryCheckpoint) {
      return;
    }

    const checkpointSignature = buildAutoCheckpointSignature(persistedState);
    if (checkpointSignature === lastAutoCheckpointSignatureRef.current) {
      return;
    }

    lastAutoCheckpointSignatureRef.current = checkpointSignature;
    setRecoveryTimeline((current) => {
      const entry: PathForgerRecoveryTimelineEntry = {
        id: createPersistenceId("pathforger-checkpoint"),
        createdAt: Date.now(),
        label: buildCheckpointLabel(persistedState),
        reason: "auto-checkpoint",
        chapterNumber: persistedState.story.chapterOnlyResult?.chapterNumber ?? null,
        selectedPitch: persistedState.form.selectedPitch,
        snapshot: persistedState,
      };
      const next: PathForgerRecoveryTimelineEntry[] = [entry, ...current].slice(
        0,
        pathForgerRecoveryTimelineLimit,
      );
      return next;
    });
  }, [buildPersistedState, ready]);

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

  React.useEffect(() => {
    if (typeof window === "undefined" || !ready) {
      return;
    }
    if (!didHydratePersistedStateRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(pathForgerSaveSlotsStorageKey, JSON.stringify(saveSlots));
    } catch {
      // Ignore storage write failures.
    }
  }, [ready, saveSlots]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !ready) {
      return;
    }
    if (!didHydratePersistedStateRef.current) {
      return;
    }

    try {
      window.localStorage.setItem(
        pathForgerRecoveryTimelineStorageKey,
        JSON.stringify(recoveryTimeline),
      );
    } catch {
      // Ignore storage write failures.
    }
  }, [ready, recoveryTimeline]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== pathForgerStateStorageKey || !event.newValue) {
        return;
      }

      try {
        const parsedUnknown: unknown = JSON.parse(event.newValue);
        const extracted = extractPersistedStateSnapshot(parsedUnknown);
        if (!extracted?.envelope) {
          return;
        }

        if (extracted.envelope.sessionId === sessionIdRef.current) {
          return;
        }

        if (extracted.envelope.revision <= revisionRef.current) {
          return;
        }

        incomingEnvelopeRef.current = extracted.envelope;
        setResumeConflict({
          incomingUpdatedAt: extracted.envelope.updatedAt,
          incomingRevision: extracted.envelope.revision,
          incomingSessionId: extracted.envelope.sessionId,
        });
      } catch {
        // Ignore malformed cross-tab storage payloads.
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const persistCurrentStateEnvelope = React.useCallback(
    (stateOverride?: PathForgerPersistedStateV1): PathForgerPersistedEnvelopeV2 | null => {
      if (typeof window === "undefined") {
        return null;
      }

      const state = stateOverride ?? buildPersistedState();
      revisionRef.current += 1;
      const envelope: PathForgerPersistedEnvelopeV2 = {
        version: 2,
        sessionId: sessionIdRef.current,
        revision: revisionRef.current,
        updatedAt: Date.now(),
        state,
      };

      try {
        window.localStorage.setItem(pathForgerStateStorageKey, JSON.stringify(envelope));
      } catch {
        return null;
      }

      return envelope;
    },
    [buildPersistedState],
  );

  const createSaveSlot = React.useCallback(
    (name: string, options?: PathForgerCreateSaveSlotOptions) => {
      const snapshot = buildPersistedState();
      const trimmedName = name.trim();
      const overwriteTarget = options?.overwriteSlotId
        ? (saveSlots.find((candidate) => candidate.id === options.overwriteSlotId) ?? null)
        : null;
      const slotName = trimmedName || overwriteTarget?.name || `Save ${saveSlots.length + 1}`;
      const now = Date.now();

      setSaveSlots((current) =>
        (overwriteTarget
          ? [
              {
                ...overwriteTarget,
                name: slotName,
                updatedAt: now,
                revision: revisionRef.current,
                snapshot,
              },
              ...current.filter((slot) => slot.id !== overwriteTarget.id),
            ]
          : [
              {
                id: createPersistenceId("pathforger-slot"),
                name: slotName,
                createdAt: now,
                updatedAt: now,
                revision: revisionRef.current,
                snapshot,
              },
              ...current,
            ]
        ).slice(0, pathForgerSaveSlotLimit),
      );

      setRecoveryTimeline((current) => {
        const entry: PathForgerRecoveryTimelineEntry = {
          id: createPersistenceId("pathforger-timeline"),
          createdAt: now,
          label: `${overwriteTarget ? "Overwrote slot" : "Saved slot"} · ${slotName}`,
          reason: "save-slot",
          chapterNumber: snapshot.story.chapterOnlyResult?.chapterNumber ?? null,
          selectedPitch: snapshot.form.selectedPitch,
          snapshot,
        };

        return [entry, ...current].slice(0, pathForgerRecoveryTimelineLimit);
      });
    },
    [buildPersistedState, saveSlots],
  );

  const restoreSnapshotAndReload = React.useCallback(
    (
      snapshot: PathForgerPersistedStateV1,
      label: string,
      reason: PathForgerRecoveryTimelineEntry["reason"],
    ) => {
      if (typeof window === "undefined") {
        return;
      }

      setResumeConflict(null);
      incomingEnvelopeRef.current = null;
      const now = Date.now();
      const envelope = persistCurrentStateEnvelope(snapshot);
      if (!envelope) {
        return;
      }

      const timelineEntry: PathForgerRecoveryTimelineEntry = {
        id: createPersistenceId("pathforger-timeline"),
        createdAt: now,
        label,
        reason,
        chapterNumber: snapshot.story.chapterOnlyResult?.chapterNumber ?? null,
        selectedPitch: snapshot.form.selectedPitch,
        snapshot,
      };
      const nextTimeline = [timelineEntry, ...recoveryTimeline].slice(
        0,
        pathForgerRecoveryTimelineLimit,
      );
      setRecoveryTimeline(nextTimeline);

      try {
        window.localStorage.setItem(
          pathForgerRecoveryTimelineStorageKey,
          JSON.stringify(nextTimeline),
        );
      } catch {
        // Ignore storage write failures.
      }

      try {
        if (snapshot.story.pitchOnlyResult) {
          window.localStorage.setItem(
            pitchCacheStorageKey,
            JSON.stringify(snapshot.story.pitchOnlyResult),
          );
        } else {
          window.localStorage.removeItem(pitchCacheStorageKey);
        }
      } catch {
        // Ignore storage write failures.
      }

      window.location.reload();
    },
    [persistCurrentStateEnvelope, recoveryTimeline],
  );

  const restoreSaveSlot = React.useCallback(
    (slotId: string) => {
      const slot = saveSlots.find((candidate) => candidate.id === slotId);
      if (!slot) return;
      restoreSnapshotAndReload(slot.snapshot, `Restored slot · ${slot.name}`, "restore-slot");
    },
    [restoreSnapshotAndReload, saveSlots],
  );

  const deleteSaveSlot = React.useCallback(
    (slotId: string) => setSaveSlots((current) => current.filter((slot) => slot.id !== slotId)),
    [],
  );

  const restoreTimelineEntry = React.useCallback(
    (entryId: string) => {
      const entry = recoveryTimeline.find((candidate) => candidate.id === entryId);
      if (!entry) return;
      restoreSnapshotAndReload(
        entry.snapshot,
        `Restored timeline · ${entry.label}`,
        "restore-timeline",
      );
    },
    [recoveryTimeline, restoreSnapshotAndReload],
  );
  const clearRecoveryTimeline = React.useCallback(() => setRecoveryTimeline([]), []);
  const acceptIncomingResumeConflict = React.useCallback(() => {
    const incoming = incomingEnvelopeRef.current;
    if (!incoming || typeof window === "undefined") return;
    setResumeConflict(null);
    restoreSnapshotAndReload(incoming.state, "Resumed incoming session", "resume-conflict");
  }, [restoreSnapshotAndReload]);
  const keepLocalResumeState = React.useCallback(() => {
    setResumeConflict(null);
    incomingEnvelopeRef.current = null;
    void persistCurrentStateEnvelope();
  }, [persistCurrentStateEnvelope]);

  return {
    saveSlots,
    recoveryTimeline,
    resumeConflict,
    createSaveSlot,
    restoreSaveSlot,
    deleteSaveSlot,
    restoreTimelineEntry,
    clearRecoveryTimeline,
    acceptIncomingResumeConflict,
    keepLocalResumeState,
  };
}
