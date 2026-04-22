"use client";

import { useState, useRef } from "react";
import { Box, Button, MenuItem, Stack, TextField, Typography } from "@mui/material";

import { askOpenAI } from "@/app/talentforge/_utils/utils";
import { getResumes } from "@/app/talentforge/_utils/dataStore";
import { exportElementToPdf } from "@/utils/pdfExport";
import EmptyState from "./EmptyState";
import RequireAIKey from "./RequireAIKey";

export default function CoverLetter() {
  const [resumeVariantId, setResumeVariantId] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const coverRef = useRef<HTMLDivElement>(null);

  const resumes = getResumes();

  const handleGenerate = async () => {
    if (!resumeVariantId || !jobDescription) return;
    const resume = resumes.find((r) => r.id === resumeVariantId);
    if (!resume) return;
    setLoading(true);
    const context = `Resume:\n${resume.content}\n\nJob Description:\n${jobDescription}`;
    const response = await askOpenAI({
      context,
      user: "Write a professional cover letter with exactly three paragraphs, using the resume to highlight relevant experience.",
      system:
        "You are an assistant that crafts polished three-paragraph cover letters based on a resume and job description.",
      chatHistory: [],
      returnFirstResponse: true,
      logMessagesToChatHistory: false,
    });
    setCoverLetter(response?.message || "");
    setLoading(false);
  };

  return (
    <RequireAIKey>
      {resumes.length === 0 ? (
        <EmptyState
          message="No resumes available"
          helperText="Add a resume before generating a cover letter."
        />
      ) : (
        <Box>
          <Stack spacing={2}>
            <TextField
              select
              label="Resume Variant"
              value={resumeVariantId}
              onChange={(e) => setResumeVariantId(e.target.value)}
            >
              {resumes.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.title}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Job Description"
              multiline
              minRows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                onClick={handleGenerate}
                disabled={!resumeVariantId || !jobDescription || loading}
                aria-label="Generate cover letter"
              >
                Generate
              </Button>
              <Button
                variant="outlined"
                disabled={!coverLetter}
                onClick={() =>
                  coverRef.current && exportElementToPdf(coverRef.current, "cover-letter.pdf")
                }
                aria-label="Export cover letter"
              >
                Export
              </Button>
            </Stack>
            {coverLetter && (
              <Box ref={coverRef}>
                <Typography sx={{ whiteSpace: "pre-wrap" }}>{coverLetter}</Typography>
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </RequireAIKey>
  );
}
