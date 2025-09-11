"use client";

import { ParsedResume } from "@/types/talentforge/resume";

/**
 * Parse Markdown resume text into structured sections.
 *
 * @param markdown - Resume converted to Markdown.
 * @returns Parsed resume sections.
 */
export function parseResume(markdown: string): ParsedResume {
  const lines = markdown.split(/\r?\n/);

  const resume: ParsedResume = {
    contact: "",
    experience: [],
    education: [],
    skills: [],
  };

  let section: keyof ParsedResume = "contact";

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    if (lower.includes("experience")) {
      section = "experience";
      continue;
    }
    if (lower.includes("education")) {
      section = "education";
      continue;
    }
    if (lower.includes("skill")) {
      section = "skills";
      continue;
    }

    if (section === "contact") {
      resume.contact += (resume.contact ? "\n" : "") + line;
    } else {
      (resume[section] as string[]).push(line);
    }
  }

  return resume;
}

export default parseResume;
