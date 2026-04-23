import type * as React from "react";
import { RISK_FIELD_DEFINITIONS } from "@/consts/components/shared/markdownRiskHud";
import type { RiskHudEntry, RiskTone } from "@/types/components/shared/markdownRiskHud";

export function extractPlainText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map((item) => extractPlainText(item)).join("");
  }

  if (!node || typeof node !== "object") {
    return "";
  }

  if ("props" in node && node.props && typeof node.props === "object") {
    const props = node.props as { children?: React.ReactNode };
    return extractPlainText(props.children);
  }

  return "";
}

function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeRiskHudLabel(label: string): string {
  const normalizedInput = normalizeLabel(label);
  for (const definition of RISK_FIELD_DEFINITIONS) {
    if (normalizedInput.includes(normalizeLabel(definition.label))) {
      return `${definition.emoji} ${definition.label}`;
    }
  }

  return label.trim();
}

export function extractRiskHudEntries(line: string): RiskHudEntry[] {
  const normalized = line.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const markerAlternation = RISK_FIELD_DEFINITIONS.map(
    (field) => `(?:${escapeRegExp(field.emoji)}\\s*)?${field.label.replace(/\s+/g, "\\s+")}\\s*:`,
  ).join("|");
  const markerRegex = new RegExp(markerAlternation, "gi");

  const markerMatches = Array.from(normalized.matchAll(markerRegex))
    .map((match) => ({
      index: typeof match.index === "number" ? match.index : -1,
    }))
    .filter((match) => match.index >= 0)
    .sort((a, b) => a.index - b.index);

  if (markerMatches.length === 0) {
    const singleMatch = normalized.match(/^(.+?):\s*(.+)$/);
    if (!singleMatch) {
      return [];
    }

    return [
      {
        labelText: normalizeRiskHudLabel(singleMatch[1].trim()),
        valueText: singleMatch[2].trim(),
      },
    ];
  }

  const entries: RiskHudEntry[] = [];
  for (let index = 0; index < markerMatches.length; index += 1) {
    const start = markerMatches[index].index;
    const next = markerMatches[index + 1];
    const end = next ? next.index : normalized.length;
    const chunk = normalized.slice(start, end).trim();
    if (!chunk) {
      continue;
    }

    const colonIndex = chunk.indexOf(":");
    if (colonIndex < 0) {
      continue;
    }

    const labelText = normalizeRiskHudLabel(chunk.slice(0, colonIndex).trim());
    const valueText = chunk.slice(colonIndex + 1).trim();
    if (!labelText || !valueText) {
      continue;
    }

    entries.push({
      labelText,
      valueText,
    });
  }

  if (entries.length > 0) {
    return entries;
  }

  const fallbackMatch = normalized.match(/^(.+?):\s*(.+)$/);
  if (!fallbackMatch) {
    return [];
  }

  return [
    {
      labelText: normalizeRiskHudLabel(fallbackMatch[1].trim()),
      valueText: fallbackMatch[2].trim(),
    },
  ];
}

function classifySeverityLevel(value: string): "low" | "moderate" | "high" | null {
  const normalizedValue = value.toLowerCase().trim();
  const percentageMatch = normalizedValue.match(/(\d{1,3})\s*%/);
  if (percentageMatch) {
    const percentage = Number.parseInt(percentageMatch[1], 10);
    if (Number.isFinite(percentage)) {
      if (percentage >= 67) {
        return "high";
      }
      if (percentage >= 40) {
        return "moderate";
      }
      return "low";
    }
  }

  if (/\b(very high|extreme|critical|severe|deadly|high)\b/i.test(normalizedValue)) {
    return "high";
  }

  if (/\b(moderate|medium)\b/i.test(normalizedValue)) {
    return "moderate";
  }

  if (/\b(very low|minimal|low|minor|safe)\b/i.test(normalizedValue)) {
    return "low";
  }

  return null;
}

export function getRiskTone(label: string, value: string): RiskTone | null {
  const normalizedLabel = normalizeLabel(label);
  const severity = classifySeverityLevel(value);

  if (!severity) {
    return null;
  }

  const isPositiveDirection =
    normalizedLabel.includes("success probability") || normalizedLabel.includes("reward potential");
  const isNegativeDirection =
    normalizedLabel.includes("threat level") ||
    normalizedLabel.includes("injury risk") ||
    normalizedLabel.includes("resource cost");

  if (!isPositiveDirection && !isNegativeDirection) {
    return null;
  }

  if (isPositiveDirection) {
    if (severity === "high") {
      return "good";
    }
    if (severity === "moderate") {
      return "moderate";
    }
    return "bad";
  }

  if (severity === "high") {
    return "bad";
  }
  if (severity === "moderate") {
    return "moderate";
  }
  return "good";
}
