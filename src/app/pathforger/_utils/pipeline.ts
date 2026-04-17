import { toJSONSchema, z } from "zod";
import { withBasePath } from "@/utils/basePath";
import { KnowledgeDocFile, OpenAIErrorPayload, OpenAIInputContentPart, PathForgerBranchChoice, PathForgerChapterResult, PathForgerGeneratedImage, PathForgerImageStageUpdate, PathForgerImageType, PathForgerOnboardingInput, PathForgerPipelineProgress, PathForgerPipelineResult, PathForgerPitchResult, RunPathForgerChapterStageInput, RunPathForgerCoverFromPitchStageInput, RunPathForgerImageStageInput, RunPathForgerOutcomeImageStageInput, RunPathForgerPathLedgerUpdateStageInput, RunPathForgerPipelineInput, RunPathForgerPitchStageInput, RunPathForgerPremiseStageInput, RunPathForgerProtagonistNameStageInput, RunPathForgerToneStageInput, RunPathForgerVisualStyleStageInput } from "../_types/pipeline";
import { KNOWLEDGE_DOC_FILES } from "../_consts/knowledge";
import { PathForgerPitchChoice } from "../_types/pitch";
import { imagePromptSetSchema, pathForgerChapterCoreResultSchema, pathForgerChapterResultSchema, pathForgerPitchResultSchema, pathLedgerUpdateResultSchema, premiseResultSchema, protagonistNameResultSchema, runChapterStageInputSchema, runCoverFromPitchStageInputSchema, runImageStageInputSchema, runOutcomeImageStageInputSchema, runPathLedgerUpdateStageInputSchema, runPipelineInputSchema, runPitchStageInputSchema, runPremiseStageInputSchema, runProtagonistNameStageInputSchema, runToneStageInputSchema, runVisualStyleStageInputSchema, toneResultSchema, visualStyleResultSchema } from "../_schemas/pipeline";

const RESPONSES_URL = "https://api.openai.com/v1/responses";
const DEFAULT_TEXT_MODEL = "gpt-4.1-mini";
const DEFAULT_IMAGE_MODEL = "gpt-image-1-mini";
const TARGET_IMAGE_SIZE = "1024x1024";
const MAX_PARALLEL_IMAGE_CALLS = 6;
const IMAGE_RATE_LIMIT_MAX_RETRIES = 3;
const IMAGE_RATE_LIMIT_BASE_DELAY_MS = 1_500;
const SELFIE_REFERENCE_IMAGE_TYPES: ReadonlySet<PathForgerImageType> = new Set([
  "choicePreviewA",
  "choicePreviewB",
  "outcomeA",
  "outcomeB",
]);
const OVERUSED_NEON_PHRASES = [
  "neon-lit",
  "neon lit",
  "neon-drenched",
  "neon drenched",
  "neon-soaked",
  "neon soaked",
] as const;

function isImageModelId(modelId: string): boolean {
  return /^gpt-image/i.test(modelId.trim());
}

function resolveTextModel(
  explicitModel: string | undefined,
  defaultModel: string | undefined,
): string {
  const explicit = explicitModel?.trim() ?? "";
  if (explicit.length > 0) {
    return explicit;
  }

  const fallback = defaultModel?.trim() ?? "";
  if (fallback.length > 0 && !isImageModelId(fallback)) {
    return fallback;
  }

  return DEFAULT_TEXT_MODEL;
}

function resolveImageModel(
  explicitModel: string | undefined,
  defaultModel: string | undefined,
): string {
  const explicit = explicitModel?.trim() ?? "";
  if (explicit.length > 0) {
    return explicit;
  }

  const fallback = defaultModel?.trim() ?? "";
  if (fallback.length > 0 && isImageModelId(fallback)) {
    return fallback;
  }

  return DEFAULT_IMAGE_MODEL;
}

function shouldUseSelfieReferenceImage(params: {
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

const renderImageDefaults: Record<PathForgerImageType, boolean> = {
  cover: true,
  chapterSpread: true,
  choicePreviewA: true,
  choicePreviewB: true,
  outcomeA: true,
  outcomeB: true,
};

type PathForgerKnowledge = {
  mainPrompt: string;
  docs: Record<KnowledgeDocFile, string>;
};

type PathForgerKnowledgeCachePayload = {
  version: string;
  knowledge: PathForgerKnowledge;
};

const PATHFORGER_KNOWLEDGE_CACHE_KEY = "pathforger-knowledge-cache-v1";
const PATHFORGER_KNOWLEDGE_CACHE_VERSION = `v2:docs:${KNOWLEDGE_DOC_FILES.join("|")}`;

let knowledgePromise: Promise<PathForgerKnowledge> | null = null;
let knowledgeCache: PathForgerKnowledge | null = null;

function isPathForgerKnowledge(value: unknown): value is PathForgerKnowledge {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<PathForgerKnowledge>;
  if (typeof candidate.mainPrompt !== "string") {
    return false;
  }
  if (!candidate.docs || typeof candidate.docs !== "object") {
    return false;
  }

  for (const docFile of KNOWLEDGE_DOC_FILES) {
    if (typeof candidate.docs[docFile] !== "string") {
      return false;
    }
  }

  return true;
}

function readKnowledgeFromSessionCache(): PathForgerKnowledge | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(PATHFORGER_KNOWLEDGE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PathForgerKnowledgeCachePayload;
    if (
      !parsed ||
      parsed.version !== PATHFORGER_KNOWLEDGE_CACHE_VERSION ||
      !isPathForgerKnowledge(parsed.knowledge)
    ) {
      window.sessionStorage.removeItem(PATHFORGER_KNOWLEDGE_CACHE_KEY);
      return null;
    }

    return parsed.knowledge;
  } catch {
    return null;
  }
}

function hasKnowledgeSessionCache(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const raw = window.sessionStorage.getItem(PATHFORGER_KNOWLEDGE_CACHE_KEY);
    return Boolean(raw);
  } catch {
    return false;
  }
}

function writeKnowledgeToSessionCache(knowledge: PathForgerKnowledge): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const payload: PathForgerKnowledgeCachePayload = {
      version: PATHFORGER_KNOWLEDGE_CACHE_VERSION,
      knowledge,
    };
    window.sessionStorage.setItem(
      PATHFORGER_KNOWLEDGE_CACHE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // Ignore storage failures (private mode/quota).
  }
}

async function readStaticText(path: string): Promise<string> {
  const response = await fetch(withBasePath(path), { cache: "force-cache" });
  if (!response.ok) {
    throw new Error(`Failed to load ${path} (${response.status}).`);
  }

  return (await response.text()).trim();
}

async function loadPathForgerKnowledge(): Promise<PathForgerKnowledge> {
  if (knowledgeCache) {
    return knowledgeCache;
  }

  if (!knowledgePromise) {
    knowledgePromise = (async () => {
      const cachedKnowledge = readKnowledgeFromSessionCache();
      if (cachedKnowledge) {
        knowledgeCache = cachedKnowledge;
        return cachedKnowledge;
      }

      const [mainPrompt, ...docContents] = await Promise.all([
        readStaticText("/pathforger/MAIN_PROMPT.txt"),
        ...KNOWLEDGE_DOC_FILES.map((file) =>
          readStaticText(`/pathforger/knowledge-files/${file}`),
        ),
      ]);

      const docs = KNOWLEDGE_DOC_FILES.reduce<Record<KnowledgeDocFile, string>>(
        (acc, file, index) => {
          acc[file] = docContents[index];
          return acc;
        },
        {} as Record<KnowledgeDocFile, string>,
      );

      const knowledge: PathForgerKnowledge = {
        mainPrompt,
        docs,
      };

      knowledgeCache = knowledge;
      writeKnowledgeToSessionCache(knowledge);

      return knowledge;
    })();
  }

  return knowledgePromise;
}

