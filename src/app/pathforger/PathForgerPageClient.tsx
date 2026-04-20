"use client";

import * as React from "react";
import {
  Alert,
  AppBar,
  Box,
  Container,
  CssBaseline,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { ArrowBack, AutoStories } from "@mui/icons-material";
import { ThemeProvider } from "@mui/material/styles";
import { OpenAIKeyInterstitialContent } from "@/components/shared";
import { portfolioApps } from "@/consts/resumeData";
import { withBasePath } from "@/utils/basePath";
import PathForgerDialogController from "@/app/pathforger/_components/PathForgerDialogController";
import PathForgerPanelController from "@/app/pathforger/_components/PathForgerPanelController";
import PathForgerSnackbar from "@/app/pathforger/_components/PathForgerSnackbar";
import PathForgerToolbar from "@/app/pathforger/_components/PathForgerToolbar";
import { usePathForgerDerivedState } from "@/app/pathforger/_hooks/usePathForgerDerivedState";
import { usePathForgerFormState } from "@/app/pathforger/_hooks/usePathForgerFormState";
import { usePathForgerGenerationActions } from "@/app/pathforger/_hooks/usePathForgerGenerationActions";
import { usePathForgerNextChapterLedgerPlayback } from "@/app/pathforger/_hooks/usePathForgerNextChapterLedgerPlayback";
import { usePathForgerPersistence } from "@/app/pathforger/_hooks/usePathForgerPersistence";
import { usePathForgerPitchChapterActions } from "@/app/pathforger/_hooks/usePathForgerPitchChapterActions";
import { useStatusMessageQueue } from "@/app/pathforger/_hooks/useStatusMessageQueue";
import { appTheme, kenBurnsImageSx } from "@/app/pathforger/_theme/theme";
import { sortModelIds } from "@/app/pathforger/_utils/modelOptions";
import {
  DEFAULT_IMAGE_MODEL_ID,
  DEFAULT_ONE_OFF_MODEL_ID,
  DEFAULT_TEXT_MODEL_ID,
  STATUS_SNACKBAR_MIN_MESSAGE_MS,
  defaultModelOptions,
  imageTypeLabels,
  imageTypeOrder,
  optionBranchOrder,
  pitchCacheStorageKey,
  pitchPanelBorderRadius,
} from "@/app/pathforger/_consts/consts";
import {
  getPathForgerOpenAIKey,
  setPathForgerOpenAIKey,
} from "@/app/pathforger/_utils/openAIKey";
import {
  runPathForgerOutcomeImageStage,
  runPathForgerPathLedgerUpdateStage,
} from "@/app/pathforger/_utils/pipeline";
import {
  PathForgerBranchChoice,
  PathForgerChapterResult,
  PathForgerGeneratedImage,
  PathForgerImageType,
  PathForgerPipelineResult,
} from "./_types/pipeline";
import { PathForgerPitchChoice } from "./_types/pitch";

type BranchRevealState = Record<PathForgerBranchChoice, boolean>;
type BranchRevealTickState = Record<PathForgerBranchChoice, number>;
type ForgedOutcomesState = Partial<Record<PathForgerBranchChoice, string>>;
type ForgedOutcomeImagesState = Partial<
  Record<PathForgerBranchChoice, PathForgerGeneratedImage>
>;

export default function PathForgerPageClient() {
  const [ready, setReady] = React.useState(false);
  const [apiKeyReady, setApiKeyReady] = React.useState(false);
  const [draftKey, setDraftKey] = React.useState("");
  const [keyError, setKeyError] = React.useState("");
  const keyInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    genre,
    setGenre,
    tone,
    setTone,
    dangerLevel,
    setDangerLevel,
    adventureLength,
    setAdventureLength,
    protagonistPreference,
    setProtagonistPreference,
    recentGeneratedProtagonistNames,
    setRecentGeneratedProtagonistNames,
    recentGeneratedPremises,
    setRecentGeneratedPremises,
    premise,
    setPremise,
    didAutoGeneratePremiseRef,
    visualStyle,
    setVisualStyle,
    didAutoGenerateStyleRef,
    didAutoGenerateToneRef,
    previousGenreRef,
    pendingGenreAutoRegenerate,
    setPendingGenreAutoRegenerate,
    pendingAgeRatingPremiseRegenerate,
    setPendingAgeRatingPremiseRegenerate,
    romanceMode,
    setRomanceMode,
    allowPermanentDeath,
    setAllowPermanentDeath,
    ageRating,
    setAgeRating,
    previousAgeRatingRef,
    personalizedImages,
    setPersonalizedImages,
    selectedPitch,
    setSelectedPitch,
    selectedPitchRef,
    selectedBranch,
    setSelectedBranch,
    defaultModel,
    setDefaultModel,
    textModel,
    setTextModel,
    imageModel,
    setImageModel,
    resolvedDefaultModel,
    modelOptions,
    setModelOptions,
    loadingModelOptions,
    setLoadingModelOptions,
    loadedModelOptions,
    setLoadedModelOptions,
    renderImages,
    setRenderImages,
    selfieDataUrl,
    setSelfieDataUrl,
    selfieName,
    setSelfieName,
    isRunning,
    setIsRunning,
    isGeneratingChapterImages,
    setIsGeneratingChapterImages,
    chapterImageGenerationRunIdRef,
    coverImageGenerationRunIdRef,
    activeRunAction,
    setActiveRunAction,
    errorMessage,
    setErrorMessage,
    coverImageByPitchKey,
    setCoverImageByPitchKey,
    pitchInputSignature,
    setPitchInputSignature,
    pitchOnlyResult,
    setPitchOnlyResult,
    chapterOnlyResult,
    setChapterOnlyResult,
    result,
    setResult,
    imagePromptDrafts,
    setImagePromptDrafts,
    imagePromptOverrides,
    setImagePromptOverrides,
    editingImagePromptType,
    setEditingImagePromptType,
    imagePromptEditorValue,
    setImagePromptEditorValue,
    activeOptionBranch,
    setActiveOptionBranch,
    revealedOptionBranches,
    setRevealedOptionBranches,
    optionRevealTick,
    setOptionRevealTick,
    forgedOutcomes,
    setForgedOutcomes,
    forgedOutcomeImages,
    setForgedOutcomeImages,
    createStoryInputSignature,
  } = usePathForgerFormState();

  const [pitchModalOpen, setPitchModalOpen] = React.useState(false);
  const [controlsModalOpen, setControlsModalOpen] = React.useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = React.useState(false);
  const [renderImageCallsModalOpen, setRenderImageCallsModalOpen] =
    React.useState(false);
  const [chapterModalOpen, setChapterModalOpen] = React.useState(false);
  const [continueModalOpen, setContinueModalOpen] = React.useState(false);
  const [chapterOutcomeModalOpen, setChapterOutcomeModalOpen] =
    React.useState(false);
  const [createStoryPanelOpen, setCreateStoryPanelOpen] = React.useState(false);
  const [hasCreateStoryFormBeenShown, setHasCreateStoryFormBeenShown] =
    React.useState(false);
  const [pathLedgerModalOpen, setPathLedgerModalOpen] = React.useState(false);
  const [journeyTabValue, setJourneyTabValue] = React.useState("");
  const [lastForgedLedgerTransition, setLastForgedLedgerTransition] =
    React.useState<{
      chapterNumber: number;
      previousMarkdown: string;
      nextMarkdown: string;
    } | null>(null);

  const chapterModalBodyScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [chapterModalReachedEnd, setChapterModalReachedEnd] =
    React.useState(false);

  const continueOptionsScrollRef = React.useRef<HTMLDivElement | null>(null);
  const continueOptionPanelRefs = React.useRef<
    Partial<Record<PathForgerBranchChoice, HTMLDivElement | null>>
  >({});

  const pitchListContainerRef = React.useRef<HTMLDivElement | null>(null);
  const pitchCardRefs = React.useRef<
    Partial<Record<PathForgerPitchChoice, HTMLDivElement | null>>
  >({});
  const [pitchSelectionOutline, setPitchSelectionOutline] = React.useState({
    top: 0,
    height: 0,
    opacity: 0,
  });

  const {
    statusMessage: progressMessage,
    enqueueStatusMessage,
    clearStatusMessages,
  } = useStatusMessageQueue(STATUS_SNACKBAR_MIN_MESSAGE_MS);

  const optionRevealAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const optionSelectAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const forgeSuccessAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const wandActionAudioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    selectedPitchRef.current = selectedPitch;
  }, [selectedPitch, selectedPitchRef]);

  const clearPitchCacheAndState = React.useCallback(() => {
    setPitchOnlyResult(null);
    setPitchInputSignature(null);
    setCoverImageByPitchKey({});
    setSelectedPitch("auto");
    selectedPitchRef.current = "auto";
    setPitchModalOpen(false);

    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.removeItem(pitchCacheStorageKey);
    } catch {
      // Ignore storage write failures.
    }
  }, [
    selectedPitchRef,
    setCoverImageByPitchKey,
    setPitchInputSignature,
    setPitchOnlyResult,
    setSelectedPitch,
  ]);

  const {
    visiblePitches,
    visibleChapter,
    branchChoiceA,
    branchChoiceB,
    coverImage,
    chapterSpreadImage,
    optionPanelImages,
    chapterModalTitle,
    chapterModalBodyMarkdown,
    visibleSelectedPitch,
    activePitchForModal,
    chapterModalPitchTitle,
    journeySnapshotFields,
    journeyTabPanels,
    activeJourneyPanel,
    outcomeModalChoiceLabel,
    statusIsRunning,
    showMainCreateSpinner,
    hideCreateStoryPanel,
    statusSnackbarOpen,
    statusSnackbarText,
    showPitchSelectionAnimation,
  } = usePathForgerDerivedState({
    pitchOnlyResult,
    chapterOnlyResult,
    result,
    selectedPitch,
    coverImageByPitchKey,
    activeOptionBranch,
    isRunning,
    isGeneratingChapterImages,
    activeRunAction,
    progressMessage,
    chapterModalOpen,
    continueModalOpen,
    chapterOutcomeModalOpen,
    pathLedgerModalOpen,
    journeyTabValue,
    setJourneyTabValue,
  });

  const openChapterModal = React.useCallback(() => {
    setCreateStoryPanelOpen(false);
    setChapterModalOpen(true);
  }, []);

  const {
    nextChapterLedgerPlayback,
    beginNextChapterLedgerPlayback,
    moveToPreviousPlaybackEntry,
    moveToNextPlaybackEntry,
    continueFromPlayback,
  } = usePathForgerNextChapterLedgerPlayback({
    visibleChapter,
    activeRunAction,
    isRunning,
    onOpenChapterModal: openChapterModal,
    lastForgedLedgerTransition,
  });

  const activeStoryTitle = React.useMemo(() => {
    const chapterTitle = chapterModalPitchTitle.trim();
    if (chapterTitle) {
      return chapterTitle;
    }

    const modalPitchTitle = activePitchForModal?.title?.trim();
    if (modalPitchTitle) {
      return modalPitchTitle;
    }

    if (visiblePitches) {
      const selectedPitchId =
        visibleSelectedPitch || visiblePitches.recommendedPitch;
      const selectedPitchTitle =
        visiblePitches.pitches
          .find((pitch) => pitch.id === selectedPitchId)
          ?.title?.trim() || "";
      if (selectedPitchTitle) {
        return selectedPitchTitle;
      }
    }

    return "Story Cover";
  }, [
    activePitchForModal?.title,
    chapterModalPitchTitle,
    visiblePitches,
    visibleSelectedPitch,
  ]);

  const getImagePromptForType = React.useCallback(
    (type: PathForgerImageType) => {
      const draft = imagePromptDrafts[type];
      if (typeof draft === "string") {
        return draft;
      }

      return visibleChapter?.imagePrompts[type] ?? "";
    },
    [imagePromptDrafts, visibleChapter],
  );

  const updatePitchSelectionOutline = React.useCallback(() => {
    if (!pitchModalOpen || !visiblePitches) {
      setPitchSelectionOutline((prev) =>
        prev.opacity === 0 ? prev : { ...prev, opacity: 0 },
      );
      return;
    }

    const activePitchId = (visibleSelectedPitch ||
      visiblePitches.recommendedPitch) as PathForgerPitchChoice;
    const container = pitchListContainerRef.current;
    const activeCard = pitchCardRefs.current[activePitchId];

    if (!container || !activeCard) {
      setPitchSelectionOutline((prev) =>
        prev.opacity === 0 ? prev : { ...prev, opacity: 0 },
      );
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    setPitchSelectionOutline({
      top: cardRect.top - containerRect.top,
      height: cardRect.height,
      opacity: 1,
    });
  }, [pitchModalOpen, visiblePitches, visibleSelectedPitch]);

  React.useLayoutEffect(() => {
    updatePitchSelectionOutline();
  }, [updatePitchSelectionOutline]);

  const playUiSound = React.useCallback(
    (audioRef: React.RefObject<HTMLAudioElement | null>) => {
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      audio.currentTime = 0;
      void audio.play().catch(() => {
        // Ignore autoplay-blocked audio failures.
      });
    },
    [],
  );

  const loadOpenAIModelOptions = React.useCallback(async () => {
    if (loadingModelOptions) {
      return;
    }

    const apiKey = getPathForgerOpenAIKey().trim();
    if (!apiKey) {
      setModelOptions(defaultModelOptions);
      return;
    }

    setLoadingModelOptions(true);
    try {
      const response = await fetch("https://api.openai.com/v1/models", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      const payload = (await response.json()) as {
        data?: Array<{ id?: unknown }>;
      };

      if (!response.ok) {
        throw new Error("Unable to load model list from OpenAI.");
      }

      const ids = Array.isArray(payload.data)
        ? payload.data
            .map((item) => (typeof item?.id === "string" ? item.id : ""))
            .filter((id) => id.trim().length > 0)
        : [];

      const nextOptions =
        ids.length > 0
          ? sortModelIds([...ids, ...defaultModelOptions])
          : defaultModelOptions;
      setModelOptions(nextOptions);
      setLoadedModelOptions(true);
    } catch {
      setModelOptions(defaultModelOptions);
      setLoadedModelOptions(false);
      setErrorMessage("Could not load exhaustive model list from OpenAI.");
    } finally {
      setLoadingModelOptions(false);
    }
  }, [
    loadingModelOptions,
    setErrorMessage,
    setLoadedModelOptions,
    setLoadingModelOptions,
    setModelOptions,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    optionRevealAudioRef.current = new Audio(withBasePath("/audio/whoosh.ogg"));
    optionSelectAudioRef.current = new Audio(
      withBasePath("/audio/select_004.ogg"),
    );
    forgeSuccessAudioRef.current = new Audio(
      withBasePath("/audio/confirmation_001.ogg"),
    );
    wandActionAudioRef.current = new Audio(withBasePath("/audio/powerUp8.ogg"));
    if (wandActionAudioRef.current) {
      wandActionAudioRef.current.volume = 0.6;
    }

    return () => {
      [
        optionRevealAudioRef.current,
        optionSelectAudioRef.current,
        forgeSuccessAudioRef.current,
        wandActionAudioRef.current,
      ].forEach((audio) => {
        if (!audio) {
          return;
        }

        audio.pause();
        audio.currentTime = 0;
      });
    };
  }, []);

  React.useEffect(() => {
    setActiveOptionBranch(selectedBranch || null);
  }, [selectedBranch, setActiveOptionBranch]);

  React.useEffect(() => {
    if (!chapterModalOpen || !visibleChapter) {
      setChapterModalReachedEnd(false);
      return;
    }

    const raf = window.requestAnimationFrame(() => {
      const node = chapterModalBodyScrollRef.current;
      if (!node) {
        setChapterModalReachedEnd(false);
        return;
      }

      const nearBottom =
        node.scrollTop + node.clientHeight >= node.scrollHeight - 10;
      setChapterModalReachedEnd(nearBottom);
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [chapterModalBodyMarkdown, chapterModalOpen, visibleChapter]);

  React.useEffect(() => {
    if (!pitchModalOpen) {
      return;
    }

    const handleResize = () => {
      updatePitchSelectionOutline();
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [pitchModalOpen, updatePitchSelectionOutline]);

  React.useEffect(() => {
    if (
      !createStoryPanelOpen ||
      chapterModalOpen ||
      continueModalOpen ||
      chapterOutcomeModalOpen
    ) {
      return;
    }

    setHasCreateStoryFormBeenShown((prev) => (prev ? prev : true));
  }, [
    chapterModalOpen,
    chapterOutcomeModalOpen,
    continueModalOpen,
    createStoryPanelOpen,
  ]);

  React.useEffect(() => {
    if (typeof window === "undefined" || !pitchOnlyResult) {
      return;
    }

    try {
      window.localStorage.setItem(
        pitchCacheStorageKey,
        JSON.stringify(pitchOnlyResult),
      );
    } catch {
      // Ignore storage write failures.
    }
  }, [pitchOnlyResult]);

  React.useEffect(() => {
    if (!pitchOnlyResult || !pitchInputSignature) {
      return;
    }

    if (pitchInputSignature === createStoryInputSignature) {
      return;
    }

    clearPitchCacheAndState();
  }, [
    clearPitchCacheAndState,
    createStoryInputSignature,
    pitchInputSignature,
    pitchOnlyResult,
  ]);

  React.useEffect(() => {
    document.title = portfolioApps.pathforger.documentTitle;
  }, []);

  React.useEffect(() => {
    if (ready && !apiKeyReady) {
      keyInputRef.current?.focus();
    }
  }, [apiKeyReady, ready]);

  React.useEffect(() => {
    if (!controlsModalOpen) {
      return;
    }
    if (loadedModelOptions) {
      return;
    }

    void loadOpenAIModelOptions();
  }, [controlsModalOpen, loadOpenAIModelOptions, loadedModelOptions]);

  const handleKeySubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = draftKey.trim();

    if (!trimmed) {
      setKeyError("OpenAI API key is required.");
      return;
    }

    setPathForgerOpenAIKey(trimmed);
    setLoadedModelOptions(false);
    setModelOptions(defaultModelOptions);
    setApiKeyReady(true);
    setKeyError("");
  };

  const handleToggleImageType = (type: PathForgerImageType) => {
    setRenderImages(
      (
        prev: Record<PathForgerImageType, boolean>,
      ): Record<PathForgerImageType, boolean> => ({
        ...prev,
        [type]: !prev[type],
      }),
    );
  };

  const handleSetAllImageTypes = (enabled: boolean) => {
    setRenderImages(
      imageTypeOrder.reduce<Record<PathForgerImageType, boolean>>(
        (acc, type) => {
          acc[type as PathForgerImageType] = enabled;
          return acc;
        },
        {} as Record<PathForgerImageType, boolean>,
      ),
    );
  };

  const handleOpenImagePromptEditor = (type: PathForgerImageType) => {
    setEditingImagePromptType(type);
    setImagePromptEditorValue(getImagePromptForType(type));
  };

  const handleCloseImagePromptEditor = () => {
    setEditingImagePromptType(null);
    setImagePromptEditorValue("");
  };

  const handleSelfieChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSelfieDataUrl(undefined);
      setSelfieName("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setErrorMessage(
        "Please choose an image file for the protagonist reference.",
      );
      return;
    }

    if (file.size > 6 * 1024 * 1024) {
      setErrorMessage(
        "Reference image is too large. Please use a file under 6MB.",
      );
      return;
    }

    setErrorMessage("");

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("Unable to load image."));
      };
      reader.onerror = () => reject(new Error("Unable to load image."));
      reader.readAsDataURL(file);
    }).catch((error) => {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load image.",
      );
      return "";
    });

    if (!dataUrl) {
      return;
    }

    setSelfieDataUrl(dataUrl);
    setSelfieName(file.name);
  };

  const buildOnboardingPayload = React.useCallback(
    () => ({
      genre,
      tone,
      dangerLevel,
      adventureLength,
      protagonistPreference:
        protagonistPreference.trim().length > 0
          ? protagonistPreference.trim()
          : "Auto-generate a name",
      premise,
      visualStyle,
      romanceMode,
      allowPermanentDeath,
      personalizedImages,
      ageRating,
    }),
    [
      adventureLength,
      ageRating,
      allowPermanentDeath,
      dangerLevel,
      genre,
      personalizedImages,
      premise,
      protagonistPreference,
      romanceMode,
      tone,
      visualStyle,
    ],
  );

  usePathForgerPersistence({
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
    renderImages: renderImages as Record<PathForgerImageType, boolean>,
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
    revealedOptionBranches: revealedOptionBranches as BranchRevealState,
    optionRevealTick: optionRevealTick as BranchRevealTickState,
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
    setRevealedOptionBranches: setRevealedOptionBranches as React.Dispatch<
      React.SetStateAction<BranchRevealState>
    >,
    setOptionRevealTick: setOptionRevealTick as React.Dispatch<
      React.SetStateAction<BranchRevealTickState>
    >,
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
  });

  const {
    handlePitchMe,
    handleGenerateNextChapter,
    handlePitchModalOk,
    handleRunPipeline,
    handleSelectPitchFromModal,
  } = usePathForgerPitchChapterActions({
    buildOnboardingPayload,
    resolvedDefaultModel,
    textModel,
    imageModel,
    selectedPitch,
    selectedPitchRef,
    selectedBranch,
    selfieDataUrl,
    renderImages: renderImages as Record<PathForgerImageType, boolean>,
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
    setRevealedOptionBranches: setRevealedOptionBranches as React.Dispatch<
      React.SetStateAction<BranchRevealState>
    >,
    setOptionRevealTick: setOptionRevealTick as React.Dispatch<
      React.SetStateAction<BranchRevealTickState>
    >,
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
  });

  const generation = usePathForgerGenerationActions({
    premise,
    setPremise,
    genre,
    tone,
    setTone,
    setVisualStyle,
    protagonistPreference,
    setProtagonistPreference,
    recentGeneratedProtagonistNames,
    setRecentGeneratedProtagonistNames,
    recentGeneratedPremises,
    setRecentGeneratedPremises,
    buildOnboardingPayload,
    resolvedDefaultModel,
    setApiKeyReady,
    setErrorMessage,
    clearStatusMessages,
    enqueueStatusMessage,
    playUiSound,
    wandActionAudioRef,
    setIsRunning,
    setActiveRunAction,
    imagePromptEditorValue,
    editingImagePromptType,
    setImagePromptDrafts,
    setImagePromptOverrides,
    setResult,
    setChapterOnlyResult,
    handleCloseImagePromptEditor,
  });

  React.useEffect(() => {
    if (!ready || !apiKeyReady) {
      return;
    }
    if (!hasCreateStoryFormBeenShown) {
      return;
    }
    if (didAutoGeneratePremiseRef.current) {
      return;
    }
    if (premise.trim().length > 0) {
      return;
    }

    didAutoGeneratePremiseRef.current = true;
    void generation.handleGeneratePremise();
  }, [
    apiKeyReady,
    didAutoGeneratePremiseRef,
    generation,
    hasCreateStoryFormBeenShown,
    premise,
    ready,
  ]);

  React.useEffect(() => {
    if (!ready || !apiKeyReady) {
      return;
    }
    if (!hasCreateStoryFormBeenShown) {
      return;
    }
    if (didAutoGenerateToneRef.current) {
      return;
    }
    if (isRunning) {
      return;
    }
    if (premise.trim().length === 0) {
      return;
    }
    if (tone.trim().length > 0) {
      return;
    }

    didAutoGenerateToneRef.current = true;
    void generation.handleGenerateTone();
  }, [
    apiKeyReady,
    didAutoGenerateToneRef,
    generation,
    hasCreateStoryFormBeenShown,
    isRunning,
    premise,
    ready,
    tone,
  ]);

  React.useEffect(() => {
    if (!ready || !apiKeyReady) {
      return;
    }
    if (!hasCreateStoryFormBeenShown) {
      return;
    }
    if (didAutoGenerateStyleRef.current) {
      return;
    }
    if (isRunning) {
      return;
    }
    if (premise.trim().length === 0) {
      return;
    }
    if (tone.trim().length === 0) {
      return;
    }
    if (visualStyle.trim().length > 0) {
      return;
    }

    didAutoGenerateStyleRef.current = true;
    void generation.handleGenerateVisualStyle();
  }, [
    apiKeyReady,
    didAutoGenerateStyleRef,
    generation,
    hasCreateStoryFormBeenShown,
    isRunning,
    premise,
    ready,
    tone,
    visualStyle,
  ]);

  React.useEffect(() => {
    if (!hasCreateStoryFormBeenShown) {
      previousGenreRef.current = genre;
      return;
    }
    if (previousGenreRef.current === genre) {
      return;
    }

    previousGenreRef.current = genre;
    setPendingGenreAutoRegenerate(true);
  }, [
    genre,
    hasCreateStoryFormBeenShown,
    previousGenreRef,
    setPendingGenreAutoRegenerate,
  ]);

  React.useEffect(() => {
    if (!hasCreateStoryFormBeenShown) {
      previousAgeRatingRef.current = ageRating;
      return;
    }
    if (previousAgeRatingRef.current === ageRating) {
      return;
    }

    previousAgeRatingRef.current = ageRating;
    setPendingAgeRatingPremiseRegenerate(true);
  }, [
    ageRating,
    hasCreateStoryFormBeenShown,
    previousAgeRatingRef,
    setPendingAgeRatingPremiseRegenerate,
  ]);

  React.useEffect(() => {
    if (!pendingGenreAutoRegenerate) {
      return;
    }
    if (!hasCreateStoryFormBeenShown) {
      return;
    }
    if (!ready || !apiKeyReady || isRunning) {
      return;
    }

    setPendingGenreAutoRegenerate(false);
    void (async () => {
      const generatedPremise = await generation.handleGeneratePremise();
      const generatedTone = await generation.runGenerateTone({
        premiseOverride: generatedPremise ?? undefined,
        visualStyleOverride: "",
      });
      await generation.runGenerateVisualStyle({
        premiseOverride: generatedPremise ?? undefined,
        toneOverride: generatedTone ?? undefined,
      });
    })();
  }, [
    apiKeyReady,
    generation,
    hasCreateStoryFormBeenShown,
    isRunning,
    pendingGenreAutoRegenerate,
    ready,
    setPendingGenreAutoRegenerate,
  ]);

  React.useEffect(() => {
    if (!pendingAgeRatingPremiseRegenerate) {
      return;
    }
    if (!hasCreateStoryFormBeenShown) {
      return;
    }
    if (pendingGenreAutoRegenerate) {
      setPendingAgeRatingPremiseRegenerate(false);
      return;
    }
    if (!ready || !apiKeyReady || isRunning) {
      return;
    }

    setPendingAgeRatingPremiseRegenerate(false);
    void generation.handleGeneratePremise();
  }, [
    apiKeyReady,
    generation,
    hasCreateStoryFormBeenShown,
    isRunning,
    pendingAgeRatingPremiseRegenerate,
    pendingGenreAutoRegenerate,
    ready,
    setPendingAgeRatingPremiseRegenerate,
  ]);

  const handleToggleChapterModal = () => {
    if (!visibleChapter) {
      return;
    }

    if (!chapterModalOpen) {
      setCreateStoryPanelOpen(false);
    }
    setChapterModalOpen((prev) => !prev);
  };

  const handleChapterModalBodyScroll = (
    event: React.UIEvent<HTMLDivElement, UIEvent>,
  ) => {
    const node = event.currentTarget;
    const nearBottom =
      node.scrollTop + node.clientHeight >= node.scrollHeight - 10;
    if (nearBottom) {
      setChapterModalReachedEnd(true);
    }
  };

  const handleOpenContinueModal = () => {
    if (!visibleChapter || !chapterModalReachedEnd) {
      return;
    }

    setCreateStoryPanelOpen(false);
    setChapterModalOpen(false);
    setChapterOutcomeModalOpen(false);
    setContinueModalOpen(true);
  };

  const scrollContinueOptionPanelIntoView = React.useCallback(
    (branch: PathForgerBranchChoice) => {
      const scrollContainer = continueOptionsScrollRef.current;
      const optionPanel = continueOptionPanelRefs.current[branch];

      if (!scrollContainer || !optionPanel) {
        return;
      }

      const containerRect = scrollContainer.getBoundingClientRect();
      const panelRect = optionPanel.getBoundingClientRect();
      const padding = 12;

      if (panelRect.top < containerRect.top + padding) {
        scrollContainer.scrollBy({
          top: panelRect.top - containerRect.top - padding,
          behavior: "smooth",
        });
        return;
      }

      if (panelRect.bottom > containerRect.bottom - padding) {
        scrollContainer.scrollBy({
          top: panelRect.bottom - containerRect.bottom + padding,
          behavior: "smooth",
        });
      }
    },
    [],
  );

  const handleSelectOptionPanel = (branch: PathForgerBranchChoice) => {
    const isFirstReveal = !revealedOptionBranches[branch];

    setActiveOptionBranch(branch);
    setSelectedBranch(branch);
    scrollContinueOptionPanelIntoView(branch);

    if (isFirstReveal) {
      setRevealedOptionBranches((prev: BranchRevealState) => ({
        ...prev,
        [branch]: true,
      }));
      setOptionRevealTick((prev: BranchRevealTickState) => ({
        ...prev,
        [branch]: prev[branch] + 1,
      }));
      window.setTimeout(() => {
        scrollContinueOptionPanelIntoView(branch);
      }, 280);
      playUiSound(optionRevealAudioRef);
      return;
    }

    playUiSound(optionSelectAudioRef);
  };

  const handleForgeMyPath = async () => {
    if (!activeOptionBranch || !visibleChapter) {
      return;
    }

    setErrorMessage("");
    clearStatusMessages();

    const branchToForge = activeOptionBranch;
    const outcomeType: PathForgerImageType =
      branchToForge === "A" ? "outcomeA" : "outcomeB";
    const selectedChoice = visibleChapter.choices.find(
      (choice) => choice.id === branchToForge,
    );
    if (!selectedChoice) {
      setErrorMessage(`Unable to resolve Option ${branchToForge} details.`);
      return;
    }
    const branchOutcomeMarkdown =
      branchToForge === "A"
        ? visibleChapter.outcomeAMarkdown
        : visibleChapter.outcomeBMarkdown;
    const previousPathLedgerMarkdown = visibleChapter.pathLedgerMarkdown;

    setIsRunning(true);
    setActiveRunAction("forgePath");

    try {
      setSelectedBranch(branchToForge);
      setForgedOutcomes((prev: ForgedOutcomesState) => ({
        ...prev,
        [branchToForge]: branchOutcomeMarkdown,
      }));

      const existingOutcomeImage =
        forgedOutcomeImages[branchToForge] ?? result?.images[outcomeType];

      if (existingOutcomeImage) {
        setForgedOutcomeImages((prev: ForgedOutcomeImagesState) => ({
          ...prev,
          [branchToForge]: existingOutcomeImage,
        }));
      } else if (
        (renderImages as Record<PathForgerImageType, boolean>)[outcomeType]
      ) {
        const apiKey = getPathForgerOpenAIKey().trim();
        if (!apiKey) {
          setErrorMessage("OpenAI API key is required.");
          setApiKeyReady(false);
          return;
        }

        if (personalizedImages && !selfieDataUrl) {
          setErrorMessage(
            "Personalized images are enabled. Please upload a selfie/headshot or disable personalization.",
          );
          return;
        }

        const outcomeImageResult = await runPathForgerOutcomeImageStage(
          {
            apiKey,
            onboarding: buildOnboardingPayload(),
            branch: branchToForge,
            outcomeMarkdown: branchOutcomeMarkdown,
            selectedChoiceLabel: selectedChoice.label,
            imagePrompts: visibleChapter.imagePrompts,
            defaultModel: resolvedDefaultModel,
            imageModel,
            selfieDataUrl,
            imagePromptOverrides: {
              outcomeA: imagePromptOverrides.outcomeA,
              outcomeB: imagePromptOverrides.outcomeB,
            },
          },
          (progress) => {
            enqueueStatusMessage(progress.message);
          },
        );

        setForgedOutcomeImages((prev: ForgedOutcomeImagesState) => ({
          ...prev,
          [branchToForge]: outcomeImageResult.image,
        }));

        setResult((prev: PathForgerPipelineResult | null) => {
          if (!prev) {
            return prev;
          }

          const remainingErrors = { ...prev.imageErrors };
          delete remainingErrors[outcomeImageResult.imageType];

          return {
            ...prev,
            images: {
              ...prev.images,
              [outcomeImageResult.imageType]: outcomeImageResult.image,
            },
            imageErrors: remainingErrors,
            imageModel: outcomeImageResult.imageModel,
          };
        });
      }

      const apiKey = getPathForgerOpenAIKey().trim();
      if (!apiKey) {
        setErrorMessage("OpenAI API key is required.");
        setApiKeyReady(false);
        return;
      }

      const ledgerUpdate = await runPathForgerPathLedgerUpdateStage(
        {
          apiKey,
          onboarding: buildOnboardingPayload(),
          chapterNumber: visibleChapter.chapterNumber,
          currentPathLedgerMarkdown: visibleChapter.pathLedgerMarkdown,
          selectedBranch: branchToForge,
          selectedChoiceLabel: selectedChoice.label,
          selectedChoiceDescription: selectedChoice.description,
          selectedChoiceRiskHudMarkdown: selectedChoice.riskHudMarkdown,
          outcomeMarkdown: branchOutcomeMarkdown,
          defaultModel: resolvedDefaultModel,
          textModel,
        },
        (progress) => {
          enqueueStatusMessage(progress.message);
        },
      );

      setChapterOnlyResult((prev: PathForgerChapterResult | null) =>
        prev
          ? {
              ...prev,
              pathLedgerMarkdown: ledgerUpdate.pathLedgerMarkdown,
            }
          : prev,
      );
      setResult((prev: PathForgerPipelineResult | null) =>
        prev
          ? {
              ...prev,
              chapter: {
                ...prev.chapter,
                pathLedgerMarkdown: ledgerUpdate.pathLedgerMarkdown,
              },
            }
          : prev,
      );
      setLastForgedLedgerTransition({
        chapterNumber: visibleChapter.chapterNumber,
        previousMarkdown: previousPathLedgerMarkdown,
        nextMarkdown: ledgerUpdate.pathLedgerMarkdown,
      });

      playUiSound(forgeSuccessAudioRef);
      setContinueModalOpen(false);
      setChapterOutcomeModalOpen(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Forge my path failed.",
      );
    } finally {
      clearStatusMessages();
      setIsRunning(false);
      setActiveRunAction(null);
    }
  };

  const handleGenerateNextChapterWithJourneyPlayback = React.useCallback(() => {
    setChapterModalOpen(false);
    setContinueModalOpen(false);
    setChapterOutcomeModalOpen(false);

    const armed = beginNextChapterLedgerPlayback();
    if (!armed) {
      return;
    }

    void handleGenerateNextChapter();
  }, [beginNextChapterLedgerPlayback, handleGenerateNextChapter]);

  const hasVisibleForgedOutcome =
    Boolean(activeOptionBranch) &&
    Boolean(forgedOutcomes[activeOptionBranch || "A"]?.trim());
  const showMainCreateSpinnerWithJourneyPlayback =
    showMainCreateSpinner || nextChapterLedgerPlayback.active;
  const showCreateStoryPanelForPlayback = nextChapterLedgerPlayback.active;
  const showCreateStoryPanel =
    createStoryPanelOpen || showCreateStoryPanelForPlayback;
  const createStoryPanelHidden =
    (hideCreateStoryPanel && !showCreateStoryPanelForPlayback) ||
    !showCreateStoryPanel;

  if (!ready) {
    return null;
  }

  if (!apiKeyReady) {
    return (
      <ThemeProvider theme={appTheme}>
        <CssBaseline enableColorScheme />
        <OpenAIKeyInterstitialContent
          appName={portfolioApps.pathforger.interstitialAppName}
          logoAlt={portfolioApps.pathforger.interstitialLogoAlt}
          logoSrc={withBasePath(portfolioApps.pathforger.interstitialLogoSrc)}
          value={draftKey}
          onChange={setDraftKey}
          onSubmit={handleKeySubmit}
          inputRef={keyInputRef}
          buttonLabel="Enter PathForger"
          textFieldName="pathforgerApiKey"
          errorText={keyError || undefined}
        />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline enableColorScheme />
      <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
        <AppBar position="sticky" color="transparent" elevation={0}>
          <Toolbar sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="Back to portfolio"
              href={withBasePath("/")}
              sx={{ mr: 2 }}
            >
              <ArrowBack />
            </IconButton>
            <AutoStories sx={{ mr: 1.5 }} />
            <Box sx={{ minWidth: 0, flexGrow: 1 }}>
              <Typography variant="h6" noWrap>
                {portfolioApps.pathforger.documentTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                Stage your adventure from pitch to chapter to cinematic visuals
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ pt: 3, pb: { xs: 14, md: 16 } }}>
          <Stack spacing={2.5}>
            <PathForgerPanelController
              createStoryPanel={{
                hidden: createStoryPanelHidden,
                showMainCreateSpinner: showMainCreateSpinnerWithJourneyPlayback,
                coverImage,
                coverImageTitle: activeStoryTitle,
                coverImageCaption: "By You",
                showPitchSelectionAnimation,
                pitchLoadingGifSrc: withBasePath(
                  "/apps/pathforger/pitch-loading.gif",
                ),
                chapterLoadingGifSrc: withBasePath(
                  "/apps/pathforger/chapter-loading.gif",
                ),
                pathForgingGifSrc: withBasePath("/apps/pathforger/path-forging.gif"),
                nextChapterLedgerPlayback,
                onLedgerPlaybackPrevious: moveToPreviousPlaybackEntry,
                onLedgerPlaybackNext: moveToNextPlaybackEntry,
                onLedgerPlaybackContinue: continueFromPlayback,
                statusText: statusSnackbarText,
                kenBurnsImageSx,
                controlsModalOpen,
                settingsModalOpen,
                showToolbarCloseButton: createStoryPanelOpen,
                onCloseFromToolbar: () => setCreateStoryPanelOpen(false),
                onOpenControls: () => setControlsModalOpen(true),
                onOpenSettings: () => setSettingsModalOpen(true),
                statusIsRunning,
                protagonistPreference,
                onProtagonistPreferenceChange: setProtagonistPreference,
                onGenerateProtagonistName:
                  generation.handleGenerateProtagonistName,
                genre,
                onGenreChange: setGenre,
                adventureLength,
                onAdventureLengthChange: setAdventureLength,
                visualStyle,
                onVisualStyleChange: setVisualStyle,
                onGenerateVisualStyle: generation.handleGenerateVisualStyle,
                tone,
                onToneChange: setTone,
                onGenerateTone: generation.handleGenerateTone,
                ageRating,
                onAgeRatingChange: setAgeRating,
                premise,
                onPremiseChange: setPremise,
                onGeneratePremise: () => {
                  void generation.handleGeneratePremise();
                },
                activeRunAction,
                isRunning,
                onCreateIt: () => {
                  void handlePitchMe();
                },
              }}
              chapterPanel={{
                open: chapterModalOpen && Boolean(visibleChapter),
                chapterNumber: visibleChapter?.chapterNumber,
                title: chapterModalTitle,
                subtitle: chapterModalPitchTitle,
                chapterSpreadImage,
                chapterMarkdown: chapterModalBodyMarkdown,
                chapterBodyScrollRef: chapterModalBodyScrollRef,
                onChapterBodyScroll: handleChapterModalBodyScroll,
                chapterReachedEnd: chapterModalReachedEnd,
                onClose: () => setChapterModalOpen(false),
                onProceed: handleOpenContinueModal,
                proceedDisabled: statusIsRunning || !chapterModalReachedEnd,
                kenBurnsImageSx,
              }}
              continuePanel={{
                open: continueModalOpen && Boolean(visibleChapter),
                statusIsRunning,
                pathForgingGifSrc: withBasePath("/apps/pathforger/path-forging.gif"),
                showOptionSelection: Boolean(visibleChapter),
                continuePromptMarkdown:
                  visibleChapter?.continuePromptMarkdown ?? "",
                optionBranchOrder,
                branchChoiceA,
                branchChoiceB,
                activeOptionBranch,
                revealedOptionBranches,
                optionRevealTick,
                optionPanelImages,
                continueOptionsScrollRef,
                continueOptionPanelRefs,
                onClose: () => setContinueModalOpen(false),
                onSelectOptionPanel: handleSelectOptionPanel,
                onForgeMyPath: handleForgeMyPath,
                activeRunAction,
                forgeDisabled:
                  statusIsRunning || !visibleChapter || !activeOptionBranch,
                kenBurnsImageSx,
              }}
              outcomePanel={{
                open: chapterOutcomeModalOpen && hasVisibleForgedOutcome,
                title: activeOptionBranch
                  ? `You chose Option ${activeOptionBranch}${outcomeModalChoiceLabel ? ` — "${outcomeModalChoiceLabel}".` : "."}`
                  : "Chapter Outcome",
                activeOptionBranch,
                activeOptionLabel: outcomeModalChoiceLabel,
                outcomeImage: activeOptionBranch
                  ? forgedOutcomeImages[activeOptionBranch]
                  : undefined,
                outcomeMarkdown: activeOptionBranch
                  ? (forgedOutcomes[activeOptionBranch] ?? "")
                  : "",
                statusIsRunning,
                onOpenJourney: () => setPathLedgerModalOpen(true),
                onGenerateNextChapter:
                  handleGenerateNextChapterWithJourneyPlayback,
                canGenerateNextChapter: Boolean(
                  visibleChapter &&
                  activeOptionBranch &&
                  forgedOutcomes[activeOptionBranch]?.trim(),
                ),
                activeRunAction,
                nextChapterNumberLabel: visibleChapter
                  ? String(visibleChapter.chapterNumber + 1)
                  : "N+1",
                kenBurnsImageSx,
              }}
              journeyPanel={{
                open: pathLedgerModalOpen && Boolean(visibleChapter),
                onClose: () => setPathLedgerModalOpen(false),
                pathLedgerMarkdown: visibleChapter?.pathLedgerMarkdown ?? "",
                journeyTabPanels,
                journeyTabValue,
                onJourneyTabValueChange: setJourneyTabValue,
                activeJourneyPanel,
                journeySnapshotFields,
              }}
            />

            {errorMessage ? (
              <Alert severity="error">{errorMessage}</Alert>
            ) : null}
          </Stack>
        </Container>

        <PathForgerToolbar
          hasStory={Boolean(visibleChapter)}
          createStoryPanelOpen={createStoryPanelOpen}
          statusIsRunning={statusIsRunning}
          chapterModalOpen={chapterModalOpen}
          pathLedgerModalOpen={pathLedgerModalOpen}
          onOpenCreateStory={() => setCreateStoryPanelOpen(true)}
          onToggleStory={handleToggleChapterModal}
          onOpenJourney={() => setPathLedgerModalOpen(true)}
        />
      </Box>
      <PathForgerSnackbar
        open={statusSnackbarOpen}
        isRunning={statusIsRunning}
        message={statusSnackbarText}
      />
      <PathForgerDialogController
        controlsDialog={{
          open: controlsModalOpen,
          onClose: () => setControlsModalOpen(false),
          defaultModel,
          textModel,
          imageModel,
          modelOptions,
          loadingModelOptions,
          defaultModelFallback: DEFAULT_ONE_OFF_MODEL_ID,
          textModelFallback: DEFAULT_TEXT_MODEL_ID,
          imageModelFallback: DEFAULT_IMAGE_MODEL_ID,
          onDefaultModelChange: setDefaultModel,
          onTextModelChange: setTextModel,
          onImageModelChange: setImageModel,
          romanceMode,
          onRomanceModeChange: setRomanceMode,
          onOpenRenderImageCalls: () => setRenderImageCallsModalOpen(true),
          personalizedImages,
          onPersonalizedImagesChange: setPersonalizedImages,
          onSelfieChange: handleSelfieChange,
          selfieName,
        }}
        settingsDialog={{
          open: settingsModalOpen,
          onClose: () => setSettingsModalOpen(false),
          dangerLevel,
          onDangerLevelChange: setDangerLevel,
          allowPermanentDeath,
          onAllowPermanentDeathChange: setAllowPermanentDeath,
          selectedPitch,
          onSelectedPitchChange: setSelectedPitch,
          selectedBranch,
          onSelectedBranchChange: setSelectedBranch,
          isRunning,
          activeRunAction,
          onRunPipeline: handleRunPipeline,
        }}
        renderImageCallsDialog={{
          open: renderImageCallsModalOpen,
          onClose: () => setRenderImageCallsModalOpen(false),
          imageTypeOrder,
          imageTypeLabels,
          renderImages,
          onSetAll: handleSetAllImageTypes,
          onToggleType: handleToggleImageType,
          onEditPrompt: handleOpenImagePromptEditor,
        }}
        selectedPitchDialog={{
          open: pitchModalOpen && Boolean(visiblePitches),
          onClose: () => setPitchModalOpen(false),
          visiblePitches,
          activePitchForModal,
          visibleSelectedPitch,
          pitchListContainerRef,
          pitchCardRefs,
          pitchSelectionOutline,
          pitchPanelBorderRadius,
          onSelectPitch: handleSelectPitchFromModal,
          onReprompt: () => {
            void handlePitchMe({ forceRefresh: true });
          },
          onStart: handlePitchModalOk,
          isRunning,
          activeRunAction,
        }}
        imagePromptEditorDialog={{
          open: Boolean(editingImagePromptType),
          title: `Image Prompt for ${editingImagePromptType ? imageTypeLabels[editingImagePromptType] : ""}`,
          value: imagePromptEditorValue,
          onChange: setImagePromptEditorValue,
          onClose: handleCloseImagePromptEditor,
          onUpdate: generation.handleUpdateImagePrompt,
        }}
      />
    </ThemeProvider>
  );
}
