import { toJSONSchema } from "zod";
import type { KnowledgeDocFile, PathForgerOnboardingInput } from "@/app/pathforger/_types/pipeline";
import type { PathForgerKnowledge } from "@/app/pathforger/_types/orchestrationTypes";
import {
  pathForgerPitchResultSchema,
  premiseResultSchema,
  protagonistNameResultSchema,
  toneResultSchema,
  visualStyleResultSchema,
} from "@/app/pathforger/_schemas/pipeline";

const OVERUSED_NEON_PHRASES = [
  "neon-lit",
  "neon lit",
  "neon-drenched",
  "neon drenched",
  "neon-soaked",
  "neon soaked",
] as const;

const PREMISE_SIMILARITY_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "into",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "their",
  "this",
  "to",
  "with",
]);

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

function buildKnowledgeSection(
  knowledge: PathForgerKnowledge,
  selectedDocs: readonly KnowledgeDocFile[],
): string {
  return selectedDocs.map((docName) => `## ${docName}\n${knowledge.docs[docName]}`).join("\n\n");
}

function normalizePromptPhrase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizePremiseForSimilarity(value: string): Set<string> {
  const normalized = normalizePromptPhrase(value);
  return new Set(
    normalized
      .split(" ")
      .filter(
        (token) => token.length >= 3 && !PREMISE_SIMILARITY_STOP_WORDS.has(token.toLowerCase()),
      ),
  );
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

export function buildPitchSystemPrompt(knowledge: PathForgerKnowledge): string {
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

export function buildPitchUserPrompt(onboarding: PathForgerOnboardingInput): string {
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

export function buildProtagonistNameSystemPrompt(knowledge: PathForgerKnowledge): string {
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

export function buildProtagonistNameUserPrompt(
  onboarding: PathForgerOnboardingInput,
  options?: {
    forbiddenNames?: string[];
    randomnessSeed?: string;
  },
): string {
  const forbiddenList = options?.forbiddenNames?.filter((name) => name.trim().length > 0) ?? [];

  return [
    "Generate one protagonist name for this adventure setup.",
    "",
    "Output JSON schema:",
    JSON.stringify(toJSONSchema(protagonistNameResultSchema), null, 2),
    "",
    "Output rules:",
    "- Return only protagonistNames.",
    "- Provide 1 to 12 distinct candidate names.",
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

export function containsOverusedNeonDescriptor(value: string): boolean {
  return /\bneon[-\s]?(lit|drenched|soaked)\b/i.test(value);
}

export function softenOverusedNeonDescriptor(value: string): string {
  return value
    .replace(/\bneon[-\s]?lit\b/gi, "low-light")
    .replace(/\bneon[-\s]?drenched\b/gi, "atmospheric")
    .replace(/\bneon[-\s]?soaked\b/gi, "stylized")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizePromptHistoryValues(values: string[] | undefined, maxItems = 8): string[] {
  const seen = new Set<string>();
  const next: string[] = [];
  for (const raw of values ?? []) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const normalized = normalizePromptPhrase(trimmed);
    if (!normalized || seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    next.push(trimmed);
    if (next.length >= maxItems) {
      break;
    }
  }
  return next;
}

export function compactPromptHistoryValue(value: string, maxChars = 220): string {
  const compacted = value.replace(/\s+/g, " ").trim();
  if (compacted.length <= maxChars) {
    return compacted;
  }
  return `${compacted.slice(0, maxChars - 3).trimEnd()}...`;
}

export function findSimilarPremise(
  candidate: string,
  priorPremises: string[],
): { previousPremise: string; overlapRatio: number; overlapCount: number } | null {
  const candidateTokens = tokenizePremiseForSimilarity(candidate);
  if (candidateTokens.size < 5) {
    return null;
  }

  let bestMatch: { previousPremise: string; overlapRatio: number; overlapCount: number } | null =
    null;
  for (const previousPremise of priorPremises) {
    const previousTokens = tokenizePremiseForSimilarity(previousPremise);
    if (previousTokens.size < 5) {
      continue;
    }

    let overlapCount = 0;
    for (const token of candidateTokens) {
      if (previousTokens.has(token)) {
        overlapCount += 1;
      }
    }
    const overlapRatio = overlapCount / Math.min(candidateTokens.size, previousTokens.size);
    if (
      overlapCount >= 4 &&
      overlapRatio >= 0.58 &&
      (!bestMatch || overlapRatio > bestMatch.overlapRatio)
    ) {
      bestMatch = {
        previousPremise,
        overlapRatio,
        overlapCount,
      };
    }
  }

  return bestMatch;
}

export function matchesBlockedPhrase(candidate: string, blockedValues: string[]): string | null {
  const normalizedCandidate = normalizePromptPhrase(candidate);
  if (!normalizedCandidate) {
    return null;
  }

  for (const blockedValue of blockedValues) {
    if (normalizePromptPhrase(blockedValue) === normalizedCandidate) {
      return blockedValue;
    }
  }

  return null;
}

export function buildVisualStyleSystemPrompt(knowledge: PathForgerKnowledge): string {
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

export function buildToneSystemPrompt(knowledge: PathForgerKnowledge): string {
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

export function buildVisualStyleUserPrompt(
  onboarding: PathForgerOnboardingInput,
  options?: {
    forbiddenPhrases?: string[];
    previousVisualStyles?: string[];
  },
): string {
  const forbidden = sanitizePromptHistoryValues(
    [...OVERUSED_NEON_PHRASES, ...(options?.forbiddenPhrases ?? [])],
    20,
  );
  const previousVisualStyles = sanitizePromptHistoryValues(options?.previousVisualStyles, 8);

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
    ...(forbidden.length > 0
      ? [
          `- Avoid repeating these style terms/phrases: ${forbidden
            .map((phrase) => `"${compactPromptHistoryValue(phrase, 80)}"`)
            .join(", ")}.`,
        ]
      : []),
    "- Prefer varied visual language instead of default cyberpunk shorthand.",
    ...(previousVisualStyles.length > 0
      ? [
          "- Previous visual styles are exclusion-only context. Do not remix, invert, or lightly rephrase them.",
          "- Prior visual styles to avoid:",
          ...previousVisualStyles.map(
            (value, index) => `  ${index + 1}. "${compactPromptHistoryValue(value, 160)}"`,
          ),
        ]
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

export function buildToneUserPrompt(
  onboarding: PathForgerOnboardingInput,
  options?: {
    forbiddenPhrases?: string[];
    previousTones?: string[];
  },
): string {
  const forbidden = sanitizePromptHistoryValues(options?.forbiddenPhrases, 20);
  const previousTones = sanitizePromptHistoryValues(options?.previousTones, 8);

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
    ...(forbidden.length > 0
      ? [
          `- Avoid repeating these tone terms/phrases: ${forbidden
            .map((phrase) => `"${compactPromptHistoryValue(phrase, 80)}"`)
            .join(", ")}.`,
        ]
      : []),
    ...(previousTones.length > 0
      ? [
          "- Previous tones are exclusion-only context. Do not remix, invert, or lightly rephrase them.",
          "- Prior tones to avoid:",
          ...previousTones.map(
            (value, index) => `  ${index + 1}. "${compactPromptHistoryValue(value, 160)}"`,
          ),
        ]
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

export function buildPremiseSystemPrompt(knowledge: PathForgerKnowledge): string {
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

export function buildPremiseUserPrompt(
  onboarding: PathForgerOnboardingInput,
  options?: {
    forbiddenPhrases?: string[];
    previousPremises?: string[];
    randomnessSeed?: string;
  },
): string {
  const forbidden = sanitizePromptHistoryValues(
    [...OVERUSED_NEON_PHRASES, ...(options?.forbiddenPhrases ?? [])],
    20,
  );
  const previousPremises = sanitizePromptHistoryValues(options?.previousPremises, 8);

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
    "- Respect age rating.",
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
    ...(previousPremises.length > 0
      ? [
          "- Prior premise snapshots are exclusion-only context; use them only to avoid repetition.",
          "- Do not remix, invert, relocate, or lightly rephrase prior premise settings/conflicts/hooks.",
          "- If prior snapshots are from a different genre, keep them out entirely.",
          "- Prior premise snapshots to avoid:",
          ...previousPremises.map(
            (value, index) => `  ${index + 1}. "${compactPromptHistoryValue(value)}"`,
          ),
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

export function pickNameFromCandidates(params: {
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

  const allowed = unique.filter((candidate) => !params.forbiddenNames.has(candidate.toLowerCase()));

  if (allowed.length === 0) {
    return null;
  }

  const index = hashSeed(params.seed) % allowed.length;
  return allowed[index];
}