async function loadPathForgerKnowledgeForStage(
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<PathForgerKnowledge> {
  const shouldAnnounceLoading =
    !knowledgeCache && !knowledgePromise && !hasKnowledgeSessionCache();
  if (shouldAnnounceLoading) {
    onProgress?.({
      stage: "loadingKnowledge",
      message: "Loading PathForger knowledge files...",
    });
  }

  return loadPathForgerKnowledge();
}

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

function resolveRateLimitDelayMs(
  response: Response,
  message: string,
  attempt: number,
): number {
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
      const multiplier =
        unit.startsWith("ms") || unit.startsWith("millisecond") ? 1 : 1_000;
      return Math.max(500, Math.ceil(numeric * multiplier));
    }
  }

  const exponential = IMAGE_RATE_LIMIT_BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 450);
  return exponential + jitter;
}

function extractTextFromResponse(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const value = payload as Record<string, unknown>;
  if (
    typeof value.output_text === "string" &&
    value.output_text.trim().length > 0
  ) {
    return value.output_text.trim();
  }

  const chunks: string[] = [];

  if (Array.isArray(value.output)) {
    for (const item of value.output as Array<Record<string, unknown>>) {
      if (typeof item?.text === "string") {
        chunks.push(item.text);
      }

      if (Array.isArray(item?.content)) {
        for (const entry of item.content as Array<Record<string, unknown>>) {
          if (typeof entry?.text === "string") {
            chunks.push(entry.text);
          }
          if (typeof entry?.output_text === "string") {
            chunks.push(entry.output_text);
          }
        }
      }
    }
  }

  return chunks.join("\n").trim();
}

function extractJsonCandidate(raw: string): string {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const maybeJson = fencedMatch?.[1]?.trim() ?? raw.trim();

  if (maybeJson.startsWith("{") && maybeJson.endsWith("}")) {
    return maybeJson;
  }

  const firstBrace = maybeJson.indexOf("{");
  const lastBrace = maybeJson.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return maybeJson.slice(firstBrace, lastBrace + 1);
  }

  return maybeJson;
}

function normalizeForHeadingMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_>#~]/g, " ")
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripRiskHudHeading(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const normalized = normalizeForHeadingMatch(line);
    return !normalized.startsWith("risk hud");
  });

  return filtered.join("\n").trim();
}

function injectRiskHudEmojis(markdown: string): string {
  const labelEmojiMap: Array<{ label: string; emoji: string }> = [
    { label: "Success Probability", emoji: "🎯" },
    { label: "Threat Level", emoji: "⚠️" },
    { label: "Injury Risk", emoji: "🩹" },
    { label: "Resource Cost", emoji: "💸" },
    { label: "Reward Potential", emoji: "🏆" },
    { label: "Key Risk Factors", emoji: "🧭" },
  ];

  return markdown
    .split(/\r?\n/)
    .map((line) => {
      let nextLine = line;
      for (const { label, emoji } of labelEmojiMap) {
        if (nextLine.includes(emoji)) {
          continue;
        }

        const labelPattern = new RegExp(
          `\\b${label.replace(/\s+/g, "\\s+")}\\b`,
          "i",
        );
        if (labelPattern.test(nextLine)) {
          nextLine = nextLine.replace(labelPattern, `${emoji} $&`);
        }
      }

      return nextLine;
    })
    .join("\n")
    .trim();
}

function toRiskHudLineItems(markdown: string): string {
  const riskMarkers: Array<{ label: string; emoji: string }> = [
    { label: "Success Probability", emoji: "🎯" },
    { label: "Threat Level", emoji: "⚠️" },
    { label: "Injury Risk", emoji: "🩹" },
    { label: "Resource Cost", emoji: "💸" },
    { label: "Reward Potential", emoji: "🏆" },
    { label: "Key Risk Factors", emoji: "🧭" },
  ];

  const markerPatterns = riskMarkers.map(
    ({ label, emoji }) =>
      `${emoji.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*${label.replace(/\s+/g, "\\s+")}\\s*:`,
  );
  const markerAlternation = markerPatterns.join("|");
  const markerChunkPattern = new RegExp(
    `(${markerAlternation})[\\s\\S]*?(?=(${markerAlternation})|$)`,
    "gi",
  );

  const matches = Array.from(markdown.matchAll(markerChunkPattern)).map(
    (match) => match[0].trim(),
  );
  if (matches.length === 0) {
    return markdown.trim();
  }

  const normalizedLines = matches
    .map((line) => line.replace(/^\s*[-+•]\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (normalizedLines.length === 0) {
    return markdown.trim();
  }

  // Keep the Risk HUD as plain markdown lines and normalize to single
  // line breaks between sections (instead of forcing bullet list formatting).
  return normalizedLines.join("\n").trim();
}

function normalizeRiskHudMarkdownLayout(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s+/, "")
        .replace(/^\s{0,3}>\s+/, "")
        .replace(/^\s*[-+*•]\s+/, "")
        .replace(/[*_`~]/g, "")
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
}

function sanitizeRiskHudMarkdown(markdown: string): string {
  const withoutHeading = stripRiskHudHeading(markdown);
  const normalized = normalizeRiskHudMarkdownLayout(withoutHeading);
  const withEmojis = injectRiskHudEmojis(normalized);
  return toRiskHudLineItems(withEmojis);
}

function stripChapterChoicesTail(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const sectionKeywordPattern =
    "(?:path\\s*ledger|pathledger|your\\s+choices?|choices?|option\\s*[ab]|outcome\\s*[ab]|continue\\s+prompt|risk\\s*hud|image\\s*prompts?)";

  const cutIndex = lines.findIndex((line) => {
    const normalized = normalizeForHeadingMatch(line);
    if (
      normalized === "your choices" ||
      normalized.startsWith("your choices ") ||
      normalized === "choices" ||
      normalized === "path ledger" ||
      normalized === "pathledger" ||
      normalized.startsWith("path ledger ") ||
      normalized.startsWith("pathledger ") ||
      normalized.startsWith("option a") ||
      normalized.startsWith("option b") ||
      normalized.startsWith("outcome a") ||
      normalized.startsWith("outcome b") ||
      normalized.startsWith("continue prompt") ||
      normalized.startsWith("risk hud") ||
      normalized.startsWith("image prompts") ||
      normalized.startsWith("image prompt")
    ) {
      return true;
    }

    if (
      new RegExp(`^\\s*#{1,6}\\s*${sectionKeywordPattern}\\b`, "i").test(line)
    ) {
      return true;
    }

    if (
      new RegExp(
        `^\\s*(?:[-+*]\\s*)?${sectionKeywordPattern}\\s*(?:[:—–-]|$)`,
        "i",
      ).test(line)
    ) {
      return true;
    }

    return false;
  });

  const narrative =
    cutIndex < 0 ? markdown.trim() : lines.slice(0, cutIndex).join("\n").trim();

  return narrative.replace(/\n\s*(?:[-*_]\s*){3,}\s*$/g, "").trim();
}

function normalizeChoiceRiskHud<T extends { riskHudMarkdown: string }>(
  choices: T[],
): T[] {
  return choices.map((choice) => ({
    ...choice,
    riskHudMarkdown: sanitizeRiskHudMarkdown(choice.riskHudMarkdown),
  }));
}

