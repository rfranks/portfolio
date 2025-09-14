"use client";

import { useState } from "react";
import { Button, Stack, TextField } from "@mui/material";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function KeyEntryStep({ onNext }: StepProps) {
  const [key, setKey] = useState("");

  return (
    <Stack spacing={2} aria-label="API key entry">
        <TextField
          label="OpenAI API Key"
          aria-label="OpenAI API Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          autoFocus
        />
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!key}
          aria-label="Continue"
        >
          Continue
        </Button>
      </Stack>
  );
}

