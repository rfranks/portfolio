import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";

import type { PathForgerPitchResult } from "@/app/pathforger/_types/pipeline";

export function isPitchChoice(value: unknown): value is PathForgerPitchChoice {
  return value === "A" || value === "B" || value === "C";
}

export function isPathForgerPitchResult(value: unknown): value is PathForgerPitchResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;
  if (
    typeof payload.adventureTitle !== "string" ||
    typeof payload.protagonistName !== "string" ||
    typeof payload.onboardingRecapMarkdown !== "string" ||
    typeof payload.choosePromptMarkdown !== "string" ||
    !isPitchChoice(payload.recommendedPitch)
  ) {
    return false;
  }

  if (!Array.isArray(payload.pitches) || payload.pitches.length !== 3) {
    return false;
  }

  return payload.pitches.every((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const pitch = item as Record<string, unknown>;
    return (
      isPitchChoice(pitch.id) &&
      typeof pitch.title === "string" &&
      typeof pitch.markdown === "string"
    );
  });
}

export function toPitchSubtitle(markdown: string): string {
  const lines = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const stripped = line
      .replace(/^#{1,6}\s*/g, "")
      .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
      .replace(/[*_`>~-]/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (stripped.length > 0) {
      if (stripped.length <= 140) {
        return stripped;
      }

      return `${stripped.slice(0, 137).trimEnd()}...`;
    }
  }

  return "A new branch of the adventure.";
}

export function buildPitchCoverCacheKey(params: {
  pitchResult: PathForgerPitchResult;
  selectedPitch: PathForgerPitchChoice;
}): string {
  const selectedPitch = params.pitchResult.pitches.find(
    (pitch) => pitch.id === params.selectedPitch,
  );

  return [
    params.pitchResult.adventureTitle.trim().toLowerCase(),
    params.pitchResult.protagonistName.trim().toLowerCase(),
    params.selectedPitch,
    selectedPitch?.title?.trim().toLowerCase() ?? "",
  ].join("::");
}
