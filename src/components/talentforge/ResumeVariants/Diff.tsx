"use client";

import { Box, Typography } from "@mui/material";

interface DiffPart {
  type: "same" | "added" | "removed";
  text: string;
}

interface Props {
  original: string;
  updated: string;
}

function computeDiff(a: string, b: string): DiffPart[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const max = Math.max(aLines.length, bLines.length);
  const result: DiffPart[] = [];
  for (let i = 0; i < max; i++) {
    const lineA = aLines[i];
    const lineB = bLines[i];
    if (lineA === lineB) {
      if (lineA !== undefined) result.push({ type: "same", text: lineA });
    } else {
      if (lineA !== undefined) result.push({ type: "removed", text: lineA });
      if (lineB !== undefined) result.push({ type: "added", text: lineB });
    }
  }
  return result;
}

export default function Diff({ original, updated }: Props) {
  const diff = computeDiff(original, updated);
  return (
    <Box component="pre" sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
      {diff.map((part, idx) => (
        <Typography
          component="span"
          key={idx}
          color={
            part.type === "added"
              ? "success.main"
              : part.type === "removed"
              ? "error.main"
              : undefined
          }
        >
          {part.text}
          {"\n"}
        </Typography>
      ))}
    </Box>
  );
}

