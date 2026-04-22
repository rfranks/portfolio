import * as React from "react";
import {
  type PitchSelectionState,
  type PathForgerPitchChoice,
} from "@/app/pathforger/_types/pitch";
import { buildPitchCoverCacheKey } from "@/app/pathforger/_utils/pitchHelpers";

import {
  extractChapterTitle,
  stripLeadingDuplicateChapterHeadings,
} from "@/app/pathforger/_utils/chapterHelpers";
import {
  type JourneyLedgerField,
  type JourneyTabPanel,
} from "@/app/pathforger/_types/journeyLedger";
import { parseJourneyLedger } from "@/app/pathforger/_utils/journeyLedger";
import type {
  PathForgerBranchChoice,
  PathForgerChapterResult,
  PathForgerGeneratedImage,
  PathForgerPipelineResult,
  PathForgerPitchResult,
} from "@/app/pathforger/_types/pipeline";

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

type UsePathForgerDerivedStateArgs = {
  pitchOnlyResult: PathForgerPitchResult | null;
  chapterOnlyResult: PathForgerChapterResult | null;
  result: PathForgerPipelineResult | null;
  selectedPitch: PitchSelectionState;
  coverImageByPitchKey: Record<string, PathForgerGeneratedImage>;
  activeOptionBranch: PathForgerBranchChoice | null;
  isRunning: boolean;
  isGeneratingChapterImages: boolean;
  activeRunAction: ActiveRunAction;
  progressMessage: string;
  chapterModalOpen: boolean;
  continueModalOpen: boolean;
  chapterOutcomeModalOpen: boolean;
  pathLedgerModalOpen: boolean;
  journeyTabValue: string;
  setJourneyTabValue: (value: string) => void;
};

