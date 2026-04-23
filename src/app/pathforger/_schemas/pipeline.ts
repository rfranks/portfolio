import z from "zod";

export const onboardingInputSchema = z.object({
  genre: z.string().min(1),
  tone: z.string().min(1),
  dangerLevel: z.enum(["Forgiving", "Risky", "Deadly"]),
  adventureLength: z.enum(["Very short (1-2 lines)", "Short", "Medium", "Long", "Very long"]),
  protagonistPreference: z.string().min(1),
  premise: z.string().min(1),
  visualStyle: z.string().min(1),
  romanceMode: z.enum(["No romance", "Optional romance", "Romance-forward"]),
  allowPermanentDeath: z.boolean(),
  personalizedImages: z.boolean(),
  ageRating: z.string().min(1),
});

export const runPipelineInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingInputSchema,
  selectedPitch: z.enum(["A", "B", "C"]).optional(),
  selectedBranch: z.enum(["A", "B"]).optional(),
  selfieDataUrl: z.string().optional(),
  defaultModel: z.string().optional(),
  textModel: z.string().optional(),
  imageModel: z.string().optional(),
  imagePromptOverrides: z
    .object({
      cover: z.string().optional(),
      chapterSpread: z.string().optional(),
      choicePreviewA: z.string().optional(),
      choicePreviewB: z.string().optional(),
      outcomeA: z.string().optional(),
      outcomeB: z.string().optional(),
    })
    .optional(),
  renderImages: z
    .object({
      cover: z.boolean(),
      chapterSpread: z.boolean(),
      choicePreviewA: z.boolean(),
      choicePreviewB: z.boolean(),
      outcomeA: z.boolean(),
      outcomeB: z.boolean(),
    })
    .optional(),
});

export const runPitchStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingInputSchema,
  defaultModel: z.string().optional(),
  textModel: z.string().optional(),
});

export const onboardingNameStageInputSchema = onboardingInputSchema.extend({
  protagonistPreference: z.string().optional().default(""),
  visualStyle: z.string().optional().default(""),
  tone: z.string().optional().default(""),
  premise: z.string().optional().default(""),
});

export const runProtagonistNameStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingNameStageInputSchema,
  defaultModel: z.string().optional(),
  textModel: z.string().optional(),
  forbiddenNames: z.array(z.string().min(1)).max(40).optional(),
  randomnessSeed: z.string().optional(),
});

export const onboardingVisualStyleStageInputSchema = onboardingInputSchema.extend({
  visualStyle: z.string().optional().default(""),
  tone: z.string().optional().default(""),
  premise: z.string().optional().default(""),
});

export const runVisualStyleStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingVisualStyleStageInputSchema,
  defaultModel: z.string().optional(),
  textModel: z.string().optional(),
});

export const onboardingToneStageInputSchema = onboardingInputSchema.extend({
  tone: z.string().optional().default(""),
  premise: z.string().optional().default(""),
  visualStyle: z.string().optional().default(""),
});

export const runToneStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingToneStageInputSchema,
  defaultModel: z.string().optional(),
  textModel: z.string().optional(),
});

export const onboardingPremiseStageInputSchema = onboardingInputSchema.extend({
  tone: z.string().optional().default(""),
  premise: z.string().optional().default(""),
  visualStyle: z.string().optional().default(""),
});

export const runPremiseStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingPremiseStageInputSchema,
  defaultModel: z.string().optional(),
  textModel: z.string().optional(),
  forbiddenPhrases: z.array(z.string().min(1)).max(20).optional(),
  randomnessSeed: z.string().optional(),
});

export const runPathLedgerUpdateStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingInputSchema,
  chapterNumber: z.number().int().positive(),
  currentPathLedgerMarkdown: z.string().min(1),
  selectedBranch: z.enum(["A", "B"]),
  selectedChoiceLabel: z.string().min(1),
  selectedChoiceDescription: z.string().min(1),
  selectedChoiceRiskHudMarkdown: z.string().min(1),
  outcomeMarkdown: z.string().min(1),
  defaultModel: z.string().optional(),
  textModel: z.string().optional(),
});

export const pitchOptionSchema = z.object({
  id: z.enum(["A", "B", "C"]),
  title: z.string().min(1),
  markdown: z.string().min(1),
});

export const pathForgerPitchResultSchema = z.object({
  adventureTitle: z.string().min(1),
  protagonistName: z.string().min(1),
  onboardingRecapMarkdown: z.string().min(1),
  pitches: z.array(pitchOptionSchema).length(3),
  recommendedPitch: z.enum(["A", "B", "C"]),
  choosePromptMarkdown: z.string().min(1),
});

