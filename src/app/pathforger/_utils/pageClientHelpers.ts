import { PathForgerBranchChoice, PathForgerGeneratedImage } from "@/app/pathforger/_types/pipeline";

export type BranchRevealState = Record<PathForgerBranchChoice, boolean>;
export type BranchRevealTickState = Record<PathForgerBranchChoice, number>;
export type ForgedOutcomesState = Partial<Record<PathForgerBranchChoice, string>>;
export type ForgedOutcomeImagesState = Partial<
  Record<PathForgerBranchChoice, PathForgerGeneratedImage>
>;

const OPENAI_AUTH_ERROR_MARKERS = [
  "missing bearer or basic authentication",
  "missing bearer",
  "invalid api key",
  "incorrect api key",
] as const;

export function isOpenAIAuthFailureMessage(message: string): boolean {
  const normalized = message.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return OPENAI_AUTH_ERROR_MARKERS.some((marker) => normalized.includes(marker));
}
