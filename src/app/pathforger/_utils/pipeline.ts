import { z } from "zod";
import { requestOpenAIJsonRaw } from "@/utils/openai/client";
import {
  OpenAIErrorPayload,
  PathForgerChapterResult,
  PathForgerGeneratedImage,
  PathForgerPipelineProgress,
  PathForgerPipelineResult,
  PathForgerPitchResult,
  RunPathForgerChapterStageInput,
  RunPathForgerCoverFromPitchStageInput,
  RunPathForgerPathLedgerUpdateStageInput,
  RunPathForgerPipelineInput,
  RunPathForgerPitchStageInput,
  RunPathForgerPremiseStageInput,
  RunPathForgerProtagonistNameStageInput,
  RunPathForgerToneStageInput,
  RunPathForgerVisualStyleStageInput,
} from "../_types/pipeline";
import { PathForgerPitchChoice } from "../_types/pitch";
import {
  pathForgerChapterCoreResultSchema,
  pathForgerChapterResultSchema,
  pathForgerPitchResultSchema,
  pathLedgerUpdateResultSchema,
  premiseResultSchema,
  protagonistNameResultSchema,
  runChapterStageInputSchema,
  runCoverFromPitchStageInputSchema,
  runPathLedgerUpdateStageInputSchema,
  runPipelineInputSchema,
  runPitchStageInputSchema,
  runPremiseStageInputSchema,
  runProtagonistNameStageInputSchema,
  runToneStageInputSchema,
  runVisualStyleStageInputSchema,
  toneResultSchema,
  visualStyleResultSchema,
} from "../_schemas/pipeline";
import {
  PATHFORGER_PIPELINE_STAGE_KEYS,
  PathForgerPipelineStateMachine,
  throwIfAborted,
} from "./pipeline/orchestrationStateMachine";
import { createPathForgerPipelineOrchestrationPolicy } from "./pipeline/orchestrationPolicyMap";
import {
  type PathForgerImageStageResult,
  type PathForgerPipelineOrchestrationContext,
} from "../_types/orchestrationTypes";
import { coerceStageModuleOutput, runPathForgerStageSequence } from "./pipeline/stageModules";
import { createGenerateChapterStage } from "./pipeline/stages/generateChapterStage";
import { createGenerateImagesStage } from "./pipeline/stages/generateImagesStage";
import { createGeneratePitchesStage } from "./pipeline/stages/generatePitchesStage";
import { createLoadKnowledgeStage } from "./pipeline/stages/loadKnowledgeStage";
import {
  renderImageDefaults,
  runPathForgerImageStage,
  runPathForgerOutcomeImageStage,
} from "./pipeline/imageOrchestration";
import {
  DEFAULT_TEXT_MODEL,
  resolveImageModel,
  resolveTextModel,
  resolveTextModelFallbackCandidates,
} from "./pipeline/modelPolicy";
import { loadPathForgerKnowledgeForStage } from "./pipeline/knowledgeCache";
import {
  buildCoverPromptFromPitch,
  normalizeChoiceRiskHud,
  normalizePitchResultTitles,
  resolvePitchDisplayTitle,
  stripChapterChoicesTail,
} from "./pipeline/textFormatting";
import { extractTextFromResponse, parseJsonResponse } from "./pipeline/responseParser";
import {
  buildPitchSystemPrompt,
  buildPitchUserPrompt,
  buildPremiseSystemPrompt,
  buildPremiseUserPrompt,
  buildProtagonistNameSystemPrompt,
  buildProtagonistNameUserPrompt,
  buildToneSystemPrompt,
  buildToneUserPrompt,
  buildVisualStyleSystemPrompt,
  buildVisualStyleUserPrompt,
  compactPromptHistoryValue,
  containsOverusedNeonDescriptor,
  findSimilarPremise,
  matchesBlockedPhrase,
  pickNameFromCandidates,
  sanitizePromptHistoryValues,
  softenOverusedNeonDescriptor,
} from "./pipeline/promptBuilders";
import {
  buildChapterCoreSystemPrompt,
  buildChapterCoreUserPrompt,
  buildChapterSystemPrompt,
  buildChapterUserPrompt,
  buildPathLedgerUpdateSystemPrompt,
  buildPathLedgerUpdateUserPrompt,
} from "./pipeline/chapterPromptBuilders";

