import { z } from "zod";

export const LayoutSchema = z.enum(["ROW_3", "GRID_2X3"]);
export const ModeSchema = z.enum(["STANDARD", "PRODUCTION"]);
export const SeveritySchema = z.enum(["error", "warning", "info"]);

export const MasterPromptConfigSchema = z.object({
  text: z.string().default(""),
  lockedRules: z.array(z.string()).default([]),
});

export const ReferenceDocConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  content: z.string().default(""),
});

export const StripInputSchema = z.object({
  masterPrompt: z.string().default(""),
  referenceDocs: z.array(ReferenceDocConfigSchema).default([]),
  stripRequest: z.string().min(1),
});

export const DialogueLineSchema = z.object({
  speaker: z.string().min(1),
  qualifier: z.string().optional(),
  text: z.string(),
  isSilent: z.boolean().default(false),
  raw: z.string(),
});

export const CharacterInstanceSchema = z.object({
  name: z.string().min(1),
  expression: z.string().optional(),
  pose: z.string().optional(),
  wardrobe: z.string().optional(),
  isRemote: z.boolean().default(false),
});

export const PropRequirementSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(["prop", "label", "nameplate", "nameTag", "window", "device"]),
  requiredText: z.string().optional(),
  panelNumber: z.number().int().positive().optional(),
});

export const PanelSpecSchema = z.object({
  panelNumber: z.number().int().positive(),
  sceneText: z.string().default(""),
  characters: z.array(CharacterInstanceSchema).default([]),
  dialogue: z.array(DialogueLineSchema).default([]),
  props: z.array(PropRequirementSchema).default([]),
  labels: z.array(z.string()).default([]),
  camera: z.string().default("medium"),
  mood: z.string().default("deadpan"),
});

export const ComicStripSpecSchema = z.object({
  title: z.string().default("RICKBERT"),
  panelCount: z.number().int().min(1).max(6),
  layout: LayoutSchema,
  mode: ModeSchema,
  artStyle: z.string().default("Flat newspaper office comic"),
  panels: z.array(PanelSpecSchema),
  globalConstraints: z.array(z.string()).default([]),
  characterOverrides: z.record(z.string(), z.string()).default({}),
  sourceText: z.string(),
});

export const ValidationIssueSchema = z.object({
  code: z.string().min(1),
  category: z.enum([
    "format",
    "script",
    "character",
    "visual",
    "readability",
    "style",
  ]),
  severity: SeveritySchema,
  message: z.string(),
  panelNumber: z.number().int().positive().optional(),
  suggestion: z.string().optional(),
});

export const ValidationReportSchema = z.object({
  pass: z.boolean(),
  issues: z.array(ValidationIssueSchema),
  issueCounts: z.object({
    error: z.number().int().nonnegative(),
    warning: z.number().int().nonnegative(),
    info: z.number().int().nonnegative(),
  }),
  generatedAt: z.string(),
});

export type Layout = z.infer<typeof LayoutSchema>;
export type Mode = z.infer<typeof ModeSchema>;
export type MasterPromptConfig = z.infer<typeof MasterPromptConfigSchema>;
export type ReferenceDocConfig = z.infer<typeof ReferenceDocConfigSchema>;
export type StripInput = z.infer<typeof StripInputSchema>;
export type DialogueLine = z.infer<typeof DialogueLineSchema>;
export type CharacterInstance = z.infer<typeof CharacterInstanceSchema>;
export type PropRequirement = z.infer<typeof PropRequirementSchema>;
export type PanelSpec = z.infer<typeof PanelSpecSchema>;
export type ComicStripSpec = z.infer<typeof ComicStripSpecSchema>;
export type ValidationIssue = z.infer<typeof ValidationIssueSchema>;
export type ValidationReport = z.infer<typeof ValidationReportSchema>;
