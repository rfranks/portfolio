"use client";

import * as React from "react";
import {
  Box,
  Button,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ContentCopy, Download } from "@mui/icons-material";

import {
  generateCoverLetter,
  generateTailoredResume,
} from "@/utils/talentforge/documentGenerator";

/**
 * DocumentGenerator allows users to generate a tailored resume and cover letter
 * based on a job description. Generated documents can be copied to the
 * clipboard or downloaded as text files.
 */
export default function DocumentGenerator() {
  const [jobDescription, setJobDescription] = React.useState("");
  const [resume, setResume] = React.useState("");
  const [tailoredResume, setTailoredResume] = React.useState("");
  const [coverLetter, setCoverLetter] = React.useState("");
  const [loadingResume, setLoadingResume] = React.useState(false);
  const [loadingCover, setLoadingCover] = React.useState(false);

  const handleGenerateResume = async () => {
    setLoadingResume(true);
    const result = await generateTailoredResume({
      resume,
      jobDescription,
    });
    setTailoredResume(result);
    setLoadingResume(false);
  };

  const handleGenerateCoverLetter = async () => {
    setLoadingCover(true);
    const result = await generateCoverLetter({
      resume,
      jobDescription,
    });
    setCoverLetter(result);
    setLoadingCover(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = (filename: string, text: string) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const ready = jobDescription.trim() && resume.trim();

  return (
    <Box id="document-generator" sx={{ py: 6 }}>
      <Container maxWidth="md">
        <Stack spacing={2}>
          <Typography variant="h4" component="h2" align="center">
            Document Generator
          </Typography>
          <TextField
            label="Job Description"
            multiline
            minRows={4}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          <TextField
            label="Your Resume"
            multiline
            minRows={4}
            value={resume}
            onChange={(e) => setResume(e.target.value)}
          />
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              onClick={handleGenerateResume}
              disabled={!ready || loadingResume}
            >
              {loadingResume ? "Generating…" : "Generate Resume"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleGenerateCoverLetter}
              disabled={!ready || loadingCover}
            >
              {loadingCover ? "Generating…" : "Generate Cover Letter"}
            </Button>
          </Stack>

          {tailoredResume && (
            <Stack spacing={1}>
              <Typography variant="h6">Tailored Resume</Typography>
              <TextField
                multiline
                minRows={6}
                value={tailoredResume}
                onChange={(e) => setTailoredResume(e.target.value)}
              />
              <Stack direction="row" spacing={1}>
                <IconButton
                  aria-label="copy tailored resume"
                  onClick={() => handleCopy(tailoredResume)}
                >
                  <ContentCopy />
                </IconButton>
                <IconButton
                  aria-label="download tailored resume"
                  onClick={() =>
                    handleDownload("tailored-resume.txt", tailoredResume)
                  }
                >
                  <Download />
                </IconButton>
              </Stack>
            </Stack>
          )}

          {coverLetter && (
            <Stack spacing={1}>
              <Typography variant="h6">Cover Letter</Typography>
              <TextField
                multiline
                minRows={6}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
              <Stack direction="row" spacing={1}>
                <IconButton
                  aria-label="copy cover letter"
                  onClick={() => handleCopy(coverLetter)}
                >
                  <ContentCopy />
                </IconButton>
                <IconButton
                  aria-label="download cover letter"
                  onClick={() =>
                    handleDownload("cover-letter.txt", coverLetter)
                  }
                >
                  <Download />
                </IconButton>
              </Stack>
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
}
