"use client";

import { useState } from "react";
import { Button, Stack } from "@mui/material";
import { v4 as uuid } from "uuid";

import { pdfToMarkdown, parseResumeText } from "@/utils/talentforge/pdfParser";
import { addResume } from "@/utils/talentforge/dataStore";
import { tagResume } from "@/utils/talentforge/tagging";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function ResumeImportStep({ onNext, onBack }: StepProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
  };

  const handleContinue = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const text = await pdfToMarkdown(file);
      const tags = await tagResume(text);
      const parsed = parseResumeText(text);
      addResume({
        id: uuid(),
        userId: "",
        label: "",
        url: "",
        content: text,
        parsed,
        tags,
      });
      onNext();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={2} aria-label="Resume import">
        <Button component="label" variant="outlined" aria-label="Upload resume">
          Upload Resume
          <input
            type="file"
            hidden
            onChange={handleFileChange}
          />
        </Button>
        <Stack direction="row" spacing={1}>
          {onBack && (
            <Button onClick={onBack} aria-label="Back">
              Back
            </Button>
          )}
          <Button
            variant="contained"
            onClick={handleContinue}
            disabled={!file || loading}
            aria-label="Continue"
          >
            Continue
          </Button>
        </Stack>
      </Stack>
  );
}

