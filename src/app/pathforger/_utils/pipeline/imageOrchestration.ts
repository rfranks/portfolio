import { z } from "zod";
import { requestOpenAIJsonRaw } from "@/utils/openai/client";
import {
  imagePromptSetSchema,
  runImageStageInputSchema,
  runOutcomeImageStageInputSchema,
} from "@/app/pathforger/_schemas/pipeline";
import type {
  OpenAIErrorPayload,
  OpenAIInputContentPart,
  PathForgerGeneratedImage,
  PathForgerImageStageUpdate,
  PathForgerImageType,
  PathForgerPipelineProgress,
  RunPathForgerImageStageInput,
  RunPathForgerOutcomeImageStageInput,
} from "@/app/pathforger/_types/pipeline";
import {
  resolveImageModel,
  resolveImageModelFallbackCandidates,
  shouldUseSelfieReferenceImage,
  DEFAULT_IMAGE_MODEL,
} from "@/app/pathforger/_utils/pipeline/modelPolicy";
import {
  buildCoverPromptFromTitle,
  extractCoverTitleHintFromPrompt,
  markdownToPlainText,
} from "@/app/pathforger/_utils/pipeline/textFormatting";

const TARGET_IMAGE_SIZE = "1024x1024";
const MAX_PARALLEL_IMAGE_CALLS = 3;
const IMAGE_REQUEST_TIMEOUT_MS = 180_000;
const IMAGE_RATE_LIMIT_MAX_RETRIES = 3;
const IMAGE_RATE_LIMIT_BASE_DELAY_MS = 1_500;

export const renderImageDefaults: Record<PathForgerImageType, boolean> = {
  cover: true,
  chapterSpread: true,
  choicePreviewA: true,
  choicePreviewB: true,
  outcomeA: true,
  outcomeB: true,
};

function extractErrorMessage(payload: Record<string, unknown>): string {
  const errorPayload =
    typeof payload.error === "object" && payload.error
      ? (payload.error as OpenAIErrorPayload)
      : null;

  if (errorPayload?.message && errorPayload.message.trim().length > 0) {
    return errorPayload.message;
  }

  if (typeof payload.error === "string") {
    return payload.error;
  }

  return "";
}

function extractErrorCode(payload: Record<string, unknown>): string {
  const errorPayload =
    typeof payload.error === "object" && payload.error
      ? (payload.error as Record<string, unknown>)
      : null;

  if (typeof errorPayload?.code === "string") {
    return errorPayload.code;
  }

  return "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const numeric = Number(trimmed);
  if (Number.isFinite(numeric) && numeric > 0) {
    return Math.ceil(numeric * 1_000);
  }

  const dateMs = Date.parse(trimmed);
  if (!Number.isNaN(dateMs)) {
    const delta = dateMs - Date.now();
    return delta > 0 ? delta : null;
  }

  return null;
}

function isRateLimitResponse(
  status: number,
  payload: Record<string, unknown>,
  message: string,
): boolean {
  if (status === 429) {
    return true;
  }

  const code = extractErrorCode(payload).toLowerCase();
  if (code === "rate_limit_exceeded") {
    return true;
  }

  const lower = message.toLowerCase();
  return lower.includes("rate limit");
}

function resolveRateLimitDelayMs(response: Response, message: string, attempt: number): number {
  const headerDelayMs = parseRetryAfterMs(response.headers.get("retry-after"));
  if (headerDelayMs !== null) {
    return Math.max(500, headerDelayMs);
  }

  const retryInMatch = message.match(
    /try again in\s+(\d+(?:\.\d+)?)\s*(ms|millisecond|milliseconds|s|sec|secs|second|seconds)?/i,
  );
  if (retryInMatch) {
    const numeric = Number(retryInMatch[1]);
    if (Number.isFinite(numeric) && numeric > 0) {
      const unit = (retryInMatch[2] ?? "s").toLowerCase();
      const multiplier = unit.startsWith("ms") || unit.startsWith("millisecond") ? 1 : 1_000;
      return Math.max(500, Math.ceil(numeric * multiplier));
    }
  }

  const exponential = IMAGE_RATE_LIMIT_BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 450);
  return exponential + jitter;
}

type ExtractedImage = {
  base64: string;
  mimeType: string;
};

function parseImageCandidate(raw: string): ExtractedImage | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const dataUrlMatch = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      base64: dataUrlMatch[2],
    };
  }

  return {
    mimeType: "image/png",
    base64: value,
  };
}

