import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import type { SxProps, Theme } from "@mui/material/styles";
import type { TypographyProps } from "@mui/material/Typography";
import Markdown from "react-markdown";

interface MarkdownContentProps {
  content: string;
  className?: string;
  color?: TypographyProps["color"];
  sx?: SxProps<Theme>;
  variant?: TypographyProps["variant"];
}

export default function MarkdownContent({
  content,
  className,
  color = "text.secondary",
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
          li: ({ children }) => (
            <Typography component="li" variant={variant} color={color}>
              {children}
            </Typography>
          ),
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