function extractCoverTitleHintFromPrompt(prompt: string): string | null {
  const lines = prompt
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const titleLine = line.match(/^title\s*[:\-]\s*["“]?(.+?)["”]?$/i);
    if (titleLine?.[1]?.trim()) {
      return titleLine[1].trim();
    }
  }

  const quotedTitle = prompt.match(
    /(?:title|book title)\s*[:\-]?\s*["“]([^"”\n]{2,120})["”]/i,
  );
  if (quotedTitle?.[1]?.trim()) {
    return quotedTitle[1].trim();
  }

  return null;
}

function markdownToPlainText(markdown: string, maxChars = 360): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxChars) {
    return plain;
  }

  return `${plain.slice(0, maxChars - 1).trimEnd()}…`;
}

function buildCoverPromptFromPitch(input: {
  onboarding: PathForgerOnboardingInput;
  pitchResult: PathForgerPitchResult;
  selectedPitch: PathForgerPitchChoice;
}): string {
  const selectedPitch = input.pitchResult.pitches.find(
    (pitch) => pitch.id === input.selectedPitch,
  );

  if (!selectedPitch) {
    throw new Error(`Unable to resolve selected pitch: ${input.selectedPitch}`);
  }

  const selectedPitchTitle = normalizePitchTitle(
    selectedPitch.title,
    `Pitch ${selectedPitch.id}`,
  );
  const fallbackAdventureTitle = input.pitchResult.adventureTitle.trim();
  const coverTitle =
    selectedPitchTitle.length > 0 ? selectedPitchTitle : fallbackAdventureTitle;

  return buildCoverPromptFromTitle({
    onboarding: input.onboarding,
    coverTitle,
    teaserMarkdown: selectedPitch.markdown,
    contextTitle:
      fallbackAdventureTitle.length > 0 ? fallbackAdventureTitle : undefined,
  });
}

function buildCoverPromptFromTitle(input: {
  onboarding: PathForgerOnboardingInput;
  coverTitle: string;
  teaserMarkdown?: string;
  contextTitle?: string;
}): string {
  const sanitizedCoverTitle = input.coverTitle.trim();
  const teaser = input.teaserMarkdown
    ? markdownToPlainText(input.teaserMarkdown, 260)
    : "";
  const contextTitle = input.contextTitle?.trim() ?? "";

  return [
    "Create a premium front-facing novel book cover illustration.",
    `Book Title: "${sanitizedCoverTitle}"`,
    teaser ? `Story Teaser: ${teaser}` : "",
    contextTitle ? `Story Context Title: "${contextTitle}"` : "",
    "",
    "Cover requirements:",
    "- The main title text must be large, high-contrast, clean, and legible.",
    "- The title must read exactly as written in the Book Title field.",
    "- Never render chapter labels or chapter titles (e.g., 'Chapter 1', 'Chapter N — ...').",
    "- Do not include any text besides the exact Book Title.",
    "- Composition should feel like a real published book cover (not a scene still).",
    "- Keep supporting text minimal and subordinate to the title.",
    "",
    `Genre: ${input.onboarding.genre}`,
    `Tone: ${input.onboarding.tone}`,
    `Visual Style: ${input.onboarding.visualStyle}`,
    `Age Rating: ${input.onboarding.ageRating}`,
  ].join("\n");
}

function resolvePitchDisplayTitle(input: {
  pitchResult: PathForgerPitchResult;
  selectedPitch: PathForgerPitchChoice;
}): string {
  const selectedPitch = input.pitchResult.pitches.find(
    (pitch) => pitch.id === input.selectedPitch,
  );
  const title = selectedPitch
    ? normalizePitchTitle(selectedPitch.title, `Pitch ${input.selectedPitch}`)
    : "";
  if (title && title.length > 0) {
    return title;
  }

  return `Pitch ${input.selectedPitch}`;
}

const MAX_PITCH_TITLE_WORDS = 6;
const MAX_PITCH_TITLE_CHARS = 56;

function clampTitleLength(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  const cutoff = value.slice(0, maxChars);
  const lastSpace = cutoff.lastIndexOf(" ");
  if (lastSpace >= 0) {
    return cutoff.slice(0, lastSpace).trim();
  }
  return cutoff.trim();
}

function normalizePitchTitle(rawTitle: string, fallbackTitle: string): string {
  const titleWithoutParens = rawTitle
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ");

  const firstPartOnly = titleWithoutParens
    .split(/[:|]/)[0]
    ?.split(/\s+[—–-]\s+/)[0];

  const normalized = (firstPartOnly ?? titleWithoutParens)
    .replace(/[`*_#]/g, " ")
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "")
    .replace(/[.,;!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalized
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, MAX_PITCH_TITLE_WORDS);
  const byWords = words.join(" ").trim();
  const byChars = clampTitleLength(byWords, MAX_PITCH_TITLE_CHARS);
  const clean = byChars.replace(/\s+/g, " ").trim();

  if (clean.length > 0) {
    return clean;
  }
  return fallbackTitle;
}

function normalizePitchResultTitles(
  pitchResult: PathForgerPitchResult,
): PathForgerPitchResult {
  const usedTitles = new Set<string>();
  const pitches = pitchResult.pitches.map((pitch) => {
    const fallback = `Pitch ${pitch.id}`;
    let title = normalizePitchTitle(pitch.title, fallback);

    const dedupeKey = title.toLowerCase();
    if (usedTitles.has(dedupeKey)) {
      const suffix = pitch.id;
      const base = clampTitleLength(
        title,
        Math.max(8, MAX_PITCH_TITLE_CHARS - suffix.length - 1),
      );
      title = `${base} ${suffix}`.trim();
    }

    usedTitles.add(title.toLowerCase());

    return {
      ...pitch,
      title,
    };
  });

  return {
    ...pitchResult,
    pitches,
  };
}

function parseJsonResponse(rawText: string): unknown {
  const candidate = extractJsonCandidate(rawText);

  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("PathForger text stage returned invalid JSON.");
  }
}

function buildKnowledgeSection(
  knowledge: PathForgerKnowledge,
  selectedDocs: readonly KnowledgeDocFile[],
): string {
  return selectedDocs
    .map((docName) => `## ${docName}\n${knowledge.docs[docName]}`)
    .join("\n\n");
}

const PITCH_STAGE_DOCS: readonly KnowledgeDocFile[] = [
  "00_OVERVIEW.md",
  "10_ONBOARDING.md",
  "20_ADVENTURE_PITCHES.md",
  "70_GENRES.md",
  "90_EXAMPLES.md",
] as const;

const NAME_STAGE_DOCS: readonly KnowledgeDocFile[] = [
  "00_OVERVIEW.md",
  "10_ONBOARDING.md",
  "70_GENRES.md",
] as const;

const PREMISE_STAGE_DOCS: readonly KnowledgeDocFile[] = [
  "00_OVERVIEW.md",
  "10_ONBOARDING.md",
  "70_GENRES.md",
] as const;

const CHAPTER_STAGE_DOCS: readonly KnowledgeDocFile[] = [
  "00_OVERVIEW.md",
  "30_CHAPTER_ENGINE.md",
  "40_RISK_SYSTEM.md",
  "50_CONTINUITY.md",
  "60_IMAGE_SYSTEM.md",
  "70_GENRES.md",
  "80_ENDINGS.md",
  "90_EXAMPLES.md",
] as const;

function buildPitchSystemPrompt(knowledge: PathForgerKnowledge): string {
  return [
    "You are PathForger's text pipeline (stage 1: onboarding + A/B/C pitches).",
    "Produce polished markdown-forward narrative outputs and strict JSON only.",
    "Follow MAIN_PROMPT and selected knowledge docs as your operating manual.",
    "Return JSON only. Do not include markdown fences.",
    "",
    "MAIN_PROMPT:",
    knowledge.mainPrompt,
    "",
    "KNOWLEDGE DOCS:",
    buildKnowledgeSection(knowledge, PITCH_STAGE_DOCS),
  ].join("\n");
}

function buildPitchUserPrompt(onboarding: PathForgerOnboardingInput): string {
  return [
    "Generate PathForger startup content from this onboarding payload.",
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(pathForgerPitchResultSchema), null, 2),
    "",
    "Output rules:",
    "- onboardingRecapMarkdown should be concise and cinematic (markdown).",
    "- pitches must contain exactly A/B/C and each pitch markdown should be 3-5 paragraphs.",
    "- Each pitch title must be short and punchy like a book title (2-6 words preferred).",
    "- Do not use parentheses in pitch titles.",
    "- Avoid verbose subtitle-style title suffixes or explanatory labels.",
    "- recommendedPitch should be the strongest fit for the provided onboarding.",
    "- choosePromptMarkdown should end by asking for A, B, or C.",
    "",
    "Onboarding JSON:",
    JSON.stringify(onboarding, null, 2),
  ].join("\n");
}

function buildProtagonistNameSystemPrompt(
  knowledge: PathForgerKnowledge,
): string {
  return [
    "You are PathForger's story setup assistant.",
    "Generate exactly one memorable protagonist name based on the onboarding payload.",
    "Use genre, tone, premise, age rating, and style cues to fit the story world.",
    "Avoid reusing names from examples and avoid obvious repeated defaults.",
    "Return JSON only. Do not include markdown fences.",
    "",
    "MAIN_PROMPT:",
    knowledge.mainPrompt,
    "",
    "KNOWLEDGE DOCS:",
    buildKnowledgeSection(knowledge, NAME_STAGE_DOCS),
  ].join("\n");
}

function buildProtagonistNameUserPrompt(
  onboarding: PathForgerOnboardingInput,
  options?: {
    forbiddenNames?: string[];
    randomnessSeed?: string;
  },
): string {
  const forbiddenList =
    options?.forbiddenNames?.filter((name) => name.trim().length > 0) ?? [];

  return [
    "Generate one protagonist name for this adventure setup.",
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(protagonistNameResultSchema), null, 2),
    "",
    "Output rules:",
    "- Return only protagonistNames.",
    "- Provide 6 to 12 distinct candidate names.",
    "- Name should fit genre + tone + premise + age rating.",
    "- Avoid trademarked character names and obvious parody names.",
    "- Prefer pronounceable, human-friendly first + last names.",
    "- Make this a fresh option each time; avoid overused defaults.",
    ...(forbiddenList.length > 0
      ? [
          `- Do not include any of these names (case-insensitive exact match): ${forbiddenList
            .map((name) => `"${name}"`)
            .join(", ")}.`,
        ]
      : []),
    ...(options?.randomnessSeed
      ? [`- Freshness seed for variation: ${options.randomnessSeed}.`]
      : []),
    "",
    "Onboarding JSON:",
    JSON.stringify(onboarding, null, 2),
  ].join("\n");
}

