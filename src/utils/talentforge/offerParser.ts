"use client";

import { type OfferComp } from "@/types";

export interface ParsedOffer {
  compensation: OfferComp[];
  summary: string;
}

function extractAmount(value: string): number {
  const digitsAndDots = value.replace(/[^0-9.]/g, "");
  const firstDecimalIndex = digitsAndDots.indexOf(".");

  let normalized = digitsAndDots;
  if (firstDecimalIndex !== -1) {
    normalized =
      digitsAndDots.slice(0, firstDecimalIndex + 1) +
      digitsAndDots.slice(firstDecimalIndex + 1).replace(/\./g, "");
  }

  const amount = parseFloat(normalized);
  return Number.isNaN(amount) ? 0 : amount;
}

export function parseOfferText(text: string): ParsedOffer {
  const comps: OfferComp[] = [];

  const base = /base\s+salary[^$]*\$?([0-9,]+(?:\.[0-9]+)?)/i.exec(text);
  if (base) {
    comps.push({ type: "base", amount: extractAmount(base[1]) });
  }

  const bonus = /bonus[^$]*\$?([0-9,]+(?:\.[0-9]+)?)/i.exec(text);
  if (bonus) {
    comps.push({ type: "bonus", amount: extractAmount(bonus[1]) });
  }

  const equity = /equity[^0-9]*([0-9,]+(?:\.[0-9]+)?)\s*(RSUs|shares|options)?/i.exec(text);
  if (equity) {
    comps.push({
      type: "equity",
      amount: extractAmount(equity[1]),
      notes: equity[2]?.trim(),
    });
  }

  const start = /start\s+date[:\s]*([^\n]+)/i.exec(text);
  if (start) {
    comps.push({ type: "start", amount: 0, notes: start[1].trim() });
  }

  return {
    compensation: comps,
    summary: text.trim().slice(0, 200),
  };
}
