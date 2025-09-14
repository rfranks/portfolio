"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Button, TextField } from "@mui/material";

interface ResumeImportStepProps {
  onNext: () => void;
}

export default function ResumeImportStep({ onNext }: ResumeImportStepProps) {
  const [resume, setResume] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleImport = () => {
    if (!resume.trim()) return;
    // Placeholder for resume processing logic
    onNext();
  };

  return (
    <Box aria-label="resume import">
      <TextField
        inputRef={inputRef}
        label="Paste resume text"
        multiline
        minRows={4}
        fullWidth
        value={resume}
        onChange={(e) => setResume(e.target.value)}
      />
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={handleImport}
        disabled={!resume.trim()}
        aria-label="import resume"
      >
        Import Resume
      </Button>
    </Box>
  );
}