export const runCoverFromPitchStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingInputSchema,
  pitchResult: pathForgerPitchResultSchema,
  selectedPitch: z.enum(["A", "B", "C"]),
  defaultModel: z.string().optional(),
  imageModel: z.string().optional(),
  selfieDataUrl: z.string().optional(),
});

export const protagonistNameResultSchema = z.object({
  protagonistNames: z.array(z.string().min(1).max(80)).min(1).max(12),
});

export const visualStyleResultSchema = z.object({
  visualStyle: z.string().min(1).max(120),
});

export const toneResultSchema = z.object({
  tone: z.string().min(1).max(120),
});

export const premiseResultSchema = z.object({
  premise: z.string().min(1).max(800),
  protagonistName: z.string().min(1).max(80),
});

export const pathLedgerUpdateResultSchema = z.object({
  pathLedgerMarkdown: z.string().min(1),
});

export const choiceSchema = z.object({
  id: z.enum(["A", "B", "C"]),
  label: z.string().min(1),
  description: z.string().min(1),
  riskHudMarkdown: z.string().min(1),
});

export const imagePromptSetSchema = z.object({
  cover: z.string().min(1),
  chapterSpread: z.string().min(1),
  choicePreviewA: z.string().min(1),
  choicePreviewB: z.string().min(1),
  outcomeA: z.string().min(1),
  outcomeB: z.string().min(1),
});

export const runImageStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingInputSchema,
  imagePrompts: imagePromptSetSchema,
  coverTitle: z.string().optional(),
  selectedBranch: z.enum(["A", "B"]).optional(),
  selfieDataUrl: z.string().optional(),
  defaultModel: z.string().optional(),
  imageModel: z.string().optional(),
  imagePromptOverrides: z
    .object({
      cover: z.string().optional(),
      chapterSpread: z.string().optional(),
      choicePreviewA: z.string().optional(),
      choicePreviewB: z.string().optional(),
      outcomeA: z.string().optional(),
      outcomeB: z.string().optional(),
    })
    .optional(),
  renderImages: z
    .object({
      cover: z.boolean(),
      chapterSpread: z.boolean(),
      choicePreviewA: z.boolean(),
      choicePreviewB: z.boolean(),
      outcomeA: z.boolean(),
      outcomeB: z.boolean(),
    })
    .optional(),
});

export const pathForgerChapterResultSchema = z.object({
  chapterNumber: z.number().int().positive(),
  chapterTitle: z.string().min(1),
  chapterMarkdown: z.string().min(1),
  pathLedgerMarkdown: z.string().min(1),
  choices: z.array(choiceSchema).min(2).max(3),
  outcomeAMarkdown: z.string().min(1),
  outcomeBMarkdown: z.string().min(1),
  continuePromptMarkdown: z.string().min(1),
  imagePrompts: imagePromptSetSchema,
});

export const pathForgerChapterCoreResultSchema = z.object({
  chapterNumber: z.number().int().positive(),
  chapterTitle: z.string().min(1),
  chapterMarkdown: z.string().min(1),
  pathLedgerMarkdown: z.string().min(1),
  choices: z.array(choiceSchema).min(2).max(3),
  outcomeAMarkdown: z.string().min(1),
  outcomeBMarkdown: z.string().min(1),
  continuePromptMarkdown: z.string().min(1),
  imagePrompts: imagePromptSetSchema,
});

export const runChapterStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingInputSchema,
  pitchResult: pathForgerPitchResultSchema,
  selectedPitch: z.enum(["A", "B", "C"]),
  selectedBranch: z.enum(["A", "B"]).optional(),
  chapterNumber: z.number().int().positive().optional(),
  previousChapterMarkdown: z.string().min(1).optional(),
  previousOutcomeMarkdown: z.string().min(1).optional(),
  currentPathLedgerMarkdown: z.string().min(1).optional(),
  defaultModel: z.string().optional(),
  textModel: z.string().optional(),
});

export const runOutcomeImageStageInputSchema = z.object({
  apiKey: z.string().min(1),
  onboarding: onboardingInputSchema,
  branch: z.enum(["A", "B"]),
  outcomeMarkdown: z.string().min(1),
  selectedChoiceLabel: z.string().min(1).optional(),
  imagePrompts: imagePromptSetSchema,
  defaultModel: z.string().optional(),
  imageModel: z.string().optional(),
  selfieDataUrl: z.string().optional(),
  imagePromptOverrides: z
    .object({
      outcomeA: z.string().optional(),
      outcomeB: z.string().optional(),
    })
    .optional(),
});
