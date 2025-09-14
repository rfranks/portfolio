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
      "Write a professional cover letter with exactly three paragraphs tailored to the job description.",
  },
  negotiateOffer: {
    displayText: "Negotiate Offer",
    fullText:
      "Review the job offer alongside the current compensation and suggest negotiation strategies. Draft a polite response to the employer summarizing your position.",
  },
  interviewPreparation: {
    displayText: "Interview Preparation",
    fullText:
      "Suggest five common interview questions for this role and tips on how to answer them.",
  },
  salaryResearch: {
    displayText: "Salary Research",
    fullText:
      "Provide a market salary range for this role in the specified location based on recent data.",
  },
  skillGapAnalysis: {
    displayText: "Skill Gap Analysis",
    fullText:
      "Analyze the job description and highlight any skills you may need to develop to be competitive.",
  },
  compareResumeToJob: {
    displayText: "Compare Resume to Job",
    fullText:
      "Compare your resume to the job description, highlighting strong matches and gaps to address.",
  },
  jobDescriptionRewrite: {
    displayText: "Job Description Rewrite",
    fullText:
      "Rewrite the job description to emphasize candidate requirements and key deliverables for internal sharing.",
  },
  jobDescriptionRisk: {
    displayText: "Job Description Risk",
    fullText:
      "Identify potential issues in this job description like unpaid overtime, vague responsibilities, or compliance red flags. Return JSON with a 'summary' and an 'issues' array of objects with 'severity' ('red' or 'yellow') and 'message'.",
  },
  screenRole: {
    displayText: "Screen Role",
    fullText:
      "Review the following job description, provide a brief summary, and list potential issues candidates should note. Return JSON with a 'summary' and an 'issues' array of objects with 'severity' ('red' or 'yellow') and 'message'.",
  },
  jobRequirements: {
    displayText: "Job Requirements",
    fullText:
      "List the key job requirements from the provided job description in bullet points.",
  },
  networkingOutreach: {
    displayText: "Networking Outreach",
    fullText:
      "Draft a message to connect with professionals in this industry or company for networking purposes.",
  },
  portfolioReview: {
    displayText: "Portfolio Review",
    fullText:
      "Review your project portfolio and suggest improvements or missing pieces that would strengthen it.",
  },
  elevatorPitch: {
    displayText: "Elevator Pitch",
    fullText:
      "Craft a concise elevator pitch summarizing your background and career aspirations.",
  },
  projectSummary: {
    displayText: "Project Summary",
    fullText:
      "Summarize this project in a paragraph highlighting challenges, solutions, and outcomes.",
  },
  careerGoals: {
    displayText: "Career Goals",
    fullText:
      "Outline your short-term and long-term career goals along with actionable steps to achieve them.",
  },
  linkedinProfileOptimization: {
    displayText: "LinkedIn Profile Optimization",
    fullText:
      "Provide tips to optimize your LinkedIn profile so recruiters in your field can find you more easily.",
  },
};

export const PROMPT_GROUPS: Record<string, string[]> = {
  Resumes: ["resumeSummary", "coverLetter", "portfolioReview", "projectSummary"],
  Offers: ["negotiateOffer", "salaryResearch"],
  "Recruiter Replies": ["interviewPreparation", "networkingOutreach"],
  "Career Growth": [
    "skillGapAnalysis",
    "jobDescriptionRewrite",
    "jobRequirements",
    "careerGoals",
    "elevatorPitch",
    "linkedinProfileOptimization",
  ],
};
