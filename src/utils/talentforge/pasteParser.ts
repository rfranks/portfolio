"use client";

import DOMPurify from "dompurify";

/**
 * Sanitize HTML pasted by the user and return plain text.
 */
export function parsePastedHtml(html: string): string {
  if (typeof window === "undefined") return html;
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  const temp = document.createElement("div");
  temp.innerHTML = clean;
  return temp.textContent || temp.innerText || "";
}
