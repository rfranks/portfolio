"use client";

import { useState } from "react";
import { Button, Stack, TextField } from "@mui/material";
import { setOpenAIKey } from "@/utils/talentforge/utils";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function KeyEntryStep({ onNext }: StepProps) {
  const [key, setKey] = useState("");

  const handleContinue = async () => {
    const trimmed = key.trim();
    if (!trimmed) return;
    try {
      const res = await fetch("/api/test-openai-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed }),
      });
      if (res.ok) {
        setOpenAIKey(trimmed);
        alert("Key is valid!");
        onNext();
      } else {
        alert("Key test failed.");
      }
    } catch {
      alert("Key test failed.");
    }
  };

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
          onClick={handleContinue}
          disabled={!key}
          aria-label="Continue"
        >
          Continue
        </Button>
      </Stack>
  );
}

