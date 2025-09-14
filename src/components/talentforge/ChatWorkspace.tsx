"use client";

import { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

import PromptTileGrid from "./promptTiles/PromptTileGrid";

interface ChatWorkspaceProps {
  onInsertIntoInbox?: (text: string) => void;
  onSaveResumeVariant?: (text: string) => void;
}

export default function ChatWorkspace({
  onInsertIntoInbox,
  onSaveResumeVariant,
}: ChatWorkspaceProps) {
  const [output, setOutput] = useState("");

  const handleCopy = () => {
    if (navigator.clipboard && output) {
      navigator.clipboard.writeText(output);
    }
  };

  const handleInsert = () => {
    onInsertIntoInbox?.(output);
  };

  const handleSave = () => {
    onSaveResumeVariant?.(output);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <PromptTileGrid onResponse={setOutput} />
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
            disabled={!onInsertIntoInbox || !output}
          >
            Insert into Inbox
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!onSaveResumeVariant || !output}
          >
            Save Resume Variant
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

