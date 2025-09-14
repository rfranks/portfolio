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
  bulletRewrite: {
    ...BASE_TILES.bulletRewrite,
    fullPrompt:
      "Rewrite the following resume bullet into three STAR-formatted variants, each including clear metrics:\n\n{{bullet}}",
    inputs: ["bullet"],
  },
  resumeRewrite: {
    ...BASE_TILES.resumeSummary,
    id: "resumeRewrite",
    display: "Resume Rewrite",
    fullPrompt:
      "Using the provided job description and resume, rewrite the resume to emphasize how the candidate meets the role requirements.",
    inputs: ["resumeVariantId", "jobDescription"],
  },
  resumeCompare: {
    id: "resumeCompare",
    display: "Compare to Resume",
    fullPrompt:
      "Compare the following resume to the job description. List items that align with the job description, items missing from the resume, and recommendations to better align the resume with the job description.\n\nJob Description:\n{{jobDescription}}\n\nResume:\n{{resumeContent}}",
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
  compareOffers: {
    id: "compareOffers",
    display: "Compare Offers",
    fullPrompt:
      "Compare the following two job offers in a markdown table highlighting differences in compensation, benefits, and other terms. Then provide a brief summary of which offer is more advantageous.\n\nOffer A:\n{{offerA}}\n\nOffer B:\n{{offerB}}",
    inputs: ["offerA", "offerB"],
  },
  offerDetails: {
    id: "offerDetails",
    display: "Offer Letter",
    fullPrompt:
      "Extract base salary, bonus, equity, start date, and other key details from the following offer letter. Return ONLY valid JSON with keys compensation (array of {type:string, amount:number, notes?:string}) and summary (array of strings). Do not include any text outside the JSON.\n\n{{offerText}}",
    inputs: ["offerText"],
  },
  screenRole: {
    ...BASE_TILES.screenRole,
    fullPrompt:
      "Review the following job description, provide a brief summary, and list potential issues candidates should note. Return JSON with a 'summary' and an 'issues' array of objects with 'severity' ('red' or 'yellow') and 'message'.\n\n{{jobDescription}}",
    inputs: ["jobDescription"],
  },
  negotiateOffer: {
    ...BASE_TILES.negotiateOffer,
    fullPrompt:
      "Compare the offer letter to the current compensation and summarize key differences. Then draft professional replies for email, LinkedIn, and Indeed. Respond in JSON with keys email, linkedin, indeed.",
    inputs: ["offerLetter", "currentComp"],
  },
  recruiterNudge: {
    ...BASE_TILES.recruiterNudge,
    fullPrompt:
      "Given the message context, draft a polite follow-up and a polite decline for a recruiter. Provide versions for email, LinkedIn, and Indeed in JSON with keys followUp and decline, each containing email, linkedin, and indeed.\n\nMessage context:\n{{messageContext}}",
    inputs: ["messageContext"],
  },
};

