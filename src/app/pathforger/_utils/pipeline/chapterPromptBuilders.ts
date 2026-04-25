import { toJSONSchema } from "zod";
import type {
  KnowledgeDocFile,
  PathForgerBranchChoice,
  PathForgerOnboardingInput,
  PathForgerPitchResult,
  RunPathForgerPathLedgerUpdateStageInput,
} from "@/app/pathforger/_types/pipeline";
import type { PathForgerPitchChoice } from "@/app/pathforger/_types/pitch";
import type { PathForgerKnowledge } from "@/app/pathforger/_types/orchestrationTypes";
import {
  pathForgerChapterCoreResultSchema,
  pathForgerChapterResultSchema,
  pathLedgerUpdateResultSchema,
} from "@/app/pathforger/_schemas/pipeline";

const CONTINUATION_CHAPTER_MAX_CHARS = 10_000;
const CONTINUATION_OUTCOME_MAX_CHARS = 4_000;
const CONTINUATION_LEDGER_MAX_CHARS = 5_000;

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

function buildKnowledgeSection(
  knowledge: PathForgerKnowledge,
  selectedDocs: readonly KnowledgeDocFile[],
): string {
  return selectedDocs.map((docName) => `## ${docName}\n${knowledge.docs[docName]}`).join("\n\n");
}

export function buildChapterSystemPrompt(knowledge: PathForgerKnowledge): string {
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

export function buildChapterCoreSystemPrompt(knowledge: PathForgerKnowledge): string {
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

export function buildPathLedgerUpdateSystemPrompt(knowledge: PathForgerKnowledge): string {
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

function buildChapterAgeRatingRule(ageRating: PathForgerOnboardingInput["ageRating"]): string[] {
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

function truncateContinuationContextText(value: string | undefined, maxChars: number): string {
  const source = (value ?? "").trim();
  if (source.length <= maxChars) {
    return source;
  }

  const tail = source.slice(-maxChars);
  return `[truncated to last ${maxChars} chars]\n${tail}`;
}

function buildContinuationContext(params: {
  previousChapterMarkdown?: string;
  previousOutcomeMarkdown?: string;
  currentPathLedgerMarkdown?: string;
}): {
  previousChapterMarkdown: string;
  previousOutcomeMarkdown: string;
  currentPathLedgerMarkdown: string;
} {
  return {
    previousChapterMarkdown: truncateContinuationContextText(
      params.previousChapterMarkdown,
      CONTINUATION_CHAPTER_MAX_CHARS,
    ),
    previousOutcomeMarkdown: truncateContinuationContextText(
      params.previousOutcomeMarkdown,
      CONTINUATION_OUTCOME_MAX_CHARS,
    ),
    currentPathLedgerMarkdown: truncateContinuationContextText(
      params.currentPathLedgerMarkdown,
      CONTINUATION_LEDGER_MAX_CHARS,
    ),
  };
}

export function buildChapterUserPrompt(params: {
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
    throw new Error(`Unable to resolve selected pitch: ${params.selectedPitch}`);
  }

  const chapterNumber = params.chapterNumber ?? 1;
  const chapterLengthRule = buildChapterLengthRule(params.onboarding.adventureLength);
  const chapterAgeRatingRules = buildChapterAgeRatingRule(params.onboarding.ageRating);
  const chapterStyleTextRules = buildChapterStyleTextRules(params.onboarding);
  const continuationContext = buildContinuationContext({
    previousChapterMarkdown: params.previousChapterMarkdown,
    previousOutcomeMarkdown: params.previousOutcomeMarkdown,
    currentPathLedgerMarkdown: params.currentPathLedgerMarkdown,
  });

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
          JSON.stringify(continuationContext, null, 2),
          "",
          `Write a true continuation into Chapter ${chapterNumber}. Preserve continuity from the prior chapter, resolved branch outcome, and path ledger.`,
        ]
      : []),
  ].join("\n");
}

export function buildChapterCoreUserPrompt(params: {
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
    throw new Error(`Unable to resolve selected pitch: ${params.selectedPitch}`);
  }

  const chapterNumber = params.chapterNumber ?? 1;
  const chapterLengthRule = buildChapterLengthRule(params.onboarding.adventureLength);
  const chapterAgeRatingRules = buildChapterAgeRatingRule(params.onboarding.ageRating);
  const chapterStyleTextRules = buildChapterStyleTextRules(params.onboarding);
  const continuationContext = buildContinuationContext({
    previousChapterMarkdown: params.previousChapterMarkdown,
    previousOutcomeMarkdown: params.previousOutcomeMarkdown,
    currentPathLedgerMarkdown: params.currentPathLedgerMarkdown,
  });

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
          JSON.stringify(continuationContext, null, 2),
          "",
          `Write a true continuation into Chapter ${chapterNumber}. Preserve continuity from the prior chapter, resolved branch outcome, and path ledger.`,
        ]
      : []),
  ].join("\n");
}

export function buildPathLedgerUpdateUserPrompt(
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
