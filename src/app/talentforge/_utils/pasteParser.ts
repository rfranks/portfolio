"use client";

import DOMPurify from "dompurify";

/**
 * Sanitize HTML pasted by the user and return plain text.
 */
export function parsePastedHtml(html: string): string {
  if (typeof window === "undefined") {
    // Fallback for server-side environments: strip all HTML tags
    return html.replace(/<[^>]*>/g, "");
  }
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  const temp = document.createElement("div");
  temp.innerHTML = clean;
  return temp.textContent || temp.innerText || "";
}
