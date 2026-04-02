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
  tailorResumeToRole: {
    ...BASE_TILES.tailorResumeToRole,
    display: "Tailor Résumé",
    fullPrompt:
      "You're tailoring a resume to a specific opportunity. Review the resume and job description below. Produce markdown with four sections: \"Tailored Summary\" (two sentences), \"Priority Bullet Updates\" (three to five rewritten bullets that reference quantified achievements from the resume), \"Keywords to Emphasize\" (comma-separated keywords), and \"Gaps to Address\" (bullet list of missing experience or evidence to gather). Resume:\n{{resumeText}}\n\nJob Description:\n{{jobDescription}}",
    inputs: ["resumeText", "jobDescription"],
  },
  coverLetter: {
    ...BASE_TILES.coverLetter,
    fullPrompt:
      "Write a cover letter applying for the position of {{position}} at {{company}}. Highlight relevant skills and enthusiasm.",
    inputs: ["position", "company"],
  },
  targetedCoverLetter: {
    ...BASE_TILES.targetedCoverLetter,
    display: "Targeted Cover Letter",
    fullPrompt:
      "Write a targeted cover letter for the {{roleTitle}} role at {{company}}. Use the resume highlights and job description below to craft three paragraphs: an engaging opening that aligns motivations, a middle paragraph citing two to three measurable achievements mapped to the role's priorities, and a closing paragraph that reiterates interest and requests next steps. Close with a professional sign-off using \"Sincerely\" and a placeholder for the candidate's name. Resume Highlights:\n{{resumeText}}\n\nJob Description:\n{{jobDescription}}",
    inputs: ["roleTitle", "company", "resumeText", "jobDescription"],
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
  extractKeyRequirements: {
    ...BASE_TILES.extractKeyRequirements,
    display: "Extract Requirements",
    fullPrompt:
      "Extract the key requirements from the job description below. Organize the response as markdown sections titled \"Core Responsibilities\", \"Required Qualifications\", \"Preferred Skills\", and \"Notable Keywords\" with concise bullet points under each heading. Job Description:\n{{jobDescription}}",
    inputs: ["jobDescription"],
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
  negotiateBetterOffer: {
    ...BASE_TILES.negotiateBetterOffer,
    display: "Negotiate Better Offer",
    fullPrompt:
      "Help the candidate negotiate for better terms. Review the offer details, current compensation, and leverage points below. First provide a markdown section titled \"Negotiation Strategy\" summarizing the strongest arguments with bullet points referencing numbers or evidence. Then provide a section titled \"Draft Message\" containing a polished email requesting the desired improvements. Offer Details:\n{{offerDetails}}\n\nCurrent Compensation:\n{{currentComp}}\n\nLeverage Points:\n{{leveragePoints}}",
    inputs: ["offerDetails", "currentComp", "leveragePoints"],
  },
  compareOffers: {
    id: "compareOffers",
    display: "Compare Offers",
    fullPrompt:
      "Compare the following two job offers in a markdown table highlighting differences in compensation, benefits, and other terms. Then provide a brief summary of which offer is more advantageous.\n\nOffer A:\n{{offerA}}\n\nOffer B:\n{{offerB}}",
    inputs: ["offerA", "offerB"],
  },
  compareTwoOffers: {
    ...BASE_TILES.compareTwoOffers,
    display: "Compare Two Offers",
    fullPrompt:
      "Compare the two offers below. Create a markdown table with rows for Base Salary, Bonus, Equity, Benefits, Time Off, and Other Notes using the details provided. After the table, add sections titled \"Key Differences\" and \"Recommendation\" summarizing trade-offs and advising which offer better aligns with the candidate's stated priorities. Offer A:\n{{offerA}}\n\nOffer B:\n{{offerB}}\n\nCandidate Priorities:\n{{priorities}}",
    inputs: ["offerA", "offerB", "priorities"],
  },
  offerDetails: {
    id: "offerDetails",
    display: "Offer Letter",
    fullPrompt:
      "Extract base salary, bonus, equity, start date, and other key details from the following offer letter. Return ONLY valid JSON with keys compensation (array of {type:string, amount:number, notes?:string}) and summary (array of strings). Do not include any text outside the JSON.\n\n{{offerText}}",
    inputs: ["offerText"],
  },
  offerNegotiation: {
    id: "offerNegotiation",
    display: "Renegotiation Offer",
    fullPrompt:
      "Using the job description, resume, current offer summary, and recent market job listings, craft a persuasive counteroffer in the candidate's favor. Reference the resume and market data to justify improved compensation. Provide only the negotiation message.\n\nJob Description:\n{{jobDescription}}\n\nResume:\n{{resumeContent}}\n\nCurrent Offer:\n{{offerSummary}}\n\nMarket Data:\n{{marketData}}",
    inputs: [
      "jobDescription",
      "resumeContent",
      "offerSummary",
      "marketData",
    ],
  },
  compareCurrentComp: {
    id: "compareCurrentComp",
    display: "Compare to Current Comp",
    fullPrompt:
      "Compare the following job offer details with the employee's current compensation. Provide a markdown table highlighting differences in base salary, bonus, equity, benefits, and other notable factors, followed by a brief summary.\n\nOffer:\n{{offer}}\n\nCurrent Compensation:\n{{currentComp}}",
    inputs: ["offer", "currentComp"],
  },
  screenRole: {
    ...BASE_TILES.screenRole,
    fullPrompt:
      "Review the following job description, provide a brief summary, and list potential issues candidates should note. Return JSON with a 'summary' and an 'issues' array of objects with 'severity' ('red' or 'yellow') and 'message'.\n\n{{jobDescription}}",
    inputs: ["jobDescription"],
  },
  screenRoleForRedFlags: {
    ...BASE_TILES.screenRoleForRedFlags,
    display: "Spot Red Flags",
    fullPrompt:
      "Screen the job description below for potential red flags. Begin with a two-sentence summary of the role. Then produce a markdown table with columns \"Flag\", \"Severity\", and \"Why it Matters\" where severity is either red or yellow. Conclude with a bullet list of clarifying questions to ask. Job Description:\n{{jobDescription}}",
    inputs: ["jobDescription"],
  },
  negotiateOffer: {
    ...BASE_TILES.negotiateOffer,
    fullPrompt:
      "Compare the offer letter to the current compensation and summarize key differences. Then draft professional replies for email, LinkedIn, and Indeed. Respond in JSON with keys email, linkedin, indeed.",
    inputs: ["offerLetter", "currentComp"],
  },
  recruiterFollowUp: {
    ...BASE_TILES.recruiterFollowUp,
    fullPrompt:
      "You're helping a candidate send a courteous follow-up to a recruiter. Use the conversation context below to craft three polished variants for email, LinkedIn, and Indeed. Return ONLY valid JSON with keys email, linkedin, and indeed where each value is the full message ready to send. Conversation context:\n{{messageContext}}",
    inputs: ["messageContext"],
  },
  recruiterDecline: {
    ...BASE_TILES.recruiterDecline,
    fullPrompt:
      "You're helping a candidate gracefully decline a recruiter. Use the conversation context below to write professional variants for email, LinkedIn, and Indeed that thank the recruiter, clearly decline, and keep the door open. Return ONLY valid JSON with keys email, linkedin, and indeed. Conversation context:\n{{messageContext}}",
    inputs: ["messageContext"],
  },
  recruiterNudge: {
    ...BASE_TILES.recruiterNudge,
    fullPrompt:
      "Given the message context, draft a polite follow-up and a polite decline for a recruiter. Provide versions for email, LinkedIn, and Indeed in JSON with keys followUp and decline, each containing email, linkedin, and indeed.\n\nMessage context:\n{{messageContext}}",
    inputs: ["messageContext"],
  },
  recruiterFollowUpNudge: {
    ...BASE_TILES.recruiterFollowUpNudge,
    display: "Follow-Up Nudge",
    fullPrompt:
      "Draft a professional follow-up to a recruiter based on the conversation context below. Provide two polished messages: one for email and one for LinkedIn InMail. Each message should acknowledge the previous touchpoint, restate interest or value, and suggest a next step or question. Format the output using markdown headings \"Email\" and \"LinkedIn\" followed by the respective message. Conversation context:\n{{conversationContext}}",
    inputs: ["conversationContext"],
  },
};