function containsOverusedNeonDescriptor(value: string): boolean {
  return /\bneon[-\s]?(lit|drenched|soaked)\b/i.test(value);
}

function softenOverusedNeonDescriptor(value: string): string {
  return value
    .replace(/\bneon[-\s]?lit\b/gi, "low-light")
    .replace(/\bneon[-\s]?drenched\b/gi, "atmospheric")
    .replace(/\bneon[-\s]?soaked\b/gi, "stylized")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVisualStyleSystemPrompt(knowledge: PathForgerKnowledge): string {
  return [
    "You are PathForger's story setup assistant.",
    "Generate exactly one short visual style phrase based on the onboarding payload.",
    "The style should feel cinematic, specific, and suitable for chapter storytelling imagery.",
    "Treat age rating as a hard boundary for visual intensity and thematic edge.",
    "Avoid overused stylistic filler terms, especially repetitive neon phrasing.",
    "Return JSON only. Do not include markdown fences.",
    "",
    "MAIN_PROMPT:",
    knowledge.mainPrompt,
    "",
    "KNOWLEDGE DOCS:",
    buildKnowledgeSection(knowledge, PITCH_STAGE_DOCS),
  ].join("\n");
}

function buildToneSystemPrompt(knowledge: PathForgerKnowledge): string {
  return [
    "You are PathForger's story setup assistant.",
    "Generate exactly one short tone phrase based on the onboarding payload.",
    "Tone must match genre, premise, age rating, danger level, chapter length, romance preference, and visual style intent.",
    "Keep it expressive but concise, and avoid stale default wording.",
    "Return JSON only. Do not include markdown fences.",
    "",
    "MAIN_PROMPT:",
    knowledge.mainPrompt,
    "",
    "KNOWLEDGE DOCS:",
    buildKnowledgeSection(knowledge, PITCH_STAGE_DOCS),
  ].join("\n");
}

function buildVisualStyleUserPrompt(
  onboarding: PathForgerOnboardingInput,
): string {
  return [
    "Generate one short visual style phrase for this adventure setup.",
    "Treat the selected age rating as a hard style/content constraint.",
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(visualStyleResultSchema), null, 2),
    "",
    "Output rules:",
    "- Return only one value in visualStyle.",
    "- Keep it short: ideally 3 to 8 words.",
    "- No punctuation-heavy lists, no slashes, no em-dashes.",
    "- Must match genre + tone + premise + age rating.",
    "- Adjust imagery intensity and edge to fit the rating.",
    "- For G/PG, keep wording family-safe and avoid graphic/explicit terms.",
    "- For PG-13, allow heightened tension without explicit brutality.",
    "- For R/NC-17, mature intensity is allowed but still avoid gratuitous shock phrasing.",
    `- Avoid these overused descriptors: ${OVERUSED_NEON_PHRASES.map((phrase) => `"${phrase}"`).join(", ")}.`,
    "- Prefer varied visual language instead of default cyberpunk shorthand.",
    "",
    "Hard constraints:",
    `- Genre: ${onboarding.genre}`,
    `- Age rating: ${onboarding.ageRating}`,
    "",
    "Onboarding JSON:",
    JSON.stringify(onboarding, null, 2),
  ].join("\n");
}

function buildToneUserPrompt(onboarding: PathForgerOnboardingInput): string {
  return [
    "Generate one short tone phrase for this adventure setup.",
    "Treat the selected age rating as a hard tone/content boundary.",
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(toneResultSchema), null, 2),
    "",
    "Output rules:",
    "- Return only one value in tone.",
    "- Keep it short: ideally 2 to 8 words.",
    "- Must reflect genre + premise + age rating + danger level + chapter length + romance mode + visual style.",
    "- Describe narrative/emotional voice, not camera or rendering techniques.",
    '- Avoid repetitive defaults like "cinematic, tense, emotionally grounded".',
    "- For G/PG, prefer lighter/family-safe wording.",
    "- For PG-13, allow elevated suspense without explicit brutality.",
    "- For R/NC-17, mature intensity is allowed when fitting the setup.",
    "",
    "Hard constraints:",
    `- Genre: ${onboarding.genre}`,
    `- Age rating: ${onboarding.ageRating}`,
    "",
    "Onboarding JSON:",
    JSON.stringify(onboarding, null, 2),
  ].join("\n");
}

