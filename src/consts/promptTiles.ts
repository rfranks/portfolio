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
      "Write a cover letter applying for the position of {{position}} at {{company}}. Highlight relevant skills and enthusiasm.",
    inputs: ["position", "company"],
  },
  elevatorPitch: {
    ...BASE_TILES.elevatorPitch,
    fullPrompt:
      "Craft a short elevator pitch for a professional with experience in {{experience}} looking for {{goal}}.",
    inputs: ["experience", "goal"],
  },
  resumeRewrite: {
    ...BASE_TILES.resumeSummary,
    id: "resumeRewrite",
    display: "Resume Rewrite",
    fullPrompt:
      "Using the provided job description and resume, rewrite the resume to emphasize how the candidate meets the role requirements.",
    inputs: ["resumeVariantId", "jobDescription"],
  },
  jdRequirements: {
    id: "jdRequirements",
    display: "JD Requirements",
    fullPrompt:
      "From the following job description, list the key job requirements as bullet points:\n\n{{jobDescription}}",
    inputs: ["jobDescription"],
  },
  jobRequirements: {
    ...BASE_TILES.jobRequirements,
    fullPrompt:
      "From the following job description, list the key job requirements as bullet points:\n\n{{jobDescription}}",
    inputs: ["jobDescription"],
  },
  negotiateOffer: {
    ...BASE_TILES.negotiateOffer,
    fullPrompt:
      "Compare the offer letter to the current compensation and summarize key differences. Then draft professional replies for email, LinkedIn, and Indeed. Respond in JSON with keys email, linkedin, indeed.",
    inputs: ["offerLetter", "currentComp"],
  },
};

