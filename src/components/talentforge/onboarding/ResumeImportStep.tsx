"use client";

import { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import FocusTrap from "@mui/base/FocusTrap";

import FileUploader from "../FileUploader";

interface ResumeImportStepProps {
  onNext: () => void;
}

export default function ResumeImportStep({ onNext }: ResumeImportStepProps) {
  const [uploaded, setUploaded] = useState(false);

  return (
    <FocusTrap open>
      <Box aria-label="resume import step">
        <Typography>Upload your resume to personalize suggestions.</Typography>
        <FileUploader
          accept=".pdf,.txt,.md"
          label="Upload resume"
          onChange={() => setUploaded(true)}
          sx={{ mt: 2 }}
        />
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!uploaded}
          sx={{ mt: 2 }}
          aria-label="continue after resume upload"
        >
          Continue
        </Button>
      </Box>
    </FocusTrap>
  );
}

