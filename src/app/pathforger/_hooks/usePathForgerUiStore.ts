import { create } from "zustand";
import { initialOptionRevealState, initialOptionRevealTick } from "@/app/pathforger/_consts/consts";
import type {
  BranchRevealState,
  BranchRevealTickState,
  ActiveRunAction,
} from "@/app/pathforger/_types/persistence";
import type {
  PathForgerBranchChoice,
  PathForgerGeneratedImage,
} from "@/app/pathforger/_types/pipeline";
import type { PathForgerPipelineRunDiagnostics } from "@/app/pathforger/_types/pipelineRunInspector";

type StateUpdater<T> = T | ((previous: T) => T);

type PathForgerDialogStateSlice = {
  pitchModalOpen: boolean;
  controlsModalOpen: boolean;
  settingsModalOpen: boolean;
  renderImageCallsModalOpen: boolean;
  chapterModalOpen: boolean;
  continueModalOpen: boolean;
  chapterOutcomeModalOpen: boolean;
  createStoryPanelOpen: boolean;
  hasCreateStoryFormBeenShown: boolean;
  pathLedgerModalOpen: boolean;
  journeyTabValue: string;
  persistenceDialogOpen: boolean;
  chapterModalReachedEnd: boolean;
  setPitchModalOpen: (value: StateUpdater<boolean>) => void;
  setControlsModalOpen: (value: StateUpdater<boolean>) => void;
  setSettingsModalOpen: (value: StateUpdater<boolean>) => void;
  setRenderImageCallsModalOpen: (value: StateUpdater<boolean>) => void;
  setChapterModalOpen: (value: StateUpdater<boolean>) => void;
  setContinueModalOpen: (value: StateUpdater<boolean>) => void;
  setChapterOutcomeModalOpen: (value: StateUpdater<boolean>) => void;
  setCreateStoryPanelOpen: (value: StateUpdater<boolean>) => void;
  setHasCreateStoryFormBeenShown: (value: StateUpdater<boolean>) => void;
  setPathLedgerModalOpen: (value: StateUpdater<boolean>) => void;
  setJourneyTabValue: (value: StateUpdater<string>) => void;
  setPersistenceDialogOpen: (value: StateUpdater<boolean>) => void;
  setChapterModalReachedEnd: (value: StateUpdater<boolean>) => void;
};

type PathForgerRunStateSlice = {
  isRunning: boolean;
  isGeneratingChapterImages: boolean;
  activeRunAction: ActiveRunAction;
  errorMessage: string;
  setIsRunning: (value: StateUpdater<boolean>) => void;
  setIsGeneratingChapterImages: (value: StateUpdater<boolean>) => void;
  setActiveRunAction: (value: StateUpdater<ActiveRunAction>) => void;
  setErrorMessage: (value: StateUpdater<string>) => void;
};

type PathForgerBranchStateSlice = {
  selectedBranch: "" | PathForgerBranchChoice;
  activeOptionBranch: PathForgerBranchChoice | null;
  revealedOptionBranches: BranchRevealState;
  optionRevealTick: BranchRevealTickState;
  forgedOutcomes: Partial<Record<PathForgerBranchChoice, string>>;
  forgedOutcomeImages: Partial<Record<PathForgerBranchChoice, PathForgerGeneratedImage>>;
  setSelectedBranch: (value: StateUpdater<"" | PathForgerBranchChoice>) => void;
  setActiveOptionBranch: (value: StateUpdater<PathForgerBranchChoice | null>) => void;
  setRevealedOptionBranches: (value: StateUpdater<BranchRevealState>) => void;
  setOptionRevealTick: (value: StateUpdater<BranchRevealTickState>) => void;
  setForgedOutcomes: (value: StateUpdater<Partial<Record<PathForgerBranchChoice, string>>>) => void;
  setForgedOutcomeImages: (
    value: StateUpdater<Partial<Record<PathForgerBranchChoice, PathForgerGeneratedImage>>>,
  ) => void;
  resetBranchState: () => void;
};

type PathForgerPersistenceStateSlice = {
  lastForgedLedgerTransition: {
    chapterNumber: number;
    previousMarkdown: string;
    nextMarkdown: string;
  } | null;
  pipelineRunDiagnostics: PathForgerPipelineRunDiagnostics[];
  setLastForgedLedgerTransition: (
    value: StateUpdater<{
      chapterNumber: number;
      previousMarkdown: string;
      nextMarkdown: string;
    } | null>,
  ) => void;
  setPipelineRunDiagnostics: (value: StateUpdater<PathForgerPipelineRunDiagnostics[]>) => void;
  pushPipelineRunDiagnostics: (diagnostics: PathForgerPipelineRunDiagnostics) => void;
};

type PathForgerUiStoreState = PathForgerDialogStateSlice &
  PathForgerRunStateSlice &
  PathForgerBranchStateSlice &
  PathForgerPersistenceStateSlice;

function applyStateUpdater<T>(current: T, next: StateUpdater<T>): T {
  if (typeof next === "function") {
    return (next as (value: T) => T)(current);
  }

  return next;
}

