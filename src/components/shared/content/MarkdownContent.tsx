import type * as React from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Markdown from "react-markdown";
import type { MarkdownContentProps } from "@/types/components/shared";

type RiskTone = "good" | "moderate" | "bad";
type RiskHudEntry = { labelText: string; valueText: string };
type RiskFieldDefinition = { label: string; emoji: string };

const riskFieldDefinitions: RiskFieldDefinition[] = [
  { label: "Success Probability", emoji: "🎯" },
  { label: "Threat Level", emoji: "⚠️" },
  { label: "Injury Risk", emoji: "🩹" },
  { label: "Resource Cost", emoji: "💸" },
  { label: "Reward Potential", emoji: "🏆" },
  { label: "Key Risk Factors", emoji: "🧭" },
];

function extractPlainText(node: React.ReactNode): string {
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
  for (const definition of riskFieldDefinitions) {
    if (normalizedInput.includes(normalizeLabel(definition.label))) {
      return `${definition.emoji} ${definition.label}`;
    }
  }

  return label.trim();
}

function extractRiskHudEntries(line: string): RiskHudEntry[] {
  const normalized = line.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return [];
  }

  const markerAlternation = riskFieldDefinitions
    .map(
      (field) =>
        `(?:${escapeRegExp(field.emoji)}\\s*)?${field.label.replace(/\s+/g, "\\s+")}\\s*:`,
    )
    .join("|");
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

  if (
    /\b(very high|extreme|critical|severe|deadly|high)\b/i.test(normalizedValue)
  ) {
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

function getRiskTone(label: string, value: string): RiskTone | null {
  const normalizedLabel = normalizeLabel(label);
  const severity = classifySeverityLevel(value);

  if (!severity) {
    return null;
  }

  const isPositiveDirection =
    normalizedLabel.includes("success probability") ||
    normalizedLabel.includes("reward potential");
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

export default function MarkdownContent({
  content,
  className,
  color = "text.secondary",
  riskHudColorize = false,
  sx,
  variant = "body2",
}: MarkdownContentProps) {
  const renderRiskHudEntry = (
    entry: RiskHudEntry,
    component: "p" | "li" | "div",
    key?: string,
  ) => {
    const tone = getRiskTone(entry.labelText, entry.valueText);
    const toneColor =
      tone === "good"
        ? "success.main"
        : tone === "moderate"
          ? "#f59e0b"
          : tone === "bad"
            ? "error.main"
            : color;

    return (
      <Typography
        key={key}
        component={component}
        variant={variant}
        color={color}
      >
        <Box component="span" sx={{ fontWeight: 600 }}>
          {entry.labelText}:
        </Box>{" "}
        <Box component="span" sx={{ color: toneColor, fontWeight: 700 }}>
          {entry.valueText}
        </Box>
      </Typography>
    );
  };

  const renderRiskHudLine = (
    children: React.ReactNode,
    component: "p" | "li" = "p",
  ) => {
    const line = extractPlainText(children).replace(/\s+/g, " ").trim();
    const entries = extractRiskHudEntries(line);

    if (entries.length === 0) {
      return (
        <Typography component={component} variant={variant} color={color}>
          {children}
        </Typography>
      );
    }

    if (entries.length === 1) {
      return renderRiskHudEntry(entries[0], component);
    }

    if (component === "li") {
      return (
        <Box component="li">
          {entries.map((entry, index) =>
            renderRiskHudEntry(entry, "div", `${entry.labelText}-${index}`),
          )}
        </Box>
      );
    }

    return (
      <Box>
        {entries.map((entry, index) =>
          renderRiskHudEntry(entry, "p", `${entry.labelText}-${index}`),
        )}
      </Box>
    );
  };

  return (
    <Box
      className={className}
      sx={{
        "& > :last-child": {
          mb: 0,
        },
        "& p": {
          mb: 1.25,
        },
        "& ul, & ol": {
          margin: 0,
          paddingLeft: "1.25rem",
        },
        "& li + li": {
          mt: 0.5,
        },
        "& code": {
          px: 0.5,
          py: 0.125,
          borderRadius: 1,
          backgroundColor: "action.hover",
          fontFamily: "monospace",
          fontSize: "0.92em",
        },
        ...sx,
      }}
    >
      <Markdown
        components={{
          p: ({ children }) =>
            riskHudColorize ? (
              renderRiskHudLine(children, "p")
            ) : (
              <Typography component="p" variant={variant} color={color}>
                {children}
              </Typography>
            ),
          a: ({ children, href }) => (
            <Link href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </Link>
          ),
          h1: ({ children }) =>
            riskHudColorize ? (
              renderRiskHudLine(children, "p")
            ) : (
              <Typography component="h1" variant="h6" color={color}>
                {children}
              </Typography>
            ),
          h2: ({ children }) =>
            riskHudColorize ? (
              renderRiskHudLine(children, "p")
            ) : (
              <Typography component="h2" variant="h6" color={color}>
                {children}
              </Typography>
            ),
          h3: ({ children }) =>
            riskHudColorize ? (
              renderRiskHudLine(children, "p")
            ) : (
              <Typography component="h3" variant="h6" color={color}>
                {children}
              </Typography>
            ),
          h4: ({ children }) =>
            riskHudColorize ? (
              renderRiskHudLine(children, "p")
            ) : (
              <Typography component="h4" variant="subtitle1" color={color}>
                {children}
              </Typography>
            ),
          h5: ({ children }) =>
            riskHudColorize ? (
              renderRiskHudLine(children, "p")
            ) : (
              <Typography component="h5" variant="subtitle1" color={color}>
                {children}
              </Typography>
            ),
          h6: ({ children }) =>
            riskHudColorize ? (
              renderRiskHudLine(children, "p")
            ) : (
              <Typography component="h6" variant="subtitle2" color={color}>
                {children}
              </Typography>
            ),
          li: ({ children }) => {
            if (!riskHudColorize) {
              return (
                <Typography component="li" variant={variant} color={color}>
                  {children}
                </Typography>
              );
            }

            return renderRiskHudLine(children, "li");
          },
          strong: ({ children }) => (
            <Box component="strong" sx={{ fontWeight: 700 }}>
              {children}
            </Box>
          ),
          em: ({ children }) => (
            <Box component="em" sx={{ fontStyle: "italic" }}>
              {children}
            </Box>
          ),
        }}
      >
        {content}
      </Markdown>
    </Box>
  );
}
