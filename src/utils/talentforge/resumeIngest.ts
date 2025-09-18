"use client";

import * as pdfjs from "pdfjs-dist";

import { Buffer } from "buffer";
import type { ParsedResume, ResumeEntry } from "@/types";

declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

export type ResumeImportMetadata = Pick<ResumeEntry, "sourceFilename" | "importedAt">;

export interface ResumeTextResult {
  text: string;
  metadata: ResumeImportMetadata;
}

const PASTED_RESUME_LABEL = "Pasted resume";

function nowIsoString(): string {
  return new Date().toISOString();
}

function createMetadataFromFile(file: File): ResumeImportMetadata {
  return {
    sourceFilename: file.name || undefined,
    importedAt: nowIsoString(),
  };
}

export function createPastedResumeMetadata(): ResumeImportMetadata {
  return {
    sourceFilename: PASTED_RESUME_LABEL,
    importedAt: nowIsoString(),
  };
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

const DOCX_DOCUMENT_PATH = "word/document.xml";
const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;

const docxTextDecoder = new TextDecoder("utf-8");

function findEndOfCentralDirectory(data: Uint8Array): number {
  const minimumLength = 22;
  for (let i = data.length - minimumLength; i >= 0; i--) {
    if (
      data[i] === (EOCD_SIGNATURE & 0xff) &&
      data[i + 1] === ((EOCD_SIGNATURE >> 8) & 0xff) &&
      data[i + 2] === ((EOCD_SIGNATURE >> 16) & 0xff) &&
      data[i + 3] === ((EOCD_SIGNATURE >> 24) & 0xff)
    ) {
      return i;
    }
  }
  return -1;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function normalizeDocxXml(xml: string): string {
  const withBreaks = xml
    .replace(/<w:tab\s*\/>/gi, "\t")
    .replace(/<w:(?:br|cr)[^>]*>/gi, "\n")
    .replace(/<w:p[^>]*>/gi, "\n")
    .replace(/<\/w:p>/gi, "\n");

  const withoutTags = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeXmlEntities(withoutTags);

  const lines = decoded.split(/\r?\n/).map((line) => line.replace(/\t/g, " ").trim());
  const compacted: string[] = [];

  for (const line of lines) {
    if (!line) {
      if (compacted.length > 0 && compacted[compacted.length - 1] === "") {
        continue;
      }
      if (compacted.length > 0) {
        compacted.push("");
      }
      continue;
    }
    compacted.push(line.replace(/\s+/g, " "));
  }

  return compacted.join("\n").trim();
}

function arrayBufferFromUint8(data: Uint8Array): ArrayBuffer {
  const { buffer, byteOffset, byteLength } = data;
  if (buffer instanceof ArrayBuffer) {
    if (byteOffset === 0 && byteLength === buffer.byteLength) {
      return buffer;
    }
    return buffer.slice(byteOffset, byteOffset + byteLength);
  }
  const copy = new Uint8Array(data);
  return copy.buffer;
}

async function inflateDocxSegment(data: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error(
      "DOCX parsing requires a browser that supports the DecompressionStream API."
    );
  }

  let decompressor: DecompressionStream;
  try {
    decompressor = new DecompressionStream("deflate-raw");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "DOCX parsing is not supported in this browser.";
    throw new Error(message);
  }

  try {
    const chunk = arrayBufferFromUint8(data);
    const stream = new Blob([chunk]).stream().pipeThrough(decompressor);
    const buffer = await new Response(stream).arrayBuffer();
    return new Uint8Array(buffer);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to decompress the DOCX document contents.";
    throw new Error(message);
  }
}

async function extractDocumentXml(data: Uint8Array): Promise<string> {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const eocdOffset = findEndOfCentralDirectory(data);
  if (eocdOffset === -1) {
    throw new Error("Invalid DOCX archive: central directory not found");
  }

  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);
  const directoryEnd = centralDirectoryOffset + centralDirectorySize;

  let cursor = centralDirectoryOffset;
  while (cursor < directoryEnd) {
    if (view.getUint32(cursor, true) !== CENTRAL_DIRECTORY_SIGNATURE) {
      throw new Error("Invalid DOCX archive: corrupt central directory");
    }

    const generalPurposeFlag = view.getUint16(cursor + 8, true);
    if (generalPurposeFlag & 0x0001) {
      throw new Error("Encrypted DOCX files are not supported");
    }

    const compressionMethod = view.getUint16(cursor + 10, true);
    const compressedSize = view.getUint32(cursor + 20, true);
    const fileNameLength = view.getUint16(cursor + 28, true);
    const extraFieldLength = view.getUint16(cursor + 30, true);
    const fileCommentLength = view.getUint16(cursor + 32, true);
    const localHeaderOffset = view.getUint32(cursor + 42, true);

    const nameStart = cursor + 46;
    const nameEnd = nameStart + fileNameLength;
    const fileName = docxTextDecoder.decode(data.subarray(nameStart, nameEnd));

    if (fileName === DOCX_DOCUMENT_PATH) {
      const localHeaderSignature = view.getUint32(localHeaderOffset, true);
      if (localHeaderSignature !== LOCAL_FILE_HEADER_SIGNATURE) {
        throw new Error("Invalid DOCX archive: corrupt local file header");
      }

      const localNameLength = view.getUint16(localHeaderOffset + 26, true);
      const localExtraLength = view.getUint16(localHeaderOffset + 28, true);
      const dataOffset = localHeaderOffset + 30 + localNameLength + localExtraLength;
      const compressed = data.subarray(dataOffset, dataOffset + compressedSize);

      if (compressionMethod === 0) {
        return docxTextDecoder.decode(compressed);
      }

      if (compressionMethod === 8) {
        const inflated = await inflateDocxSegment(compressed);
        return docxTextDecoder.decode(inflated);
      }

      throw new Error(`Unsupported DOCX compression method: ${compressionMethod}`);
    }

    cursor = nameEnd + extraFieldLength + fileCommentLength;
  }

  throw new Error("DOCX archive does not contain word/document.xml");
}

/**
 * Extract plain text from a DOCX file using in-browser parsing.
 */
export async function docxToText(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const xml = await extractDocumentXml(new Uint8Array(arrayBuffer));
    return normalizeDocxXml(xml);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to parse DOCX file";
    throw new Error(message);
  }
}

/**
 * Extract text from a file, supporting PDF and DOCX, and attach import metadata.
 */
export async function fileToText(file: File): Promise<ResumeTextResult> {
  const name = file.name.toLowerCase();
  let text: string;
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    text = await pdfToText(file);
  } else if (
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    text = await docxToText(file);
  } else {
    text = await file.text();
  }
  return { text, metadata: createMetadataFromFile(file) };
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
): Promise<{ text: string; parsed: ParsedResume; metadata: ResumeImportMetadata }> {
  const text = await pdfToText(file);
  return { text, parsed: parseResumeText(text), metadata: createMetadataFromFile(file) };
}

export async function parseDocx(
  file: File,
): Promise<{ text: string; parsed: ParsedResume; metadata: ResumeImportMetadata }> {
  const text = await docxToText(file);
  return { text, parsed: parseResumeText(text), metadata: createMetadataFromFile(file) };
}

export async function parseResumeFile(
  file: File,
): Promise<{ text: string; parsed: ParsedResume; metadata: ResumeImportMetadata }> {
  const { text, metadata } = await fileToText(file);
  return { text, metadata, parsed: parseResumeText(text) };
}