export { renderImageDefaults, runPathForgerImageStage, runPathForgerOutcomeImageStage };

const TEXT_REQUEST_TIMEOUT_MS = 180_000;

export type RunPathForgerPipelineOptions = {
  abortSignal?: AbortSignal;
  onReplaySnapshot?: (snapshot: ReturnType<PathForgerPipelineStateMachine["getSnapshot"]>) => void;
};

const PATHFORGER_PIPELINE_ORCHESTRATION_POLICY = createPathForgerPipelineOrchestrationPolicy({
  retryDelayMs: (attempt) => attempt * 650,
});

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

function isTextTimeoutLikeError(error: unknown): boolean {
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

async function requestTextStage<TSchema extends z.ZodTypeAny>(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schema: TSchema;
  signal?: AbortSignal;
}): Promise<z.infer<TSchema>> {
  const requestBodyForModel = (model: string) => ({
    model,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: params.systemPrompt }],
      },
      {
        role: "user",
        content: [{ type: "input_text", text: params.userPrompt }],
      },
    ],
  });

  const shouldRetryWithTextModelFallback = (
    status: number,
    payload: Record<string, unknown>,
    message: string,
  ): boolean => {
    if (status < 400 || status >= 500) {
      return false;
    }

    const normalized = message.trim().toLowerCase();
    if (
      normalized.includes("model not found") ||
      normalized.includes("requested model") ||
      normalized.includes("unsupported model") ||
      normalized.includes("unknown model") ||
      normalized.includes("not supported with the responses api") ||
      normalized.includes("unsupported with the responses api")
    ) {
      return true;
    }

    const errorObj = payload.error;
    if (!errorObj || typeof errorObj !== "object") {
      return false;
    }

    const errorRecord = errorObj as Record<string, unknown>;
    const errorParam = typeof errorRecord.param === "string" ? errorRecord.param.trim() : "";
    const errorCode = typeof errorRecord.code === "string" ? errorRecord.code.trim() : "";
    return errorParam.toLowerCase() === "model" || errorCode.toLowerCase() === "model_not_found";
  };

  const runTextRequest = async (
    model: string,
  ): Promise<{ response: Response; data: Record<string, unknown> }> => {
    return requestOpenAIJsonRaw<Record<string, unknown>>({
      apiKey: params.apiKey,
      path: "/responses",
      method: "POST",
      body: requestBodyForModel(model),
      signal: params.signal,
      profile: "responses",
      profileOverrides: {
        timeoutMs: TEXT_REQUEST_TIMEOUT_MS,
      },
    });
  };

  const requestedModel = params.model.trim() || DEFAULT_TEXT_MODEL;
  let data: Record<string, unknown> | null = null;
  let lastFailureMessage = "";

  const modelAttemptOrder = [requestedModel, ...resolveTextModelFallbackCandidates(requestedModel)];
  for (const model of modelAttemptOrder) {
    let response: Response;
    let payload: Record<string, unknown>;
    try {
      ({ response, data: payload } = await runTextRequest(model));
    } catch (error) {
      if (isTextTimeoutLikeError(error)) {
        throw new Error(
          "PathForger text generation timed out while waiting for the model response. Please retry.",
        );
      }
      throw error;
    }

    if (response.ok) {
      data = payload;
      break;
    }

    const message = extractErrorMessage(payload);
    const resolvedMessage =
      message.length > 0 ? message : `PathForger text stage failed (${response.status}).`;
    lastFailureMessage = resolvedMessage;

    if (!shouldRetryWithTextModelFallback(response.status, payload, resolvedMessage)) {
      throw new Error(resolvedMessage);
    }
  }

  if (!data) {
    throw new Error(lastFailureMessage || "PathForger text stage failed.");
  }

  const text = extractTextFromResponse(data);
  if (!text) {
    throw new Error("PathForger text stage returned no text output.");
  }

  const json = parseJsonResponse(text);
  const parsed = params.schema.safeParse(json);
  if (!parsed.success) {
    throw new Error("PathForger generated an incomplete structured response. Please try again.");
  }

  return parsed.data;
}