export function usePathForgerDerivedState(args: UsePathForgerDerivedStateArgs) {
  const {
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
  } = args;

  const visiblePitches = pitchOnlyResult;
  const visibleChapter = chapterOnlyResult ?? result?.chapter ?? null;

  const branchChoiceA = React.useMemo(
    () => visibleChapter?.choices.find((choice) => choice.id === "A") ?? null,
    [visibleChapter],
  );
  const branchChoiceB = React.useMemo(
    () => visibleChapter?.choices.find((choice) => choice.id === "B") ?? null,
    [visibleChapter],
  );

  const coverImage = React.useMemo(() => {
    if (result?.images?.cover) {
      return result.images.cover;
    }

    if (!visiblePitches) {
      return undefined;
    }

    const resolvedPitchChoice =
      selectedPitch === "auto" ? visiblePitches.recommendedPitch : selectedPitch;
    const coverKey = buildPitchCoverCacheKey({
      pitchResult: visiblePitches,
      selectedPitch: resolvedPitchChoice,
    });

    return coverImageByPitchKey[coverKey];
  }, [coverImageByPitchKey, result?.images?.cover, selectedPitch, visiblePitches]);

  const chapterSpreadImage = result?.images?.chapterSpread;

  const optionPanelImages = React.useMemo<
    Partial<Record<PathForgerBranchChoice, PathForgerGeneratedImage>>
  >(
    () => ({
      A: result?.images.choicePreviewA ?? undefined,
      B: result?.images.choicePreviewB ?? undefined,
    }),
    [result?.images.choicePreviewA, result?.images.choicePreviewB],
  );

  const chapterModalTitle = visibleChapter
    ? visibleChapter.chapterTitle?.trim() || extractChapterTitle(visibleChapter.chapterMarkdown)
    : "";

  const chapterModalBodyMarkdown = React.useMemo(() => {
    if (!visibleChapter) {
      return "";
    }

    return stripLeadingDuplicateChapterHeadings({
      markdown: visibleChapter.chapterMarkdown,
      subtitle: chapterModalTitle,
      chapterNumber: visibleChapter.chapterNumber,
    });
  }, [chapterModalTitle, visibleChapter]);

  const visibleSelectedPitch: PathForgerPitchChoice | "" = visiblePitches
    ? selectedPitch === "auto"
      ? visiblePitches.recommendedPitch
      : selectedPitch
    : "";

  const activePitchForModal = React.useMemo(() => {
    if (!visiblePitches) {
      return null;
    }

    return (
      visiblePitches.pitches.find((pitch) => pitch.id === visibleSelectedPitch) ??
      visiblePitches.pitches[0] ??
      null
    );
  }, [visiblePitches, visibleSelectedPitch]);

  const chapterModalPitchTitle = React.useMemo(() => {
    const pitchSource = result?.pitches ?? pitchOnlyResult;
    if (!pitchSource) {
      return "";
    }

    const pitchChoice =
      result?.selectedPitch ??
      (selectedPitch === "auto" ? pitchSource.recommendedPitch : selectedPitch);
    const selectedPitchEntry =
      pitchSource.pitches.find((pitch) => pitch.id === pitchChoice) ?? null;

    return selectedPitchEntry?.title?.trim() ?? "";
  }, [pitchOnlyResult, result, selectedPitch]);

  const journeyLedgerView = React.useMemo(() => {
    if (!visibleChapter?.pathLedgerMarkdown?.trim()) {
      return {
        fields: [] as JourneyLedgerField[],
        remainderMarkdown: "",
      };
    }

    return parseJourneyLedger(visibleChapter.pathLedgerMarkdown);
  }, [visibleChapter?.pathLedgerMarkdown]);

  const journeySnapshotFields = React.useMemo(
    () =>
      journeyLedgerView.fields.filter(
        (field) => field.key === "chapter" || field.key === "location" || field.key === "status",
      ),
    [journeyLedgerView.fields],
  );

  const journeyDetailFields = React.useMemo(
    () =>
      journeyLedgerView.fields.filter(
        (field) => field.key !== "chapter" && field.key !== "location" && field.key !== "status",
      ),
    [journeyLedgerView.fields],
  );

  const journeyTabPanels = React.useMemo<JourneyTabPanel[]>(() => {
    const panels: JourneyTabPanel[] = [];

    if (journeySnapshotFields.length > 0) {
      panels.push({
        id: "snapshot",
        label: "📌 Snapshot",
        kind: "snapshot",
      });
    }

    for (const field of journeyDetailFields) {
      panels.push({
        id: `field-${field.key}`,
        label: `${field.emoji} ${field.label}`,
        kind: "field",
        field,
      });
    }

    return panels;
  }, [journeyDetailFields, journeySnapshotFields]);

  const activeJourneyPanel = React.useMemo(
    () => journeyTabPanels.find((panel) => panel.id === journeyTabValue) ?? null,
    [journeyTabPanels, journeyTabValue],
  );

  React.useEffect(() => {
    if (!pathLedgerModalOpen) {
      return;
    }

    if (journeyTabPanels.length === 0) {
      if (journeyTabValue !== "") {
        setJourneyTabValue("");
      }
      return;
    }

    const hasSelected = journeyTabPanels.some((panel) => panel.id === journeyTabValue);
    if (!hasSelected) {
      setJourneyTabValue(journeyTabPanels[0].id);
    }
  }, [journeyTabPanels, journeyTabValue, pathLedgerModalOpen, setJourneyTabValue]);

  const outcomeModalChoiceLabel = React.useMemo(() => {
    if (!visibleChapter || !activeOptionBranch) {
      return "";
    }

    return (
      visibleChapter.choices.find((choice) => choice.id === activeOptionBranch)?.label?.trim() ?? ""
    );
  }, [activeOptionBranch, visibleChapter]);

  const statusIsRunning = isRunning || isGeneratingChapterImages;
  const isFieldWandRun =
    isRunning &&
    (activeRunAction === "name" ||
      activeRunAction === "premise" ||
      activeRunAction === "style" ||
      activeRunAction === "tone");
  const showMainCreateSpinner = statusIsRunning && !isFieldWandRun;
  const hideCreateStoryPanel = chapterModalOpen || continueModalOpen || chapterOutcomeModalOpen;
  const statusSnackbarOpen = statusIsRunning || Boolean(progressMessage);
  const statusSnackbarMessage = progressMessage.trim();
  const statusSnackbarText = statusIsRunning
    ? statusSnackbarMessage.length > 0
      ? `${statusSnackbarMessage}`
      : "Thinking..."
    : statusSnackbarMessage;
  const showPitchSelectionAnimation =
    statusIsRunning &&
    statusSnackbarText.trim().toLowerCase() === "generating a selection of potential stories...";

  return {
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
  };
}
