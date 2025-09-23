import type { ResumeEntry, JobApplication, Offer } from "@/types";
import type { TalentForgeGoalTag } from "./promptTypes";
import type { CurrentCompensation, UserProfile } from "./dataStore";

const GOAL_LABELS: Record<TalentForgeGoalTag, string> = {
  resume: "Resume",
  networking: "Networking",
  search: "Job Search",
};

export function formatResumeForPrompt(resume: ResumeEntry): string {
  return resume.content || "";
}

export function formatJobApplicationForPrompt(
  application: JobApplication,
): string {
  const lines: string[] = [];
  lines.push(`Role: ${application.role.title}`);
  lines.push(`Company: ${application.role.company}`);
  if (application.role.location) {
    lines.push(`Location: ${application.role.location}`);
  }
  lines.push(`Status: ${application.status}`);
  if (application.nextAction) {
    lines.push(`Next Action: ${application.nextAction}`);
  }
  if (application.dueAt) {
    lines.push(`Due: ${application.dueAt}`);
  }
  if (application.role.description) {
    lines.push("\nJob Description:");
    lines.push(application.role.description.trim());
  }
  return lines.join("\n");
}

export function formatOfferForPrompt(offer: Offer): string {
  const lines: string[] = [];
  lines.push(`Company: ${offer.application.role.company}`);
  lines.push(`Role: ${offer.application.role.title}`);
  if (offer.application.role.location) {
    lines.push(`Location: ${offer.application.role.location}`);
  }
  if (offer.compensation.length > 0) {
    lines.push("\nCompensation:");
    offer.compensation.forEach((comp) => {
      const details = [comp.type];
      if (typeof comp.amount === "number" && !Number.isNaN(comp.amount)) {
        details.push(String(comp.amount));
      }
      if (comp.notes) {
        details.push(comp.notes);
      }
      lines.push(`- ${details.join(" | ")}`);
    });
  }
  if (offer.summary && offer.summary.length > 0) {
    lines.push("\nSummary:");
    offer.summary.forEach((entry) => lines.push(`- ${entry}`));
  }
  if (offer.decision) {
    lines.push("\nDecision:");
    lines.push(`Status: ${offer.decision.status}`);
    if (offer.decision.notes) {
      lines.push(`Notes: ${offer.decision.notes}`);
    }
  }
  return lines.join("\n");
}

export function formatCurrentCompensationForPrompt(
  compensation: CurrentCompensation,
): string {
  const parts: string[] = [];
  if (compensation.salary) {
    parts.push(`Salary: ${compensation.salary}`);
  }
  if (compensation.stock) {
    parts.push(`Equity: ${compensation.stock}`);
  }
  if (compensation.benefits) {
    parts.push(`Benefits: ${compensation.benefits}`);
  }
  return parts.join("\n");
}

export function formatUserProfileForPrompt(
  profile: UserProfile | undefined,
): string {
  if (!profile) return "";
  const parts: string[] = [];
  if (profile.name) {
    parts.push(`Name: ${profile.name}`);
  }
  if (profile.email) {
    parts.push(`Email: ${profile.email}`);
  }
  if (profile.firstName || profile.lastName) {
    parts.push(
      `Preferred Name: ${[profile.firstName, profile.lastName]
        .filter(Boolean)
        .join(" ")}`,
    );
  }
  return parts.join("\n");
}

export function formatGoalsForPrompt(goals: TalentForgeGoalTag[]): string {
  if (goals.length === 0) return "";
  return goals.map((goal) => GOAL_LABELS[goal] || goal).join(", ");
}