export async function runPathForgerPitchStage(
  rawInput: RunPathForgerPitchStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{ pitches: PathForgerPitchResult; textModel: string }> {
  const input = runPitchStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingPitches",
    message: "Generating a selection of potential stories...",
  });
  const pitches = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildPitchSystemPrompt(knowledge),
    userPrompt: buildPitchUserPrompt(input.onboarding),
    schema: pathForgerPitchResultSchema,
  });
  const normalizedPitches = normalizePitchResultTitles(pitches);

  return {
    pitches: normalizedPitches,
    textModel,
  };
}

export async function runPathForgerCoverFromPitchStage(
  rawInput: RunPathForgerCoverFromPitchStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{
  selectedPitch: PathForgerPitchChoice;
  prompt: string;
  image: PathForgerGeneratedImage;
  imageModel: string;
}> {
  const input = runCoverFromPitchStageInputSchema.parse(rawInput);
  const requestedImageModel = resolveImageModel(input.imageModel, input.defaultModel);
  const prompt = buildCoverPromptFromPitch({
    onboarding: input.onboarding,
    pitchResult: input.pitchResult,
    selectedPitch: input.selectedPitch,
  });

  onProgress?.({
    stage: "generatingImages",
    message: "Rendering cover image...",
  });

  const imageStageResult = await runPathForgerImageStage(
    {
      apiKey: input.apiKey,
      onboarding: input.onboarding,
      imagePrompts: {
        cover: prompt,
        chapterSpread: prompt,
        choicePreviewA: prompt,
        choicePreviewB: prompt,
        outcomeA: prompt,
        outcomeB: prompt,
      },
      coverTitle: resolvePitchDisplayTitle({
        pitchResult: input.pitchResult,
        selectedPitch: input.selectedPitch,
      }),
      selectedBranch: undefined,
      defaultModel: input.defaultModel,
      imageModel: requestedImageModel,
      selfieDataUrl: input.selfieDataUrl,
      renderImages: {
        cover: true,
        chapterSpread: false,
        choicePreviewA: false,
        choicePreviewB: false,
        outcomeA: false,
        outcomeB: false,
      },
    },
    onProgress,
  );

  const imageAsset = imageStageResult.images.cover;
  if (!imageAsset) {
    throw new Error(
      imageStageResult.imageErrors.cover || "PathForger image stage returned no cover image.",
    );
  }

  return {
    selectedPitch: input.selectedPitch,
    prompt,
    image: imageAsset,
    imageModel: imageStageResult.imageModel || requestedImageModel,
  };
}

export async function runPathForgerProtagonistNameStage(
  rawInput: RunPathForgerProtagonistNameStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{ protagonistName: string; textModel: string }> {
  const input = runProtagonistNameStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingName",
    message: "Forging a protagonist name...",
  });
  const systemPrompt = buildProtagonistNameSystemPrompt(knowledge);
  const forbiddenSet = new Set(
    (input.forbiddenNames ?? []).map((name) => name.trim().toLowerCase()).filter(Boolean),
  );
  const baseSeed = input.randomnessSeed?.trim().length
    ? input.randomnessSeed.trim()
    : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  const generated = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt,
    userPrompt: buildProtagonistNameUserPrompt(input.onboarding, {
      forbiddenNames: input.forbiddenNames,
      randomnessSeed: baseSeed,
    }),
    schema: protagonistNameResultSchema,
  });

  const selectedFromFirst = pickNameFromCandidates({
    candidates: generated.protagonistNames,
    forbiddenNames: forbiddenSet,
    seed: baseSeed,
  });
  if (selectedFromFirst) {
    return {
      protagonistName: selectedFromFirst,
      textModel,
    };
  }

  const fallbackSeed = `${baseSeed}-retry`;
  const fallback = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt,
    userPrompt: [
      buildProtagonistNameUserPrompt(input.onboarding, {
        forbiddenNames: input.forbiddenNames,
        randomnessSeed: fallbackSeed,
      }),
      "",
      "Previous candidates were blocked. Return a completely different candidate list.",
    ].join("\n"),
    schema: protagonistNameResultSchema,
  });

  const selectedFromFallback = pickNameFromCandidates({
    candidates: fallback.protagonistNames,
    forbiddenNames: forbiddenSet,
    seed: fallbackSeed,
  });
  if (!selectedFromFallback) {
    throw new Error("Unable to generate a new protagonist name. Try again.");
  }

  return {
    protagonistName: selectedFromFallback,
    textModel,
  };
}

