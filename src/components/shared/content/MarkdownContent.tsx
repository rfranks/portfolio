import type * as React from "react";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import Markdown from "react-markdown";
import type { MarkdownContentProps } from "@/types/components/shared";
import type { RiskHudEntry } from "@/types/components/shared/markdownRiskHud";
import {
  extractPlainText,
  extractRiskHudEntries,
  getRiskTone,
} from "@/utils/content/markdownRiskHud";

export default function MarkdownContent({
  content,
  className,
  color = "text.secondary",
  riskHudColorize = false,
  sx,
  variant = "body2",
}: MarkdownContentProps) {
  const renderRiskHudEntry = (entry: RiskHudEntry, component: "p" | "li" | "div", key?: string) => {
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
      <Typography key={key} component={component} variant={variant} color={color}>
        <Box component="span" sx={{ fontWeight: 600 }}>
          {entry.labelText}:
        </Box>{" "}
        <Box component="span" sx={{ color: toneColor, fontWeight: 700 }}>
          {entry.valueText}
        </Box>
      </Typography>
    );
  };

  const renderRiskHudLine = (children: React.ReactNode, component: "p" | "li" = "p") => {
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
