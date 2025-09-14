"use client";

import { useState } from "react";
import { Button, Stack } from "@mui/material";
import FocusTrap from "@mui/base/FocusTrap";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function ResumeImportStep({ onNext, onBack }: StepProps) {
  const [hasFile, setHasFile] = useState(false);

  return (
    <FocusTrap open>
      <Stack spacing={2} aria-label="Resume import">
        <Button component="label" variant="outlined" aria-label="Upload resume">
          Upload Resume
          <input
            type="file"
            hidden
            onChange={(e) => setHasFile(!!e.target.files && e.target.files.length > 0)}
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
            onClick={onNext}
            disabled={!hasFile}
            aria-label="Continue"
          >
            Continue
          </Button>
        </Stack>
      </Stack>
    </FocusTrap>
  );
}

