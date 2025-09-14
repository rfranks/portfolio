import { PROMPT_TEMPLATES } from "./prompts";

export interface PromptTileDefinition {
  id: string;
  display: string;
  fullPrompt: string;
  inputs: string[];
}

// Base tiles derived from existing prompt templates (no inputs by default)
const BASE_TILES: Record<string, PromptTileDefinition> = Object.fromEntries(
  Object.entries(PROMPT_TEMPLATES).map(([id, template]) => [
    id,
    {
      id,
      display: template.displayText,
      fullPrompt: template.fullText,
      inputs: [],
    },
  ])
);

// Overrides/additional metadata for specific tiles
export const PROMPT_TILES: Record<string, PromptTileDefinition> = {
  ...BASE_TILES,
  coverLetter: {
    ...BASE_TILES.coverLetter,
    fullPrompt:
      "Write a cover letter for the position of {{position}} at {{company}}. Highlight relevant skills and enthusiasm.",
    inputs: ["position", "company"],
  },
  elevatorPitch: {
    ...BASE_TILES.elevatorPitch,
    fullPrompt:
      "Craft a short elevator pitch for a professional with experience in {{experience}} looking for {{goal}}.",
    inputs: ["experience", "goal"],
  },
  jobRequirements: {
    ...BASE_TILES.jobRequirements,
    fullPrompt:
      "From the following job description, list the key job requirements as bullet points:\n\n{{jobDescription}}",
    inputs: ["jobDescription"],
  },
};