function buildPremiseSystemPrompt(knowledge: PathForgerKnowledge): string {
  return [
    "You are PathForger's story setup assistant.",
    "Generate exactly one fresh story premise based primarily on the selected genre.",
    "Keep the premise concise, vivid, and suitable for a branching adventure.",
    "Avoid reusing stale motifs from prior outputs unless explicitly requested.",
    "Return JSON only. Do not include markdown fences.",
    "",
    "MAIN_PROMPT:",
    knowledge.mainPrompt,
    "",
    "KNOWLEDGE DOCS:",
    buildKnowledgeSection(knowledge, PREMISE_STAGE_DOCS),
  ].join("\n");
}

function buildPremiseUserPrompt(
  onboarding: PathForgerOnboardingInput,
  options?: {
    forbiddenPhrases?: string[];
    randomnessSeed?: string;
  },
): string {
  const forbidden = Array.from(
    new Set([...OVERUSED_NEON_PHRASES, ...(options?.forbiddenPhrases ?? [])]),
  )
    .map((phrase) => phrase.trim())
    .filter((phrase) => phrase.length > 0);

  return [
    "Generate one new premise for this adventure setup.",
    "Treat the selected age rating as a hard content constraint.",
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(premiseResultSchema), null, 2),
    "",
    "Output rules:",
    "- Return both premise and protagonistName.",
    "- Write 1 to 2 sentences only (target 25-55 words total).",
    "- Keep it loose and high-concept; do not over-specify scene beats or micro-details.",
    "- Anchor it strongly to the selected genre first.",
    "- Respect age rating and tone.",
    "- Keep violence, horror intensity, language, and mature themes appropriate for the provided age rating.",
    "- Avoid naming famous IP characters or settings.",
    "- Keep it specific and story-ready, while leaving room for chapter generation to explore details.",
    "- protagonistName should be a fresh, memorable first + last name that fits the premise and genre.",
    "- If genre is Sci-fi, vary widely across subgenres. Choose a fresh direction (for example: space opera, cyberpunk, first contact, biotech, time travel, military SF, climate SF, posthuman, multiverse, colony politics, alien anthropology, hard-SF mystery).",
    "- Avoid defaulting to repeated neon-forward imagery language.",
    ...(forbidden.length > 0
      ? [
          `- Avoid repeating these motifs/phrases: ${forbidden
            .map((phrase) => `"${phrase}"`)
            .join(", ")}.`,
        ]
      : []),
    ...(options?.randomnessSeed
      ? [`- Freshness seed for variation: ${options.randomnessSeed}.`]
      : []),
    "",
    "Hard constraints:",
    `- Genre: ${onboarding.genre}`,
    `- Age rating: ${onboarding.ageRating}`,
    "",
    "Onboarding JSON:",
    JSON.stringify(onboarding, null, 2),
  ].join("\n");
}

function buildChapterSystemPrompt(knowledge: PathForgerKnowledge): string {
  return [
    "You are PathForger's text pipeline (stage 2: chapter + risk + image briefs).",
    "Write novel-quality markdown and maintain continuity.",
    "Return JSON only. Do not include markdown fences.",
    "",
    "MAIN_PROMPT:",
    knowledge.mainPrompt,
    "",
    "KNOWLEDGE DOCS:",
    buildKnowledgeSection(knowledge, CHAPTER_STAGE_DOCS),
  ].join("\n");
}

function buildChapterCoreSystemPrompt(knowledge: PathForgerKnowledge): string {
  return [
    "You are PathForger's text pipeline (stage 2a: chapter core).",
    "Write novel-quality markdown and maintain continuity.",
    "Return JSON only. Do not include markdown fences.",
    "",
    "MAIN_PROMPT:",
    knowledge.mainPrompt,
    "",
    "KNOWLEDGE DOCS:",
    buildKnowledgeSection(knowledge, CHAPTER_STAGE_DOCS),
  ].join("\n");
}

function buildPathLedgerUpdateSystemPrompt(
  knowledge: PathForgerKnowledge,
): string {
  return [
    "You are PathForger's continuity ledger engine.",
    "Update the path ledger after a newly chosen branch and resolved outcome.",
    "Keep continuity-aware details concise and actionable for future chapter generation.",
    "Return JSON only. Do not include markdown fences.",
    "",
    "MAIN_PROMPT:",
    knowledge.mainPrompt,
    "",
    "KNOWLEDGE DOCS:",
    buildKnowledgeSection(knowledge, CHAPTER_STAGE_DOCS),
  ].join("\n");
}

function normalizeName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

function pickNameFromCandidates(params: {
  candidates: string[];
  forbiddenNames: Set<string>;
  seed: string;
}): string | null {
  const unique = Array.from(
    new Set(
      params.candidates
        .map((candidate) => normalizeName(candidate))
        .filter((candidate) => candidate.length > 0),
    ),
  );

  const allowed = unique.filter(
    (candidate) => !params.forbiddenNames.has(candidate.toLowerCase()),
  );

  if (allowed.length === 0) {
    return null;
  }

  const index = hashSeed(params.seed) % allowed.length;
  return allowed[index];
}

function buildChapterLengthRule(
  adventureLength: PathForgerOnboardingInput["adventureLength"],
): string {
  if (adventureLength === "Very short (1-2 lines)") {
    return "- chapterMarkdown length: VERY SHORT. Return only 1-2 lines total.";
  }
  if (adventureLength === "Short") {
    return "- chapterMarkdown length: short chapter, roughly 180-420 words.";
  }
  if (adventureLength === "Long") {
    return "- chapterMarkdown length: long chapter, roughly 1200-1800 words.";
  }
  if (adventureLength === "Very long") {
    return "- chapterMarkdown length: very long chapter, roughly 1800-2600 words.";
  }

  return "- chapterMarkdown length: medium chapter, roughly 700-1200 words.";
}

function buildChapterAgeRatingRule(
  ageRating: PathForgerOnboardingInput["ageRating"],
): string[] {
  const normalized = ageRating.trim().toUpperCase();

  if (normalized === "G") {
    return [
      "- Age rating is G: keep content family-safe with no graphic violence, profanity, sexual content, or intense horror.",
      "- Favor hopeful tone, gentle peril, and safe-to-young-readers imagery.",
    ];
  }

  if (normalized === "PG") {
    return [
      "- Age rating is PG: allow mild peril/intensity but avoid graphic violence, explicit sexual content, and strong profanity.",
      "- Keep darker themes brief, implied, and non-explicit.",
    ];
  }

  if (normalized === "PG-13") {
    return [
      "- Age rating is PG-13: moderate peril, tension, and thematic intensity are allowed; avoid explicit gore and explicit sexual content.",
      "- Language and violence can be stronger than PG but should remain non-graphic.",
    ];
  }

  if (normalized === "R") {
    return [
      "- Age rating is R: mature tone allowed, including stronger violence/language/themes where relevant.",
      "- Keep content coherent and purposeful; avoid gratuitous shock-only detail.",
    ];
  }

  if (normalized === "NC-17") {
    return [
      "- Age rating is NC-17: adult intensity allowed, including explicit mature themes and extreme content where narratively justified.",
      "- Preserve narrative quality and avoid incoherent gratuitous escalation.",
    ];
  }

  return [
    "- Treat the provided age rating as a hard content boundary for violence, horror intensity, language, and sexual themes.",
  ];
}

function buildChapterStyleTextRules(
  onboarding: Pick<PathForgerOnboardingInput, "visualStyle" | "tone">,
): string[] {
  const style = onboarding.visualStyle.trim();
  const tone = onboarding.tone.trim();

  return [
    "- Treat onboarding.visualStyle as a hard narrative style lock for text outputs.",
    "- Apply the style lock to chapterMarkdown, choices (label + description), continuePromptMarkdown, outcomeAMarkdown, and outcomeBMarkdown.",
    "- Keep diction, imagery, pacing, and sentence rhythm aligned with the requested style and tone.",
    "- Do not drift into default dark/moody/cinematic prose unless the requested style or tone explicitly calls for it.",
    "- Preserve stakes and tension through events and decisions, not by overriding the requested style voice.",
    style ? `- Required style reference: "${style}".` : "",
    tone ? `- Required tone reference: "${tone}".` : "",
  ].filter(Boolean);
}