function pushImageCandidate(bucket: ExtractedImage[], raw: unknown): void {
  if (typeof raw !== "string") {
    return;
  }

  const parsed = parseImageCandidate(raw);
  if (parsed) {
    bucket.push(parsed);
  }
}

function extractImageBase64(payload: unknown): ExtractedImage | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const candidates: ExtractedImage[] = [];

  pushImageCandidate(candidates, value.image_base64);

  if (Array.isArray(value.data)) {
    for (const entry of value.data as Array<Record<string, unknown>>) {
      pushImageCandidate(candidates, entry?.b64_json);
      pushImageCandidate(candidates, entry?.image_base64);
    }
  }

  if (Array.isArray(value.output)) {
    for (const entry of value.output as Array<Record<string, unknown>>) {
      if (entry?.type === "image_generation_call") {
        pushImageCandidate(candidates, entry.result);
        if (entry.result && typeof entry.result === "object") {
          const nested = entry.result as Record<string, unknown>;
          pushImageCandidate(candidates, nested.b64_json);
          pushImageCandidate(candidates, nested.image_base64);
        }
      }

      if (Array.isArray(entry?.content)) {
        for (const item of entry.content as Array<Record<string, unknown>>) {
          pushImageCandidate(candidates, item?.image_base64);
          pushImageCandidate(candidates, item?.b64_json);
        }
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((largest, current) =>
    current.base64.length > largest.base64.length ? current : largest,
  );
}

function shouldRetryWithMinimalToolOptions(status: number, apiMessage: string): boolean {
  if (status !== 400 || !apiMessage) {
    return false;
  }

  const lower = apiMessage.toLowerCase();
  return (
    lower.includes("unknown parameter") ||
    lower.includes("invalid tool") ||
    lower.includes("tool_choice")
  );
}

function buildImageTypePromptRequirements(imageType: PathForgerImageType): string[] {
  if (imageType === "choicePreviewA" || imageType === "choicePreviewB") {
    const optionLabel = imageType === "choicePreviewA" ? "A" : "B";
    return [
      `This is a CHOICE PREVIEW for Option ${optionLabel}.`,
      "Show the moment BEFORE a decision is executed: tension, uncertainty, and setup.",
      "Express tension through composition, staging, and character body language instead of automatically darkening the scene.",
      "Do not depict final aftermath, post-battle debris, or resolved consequences.",
      "Composition should read as an anticipatory fork-in-the-road moment.",
    ];
  }

  if (imageType === "outcomeA" || imageType === "outcomeB") {
    const optionLabel = imageType === "outcomeA" ? "A" : "B";
    return [
      `This is an OUTCOME image for Option ${optionLabel}.`,
      "Show the moment AFTER the decision with concrete consequences and world-state change.",
      "Include clear aftermath signals (environment shift, character condition, gained/lost resources, or threat escalation/reduction).",
      "Do not render this as a neutral decision moment or fork-in-the-road preview.",
      "Must be clearly visually distinct from the corresponding choice preview (different timing, framing, and consequence details).",
    ];
  }

  if (imageType === "chapterSpread") {
    return [
      "This is a chapter scene image (not a printed spread layout).",
      "Prioritize a broad in-world scene that captures chapter state instead of a single close-up beat.",
      "Do not depict open books, visible page edges, paper textures, panel borders, or any book mockup framing.",
      "Compose this as an in-world scene, not as pages in a book.",
    ];
  }

  return [];
}

function buildStyleAdherenceRequirements(params: {
  styleHint?: string;
  toneHint?: string;
  genreHint?: string;
  ageRatingHint?: string;
}): string[] {
  const style = params.styleHint?.trim() ?? "";
  const tone = params.toneHint?.trim() ?? "";
  const genre = params.genreHint?.trim() ?? "";
  const ageRating = params.ageRatingHint?.trim() ?? "";

  const hasAnyHint = Boolean(style || tone || genre || ageRating);
  if (!hasAnyHint) {
    return [];
  }

  return [
    "Style adherence rules (hard constraints):",
    style ? `- Visual Style: ${style}` : "",
    tone ? `- Tone: ${tone}` : "",
    genre ? `- Genre: ${genre}` : "",
    ageRating ? `- Age Rating: ${ageRating}` : "",
    "- Follow these hints exactly; do not drift to a default moody photoreal look unless explicitly requested.",
    "- Keep palette, rendering medium, lighting, and line/shape language consistent with the style hint.",
    "- Do not inject a cinematic/photoreal/dark treatment unless the provided style or tone explicitly requests it.",
  ].filter(Boolean);
}

function shouldRetryWithFallbackImageModel(params: {
  status: number;
  payload: Record<string, unknown>;
  errorMessage: string;
}): boolean {
  if (params.status < 400 || params.status >= 500) {
    return false;
  }

  const normalizedMessage = params.errorMessage.trim().toLowerCase();
  if (normalizedMessage.includes("model not found")) {
    return true;
  }

  const errorObj = params.payload.error;
  if (!errorObj || typeof errorObj !== "object") {
    return false;
  }

  const errorRecord = errorObj as Record<string, unknown>;
  const errorParam = typeof errorRecord.param === "string" ? errorRecord.param.trim() : "";
  if (errorParam.toLowerCase() === "model") {
    return true;
  }

  return false;
}

function isImageTimeoutLikeError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  if (error.name === "TimeoutError") {
    return true;
  }

  const normalized = error.message.trim().toLowerCase();
  return (
    normalized.includes("timed out") || normalized.includes("signal is aborted without reason")
  );
}

function normalizeImageGenerationErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();
  if (
    normalized.includes("signal is aborted without reason") ||
    normalized.includes("request timed out")
  ) {
    return "Image generation timed out while waiting for the model. Please retry.";
  }

  return message;
}

