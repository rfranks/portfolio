import type {
  PathForgerBranchChoice,
  PathForgerImageType,
} from "@/app/pathforger/_types/pipeline";

export const DEFAULT_TEXT_MODEL_ID = "gpt-4.1-mini";
export const DEFAULT_IMAGE_MODEL_ID = "gpt-4.1";
export const DEFAULT_ONE_OFF_MODEL_ID = DEFAULT_TEXT_MODEL_ID;

export const defaultModelOptions = [
  "gpt-5.2",
  "gpt-image-1",
  "gpt-4.1",
  "gpt-4.1-mini",
];

export const initialRenderImages: Record<PathForgerImageType, boolean> = {
  cover: true,
  chapterSpread: true,
  choicePreviewA: true,
  choicePreviewB: true,
  outcomeA: true,
  outcomeB: true,
};

export const imageTypeLabels: Record<PathForgerImageType, string> = {
  cover: "Book Cover",
  chapterSpread: "Chapter Spread",
  choicePreviewA: "Choice Preview A",
  choicePreviewB: "Choice Preview B",
  outcomeA: "Outcome A",
  outcomeB: "Outcome B",
};

export const imageTypeOrder: PathForgerImageType[] = [
  "cover",
  "chapterSpread",
  "choicePreviewA",
  "choicePreviewB",
  "outcomeA",
  "outcomeB",
];

export const pitchPanelBorderRadius = "8px";
export const pitchCacheStorageKey = "pathforger-last-pitches-v1";
export const pathForgerStateStorageKey = "pathforger-state-v1";

export const optionBranchOrder: PathForgerBranchChoice[] = ["A", "B"];

export const initialOptionRevealState: Record<PathForgerBranchChoice, boolean> =
  {
    A: false,
    B: false,
  };

export const initialOptionRevealTick: Record<PathForgerBranchChoice, number> = {
  A: 0,
  B: 0,
};

export const STATUS_SNACKBAR_MIN_MESSAGE_MS = 1100;