function buildChapterUserPrompt(params: {
  onboarding: PathForgerOnboardingInput;
  pitchResult: PathForgerPitchResult;
  selectedPitch: PathForgerPitchChoice;
  selectedBranch?: PathForgerBranchChoice;
  chapterNumber?: number;
  previousChapterMarkdown?: string;
  previousOutcomeMarkdown?: string;
  currentPathLedgerMarkdown?: string;
}): string {
  const selectedPitch = params.pitchResult.pitches.find(
    (pitch) => pitch.id === params.selectedPitch,
  );

  if (!selectedPitch) {
    throw new Error(
      `Unable to resolve selected pitch: ${params.selectedPitch}`,
    );
  }

  const chapterNumber = params.chapterNumber ?? 1;
  const chapterLengthRule = buildChapterLengthRule(
    params.onboarding.adventureLength,
  );
  const chapterAgeRatingRules = buildChapterAgeRatingRule(
    params.onboarding.ageRating,
  );
  const chapterStyleTextRules = buildChapterStyleTextRules(params.onboarding);

  return [
    `Generate Chapter ${chapterNumber} package for PathForger.`,
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(pathForgerChapterResultSchema), null, 2),
    "",
    "Output rules:",
    `- chapterNumber must be ${chapterNumber}.`,
    "- chapterTitle: concise cinematic title text for this chapter (plain text, no markdown, no 'Chapter N' prefix).",
    chapterLengthRule,
    "- Treat the selected age rating as a strict content policy for chapter prose, options, risk HUD wording, and outcomes.",
    ...chapterAgeRatingRules,
    ...chapterStyleTextRules,
    "- chapterMarkdown must not include a 'Your Choices' section.",
    "- choices: provide 2 strong options (3 only if absolutely necessary).",
    "- riskHudMarkdown: include success probability, threat level, injury risk, resource cost, reward potential, key risk factors.",
    "- Do not prepend riskHudMarkdown with titles like 'Risk HUD - Option A/B'.",
    "- pathLedgerMarkdown: concise and continuity-aware.",
    "- continuePromptMarkdown: urgent call to choose a path.",
    "- imagePrompts: production-ready prompts for cover, chapter spread, choice preview A, choice preview B, outcome A, and outcome B visuals.",
    "- imagePrompts for all image types must strongly reflect onboarding.visualStyle + onboarding.tone (treat style as a hard visual constraint).",
    "- Do not default to dark/gritty cinematic grading unless the requested style explicitly asks for it.",
    "- imagePrompts.chapterSpread must describe a cinematic chapter SCENE (environment + characters + mood), not a printed page or book layout.",
    "- imagePrompts.chapterSpread must explicitly avoid open books, page borders, paper textures, and text-on-page framing.",
    "- imagePrompts.cover must explicitly include the exact book title text to render and require large, high-contrast, legible typography on a professional front cover composition.",
    "- imagePrompts.choicePreviewA/B must depict PRE-DECISION tension before consequences occur.",
    "- For imagePrompts.choicePreviewA/B, represent tension via composition/staging/expressions; do not force dark/gritty lighting unless style explicitly requests it.",
    "- imagePrompts.outcomeA/B must depict AFTERMATH with concrete consequences of the corresponding option.",
    "- Each outcome prompt must be visually and temporally distinct from its corresponding choice preview prompt.",
    "- outcomeAMarkdown: resolve Option A in 1-2 vivid paragraphs.",
    "- outcomeBMarkdown: resolve Option B in 1-2 vivid paragraphs.",
    "- Keep Outcome A and Outcome B distinct and faithful to their corresponding options.",
    "",
    "Onboarding JSON:",
    JSON.stringify(params.onboarding, null, 2),
    "",
    "Selected pitch:",
    JSON.stringify(
      {
        id: selectedPitch.id,
        title: selectedPitch.title,
        markdown: selectedPitch.markdown,
      },
      null,
      2,
    ),
    "",
    "Selected branch context (for canon emphasis only; still provide both Outcome A and Outcome B):",
    params.selectedBranch ? `Option ${params.selectedBranch}` : "None selected",
    ...(chapterNumber > 1
      ? [
          "",
          "Continuation context:",
          JSON.stringify(
            {
              previousChapterMarkdown: params.previousChapterMarkdown ?? "",
              previousOutcomeMarkdown: params.previousOutcomeMarkdown ?? "",
              currentPathLedgerMarkdown: params.currentPathLedgerMarkdown ?? "",
            },
            null,
            2,
          ),
          "",
          `Write a true continuation into Chapter ${chapterNumber}. Preserve continuity from the prior chapter, resolved branch outcome, and path ledger.`,
        ]
      : []),
  ].join("\n");
}

function buildChapterCoreUserPrompt(params: {
  onboarding: PathForgerOnboardingInput;
  pitchResult: PathForgerPitchResult;
  selectedPitch: PathForgerPitchChoice;
  selectedBranch?: PathForgerBranchChoice;
  chapterNumber?: number;
  previousChapterMarkdown?: string;
  previousOutcomeMarkdown?: string;
  currentPathLedgerMarkdown?: string;
}): string {
  const selectedPitch = params.pitchResult.pitches.find(
    (pitch) => pitch.id === params.selectedPitch,
  );

  if (!selectedPitch) {
    throw new Error(
      `Unable to resolve selected pitch: ${params.selectedPitch}`,
    );
  }

  const chapterNumber = params.chapterNumber ?? 1;
  const chapterLengthRule = buildChapterLengthRule(
    params.onboarding.adventureLength,
  );
  const chapterAgeRatingRules = buildChapterAgeRatingRule(
    params.onboarding.ageRating,
  );
  const chapterStyleTextRules = buildChapterStyleTextRules(params.onboarding);

  return [
    `Generate Chapter ${chapterNumber} package for PathForger.`,
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(pathForgerChapterCoreResultSchema), null, 2),
    "",
    "Output rules:",
    `- chapterNumber must be ${chapterNumber}.`,
    "- chapterTitle: concise cinematic title text for this chapter (plain text, no markdown, no 'Chapter N' prefix).",
    chapterLengthRule,
    "- Treat the selected age rating as a strict content policy for chapter prose, options, risk HUD wording, and outcomes.",
    ...chapterAgeRatingRules,
    ...chapterStyleTextRules,
    "- chapterMarkdown must not include a 'Your Choices' section.",
    "- choices: provide 2 strong options (3 only if absolutely necessary).",
    "- riskHudMarkdown: include success probability, threat level, injury risk, resource cost, reward potential, key risk factors.",
    "- Do not prepend riskHudMarkdown with titles like 'Risk HUD - Option A/B'.",
    "- pathLedgerMarkdown: concise and continuity-aware.",
    "- outcomeAMarkdown: resolve Option A in 1-2 vivid paragraphs.",
    "- outcomeBMarkdown: resolve Option B in 1-2 vivid paragraphs.",
    "- Keep Outcome A and Outcome B distinct and faithful to their corresponding options.",
    "- continuePromptMarkdown: urgent call to choose a path.",
    "- imagePrompts: production-ready prompts for cover, chapter spread, choice preview A, choice preview B, outcome A, and outcome B visuals.",
    "- imagePrompts for all image types must strongly reflect onboarding.visualStyle + onboarding.tone (treat style as a hard visual constraint).",
    "- Do not default to dark/gritty cinematic grading unless the requested style explicitly asks for it.",
    "- imagePrompts.chapterSpread must describe a cinematic chapter SCENE (environment + characters + mood), not a printed page or book layout.",
    "- imagePrompts.chapterSpread must explicitly avoid open books, page borders, paper textures, and text-on-page framing.",
    "- imagePrompts.cover must explicitly include the exact book title text to render and require large, high-contrast, legible typography on a professional front cover composition.",
    "- imagePrompts.choicePreviewA/B must depict PRE-DECISION tension before consequences occur.",
    "- For imagePrompts.choicePreviewA/B, represent tension via composition/staging/expressions; do not force dark/gritty lighting unless style explicitly requests it.",
    "- imagePrompts.outcomeA/B must depict AFTERMATH with concrete consequences of the corresponding option.",
    "- Each outcome prompt must be visually and temporally distinct from its corresponding choice preview prompt.",
    "",
    "Onboarding JSON:",
    JSON.stringify(params.onboarding, null, 2),
    "",
    "Selected pitch:",
    JSON.stringify(
      {
        id: selectedPitch.id,
        title: selectedPitch.title,
        markdown: selectedPitch.markdown,
      },
      null,
      2,
    ),
    "",
    "Selected branch context (for canon emphasis only):",
    params.selectedBranch ? `Option ${params.selectedBranch}` : "None selected",
    ...(chapterNumber > 1
      ? [
          "",
          "Continuation context:",
          JSON.stringify(
            {
              previousChapterMarkdown: params.previousChapterMarkdown ?? "",
              previousOutcomeMarkdown: params.previousOutcomeMarkdown ?? "",
              currentPathLedgerMarkdown: params.currentPathLedgerMarkdown ?? "",
            },
            null,
            2,
          ),
          "",
          `Write a true continuation into Chapter ${chapterNumber}. Preserve continuity from the prior chapter, resolved branch outcome, and path ledger.`,
        ]
      : []),
  ].join("\n");
}

