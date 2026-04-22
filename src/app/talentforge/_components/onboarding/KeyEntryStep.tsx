"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, CircularProgress, InputAdornment, Stack, TextField } from "@mui/material";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import { validateOpenAIKey } from "@/app/talentforge/_utils/utils";
import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function KeyEntryStep({ onNext }: StepProps) {
  const { key: storedKey, setKey: setStoredKey, setValidity } = useOpenAIKey();
  const [key, setKey] = useState(storedKey);
  const [status, setStatus] = useState<"idle" | "checking" | "success" | "error">("idle");

  useEffect(() => {
    setKey(storedKey);
  }, [storedKey]);

  const validateKey = useCallback(
    async (keyToCheck: string) => {
      setStatus("checking");
      setStoredKey(keyToCheck, { validity: "checking" });
      try {
        const result = await validateOpenAIKey(keyToCheck);
        if (keyToCheck === key.trim()) {
          if (result.ok) {
            setStatus("success");
            setValidity("valid");
          } else {
            setStatus("error");
            setStoredKey(keyToCheck, { validity: "invalid" });
          }
        }
      } catch {
        if (keyToCheck === key.trim()) {
          setStatus("error");
          setStoredKey(keyToCheck, { validity: "invalid" });
        }
      }
    },
    [key, setStoredKey, setValidity],
  );

  useEffect(() => {
    const trimmed = key.trim();
    if (!trimmed) {
      setStatus("idle");
      setStoredKey("", { validity: "unknown" });
      return;
    }
    const handle = setTimeout(() => validateKey(trimmed), 500);
    return () => clearTimeout(handle);
  }, [key, setStoredKey, validateKey]);

  const adornment =
    status === "checking" ? (
      <CircularProgress size={20} />
    ) : status === "success" ? (
      <CheckCircleOutline color="success" />
    ) : status === "error" ? (
      <ErrorOutline color="error" />
    ) : null;

  return (
    <Stack spacing={2} aria-label="API key entry">
      <TextField
        label="OpenAI API Key"
        aria-label="OpenAI API Key"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        autoFocus
        error={status === "error"}
        helperText={status === "error" ? "OpenAI Key is Invalid" : ""}
        InputProps={{
          endAdornment: adornment ? (
            <InputAdornment position="end">{adornment}</InputAdornment>
          ) : undefined,
        }}
      />
      <Button
        variant="contained"
        onClick={onNext}
        disabled={status !== "success"}
        aria-label="Continue"
      >
        Continue
      </Button>
    </Stack>
  );
}
