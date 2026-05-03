import { requestOpenAIModels } from "@/utils/openai/client";
import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";
import type { PathForgerImageType, PathForgerPitchResult } from "@/app/pathforger/_types/pipeline";
import { sortModelIds } from "./modelOptions";

const PATHFORGER_SELFIE_MAX_BYTES = 6 * 1024 * 1024;

interface ResolveActiveStoryTitleArgs {
  chapterModalPitchTitle: string;
  activePitchTitle?: string | null;
  visiblePitches?: PathForgerPitchResult | null;
  visibleSelectedPitch?: PathForgerPitchChoice | "";
}

export function resolvePathForgerActiveStoryTitle({
  chapterModalPitchTitle,
  activePitchTitle,
  visiblePitches,
  visibleSelectedPitch,
}: ResolveActiveStoryTitleArgs): string {
  const chapterTitle = chapterModalPitchTitle.trim();
  if (chapterTitle) {
    return chapterTitle;
  }

  const modalPitchTitle = activePitchTitle?.trim() ?? "";
  if (modalPitchTitle) {
    return modalPitchTitle;
  }

  if (visiblePitches) {
    const selectedPitchId = visibleSelectedPitch || visiblePitches.recommendedPitch;
    const selectedPitchTitle =
      visiblePitches.pitches.find((pitch) => pitch.id === selectedPitchId)?.title?.trim() || "";
    if (selectedPitchTitle) {
      return selectedPitchTitle;
    }
  }

  return "Story Cover";
}

interface PathForgerModelOptionsResult {
  options: string[];
  loaded: boolean;
  failed: boolean;
}

export async function loadPathForgerModelOptions(
  apiKey: string,
  fallbackOptions: string[],
): Promise<PathForgerModelOptionsResult> {
  try {
    const payload = (await requestOpenAIModels(apiKey, {
      retries: 1,
    })) as {
      data?: Array<{ id?: unknown }>;
    };

    const ids = Array.isArray(payload.data)
      ? payload.data
          .map((item) => (typeof item?.id === "string" ? item.id : ""))
          .filter((id) => id.trim().length > 0)
      : [];

    const options =
      ids.length > 0 ? sortModelIds([...ids, ...fallbackOptions]) : [...fallbackOptions];

    return {
      options,
      loaded: ids.length > 0,
      failed: false,
    };
  } catch {
    return {
      options: [...fallbackOptions],
      loaded: false,
      failed: true,
    };
  }
}

export function togglePathForgerImageType(
  current: Record<PathForgerImageType, boolean>,
  type: PathForgerImageType,
): Record<PathForgerImageType, boolean> {
  return {
    ...current,
    [type]: !current[type],
  };
}

export function setAllPathForgerImageTypes(
  enabled: boolean,
  types: readonly PathForgerImageType[],
): Record<PathForgerImageType, boolean> {
  return types.reduce<Record<PathForgerImageType, boolean>>(
    (acc, type) => {
      acc[type] = enabled;
      return acc;
    },
    {} as Record<PathForgerImageType, boolean>,
  );
}

export function validatePathForgerSelfieFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please choose an image file for the protagonist reference.";
  }

  if (file.size > PATHFORGER_SELFIE_MAX_BYTES) {
    return "Reference image is too large. Please use a file under 6MB.";
  }

  return null;
}

export async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
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
  });
}
