"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Button, TextField } from "@mui/material";
import { setOpenAIKey } from "@/utils/talentforge/utils";

interface KeyEntryStepProps {
  onNext: () => void;
}

export default function KeyEntryStep({ onNext }: KeyEntryStepProps) {
  const [key, setKey] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSave = () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    setOpenAIKey(trimmed);
    onNext();
  };

  return (
    <Box aria-label="openai key entry">
      <TextField
        inputRef={inputRef}
        label="OpenAI API Key"
        type="password"
        fullWidth
        value={key}
        onChange={(e) => setKey(e.target.value)}
      />
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleSave}
        disabled={!key.trim()}
        aria-label="save api key"
      >
        Save Key
      </Button>
    </Box>
  );
}

