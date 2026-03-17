"use client";

import { useMemo } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";

import type { ResumeEntry } from "@/types";
import { getResumes } from "@/utils/talentforge/dataStore";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

const formatTimestamp = (value?: string) => {
  if (!value) return "Unknown import time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown import time";
  }
  return date.toLocaleString();
};

const buildPreview = (resume: ResumeEntry) => {
  const text = resume.content?.trim() ?? "";
  if (!text) return "No extracted text available.";
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  return lines.slice(0, 12).join("\n");
};

const selectPreviewResume = (resumes: ResumeEntry[]): ResumeEntry | undefined => {
  if (resumes.length === 0) {
    return undefined;
  }

  let selected = resumes[resumes.length - 1];
  let selectedTimestamp = Date.parse(selected.importedAt ?? "");

  for (const resume of resumes) {
    const timestamp = Date.parse(resume.importedAt ?? "");
    if (!Number.isNaN(timestamp)) {
      if (Number.isNaN(selectedTimestamp) || timestamp > selectedTimestamp) {
        selected = resume;
        selectedTimestamp = timestamp;
      }
    }
  }

  return selected;
};

export default function ResumePreviewStep({ onNext, onBack }: StepProps) {
  const resumes = useMemo(() => getResumes(), []);
  const hasResume = resumes.length > 0;
  const primaryResume = useMemo(() => selectPreviewResume(resumes), [resumes]);

  return (
    <Stack spacing={2} aria-label="Review uploaded resume">
      <Typography variant="body1">
        Confirm that we captured the correct resume details. You can re-upload
        if something looks off.
      </Typography>
      {!hasResume ? (
        <Alert severity="warning" role="status">
          No resume has been imported yet. Go back to upload one before
          continuing.
        </Alert>
      ) : (
        <Paper variant="outlined" sx={{ p: 2 }} aria-live="polite">
          <Stack spacing={1}>
            <Typography variant="h6" component="h3">
              {primaryResume?.title || primaryResume?.label || "Imported Resume"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Source file: {primaryResume?.sourceFilename || "Unknown"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Imported: {formatTimestamp(primaryResume?.importedAt)}
            </Typography>
            <Box
              component="pre"
              sx={{
                bgcolor: "background.default",
                borderRadius: 1,
                p: 2,
                overflow: "auto",
                maxHeight: 240,
                whiteSpace: "pre-wrap",
              }}
              aria-label="Resume text preview"
            >
              {primaryResume ? buildPreview(primaryResume) : "No extracted text available."}
            </Box>
          </Stack>
        </Paper>
      )}
      <Stack direction="row" spacing={1}>
        {onBack && (
          <Button onClick={onBack} aria-label="Back">
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!hasResume}
          aria-label="Continue"
        >
          Looks good
        </Button>
      </Stack>
    </Stack>
  );
}
