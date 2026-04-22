import z from "zod";
import { KNOWLEDGE_DOC_FILES } from "../_consts/knowledge";
import {
  onboardingInputSchema,
  pathForgerChapterResultSchema,
  pathForgerPitchResultSchema,
  runChapterStageInputSchema,
  runCoverFromPitchStageInputSchema,
  runImageStageInputSchema,
  runOutcomeImageStageInputSchema,
  runPathLedgerUpdateStageInputSchema,
  runPipelineInputSchema,
  runPitchStageInputSchema,
  runPremiseStageInputSchema,
  runToneStageInputSchema,
  runProtagonistNameStageInputSchema,
  runVisualStyleStageInputSchema,
} from "../_schemas/pipeline";
import { PathForgerPitchChoice } from "./pitch";

export type KnowledgeDocFile = (typeof KNOWLEDGE_DOC_FILES)[number];

export type OpenAIErrorPayload = {
  message?: string;
};

export type OpenAIInputContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };

export type PathForgerBranchChoice = "A" | "B";
export type PathForgerImageType =
  | "cover"
  | "chapterSpread"
  | "choicePreviewA"
  | "choicePreviewB"
  | "outcomeA"
  | "outcomeB";

export interface PathForgerPipelineProgress {
  stage:
    | "loadingKnowledge"
    | "generatingName"
    | "generatingPremise"
    | "generatingStyle"
    | "generatingTone"
    | "generatingPitches"
    | "generatingChapter"
    | "updatingLedger"
    | "generatingImages";
  message: string;
}

export interface PathForgerImageStageUpdate {
  type: PathForgerImageType;
  status: "success" | "error";
  image?: PathForgerGeneratedImage;
  errorMessage?: string;
  completed: number;
  total: number;
}

export interface PathForgerGeneratedImage {
  prompt: string;
  imageDataUrl: string;
  responseId: string | null;
  model: string;
}

export type PathForgerOnboardingInput = z.infer<typeof onboardingInputSchema>;
export type RunPathForgerPipelineInput = z.infer<typeof runPipelineInputSchema>;
export type RunPathForgerPitchStageInput = z.infer<typeof runPitchStageInputSchema>;
export type RunPathForgerProtagonistNameStageInput = z.infer<
  typeof runProtagonistNameStageInputSchema
>;
export type RunPathForgerVisualStyleStageInput = z.infer<typeof runVisualStyleStageInputSchema>;
export type RunPathForgerPremiseStageInput = z.infer<typeof runPremiseStageInputSchema>;
export type RunPathForgerToneStageInput = z.infer<typeof runToneStageInputSchema>;
export type RunPathForgerImageStageInput = z.infer<typeof runImageStageInputSchema>;
export type RunPathForgerPathLedgerUpdateStageInput = z.infer<
  typeof runPathLedgerUpdateStageInputSchema
>;

export type PathForgerPitchResult = z.infer<typeof pathForgerPitchResultSchema>;
export type RunPathForgerCoverFromPitchStageInput = z.infer<
  typeof runCoverFromPitchStageInputSchema
>;
export type PathForgerChapterResult = z.infer<typeof pathForgerChapterResultSchema>;
export type RunPathForgerChapterStageInput = z.infer<typeof runChapterStageInputSchema>;
export type RunPathForgerOutcomeImageStageInput = z.infer<typeof runOutcomeImageStageInputSchema>;

export interface PathForgerPipelineResult {
  pitches: PathForgerPitchResult;
  chapter: PathForgerChapterResult;
  selectedPitch: PathForgerPitchChoice;
  images: Partial<Record<PathForgerImageType, PathForgerGeneratedImage>>;
  imageErrors: Partial<Record<PathForgerImageType, string>>;
  textModel: string;
  imageModel: string;
}
