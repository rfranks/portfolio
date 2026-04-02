"use client";

import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

import ErrorBoundary from "./ErrorBoundary";
import RequireAIKey from "./RequireAIKey";
import { PROMPT_TILES } from "@/app/talentforge/_consts/promptTiles";
import Tile from "./promptTiles/Tile";

interface WorkspaceProps {
  onInsertIntoThread?: (text: string) => void;
  onSaveResumeVariant?: (text: string) => void;
}

export default function Workspace({
  onInsertIntoThread,
  onSaveResumeVariant,
}: WorkspaceProps) {
  const [output, setOutput] = useState("");

  const handleCopy = () => {
    if (navigator.clipboard && output) {
      navigator.clipboard.writeText(output);
    }
  };

  const handleInsert = () => {
    onInsertIntoThread?.(output);
  };

  const handleSave = () => {
    onSaveResumeVariant?.(output);
  };

  return (
    <ErrorBoundary>
      <RequireAIKey>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
          }}
        >
          <Box
            sx={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {Object.values(PROMPT_TILES).map((tile) => (
              <Tile key={tile.id} {...tile} onResponse={setOutput} />
            ))}
          </Box>
          <Box
            sx={{
              flexBasis: { md: "30%" },
              border: 1,
              borderColor: "divider",
              p: 2,
              borderRadius: 1,
              minHeight: 200,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Output
            </Typography>
            <Box sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{output}</Box>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleCopy} disabled={!output}>
                Copy
              </Button>
              <Button
                variant="outlined"
                onClick={handleInsert}
                disabled={!onInsertIntoThread || !output}
              >
                Insert into Thread
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!onSaveResumeVariant || !output}
              >
                Save as Resume Variant
              </Button>
            </Stack>
          </Box>
        </Box>
      </RequireAIKey>
    </ErrorBoundary>
  );
}

