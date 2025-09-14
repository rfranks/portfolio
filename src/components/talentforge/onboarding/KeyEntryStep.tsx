"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, TextField, Typography } from "@mui/material";
import FocusTrap from "@mui/base/FocusTrap";

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
    <FocusTrap open>
      <Box role="form" aria-label="enter openai api key">
        <Typography>Enter your OpenAI API key to continue.</Typography>
        <TextField
          inputRef={inputRef}
          aria-label="OpenAI API key"
          type="password"
          fullWidth
          value={key}
          onChange={(e) => setKey(e.target.value)}
          sx={{ mt: 2 }}
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!key.trim()}
          sx={{ mt: 2 }}
          aria-label="save key and continue"
        >
          Save and continue
        </Button>
      </Box>
    </FocusTrap>
  );
}

