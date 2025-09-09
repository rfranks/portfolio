"use client";

import * as pdfjs from "pdfjs-dist";
import { Buffer } from "buffer";

// Ensure Buffer is available for pdf.js when running in the browser
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

if (typeof window !== "undefined") {
  window.Buffer = window.Buffer || Buffer;
}

/**
 * Convert a resume PDF file into plain text/Markdown.
 *
 * @param file - The uploaded PDF file.
 * @returns A promise that resolves to the extracted text.
 */
export async function pdfToResumeText(file: File): Promise<string> {
  const reader = new FileReader();
  const workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  const fileReadPromise = new Promise<ArrayBuffer>((resolve, reject) => {
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = reject;
  });

  reader.readAsArrayBuffer(file);

  const buffer = await fileReadPromise;
  const pdfData = new Uint8Array(buffer);

  const doc = await pdfjs.getDocument({ data: pdfData }).promise;
  let text = "";

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    for (const item of content.items as { str: string }[]) {
      text += item.str + "\n";
    }

    text += "\n";
  }

  return text.trim();
}

export default pdfToResumeText;
