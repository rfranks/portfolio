"use client";

import * as pdfjs from "pdfjs-dist";

import { Buffer } from "buffer";
import { ParsedResume } from "@/types/talentforge/resume";

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

export async function pdfToMarkdown(file: File): Promise<string> {
  const reader = new FileReader();
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const fileReadPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => {
      resolve(reader.result as ArrayBuffer);
    };
    reader.onerror = reject;
  });

  reader.readAsArrayBuffer(file);

  const buffer = await fileReadPromise;
  const pdfData = new Uint8Array(buffer);

  const doc = await pdfjs.getDocument({ data: pdfData }).promise;
  const numPages = doc.numPages;

  let markdown = "";

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items as unknown as { str: string }[]) {
      markdown += item.str + "\n";
    }

    markdown += "\n\n";
  }

  return markdown;
}

/**
 * Naively extract sections from resume text.
 * Everything before the first recognized section header is treated as contact information.
 */
export function parseResumeText(text: string): ParsedResume {
  const lines = text.split(/\r?\n/);
  const parsed: ParsedResume = {
    contact: "",
    experience: [],
    education: [],
    skills: [],
  };

  let current: keyof Omit<ParsedResume, "contact"> | null = null;
  const experienceHeader = /^(work\s+)?experience/i;
  const educationHeader = /^education/i;
  const skillsHeader = /^skills?/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (experienceHeader.test(line)) {
      current = "experience";
      continue;
    }
    if (educationHeader.test(line)) {
      current = "education";
      continue;
    }
    if (skillsHeader.test(line)) {
      current = "skills";
      continue;
    }

    if (!current) {
      parsed.contact += (parsed.contact ? "\n" : "") + line;
    } else {
      parsed[current].push(line);
    }
  }

  return parsed;
}

/**
 * Convenience helper to convert a PDF file and parse its sections.
 */
export async function parsePdf(
  file: File,
): Promise<{ text: string; parsed: ParsedResume }> {
  const text = await pdfToMarkdown(file);
  return { text, parsed: parseResumeText(text) };
}