function buildPathLedgerUpdateUserPrompt(
  params: RunPathForgerPathLedgerUpdateStageInput,
): string {
  return [
    "Update Path Ledger markdown for the latest resolved branch.",
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(pathLedgerUpdateResultSchema), null, 2),
    "",
    "Output rules:",
    "- Preserve important existing continuity from currentPathLedgerMarkdown.",
    "- Add a concise update for the selected branch and its resolved outcome.",
    "- Include concrete consequences: injuries/resources/trust/location/objective shifts.",
    "- Keep it compact and skimmable markdown.",
    "",
    "Onboarding JSON:",
    JSON.stringify(params.onboarding, null, 2),
    "",
    "Ledger update context JSON:",
    JSON.stringify(
      {
        chapterNumber: params.chapterNumber,
        currentPathLedgerMarkdown: params.currentPathLedgerMarkdown,
        selectedBranch: params.selectedBranch,
        selectedChoiceLabel: params.selectedChoiceLabel,
        selectedChoiceDescription: params.selectedChoiceDescription,
        selectedChoiceRiskHudMarkdown: params.selectedChoiceRiskHudMarkdown,
        outcomeMarkdown: params.outcomeMarkdown,
      },
      null,
      2,
    ),
  ].join("\n");
}

async function requestTextStage<TSchema extends z.ZodTypeAny>(params: {
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  schema: TSchema;
}): Promise<z.infer<TSchema>> {
  const response = await fetch(RESPONSES_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${params.apiKey}`,
    },
    body: JSON.stringify({
      model: params.model,
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
    }),
  });

  const data = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const apiMessage = extractErrorMessage(data);
    throw new Error(
      apiMessage || `PathForger text stage failed (${response.status}).`,
    );
  }

  const text = extractTextFromResponse(data);
  if (!text) {
    throw new Error("PathForger text stage returned no text output.");
  }

  const json = parseJsonResponse(text);
  return params.schema.parse(json);
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

  const dataUrlMatch = value.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
  );
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

function shouldRetryWithMinimalToolOptions(
  status: number,
  apiMessage: string,
): boolean {
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

function buildImageTypePromptRequirements(
  imageType: PathForgerImageType,
): string[] {
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

  const rules = [
    "Style adherence rules (hard constraints):",
    style ? `- Visual Style: ${style}` : "",
    tone ? `- Tone: ${tone}` : "",
    genre ? `- Genre: ${genre}` : "",
    ageRating ? `- Age Rating: ${ageRating}` : "",
    "- Follow these hints exactly; do not drift to a default moody photoreal look unless explicitly requested.",
    "- Keep palette, rendering medium, lighting, and line/shape language consistent with the style hint.",
    "- Do not inject a cinematic/photoreal/dark treatment unless the provided style or tone explicitly requests it.",
  ].filter(Boolean);

  return rules;
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
}): Promise<Omit<PathForgerGeneratedImage, "prompt">> {
  const coverTitleHint =
    params.imageType === "cover"
      ? extractCoverTitleHintFromPrompt(params.prompt)
      : null;
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
  const imageTypeRequirements = buildImageTypePromptRequirements(
    params.imageType,
  );
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

  const baseRequestBody = {
    model: params.model,
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

  const runRequest = async (body: Record<string, unknown>) => {
    const response = await fetch(RESPONSES_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    return { response, data };
  };

  const runRequestWithRateLimitRetry = async (
    body: Record<string, unknown>,
  ) => {
    let attempt = 0;

    while (true) {
      const result = await runRequest(body);
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
    }
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
    if (
      shouldRetryWithMinimalToolOptions(response.status, secondAttemptMessage)
    ) {
      ({ response, data } = await runRequestWithRateLimitRetry(
        requestWithBareToolOptions as unknown as Record<string, unknown>,
      ));
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
    model: params.model,
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
  onboarding: PathForgerOnboardingInput;
  imageModel: string;
  selfieDataUrl?: string;
  onProgress?: (progress: PathForgerPipelineProgress) => void;
  onImageUpdate?: (update: PathForgerImageStageUpdate) => void;
}): Promise<{
  images: Partial<Record<PathForgerImageType, PathForgerGeneratedImage>>;
  imageErrors: Partial<Record<PathForgerImageType, string>>;
}> {
  const images: Partial<Record<PathForgerImageType, PathForgerGeneratedImage>> =
    {};
  const imageErrors: Partial<Record<PathForgerImageType, string>> = {};

  if (params.jobs.length === 0) {
    return { images, imageErrors };
  }

  let nextJobIndex = 0;
  let completed = 0;
  const workerCount = Math.max(
    1,
    Math.min(MAX_PARALLEL_IMAGE_CALLS, params.jobs.length),
  );
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
      const errorMessage =
        error instanceof Error ? error.message : "Image generation failed.";
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
  const imageModel = resolveImageModel(input.imageModel, input.defaultModel);
  const prompt = buildCoverPromptFromPitch({
    onboarding: input.onboarding,
    pitchResult: input.pitchResult,
    selectedPitch: input.selectedPitch,
  });

  onProgress?.({
    stage: "generatingImages",
    message: "Rendering cover image...",
  });

  const imageAsset = await requestImageAsset({
    apiKey: input.apiKey,
    model: imageModel,
    prompt,
    imageType: "cover",
    selfieDataUrl: input.selfieDataUrl,
    includeSelfieReferenceImage: shouldUseSelfieReferenceImage({
      imageType: "cover",
      personalizedImages: input.onboarding.personalizedImages,
      selfieDataUrl: input.selfieDataUrl,
    }),
    styleHint: input.onboarding.visualStyle,
    toneHint: input.onboarding.tone,
    genreHint: input.onboarding.genre,
    ageRatingHint: input.onboarding.ageRating,
  });

  return {
    selectedPitch: input.selectedPitch,
    prompt,
    image: {
      prompt,
      ...imageAsset,
    },
    imageModel,
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
    (input.forbiddenNames ?? [])
      .map((name) => name.trim().toLowerCase())
      .filter(Boolean),
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

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingStyle",
    message: "Forging a visual style...",
  });
  const generated = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildVisualStyleSystemPrompt(knowledge),
    userPrompt: buildVisualStyleUserPrompt(input.onboarding),
    schema: visualStyleResultSchema,
  });

  let visualStyle = generated.visualStyle.trim();

  if (containsOverusedNeonDescriptor(visualStyle)) {
    const fallback = await requestTextStage({
      apiKey: input.apiKey,
      model: textModel,
      systemPrompt: buildVisualStyleSystemPrompt(knowledge),
      userPrompt: [
        buildVisualStyleUserPrompt(input.onboarding),
        "",
        `The previous candidate was "${visualStyle}" and it overused neon-style wording.`,
        "Return a different visualStyle with no neon-lit/neon-drenched/neon-soaked phrasing.",
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

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingTone",
    message: "Forging story tone...",
  });
  const generated = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildToneSystemPrompt(knowledge),
    userPrompt: buildToneUserPrompt(input.onboarding),
    schema: toneResultSchema,
  });

  return {
    tone: generated.tone.trim(),
    textModel,
  };
}

export async function runPathForgerPremiseStage(
  rawInput: RunPathForgerPremiseStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{ premise: string; protagonistName: string; textModel: string }> {
  const input = runPremiseStageInputSchema.parse(rawInput);
  const textModel = resolveTextModel(input.textModel, input.defaultModel);

  const knowledge = await loadPathForgerKnowledgeForStage(onProgress);

  onProgress?.({
    stage: "generatingPremise",
    message: "Forging a genre-fit premise...",
  });
  const generated = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildPremiseSystemPrompt(knowledge),
    userPrompt: buildPremiseUserPrompt(input.onboarding, {
      forbiddenPhrases: input.forbiddenPhrases,
      randomnessSeed: input.randomnessSeed?.trim().length
        ? input.randomnessSeed.trim()
        : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`,
    }),
    schema: premiseResultSchema,
  });

  let premise = generated.premise.trim();
  let protagonistName = generated.protagonistName.trim();

  if (containsOverusedNeonDescriptor(premise)) {
    const fallback = await requestTextStage({
      apiKey: input.apiKey,
      model: textModel,
      systemPrompt: buildPremiseSystemPrompt(knowledge),
      userPrompt: [
        buildPremiseUserPrompt(input.onboarding, {
          forbiddenPhrases: input.forbiddenPhrases,
          randomnessSeed: input.randomnessSeed?.trim().length
            ? `${input.randomnessSeed.trim()}-retry-neon`
            : `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}-retry-neon`,
        }),
        "",
        `The previous premise was "${premise}" and used overused neon wording.`,
        "Return a different premise and protagonistName without neon-lit/neon-drenched/neon-soaked phrasing.",
      ].join("\n"),
      schema: premiseResultSchema,
    });

    premise = fallback.premise.trim();
    protagonistName = fallback.protagonistName.trim();
  }

  if (containsOverusedNeonDescriptor(premise)) {
    premise = softenOverusedNeonDescriptor(premise);
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

export async function runPathForgerImageStage(
  rawInput: RunPathForgerImageStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
  onImageUpdate?: (update: PathForgerImageStageUpdate) => void,
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
  const imageModel = resolveImageModel(input.imageModel, input.defaultModel);
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
    if (
      typeof overridePrompt === "string" &&
      overridePrompt.trim().length > 0
    ) {
      resolvedImagePrompts[type] = overridePrompt.trim();
    }
  }

  if (renderImages.cover) {
    const coverTitle =
      input.coverTitle?.trim() ||
      extractCoverTitleHintFromPrompt(resolvedImagePrompts.cover) ||
      "";
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
    imageModel,
    selfieDataUrl: input.selfieDataUrl,
    onProgress,
    onImageUpdate,
  });

  return {
    images,
    imageErrors,
    imageModel,
    resolvedImagePrompts,
  };
}

