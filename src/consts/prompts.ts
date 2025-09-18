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
  tailorResumeToRole: {
    displayText: "Tailor my résumé to this role",
    fullText:
      "Analyze the job description alongside my resume and outline a tailored summary, priority bullet updates, keywords to weave in, and gaps I should close for the role.",
  },
  coverLetter: {
    displayText: "Cover Letter",
    fullText:
      "Write a professional cover letter with exactly three paragraphs tailored to the job description.",
  },
  targetedCoverLetter: {
    displayText: "Create a targeted cover letter",
    fullText:
      "Using my resume highlights and the job description, craft a three-paragraph cover letter that clearly ties my achievements to the role and ends with a confident call to action.",
  },
  bulletRewrite: {
    displayText: "Bullet Rewrite",
    fullText:
      "Rewrite the following resume bullet into three STAR-formatted variants with clear metrics.",
  },
  negotiateOffer: {
    displayText: "Negotiate Offer",
    fullText:
      "Review the job offer alongside the current compensation and suggest negotiation strategies. Draft a polite response to the employer summarizing your position.",
  },
  negotiateBetterOffer: {
    displayText: "Help me negotiate a more favorable offer",
    fullText:
      "Compare the current offer to my existing compensation, leverage the proof points I provide, and draft a persuasive negotiation message requesting improved terms.",
  },
  compareTwoOffers: {
    displayText: "Compare two offers",
    fullText:
      "Review two offers side by side, highlight the major differences across compensation and benefits, and recommend which option best aligns with the stated priorities.",
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
  screenRoleForRedFlags: {
    displayText: "Screen this role for red flags",
    fullText:
      "Evaluate the job description for potential red flags, note anything unusual or vague, and provide clarifying questions I should ask before proceeding.",
  },
  jobRequirements: {
    displayText: "Job Requirements",
    fullText:
      "List the key job requirements from the provided job description in bullet points.",
  },
  extractKeyRequirements: {
    displayText: "Extract key requirements",
    fullText:
      "Break down the job description into core responsibilities, required qualifications, nice-to-have skills, and high-priority keywords so I can target my application.",
  },
  networkingOutreach: {
    displayText: "Networking Outreach",
    fullText:
      "Draft a message to connect with professionals in this industry or company for networking purposes.",
  },
  recruiterNudge: {
    displayText: "Recruiter Nudge",
    fullText:
      "Generate polite follow-up and decline messages for a recruiter. Provide versions for email, LinkedIn, and Indeed.",
  },
  recruiterFollowUpNudge: {
    displayText: "Recruiter follow-up nudge",
    fullText:
      "Draft a friendly follow-up that reaffirms my interest, references our last conversation, and asks about next steps across both email and LinkedIn.",
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
  Resumes: [
    "resumeSummary",
    "tailorResumeToRole",
    "coverLetter",
    "targetedCoverLetter",
    "bulletRewrite",
    "portfolioReview",
    "projectSummary",
  ],
  Offers: [
    "negotiateOffer",
    "negotiateBetterOffer",
    "compareTwoOffers",
    "salaryResearch",
  ],
  "Recruiter Replies": [
    "interviewPreparation",
    "networkingOutreach",
    "recruiterNudge",
    "recruiterFollowUpNudge",
  ],
  "Career Growth": [
    "skillGapAnalysis",
    "jobDescriptionRewrite",
    "jobRequirements",
    "extractKeyRequirements",
    "screenRoleForRedFlags",
    "careerGoals",
    "elevatorPitch",
    "linkedinProfileOptimization",
  ],
};