export async function runPathForgerVisualStyleStage(
  rawInput: RunPathForgerVisualStyleStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{ visualStyle: string; textModel: string }> {
  const input = runVisualStyleStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);
  const blockedVisualStyles = sanitizePromptHistoryValues(
    [...(input.previousVisualStyles ?? []), ...(input.forbiddenPhrases ?? [])],
    20,
  );

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingStyle",
    message: "Forging a visual style...",
  });
  const basePrompt = buildVisualStyleUserPrompt(input.onboarding, {
    forbiddenPhrases: input.forbiddenPhrases,
    previousVisualStyles: input.previousVisualStyles,
  });
  const generated = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildVisualStyleSystemPrompt(knowledge),
    userPrompt: basePrompt,
    schema: visualStyleResultSchema,
  });

  let visualStyle = generated.visualStyle.trim();
  const matchedBlockedVisualStyle = matchesBlockedPhrase(visualStyle, blockedVisualStyles);

  if (containsOverusedNeonDescriptor(visualStyle) || matchedBlockedVisualStyle) {
    const fallback = await requestTextStage({
      apiKey: input.apiKey,
      model: textModel,
      systemPrompt: buildVisualStyleSystemPrompt(knowledge),
      userPrompt: [
        basePrompt,
        "",
        ...(containsOverusedNeonDescriptor(visualStyle)
          ? [
              `The previous candidate was "${visualStyle}" and it overused neon-style wording.`,
              "Return a different visualStyle with no neon-lit/neon-drenched/neon-soaked phrasing.",
            ]
          : []),
        ...(matchedBlockedVisualStyle
          ? [
              `The previous candidate "${visualStyle}" repeated blocked wording ("${matchedBlockedVisualStyle}").`,
              "Return a clearly different visualStyle instead of rephrasing that prior style.",
            ]
          : []),
      ].join("\n"),
      schema: visualStyleResultSchema,
    });

    visualStyle = fallback.visualStyle.trim();
  }

  if (containsOverusedNeonDescriptor(visualStyle)) {
    visualStyle = softenOverusedNeonDescriptor(visualStyle);
  }

  return {
    visualStyle,
    textModel,
  };
}

export async function runPathForgerToneStage(
  rawInput: RunPathForgerToneStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{ tone: string; textModel: string }> {
  const input = runToneStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);
  const blockedTones = sanitizePromptHistoryValues(
    [...(input.previousTones ?? []), ...(input.forbiddenPhrases ?? [])],
    20,
  );

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingTone",
    message: "Forging story tone...",
  });
  const basePrompt = buildToneUserPrompt(input.onboarding, {
    forbiddenPhrases: input.forbiddenPhrases,
    previousTones: input.previousTones,
  });
  const generated = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildToneSystemPrompt(knowledge),
    userPrompt: basePrompt,
    schema: toneResultSchema,
  });
  let tone = generated.tone.trim();

  const matchedBlockedTone = matchesBlockedPhrase(tone, blockedTones);
  if (matchedBlockedTone) {
    const fallback = await requestTextStage({
      apiKey: input.apiKey,
      model: textModel,
      systemPrompt: buildToneSystemPrompt(knowledge),
      userPrompt: [
        basePrompt,
        "",
        `The previous candidate "${tone}" repeated blocked wording ("${matchedBlockedTone}").`,
        "Return a clearly different tone phrase, not a light rephrase of prior tones.",
      ].join("\n"),
      schema: toneResultSchema,
    });
    tone = fallback.tone.trim();
  }

  return {
    tone,
    textModel,
  };
}

