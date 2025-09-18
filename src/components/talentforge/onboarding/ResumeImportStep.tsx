"use client";

import { useState } from "react";
import { Alert, Button, CircularProgress, Stack } from "@mui/material";
import { v4 as uuid } from "uuid";

import { fileToText, parseResumeText } from "@/utils/talentforge/resumeIngest";
import { addResume } from "@/utils/talentforge/dataStore";
import { tagResume } from "@/utils/talentforge/tagging";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function ResumeImportStep({ onNext, onBack }: StepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    const selected = target.files?.[0] || null;
    setFile(selected);
    setError(null);
    if (target) {
      target.value = "";
    }
  };

  const handleContinue = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const text = await fileToText(file);
      const tags = await tagResume(text);
      let parsed;
      try {
        parsed = parseResumeText(text);
      } catch (parseError) {
        console.error("Failed to parse resume text", parseError);
        throw parseError;
      }
      addResume({
        id: uuid(),
        userId: "",
        label: "",
        title: "",
        url: "",
        content: text,
        parsed,
        tags,
      });
      setFile(null);
      onNext();
    } catch (err) {
      console.error("Failed to import resume", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to import resume. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2} aria-label="Resume import">
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Button
        component="label"
        variant="outlined"
        aria-label="Upload resume"
        disabled={loading}
      >
          Upload Resume
          <input
            type="file"
            accept=".pdf,.docx,.txt,.md"
            hidden
            onChange={handleFileChange}
          />
      </Button>
      <Stack direction="row" spacing={1}>
        {onBack && (
          <Button onClick={onBack} aria-label="Back" disabled={loading}>
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleContinue}
          disabled={!file || loading}
          aria-label="Continue"
        >
          {loading ? <CircularProgress size={24} /> : "Continue"}
        </Button>
      </Stack>
    </Stack>
  );
}