async function requestImageAsset(params: {
  apiKey: string;
  model: string;
  prompt: string;
  imageType: PathForgerImageType;
  selfieDataUrl?: string;
  includeSelfieReferenceImage?: boolean;
  styleHint?: string;
  toneHint?: string;
  genreHint?: string;
  ageRatingHint?: string;
  signal?: AbortSignal;
}): Promise<Omit<PathForgerGeneratedImage, "prompt">> {
  const coverTitleHint =
    params.imageType === "cover" ? extractCoverTitleHintFromPrompt(params.prompt) : null;
  const coverPromptRequirements =
    params.imageType === "cover"
      ? [
          "This render MUST look like a professional front-facing novel book cover.",
          "Use clear visual hierarchy with title area prioritized for readability.",
          coverTitleHint
            ? `Render this exact title text clearly and legibly: "${coverTitleHint}".`
            : "Render the story title from the prompt clearly and legibly in large high-contrast text.",
          "Do not include any other words besides that exact title text.",
          "Do not include character names, subtitles, taglines, author names, logos, or stray lettering.",
          "Do not output warped, mirrored, misspelled, tiny, or illegible title text.",
        ]
      : [];
  const imageTypeRequirements = buildImageTypePromptRequirements(params.imageType);
  const styleRequirements = buildStyleAdherenceRequirements({
    styleHint: params.styleHint,
    toneHint: params.toneHint,
    genreHint: params.genreHint,
    ageRatingHint: params.ageRatingHint,
  });
  const userContent: OpenAIInputContentPart[] = [
    {
      type: "input_text",
      text: [
        "Generate one premium story illustration.",
        `Output size must be ${TARGET_IMAGE_SIZE}.`,
        "Do not include unreadable dense text overlays.",
        ...imageTypeRequirements,
        ...coverPromptRequirements,
        "",
        "Base scene brief:",
        params.prompt,
        ...(styleRequirements.length > 0
          ? [
              "",
              "Final style lock (highest priority, overrides conflicting wording above):",
              ...styleRequirements,
            ]
          : []),
      ].join("\n"),
    },
  ];

  if (params.includeSelfieReferenceImage && params.selfieDataUrl) {
    userContent.push({
      type: "input_image",
      image_url: params.selfieDataUrl,
    });
  }

  const runRequestWithRateLimitRetry = async (body: Record<string, unknown>) => {
    let attempt = 0;

    while (true) {
      try {
        const result = await requestOpenAIJsonRaw<Record<string, unknown>>({
          apiKey: params.apiKey,
          path: "/responses",
          method: "POST",
          body,
          signal: params.signal,
          profile: "responses",
          profileOverrides: {
            timeoutMs: IMAGE_REQUEST_TIMEOUT_MS,
          },
        });
        const message = extractErrorMessage(result.data);
        if (
          !isRateLimitResponse(result.response.status, result.data, message) ||
          attempt >= IMAGE_RATE_LIMIT_MAX_RETRIES
        ) {
          return result;
        }

        const delayMs = resolveRateLimitDelayMs(result.response, message, attempt);
        await sleep(delayMs);
        attempt += 1;
      } catch (error) {
        if (!isImageTimeoutLikeError(error) || attempt >= IMAGE_RATE_LIMIT_MAX_RETRIES) {
          throw error;
        }

        await sleep(IMAGE_RATE_LIMIT_BASE_DELAY_MS * (attempt + 1));
        attempt += 1;
      }
    }
  };

  const runWithModel = async (model: string) => {
    const baseRequestBody = {
      model,
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: [
                "You are PathForger's image renderer.",
                "Produce one polished image that follows the user prompt exactly.",
                "If a headshot reference image is provided, preserve identity cues while following the requested visual style.",
                "Return only the image result.",
              ].join("\n"),
            },
          ],
        },
        {
          role: "user",
          content: userContent,
        },
      ],
    };

    const requestWithPreferredToolOptions = {
      ...baseRequestBody,
      tools: [{ type: "image_generation", size: TARGET_IMAGE_SIZE }],
      tool_choice: { type: "image_generation" },
    };

    const requestWithMinimalToolOptions = {
      ...baseRequestBody,
      tools: [{ type: "image_generation", size: TARGET_IMAGE_SIZE }],
    };

    const requestWithBareToolOptions = {
      ...baseRequestBody,
      tools: [{ type: "image_generation" }],
    };

    let { response, data } = await runRequestWithRateLimitRetry(
      requestWithPreferredToolOptions as unknown as Record<string, unknown>,
    );

    const firstAttemptMessage = extractErrorMessage(data);
    if (shouldRetryWithMinimalToolOptions(response.status, firstAttemptMessage)) {
      ({ response, data } = await runRequestWithRateLimitRetry(
        requestWithMinimalToolOptions as unknown as Record<string, unknown>,
      ));

      const secondAttemptMessage = extractErrorMessage(data);
      if (shouldRetryWithMinimalToolOptions(response.status, secondAttemptMessage)) {
        ({ response, data } = await runRequestWithRateLimitRetry(
          requestWithBareToolOptions as unknown as Record<string, unknown>,
        ));
      }
    }

    return { response, data };
  };

  const requestedModel = params.model.trim() || DEFAULT_IMAGE_MODEL;
  let resolvedModel = requestedModel;
  let { response, data } = await runWithModel(resolvedModel);

  const firstModelError = extractErrorMessage(data);
  if (
    !response.ok &&
    shouldRetryWithFallbackImageModel({
      status: response.status,
      payload: data,
      errorMessage: firstModelError,
    })
  ) {
    const fallbackCandidates = resolveImageModelFallbackCandidates(resolvedModel);
    for (const fallbackModel of fallbackCandidates) {
      resolvedModel = fallbackModel;
      ({ response, data } = await runWithModel(resolvedModel));
      if (response.ok) {
        break;
      }
    }
  }

  if (!response.ok) {
    const apiMessage = extractErrorMessage(data);
    throw new Error(
      apiMessage.length > 0
        ? apiMessage
        : `PathForger image generation failed (${response.status}).`,
    );
  }

  const image = extractImageBase64(data);
  if (!image) {
    throw new Error("PathForger image stage returned no image.");
  }

  return {
    imageDataUrl: `data:${image.mimeType};base64,${image.base64}`,
    responseId: typeof data.id === "string" ? data.id : null,
    model: resolvedModel,
  };
}

