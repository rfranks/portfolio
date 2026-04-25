import type { PathForgerImageType } from "@/app/pathforger/_types/pipeline";

export const DEFAULT_TEXT_MODEL = "gpt-4.1-mini";
export const DEFAULT_IMAGE_MODEL = "gpt-5.2";
export const RESPONSES_IMAGE_FALLBACK_MODELS = [DEFAULT_IMAGE_MODEL, "gpt-4.1-mini"] as const;
export const RESPONSES_TEXT_FALLBACK_MODELS = [DEFAULT_TEXT_MODEL, "gpt-5.2", "gpt-4.1"] as const;

const SELFIE_REFERENCE_IMAGE_TYPES: ReadonlySet<PathForgerImageType> = new Set([
  "choicePreviewA",
  "choicePreviewB",
  "outcomeA",
  "outcomeB",
]);

export function isImageModelId(modelId: string): boolean {
  return /^gpt-image/i.test(modelId.trim());
}

export function resolveImageModelFallbackCandidates(model: string): string[] {
  const normalized = model.trim().toLowerCase();
  return RESPONSES_IMAGE_FALLBACK_MODELS.filter(
    (candidate) => candidate.trim().toLowerCase() !== normalized,
  );
}

export function resolveTextModelFallbackCandidates(model: string): string[] {
  const normalized = model.trim().toLowerCase();
  return RESPONSES_TEXT_FALLBACK_MODELS.filter((candidate) => {
    const trimmed = candidate.trim();
    if (!trimmed || isImageModelId(trimmed)) {
      return false;
    }

    return trimmed.toLowerCase() !== normalized;
  });
}

export function resolveTextModel(
  explicitModel: string | undefined,
  defaultModel: string | undefined,
): string {
  const explicit = explicitModel?.trim() ?? "";
  if (explicit.length > 0 && !isImageModelId(explicit)) {
    return explicit;
  }

  const fallback = defaultModel?.trim() ?? "";
  if (fallback.length > 0 && !isImageModelId(fallback)) {
    return fallback;
  }

  return DEFAULT_TEXT_MODEL;
}

export function resolveImageModel(
  explicitModel: string | undefined,
  defaultModel: string | undefined,
): string {
  const explicit = explicitModel?.trim() ?? "";
  if (explicit.length > 0 && isImageModelId(explicit)) {
    return explicit;
  }

  const fallback = defaultModel?.trim() ?? "";
  if (fallback.length > 0 && isImageModelId(fallback)) {
    return fallback;
  }

  return DEFAULT_IMAGE_MODEL;
}

export function shouldUseSelfieReferenceImage(params: {
  imageType: PathForgerImageType;
  personalizedImages: boolean;
  selfieDataUrl?: string;
}): boolean {
  if (!params.personalizedImages) {
    return false;
  }

  if (!params.selfieDataUrl?.trim()) {
    return false;
  }

  return SELFIE_REFERENCE_IMAGE_TYPES.has(params.imageType);
}