export const usePathForgerUiStore = create<PathForgerUiStoreState>((set) => ({
  pitchModalOpen: false,
  controlsModalOpen: false,
  settingsModalOpen: false,
  renderImageCallsModalOpen: false,
  chapterModalOpen: false,
  continueModalOpen: false,
  chapterOutcomeModalOpen: false,
  createStoryPanelOpen: false,
  hasCreateStoryFormBeenShown: false,
  pathLedgerModalOpen: false,
  journeyTabValue: "",
  persistenceDialogOpen: false,
  chapterModalReachedEnd: false,
  setPitchModalOpen: (value) =>
    set((state) => ({ pitchModalOpen: applyStateUpdater(state.pitchModalOpen, value) })),
  setControlsModalOpen: (value) =>
    set((state) => ({ controlsModalOpen: applyStateUpdater(state.controlsModalOpen, value) })),
  setSettingsModalOpen: (value) =>
    set((state) => ({ settingsModalOpen: applyStateUpdater(state.settingsModalOpen, value) })),
  setRenderImageCallsModalOpen: (value) =>
    set((state) => ({
      renderImageCallsModalOpen: applyStateUpdater(state.renderImageCallsModalOpen, value),
    })),
  setChapterModalOpen: (value) =>
    set((state) => ({ chapterModalOpen: applyStateUpdater(state.chapterModalOpen, value) })),
  setContinueModalOpen: (value) =>
    set((state) => ({ continueModalOpen: applyStateUpdater(state.continueModalOpen, value) })),
  setChapterOutcomeModalOpen: (value) =>
    set((state) => ({
      chapterOutcomeModalOpen: applyStateUpdater(state.chapterOutcomeModalOpen, value),
    })),
  setCreateStoryPanelOpen: (value) =>
    set((state) => ({
      createStoryPanelOpen: applyStateUpdater(state.createStoryPanelOpen, value),
    })),
  setHasCreateStoryFormBeenShown: (value) =>
    set((state) => ({
      hasCreateStoryFormBeenShown: applyStateUpdater(state.hasCreateStoryFormBeenShown, value),
    })),
  setPathLedgerModalOpen: (value) =>
    set((state) => ({ pathLedgerModalOpen: applyStateUpdater(state.pathLedgerModalOpen, value) })),
  setJourneyTabValue: (value) =>
    set((state) => ({ journeyTabValue: applyStateUpdater(state.journeyTabValue, value) })),
  setPersistenceDialogOpen: (value) =>
    set((state) => ({
      persistenceDialogOpen: applyStateUpdater(state.persistenceDialogOpen, value),
    })),
  setChapterModalReachedEnd: (value) =>
    set((state) => ({
      chapterModalReachedEnd: applyStateUpdater(state.chapterModalReachedEnd, value),
    })),

  isRunning: false,
  isGeneratingChapterImages: false,
  activeRunAction: null,
  errorMessage: "",
  setIsRunning: (value) =>
    set((state) => ({ isRunning: applyStateUpdater(state.isRunning, value) })),
  setIsGeneratingChapterImages: (value) =>
    set((state) => ({
      isGeneratingChapterImages: applyStateUpdater(state.isGeneratingChapterImages, value),
    })),
  setActiveRunAction: (value) =>
    set((state) => ({ activeRunAction: applyStateUpdater(state.activeRunAction, value) })),
  setErrorMessage: (value) =>
    set((state) => ({ errorMessage: applyStateUpdater(state.errorMessage, value) })),

  selectedBranch: "",
  activeOptionBranch: null,
  revealedOptionBranches: initialOptionRevealState,
  optionRevealTick: initialOptionRevealTick,
  forgedOutcomes: {},
  forgedOutcomeImages: {},
  setSelectedBranch: (value) =>
    set((state) => ({ selectedBranch: applyStateUpdater(state.selectedBranch, value) })),
  setActiveOptionBranch: (value) =>
    set((state) => ({ activeOptionBranch: applyStateUpdater(state.activeOptionBranch, value) })),
  setRevealedOptionBranches: (value) =>
    set((state) => ({
      revealedOptionBranches: applyStateUpdater(state.revealedOptionBranches, value),
    })),
  setOptionRevealTick: (value) =>
    set((state) => ({ optionRevealTick: applyStateUpdater(state.optionRevealTick, value) })),
  setForgedOutcomes: (value) =>
    set((state) => ({ forgedOutcomes: applyStateUpdater(state.forgedOutcomes, value) })),
  setForgedOutcomeImages: (value) =>
    set((state) => ({ forgedOutcomeImages: applyStateUpdater(state.forgedOutcomeImages, value) })),
  resetBranchState: () =>
    set({
      selectedBranch: "",
      activeOptionBranch: null,
      revealedOptionBranches: initialOptionRevealState,
      optionRevealTick: initialOptionRevealTick,
      forgedOutcomes: {},
      forgedOutcomeImages: {},
    }),

  lastForgedLedgerTransition: null,
  pipelineRunDiagnostics: [],
  setLastForgedLedgerTransition: (value) =>
    set((state) => ({
      lastForgedLedgerTransition: applyStateUpdater(state.lastForgedLedgerTransition, value),
    })),
  setPipelineRunDiagnostics: (value) =>
    set((state) => ({
      pipelineRunDiagnostics: applyStateUpdater(state.pipelineRunDiagnostics, value),
    })),
  pushPipelineRunDiagnostics: (diagnostics) =>
    set((state) => ({
      pipelineRunDiagnostics: [diagnostics, ...state.pipelineRunDiagnostics].slice(0, 6),
    })),
}));
