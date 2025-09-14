"use client";

import { Box, Typography, useTheme } from "@mui/material";

interface DiffLine {
  text: string | null;
  type: "same" | "added" | "removed";
}

interface DiffRow {
  original: DiffLine;
  updated: DiffLine;
}

interface Props {
  original: string;
  updated: string;
}

function computeDiff(a: string, b: string): DiffRow[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const max = Math.max(aLines.length, bLines.length);
  const rows: DiffRow[] = [];

  for (let i = 0; i < max; i++) {
    const lineA = aLines[i] ?? null;
    const lineB = bLines[i] ?? null;

    if (lineA === lineB) {
      rows.push({
        original: { text: lineA, type: "same" },
        updated: { text: lineB, type: "same" },
      });
    } else {
      rows.push({
        original: { text: lineA, type: lineA === null ? "same" : "removed" },
        updated: { text: lineB, type: lineB === null ? "same" : "added" },
      });
    }
  }

  return rows;
}

export default function Diff({ original, updated }: Props) {
  const theme = useTheme();
  const diff = computeDiff(original, updated);

  const getBg = (type: DiffLine["type"]) => {
    switch (type) {
      case "added":
        return theme.palette.success.light;
      case "removed":
        return theme.palette.error.light;
      default:
        return undefined;
    }
  };

  return (
    <Box
      role="region"
      aria-label="Resume diff viewer"
      sx={{
        width: "100%",
        overflowX: "auto",
      }}
    >
      <Box
        component="table"
        sx={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: 360,
          fontFamily: "monospace",
          "td, th": {
            verticalAlign: "top",
            whiteSpace: "pre-wrap",
            padding: 0.5,
          },
        }}
      >
        <thead>
          <tr>
            <th scope="col">Original</th>
            <th scope="col">Updated</th>
          </tr>
        </thead>
        <tbody>
          {diff.map((row, idx) => (
            <tr key={idx}>
              <td style={{ backgroundColor: getBg(row.original.type) }}>
                <Typography component="pre" sx={{ m: 0 }}>
                  {row.original.text}
                </Typography>
              </td>
              <td style={{ backgroundColor: getBg(row.updated.type) }}>
                <Typography component="pre" sx={{ m: 0 }}>
                  {row.updated.text}
                </Typography>
              </td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  );
}
