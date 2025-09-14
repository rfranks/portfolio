"use client";

import * as pdfjs from "pdfjs-dist";

import { Buffer } from "buffer";

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