export async function runPathForgerOutcomeImageStage(
  rawInput: RunPathForgerOutcomeImageStageInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<{
  branch: PathForgerBranchChoice;
  imageType: "outcomeA" | "outcomeB";
  prompt: string;
  image: PathForgerGeneratedImage;
  imageModel: string;
}> {
  const input = runOutcomeImageStageInputSchema.parse(rawInput);
  const imageModel = resolveImageModel(input.imageModel, input.defaultModel);
  const imageType = input.branch === "A" ? "outcomeA" : "outcomeB";
  const overridePrompt = input.imagePromptOverrides?.[imageType];
  const prompt =
    typeof overridePrompt === "string" && overridePrompt.trim().length > 0
      ? overridePrompt.trim()
      : input.imagePrompts[imageType];
  const choicePreviewPrompt =
    input.branch === "A"
      ? input.imagePrompts.choicePreviewA
      : input.imagePrompts.choicePreviewB;
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
    model: imageModel,
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
    imageModel,
  };
}

export async function runPathForgerPipeline(
  rawInput: RunPathForgerPipelineInput,
  onProgress?: (progress: PathForgerPipelineProgress) => void,
): Promise<PathForgerPipelineResult> {
  const input = runPipelineInputSchema.parse(rawInput);
  const renderImages = {
    ...renderImageDefaults,
    ...(input.renderImages ?? {}),
  };

  const textModel = resolveTextModel(input.textModel, input.defaultModel);
  const imageModel = resolveImageModel(input.imageModel, input.defaultModel);

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

  const selectedPitch =
    input.selectedPitch ?? normalizedPitches.recommendedPitch;
  const selectedPitchTitle = resolvePitchDisplayTitle({
    pitchResult: normalizedPitches,
    selectedPitch,
  });

  onProgress?.({
    stage: "generatingChapter",
    message: `Building Chapter 1 for ${selectedPitchTitle}...`,
  });
  const chapter = await requestTextStage({
    apiKey: input.apiKey,
    model: textModel,
    systemPrompt: buildChapterSystemPrompt(knowledge),
    userPrompt: buildChapterUserPrompt({
      onboarding: input.onboarding,
      pitchResult: normalizedPitches,
      selectedPitch,
      selectedBranch: input.selectedBranch,
    }),
    schema: pathForgerChapterResultSchema,
  });
  const imageStageResult = await runPathForgerImageStage(
    {
      apiKey: input.apiKey,
      onboarding: input.onboarding,
      imagePrompts: chapter.imagePrompts,
      coverTitle: selectedPitchTitle,
      selectedBranch: input.selectedBranch,
      selfieDataUrl: input.selfieDataUrl,
      imageModel,
      imagePromptOverrides: input.imagePromptOverrides,
      renderImages,
    },
    onProgress,
  );
  const chapterWithResolvedPrompts = {
    ...chapter,
    imagePrompts: imageStageResult.resolvedImagePrompts,
  };

  return {
    pitches: normalizedPitches,
    chapter: chapterWithResolvedPrompts,
    selectedPitch,
    images: imageStageResult.images,
    imageErrors: imageStageResult.imageErrors,
    textModel,
    imageModel: imageStageResult.imageModel,
  };
}