function buildImageJobList(
  prompts: z.infer<typeof imagePromptSetSchema>,
  renderImages: Record<PathForgerImageType, boolean>,
): Array<{ type: PathForgerImageType; prompt: string }> {
  const orderedTypes: PathForgerImageType[] = [
    "cover",
    "chapterSpread",
    "choicePreviewA",
    "choicePreviewB",
    "outcomeA",
    "outcomeB",
  ];

  return orderedTypes
    .filter((type) => renderImages[type])
    .map((type) => ({ type, prompt: prompts[type] }));
}

async function runImageJobsParallel(params: {
  jobs: Array<{ type: PathForgerImageType; prompt: string }>;
  apiKey: string;
  onboarding: {
    personalizedImages: boolean;
    visualStyle: string;
    tone: string;
    genre: string;
    ageRating: string;
  };
  imageModel: string;
  selfieDataUrl?: string;
  onProgress?: (progress: PathForgerPipelineProgress) => void;
  onImageUpdate?: (update: PathForgerImageStageUpdate) => void;
  abortSignal?: AbortSignal;
}): Promise<{
  images: Partial<Record<PathForgerImageType, PathForgerGeneratedImage>>;
  imageErrors: Partial<Record<PathForgerImageType, string>>;
}> {
  const images: Partial<Record<PathForgerImageType, PathForgerGeneratedImage>> = {};
  const imageErrors: Partial<Record<PathForgerImageType, string>> = {};

  if (params.jobs.length === 0) {
    return { images, imageErrors };
  }

  let nextJobIndex = 0;
  let completed = 0;
  const workerCount = Math.max(1, Math.min(MAX_PARALLEL_IMAGE_CALLS, params.jobs.length));
  const inFlight = new Set<Promise<void>>();

  const runOneJob = async (
    jobIndex: number,
    job: { type: PathForgerImageType; prompt: string },
  ) => {
    params.onProgress?.({
      stage: "generatingImages",
      message: `Rendering ${job.type} image (${jobIndex + 1}/${params.jobs.length})...`,
    });

    try {
      const image = await requestImageAsset({
        apiKey: params.apiKey,
        model: params.imageModel,
        prompt: job.prompt,
        imageType: job.type,
        selfieDataUrl: params.selfieDataUrl,
        includeSelfieReferenceImage: shouldUseSelfieReferenceImage({
          imageType: job.type,
          personalizedImages: params.onboarding.personalizedImages,
          selfieDataUrl: params.selfieDataUrl,
        }),
        styleHint: params.onboarding.visualStyle,
        toneHint: params.onboarding.tone,
        genreHint: params.onboarding.genre,
        ageRatingHint: params.onboarding.ageRating,
        signal: params.abortSignal,
      });

      images[job.type] = {
        prompt: job.prompt,
        ...image,
      };
      params.onImageUpdate?.({
        type: job.type,
        status: "success",
        image: images[job.type],
        completed: completed + 1,
        total: params.jobs.length,
      });
    } catch (error) {
      const rawErrorMessage = error instanceof Error ? error.message : "Image generation failed.";
      const errorMessage = normalizeImageGenerationErrorMessage(rawErrorMessage);
      imageErrors[job.type] = errorMessage;
      params.onImageUpdate?.({
        type: job.type,
        status: "error",
        errorMessage,
        completed: completed + 1,
        total: params.jobs.length,
      });
    } finally {
      completed += 1;
      params.onProgress?.({
        stage: "generatingImages",
        message: `Completed ${completed}/${params.jobs.length} image calls...`,
      });
    }
  };

  const startNext = () => {
    if (nextJobIndex >= params.jobs.length) {
      return false;
    }

    const jobIndex = nextJobIndex;
    nextJobIndex += 1;
    const job = params.jobs[jobIndex];
    if (!job) {
      return false;
    }

    const task = runOneJob(jobIndex, job).finally(() => {
      inFlight.delete(task);
    });
    inFlight.add(task);
    return true;
  };

  while (inFlight.size < workerCount && startNext()) {
    // Prime initial worker window.
  }

  while (inFlight.size > 0) {
    await Promise.race(inFlight);
    while (inFlight.size < workerCount && startNext()) {
      // Immediately backfill open worker slots.
    }
  }

  return {
    images,
    imageErrors,
  };
}