export async function runPathForgerPremiseStage(
  rawInput: RunPathForgerPremiseStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{ premise: string; protagonistName: string; textModel: string }> {
  const input = runPremiseStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);
  const priorPremises = sanitizePromptHistoryValues(input.previousPremises, 8);
  const baseSeed = input.randomnessSeed?.trim().length
    ? input.randomnessSeed.trim()
    : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);
  const systemPrompt = buildPremiseSystemPrompt(knowledge);
  const buildPrompt = (seed: string, extraLines?: string[]): string =>
    [
      buildPremiseUserPrompt(input.onboarding, {
        forbiddenPhrases: input.forbiddenPhrases,
        previousPremises: priorPremises,
        randomnessSeed: seed,
      }),
      ...(extraLines && extraLines.length > 0 ? ["", ...extraLines] : []),
    ].join("\n");

  onProgress?.({
    stage: "generatingPremise",
    message: "Forging a genre-fit premise...",
  });
  const generated = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt,
    userPrompt: buildPrompt(baseSeed),
    schema: premiseResultSchema,
  });

  let premise = generated.premise.trim();
  let protagonistName = generated.protagonistName.trim();
  let similarityMatch = findSimilarPremise(premise, priorPremises);

  if (containsOverusedNeonDescriptor(premise) || similarityMatch) {
    const retrySeed = `${baseSeed}-retry-1`;
    const fallback = await requestTextStage({
      apiKey: input.apiKey,
      model: textModel,
      systemPrompt,
      userPrompt: buildPrompt(retrySeed, [
        ...(containsOverusedNeonDescriptor(premise)
          ? [
              `The previous premise was "${premise}" and used overused neon wording.`,
              "Return a different premise and protagonistName without neon-lit/neon-drenched/neon-soaked phrasing.",
            ]
          : []),
        ...(similarityMatch
          ? [
              `The previous premise was too similar to this earlier premise snapshot: "${compactPromptHistoryValue(similarityMatch.previousPremise)}".`,
              "Return a distinctly different premise and protagonistName with a different setting, central conflict, and narrative hook.",
            ]
          : []),
      ]),
      schema: premiseResultSchema,
    });

    premise = fallback.premise.trim();
    protagonistName = fallback.protagonistName.trim();
    similarityMatch = findSimilarPremise(premise, priorPremises);
  }

  if (similarityMatch) {
    const finalRetry = await requestTextStage({
      apiKey: input.apiKey,
      model: textModel,
      systemPrompt,
      userPrompt: buildPrompt(`${baseSeed}-retry-2`, [
        `Your previous candidate "${premise}" was still too close to earlier premise history: "${compactPromptHistoryValue(similarityMatch.previousPremise)}".`,
        "Return a clearly distinct premise and protagonistName. Do not reuse that setting, conflict, or hook.",
      ]),
      schema: premiseResultSchema,
    });
    premise = finalRetry.premise.trim();
    protagonistName = finalRetry.protagonistName.trim();
    similarityMatch = findSimilarPremise(premise, priorPremises);
  }

  if (containsOverusedNeonDescriptor(premise)) {
    premise = softenOverusedNeonDescriptor(premise);
  }

  if (similarityMatch) {
    throw new Error(
      "PathForger could not generate a premise distinct enough from recent suggestions. Please try regenerating.",
    );
  }

  return {
    premise,
    protagonistName,
    textModel,
  };
}

export async function runPathForgerPathLedgerUpdateStage(
  rawInput: RunPathForgerPathLedgerUpdateStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{ pathLedgerMarkdown: string; textModel: string }> {
  const input = runPathLedgerUpdateStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "updatingLedger",
    message: `Updating path ledger for Option ${input.selectedBranch}...`,
  });
  const generated = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildPathLedgerUpdateSystemPrompt(knowledge),
    userPrompt: buildPathLedgerUpdateUserPrompt(input),
    schema: pathLedgerUpdateResultSchema,
  });

  return {
    pathLedgerMarkdown: generated.pathLedgerMarkdown.trim(),
    textModel,
  };
}

