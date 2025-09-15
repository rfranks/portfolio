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

/**
 * Clean up raw PDF text extracted per page.
 * - Collapses duplicate spaces
 * - Removes repeating headers/footers
 * - Joins lines that were broken mid-sentence
 */
export function cleanPdfText(pageLines: string[][]): string {
  const numPages = pageLines.length;
  let header: string | null = null;
  let footer: string | null = null;
  let numericHeader = false;
  let numericFooter = false;

  if (numPages > 1) {
    const firstLines = pageLines.map((p) => p[0]).filter(Boolean);
    const lastLines = pageLines.map((p) => p[p.length - 1]).filter(Boolean);
    const firstCandidate = firstLines[0];
    const lastCandidate = lastLines[0];
    if (firstLines.every((l) => l === firstCandidate)) header = firstCandidate;
    if (lastLines.every((l) => l === lastCandidate)) footer = lastCandidate;

    numericHeader = firstLines.every((l) => /^\d+$/.test(l));
    numericFooter = lastLines.every((l) => /^\d+$/.test(l));
  }

  const cleanedPages = pageLines.map((lines) => {
    const work = [...lines];
    if (header && work[0] === header) {
      work.shift();
    } else if (numericHeader && /^\d+$/.test(work[0])) {
      work.shift();
    }
    if (footer && work[work.length - 1] === footer) {
      work.pop();
    } else if (numericFooter && /^\d+$/.test(work[work.length - 1])) {
      work.pop();
    }

    const collapsed = work.map((l) => l.replace(/[ \t]+/g, " ").trim());
    const joined: string[] = [];

    for (const line of collapsed) {
      if (
        joined.length > 0 &&
        !/[.!?:;-]$/.test(joined[joined.length - 1]) &&
        /^[a-z0-9]/.test(line)
      ) {
        joined[joined.length - 1] += " " + line;
      } else {
        joined.push(line);
      }
    }

    return joined.join("\n");
  });

  return cleanedPages.join("\n\n");
}

/**
 * Extract plain text from a PDF file.
 */
export async function pdfToText(file: File): Promise<string> {
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

  const pages: string[][] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    const lines: string[] = [];
    let currentY: number | null = null;
    let line = "";

    for (const item of content.items as unknown as { str: string; transform: number[] }[]) {
      const str = item.str.trim();
      const y = item.transform[5];
      if (currentY !== null && Math.abs(y - currentY) > 5) {
        if (line) lines.push(line.trim());
        line = str;
      } else {
        line += (line ? " " : "") + str;
      }
      currentY = y;
    }
    if (line) lines.push(line.trim());
    pages.push(lines);
  }

  return cleanPdfText(pages);
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
 * Convenience helper to convert a PDF file to plain text and parse its sections.
 */
export async function parsePdf(
  file: File,
): Promise<{ text: string; parsed: ParsedResume }> {
  const text = await pdfToText(file);
  return { text, parsed: parseResumeText(text) };
}

