"use client";

import { useEffect, useState } from "react";
import {
  Button,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import CheckCircleOutline from "@mui/icons-material/CheckCircleOutline";
import ErrorOutline from "@mui/icons-material/ErrorOutline";
import { askOpenAI, setOpenAIKey } from "@/utils/talentforge/utils";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function KeyEntryStep({ onNext }: StepProps) {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState<
    "idle" | "checking" | "success" | "error"
  >("idle");

  const validateKey = async (keyToCheck: string) => {
    setStatus("checking");
    setOpenAIKey(keyToCheck);
    try {
      await askOpenAI({
        context: "",
        user: "ping",
        system: "{{context}}",
        logMessagesToChatHistory: false,
        returnFirstResponse: true,
        chatHistory: [],
      });
      if (keyToCheck === key.trim()) {
        setStatus("success");
      }
    } catch {
      if (keyToCheck === key.trim()) {
        setStatus("error");
        setOpenAIKey("");
      }
    }
  };

  useEffect(() => {
    const trimmed = key.trim();
    if (!trimmed) {
      setStatus("idle");
      setOpenAIKey("");
      return;
    }
    const handle = setTimeout(() => validateKey(trimmed), 500);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const adornment =
    status === "checking"
      ? (
          <CircularProgress size={20} />
        )
      : status === "success"
      ? (
          <CheckCircleOutline color="success" />
        )
      : status === "error"
      ? (
          <ErrorOutline color="error" />
        )
      : null;

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