export async function runPathForgerChapterCoreStage(
  rawInput: RunPathForgerChapterStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{
  chapter: PathForgerChapterResult;
  selectedPitch: PathForgerPitchChoice;
  textModel: string;
}> {
  const input = runChapterStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);
  const chapterNumber = input.chapterNumber ?? 1;
  const selectedPitchTitle = resolvePitchDisplayTitle({
    pitchResult: input.pitchResult,
    selectedPitch: input.selectedPitch,
  });

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingChapter",
    message: `Building Chapter ${chapterNumber} for ${selectedPitchTitle}...`,
  });
  const chapterCore = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildChapterCoreSystemPrompt(knowledge),
    userPrompt: buildChapterCoreUserPrompt({
      onboarding: input.onboarding,
      pitchResult: input.pitchResult,
      selectedPitch: input.selectedPitch,
      selectedBranch: input.selectedBranch,
      chapterNumber,
      previousChapterMarkdown: input.previousChapterMarkdown,
      previousOutcomeMarkdown: input.previousOutcomeMarkdown,
      currentPathLedgerMarkdown: input.currentPathLedgerMarkdown,
    }),
    schema: pathForgerChapterCoreResultSchema,
  });

  const chapter: PathForgerChapterResult = {
    ...chapterCore,
    chapterMarkdown: stripChapterChoicesTail(chapterCore.chapterMarkdown),
    choices: normalizeChoiceRiskHud(chapterCore.choices),
    outcomeAMarkdown: chapterCore.outcomeAMarkdown,
    outcomeBMarkdown: chapterCore.outcomeBMarkdown,
    imagePrompts: chapterCore.imagePrompts,
  };

  return {
    chapter,
    selectedPitch: input.selectedPitch,
    textModel,
  };
}

export async function runPathForgerChapterStage(
  rawInput: RunPathForgerChapterStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{
  chapter: PathForgerChapterResult;
  selectedPitch: PathForgerPitchChoice;
  textModel: string;
}> {
  const input = runChapterStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);
  const chapterNumber = input.chapterNumber ?? 1;
  const selectedPitchTitle = resolvePitchDisplayTitle({
    pitchResult: input.pitchResult,
    selectedPitch: input.selectedPitch,
  });

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingChapter",
    message: `Building Chapter ${chapterNumber} for ${selectedPitchTitle}...`,
  });
  const chapter = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildChapterSystemPrompt(knowledge),
    userPrompt: buildChapterUserPrompt({
      onboarding: input.onboarding,
      pitchResult: input.pitchResult,
      selectedPitch: input.selectedPitch,
      selectedBranch: input.selectedBranch,
      chapterNumber,
      previousChapterMarkdown: input.previousChapterMarkdown,
      previousOutcomeMarkdown: input.previousOutcomeMarkdown,
      currentPathLedgerMarkdown: input.currentPathLedgerMarkdown,
    }),
    schema: pathForgerChapterResultSchema,
  });

  const normalizedChapter: PathForgerChapterResult = {
    ...chapter,
    chapterMarkdown: stripChapterChoicesTail(chapter.chapterMarkdown),
    choices: normalizeChoiceRiskHud(chapter.choices),
  };

  return {
    chapter: normalizedChapter,
    selectedPitch: input.selectedPitch,
    textModel,
  };
}

