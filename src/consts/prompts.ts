export interface PromptTemplate {
  displayText: string;
  fullText: string;
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  resumeSummary: {
    displayText: "Resume Summary",
    fullText:
      "Summarize your professional experience and key strengths in 2-3 sentences.",
  },
  coverLetter: {
    displayText: "Cover Letter",
    fullText:
      "Draft a concise cover letter highlighting why you are a great fit for the role.",
  },
  "Negotiate Offer": {
    displayText: "Negotiate Offer",
    fullText:
      "Review the job offer alongside the current compensation and suggest negotiation strategies. Draft a polite response to the employer summarizing your position.",
  },
};