export async function runPathForgerImageStage(
  rawInput: RunPathForgerImageStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
  onImageUpdate?: (update: PathForgerImageStageUpdate) => void,
  options?: { abortSignal?: AbortSignal },
): Promise<{
  images: Partial<Record<PathForgerImageType, PathForgerGeneratedImage>>;
  imageErrors: Partial<Record<PathForgerImageType, string>>;
  imageModel: string;
  resolvedImagePrompts: z.infer<typeof imagePromptSetSchema>;
}> {
  const input = runImageStageInputSchema.parse(rawInput);
  const renderImages = {
    ...renderImageDefaults,
    ...(input.renderImages ?? {}),
  };
  const requestedImageModel = resolveImageModel(input.imageModel, input.defaultModel);
  const resolvedImagePrompts = {
    ...input.imagePrompts,
  };

  const orderedImageTypes: PathForgerImageType[] = [
    "cover",
    "outcomeB",
    "outcomeA",
    "choicePreviewB",
    "choicePreviewA",
    "chapterSpread",
  ];

  for (const type of orderedImageTypes) {
    const overridePrompt = input.imagePromptOverrides?.[type];
    if (typeof overridePrompt === "string" && overridePrompt.trim().length > 0) {
      resolvedImagePrompts[type] = overridePrompt.trim();
    }
  }

  if (renderImages.cover) {
    const coverTitle =
      input.coverTitle?.trim() || extractCoverTitleHintFromPrompt(resolvedImagePrompts.cover) || "";
    if (coverTitle.length > 0) {
      resolvedImagePrompts.cover = buildCoverPromptFromTitle({
        onboarding: input.onboarding,
        coverTitle,
        teaserMarkdown: resolvedImagePrompts.cover,
      });
    }
  }

  const imageJobs = buildImageJobList(resolvedImagePrompts, renderImages);
  const { images, imageErrors } = await runImageJobsParallel({
    jobs: imageJobs,
    apiKey: input.apiKey,
    onboarding: input.onboarding,
    imageModel: requestedImageModel,
    selfieDataUrl: input.selfieDataUrl,
    onProgress,
    onImageUpdate,
    abortSignal: options?.abortSignal,
  });

  const resolvedImageModel =
    Object.values(images).find((image): image is PathForgerGeneratedImage => Boolean(image))
      ?.model || requestedImageModel;

  return {
    images,
    imageErrors,
    imageModel: resolvedImageModel,
    resolvedImagePrompts,
  };
}

