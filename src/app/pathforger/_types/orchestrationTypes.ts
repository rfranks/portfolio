import {
  KnowledgeDocFile,
  PathForgerChapterResult,
  PathForgerGeneratedImage,
  PathForgerImageType,
  PathForgerPitchResult,
  RunPathForgerPipelineInput,
} from "./pipeline";
import { PathForgerPitchChoice } from "./pitch";

export type PathForgerKnowledge = {
  mainPrompt: string;
  docs: Record<KnowledgeDocFile, string>;
};

export type PathForgerPitchesStageResult = {
  pitches: PathForgerPitchResult;
  selectedPitch: PathForgerPitchChoice;
};

export type PathForgerImageStageResult = {
  images: Partial<Record<PathForgerImageType, PathForgerGeneratedImage>>;
  imageErrors: Partial<Record<PathForgerImageType, string>>;
  imageModel: string;
  resolvedImagePrompts: PathForgerChapterResult["imagePrompts"];
};

export type PathForgerPipelineOrchestrationContext = {
  input: RunPathForgerPipelineInput;
  renderImages: Record<PathForgerImageType, boolean>;
  textModel: string;
  imageModel: string;
  abortSignal?: AbortSignal;
  knowledge?: PathForgerKnowledge;
  pitches?: PathForgerPitchResult;
  selectedPitch?: PathForgerPitchChoice;
  chapter?: PathForgerChapterResult;
  imageStageResult?: PathForgerImageStageResult;
};
