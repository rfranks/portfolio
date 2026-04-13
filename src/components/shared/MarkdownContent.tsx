import type * as React from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Markdown from "react-markdown";
import type { MarkdownContentProps } from "@/types/components/shared";

type RiskTone = "good" | "moderate" | "bad";

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
          p: ({ children }) => (
            <Typography component="p" variant={variant} color={color}>
              {children}
            </Typography>
          ),
          a: ({ children, href }) => (
            <Link href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </Link>
          ),
          li: ({ children }) => {
            if (!riskHudColorize) {
              return (
                <Typography component="li" variant={variant} color={color}>
                  {children}
                </Typography>
              );
            }

            const line = extractPlainText(children).replace(/\s+/g, " ").trim();
            const match = line.match(/^(.+?):\s*(.+)$/);
            if (!match) {
              return (
                <Typography component="li" variant={variant} color={color}>
                  {children}
                </Typography>
              );
            }

            const labelText = match[1].trim();
            const valueText = match[2].trim();
            const tone = getRiskTone(labelText, valueText);
            const toneColor =
              tone === "good"
                ? "success.main"
                : tone === "moderate"
                  ? "#f59e0b"
                  : tone === "bad"
                    ? "error.main"
                    : color;

            return (
              <Typography component="li" variant={variant} color={color}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {labelText}:
                </Box>{" "}
                <Box component="span" sx={{ color: toneColor, fontWeight: 700 }}>
                  {valueText}
                </Box>
              </Typography>
            );
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