export async function runPathForgerOutcomeImageStage(
  rawInput: RunPathForgerOutcomeImageStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{
  branch: "A" | "B";
  imageType: "outcomeA" | "outcomeB";
  prompt: string;
  image: PathForgerGeneratedImage;
  imageModel: string;
}> {
  const input = runOutcomeImageStageInputSchema.parse(rawInput);
  const requestedImageModel = resolveImageModel(input.imageModel, input.defaultModel);
  const imageType = input.branch === "A" ? "outcomeA" : "outcomeB";
  const overridePrompt = input.imagePromptOverrides?.[imageType];
  const prompt =
    typeof overridePrompt === "string" && overridePrompt.trim().length > 0
      ? overridePrompt.trim()
      : input.imagePrompts[imageType];
  const choicePreviewPrompt =
    input.branch === "A" ? input.imagePrompts.choicePreviewA : input.imagePrompts.choicePreviewB;
  const outcomeNarrative = markdownToPlainText(input.outcomeMarkdown, 1200);
  const outcomePrompt = [
    prompt,
    "",
    "Outcome narrative context (must be reflected in the image):",
    `Option ${input.branch}${input.selectedChoiceLabel ? ` — ${input.selectedChoiceLabel}` : ""}`,
    outcomeNarrative,
    "",
    "Choice preview reference for this same option (do NOT mirror this composition):",
    markdownToPlainText(choicePreviewPrompt, 700),
    "",
    "Outcome image hard constraints:",
    "- Show post-decision aftermath with visible consequences.",
    "- Do not reuse the same camera angle, framing, beat timing, or neutral setup vibe from the choice preview image.",
    "- Make the world-state change legible at a glance (damage, injury/safety change, resource gain/loss, threat escalation/de-escalation).",
    "",
    "Render the aftermath and consequences from this outcome narrative, not the pre-choice setup.",
  ].join("\n");

  onProgress?.({
    stage: "generatingImages",
    message: `Rendering ${imageType} image...`,
  });

  const imageAsset = await requestImageAsset({
    apiKey: input.apiKey,
    model: requestedImageModel,
    prompt: outcomePrompt,
    imageType,
    selfieDataUrl: input.selfieDataUrl,
    includeSelfieReferenceImage: shouldUseSelfieReferenceImage({
      imageType,
      personalizedImages: input.onboarding.personalizedImages,
      selfieDataUrl: input.selfieDataUrl,
    }),
    styleHint: input.onboarding.visualStyle,
    toneHint: input.onboarding.tone,
    genreHint: input.onboarding.genre,
    ageRatingHint: input.onboarding.ageRating,
  });

  return {
    branch: input.branch,
    imageType,
    prompt: outcomePrompt,
    image: {
      prompt: outcomePrompt,
      ...imageAsset,
    },
    imageModel: imageAsset.model || requestedImageModel,
  };
}