export async function runPathForgerPipeline(
  rawInput: RunPathForgerPipelineInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
  options?: RunPathForgerPipelineOptions,
): Promise<PathForgerPipelineResult> {
  const input = runPipelineInputSchema.parse(rawInput);
  const contextInitial: PathForgerPipelineOrchestrationContext = {
    input,
    renderImages: {
      ...renderImageDefaults,
      ...(input.renderImages ?? {}),
    },
    textModel: resolveTextModel(input.textModel, input.defaultModel),
    imageModel: resolveImageModel(input.imageModel, input.defaultModel),
    abortSignal: options?.abortSignal,
  };
  const machine = new PathForgerPipelineStateMachine([...PATHFORGER_PIPELINE_STAGE_KEYS]);
  machine.start();
  const loadKnowledgeStage = createLoadKnowledgeStage({
    loadKnowledge: async () => loadPathForgerKnowledgeForStage(),
  });

  const pitchStage = createGeneratePitchesStage({
    generatePitches: async (context) => {
      if (!context.knowledge) {
        throw new Error("PathForger orchestration missing knowledge before pitch generation.");
      }

      const pitches = await requestTextStage({
        apiKey: context.input.apiKey,
        model: context.textModel,
        systemPrompt: buildPitchSystemPrompt(context.knowledge),
        userPrompt: buildPitchUserPrompt(context.input.onboarding),
        schema: pathForgerPitchResultSchema,
        signal: context.abortSignal,
      });
      const normalizedPitches = normalizePitchResultTitles(pitches);
      const selectedPitch = context.input.selectedPitch ?? normalizedPitches.recommendedPitch;

      return {
        pitches: normalizedPitches,
        selectedPitch,
      };
    },
  });

  const chapterStage = createGenerateChapterStage({
    getStartMessage: (context) => {
      const selectedPitchTitle =
        context.pitches && context.selectedPitch
          ? resolvePitchDisplayTitle({
              pitchResult: context.pitches,
              selectedPitch: context.selectedPitch,
            })
          : "selected pitch";
      return `Building Chapter 1 for ${selectedPitchTitle}...`;
    },
    generateChapter: async (context) => {
      if (!context.knowledge || !context.pitches || !context.selectedPitch) {
        throw new Error(
          "PathForger orchestration missing pitch context before chapter generation.",
        );
      }

      return requestTextStage({
        apiKey: context.input.apiKey,
        model: context.textModel,
        systemPrompt: buildChapterSystemPrompt(context.knowledge),
        userPrompt: buildChapterUserPrompt({
          onboarding: context.input.onboarding,
          pitchResult: context.pitches,
          selectedPitch: context.selectedPitch,
          selectedBranch: context.input.selectedBranch,
        }),
        schema: pathForgerChapterResultSchema,
        signal: context.abortSignal,
      });
    },
  });

  const imageStage = createGenerateImagesStage({
    generateImages: async (context): Promise<PathForgerImageStageResult> => {
      if (!context.chapter || !context.pitches || !context.selectedPitch) {
        throw new Error(
          "PathForger orchestration missing chapter context before image generation.",
        );
      }

      const selectedPitchTitle = resolvePitchDisplayTitle({
        pitchResult: context.pitches,
        selectedPitch: context.selectedPitch,
      });

      return runPathForgerImageStage(
        {
          apiKey: context.input.apiKey,
          onboarding: context.input.onboarding,
          imagePrompts: context.chapter.imagePrompts,
          coverTitle: selectedPitchTitle,
          selectedBranch: context.input.selectedBranch,
          selfieDataUrl: context.input.selfieDataUrl,
          imageModel: context.imageModel,
          imagePromptOverrides: context.input.imagePromptOverrides,
          renderImages: context.renderImages,
        },
        onProgress,
        undefined,
        { abortSignal: context.abortSignal },
      );
    },
  });

  let context = contextInitial;

  try {
    throwIfAborted(
      options?.abortSignal,
      PATHFORGER_PIPELINE_ORCHESTRATION_POLICY.cancelMessages.beforeStart,
    );

    const orchestrationModules = [
      coerceStageModuleOutput(loadKnowledgeStage),
      coerceStageModuleOutput(pitchStage),
      coerceStageModuleOutput(chapterStage),
      coerceStageModuleOutput(imageStage),
    ] as const;

    context = await runPathForgerStageSequence({
      modules: orchestrationModules,
      stagePolicyMap: PATHFORGER_PIPELINE_ORCHESTRATION_POLICY.stagePolicyMap,
      context,
      machine,
      onProgress,
      abortSignal: options?.abortSignal,
    });

    throwIfAborted(
      options?.abortSignal,
      PATHFORGER_PIPELINE_ORCHESTRATION_POLICY.cancelMessages.beforeFinalization,
    );
    machine.complete();

    if (
      !context.pitches ||
      !context.selectedPitch ||
      !context.chapter ||
      !context.imageStageResult
    ) {
      throw new Error("PathForger pipeline finished with incomplete orchestration state.");
    }

    const chapterWithResolvedPrompts = {
      ...context.chapter,
      imagePrompts: context.imageStageResult.resolvedImagePrompts,
    };

    return {
      pitches: context.pitches,
      chapter: chapterWithResolvedPrompts,
      selectedPitch: context.selectedPitch,
      images: context.imageStageResult.images,
      imageErrors: context.imageStageResult.imageErrors,
      textModel: context.textModel,
      imageModel: context.imageStageResult.imageModel,
    };
  } catch (error) {
    throw PATHFORGER_PIPELINE_ORCHESTRATION_POLICY.mapPipelineError({
      error,
      machine,
    });
  } finally {
    options?.onReplaySnapshot?.(machine.getSnapshot());
  }
}
