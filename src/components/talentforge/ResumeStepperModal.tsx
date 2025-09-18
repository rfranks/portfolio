"use client";

import { useEffect, useMemo, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { filterByTag, filterByText } from "@/utils/search";
import { getResumes, addResume } from "@/utils/talentforge/dataStore";
import type { ResumeEntry } from "@/types";
import { askOpenAI } from "@/utils/talentforge/utils";
import {
  fileToText,
  parseResumeText,
  createPastedResumeMetadata,
} from "@/utils/talentforge/resumeIngest";
import { parsePastedHtml } from "@/utils/talentforge/pasteParser";
import { tagResume } from "@/utils/talentforge/tagging";
import { PROMPT_TEMPLATES } from "@/consts/prompts";
import FileUploader from "./FileUploader";
import ResumeVariantList from "./ResumeVariants/List";

interface ResumeStepperModalProps {
  open: boolean;
  onClose: () => void;
  onResumesUpdated?: (resumes: ResumeEntry[]) => void;
}

const STEPS = ["Upload", "Compare", "Manage"] as const;

export default function ResumeStepperModal({
  open,
  onClose,
  onResumesUpdated,
}: ResumeStepperModalProps) {
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [text, setText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [comparison, setComparison] = useState("");
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [fileImportLoading, setFileImportLoading] = useState(false);
  const [fileImportError, setFileImportError] = useState<string | null>(null);
  const [textImportLoading, setTextImportLoading] = useState(false);
  const [textImportError, setTextImportError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setText("");
      setJobDescription("");
      setComparison("");
      setSearchText("");
      setSearchTag("");
      setToastOpen(false);
      setFileImportLoading(false);
      setTextImportLoading(false);
      setFileImportError(null);
      setTextImportError(null);
      return;
    }

    setLoadingResumes(true);
    const id = window.setTimeout(() => {
      const existing = getResumes();
      setResumes(existing);
      onResumesUpdated?.(existing);
      setLoadingResumes(false);
    }, 0);

    return () => window.clearTimeout(id);
  }, [open, onResumesUpdated]);

  const filteredResumes = useMemo(
    () => filterByTag(filterByText(resumes, searchText, ["content"]), searchTag),
    [resumes, searchText, searchTag],
  );

  const handleResumesChange = (updated: ResumeEntry[]) => {
    setResumes(updated);
    onResumesUpdated?.(updated);
  };

  const handleSave = async () => {
    if (!text.trim() || fileImportLoading || textImportLoading) return;
    setTextImportError(null);
    setTextImportLoading(true);
    try {
      const sanitized = parsePastedHtml(text);
      const tags = await tagResume(sanitized);
      let parsed: ResumeEntry["parsed"];
      try {
        parsed = parseResumeText(sanitized);
      } catch (parseError) {
        console.error("Failed to parse resume text", parseError);
        throw parseError;
      }
      const metadata = createPastedResumeMetadata();
      const newResume: ResumeEntry = {
        id: uuid(),
        userId: "",
        label: "",
        title: "",
        url: "",
        content: sanitized,
        parsed,
        tags,
        ...metadata,
      };
      const updated = addResume(newResume);
      handleResumesChange(updated);
      setText(sanitized);
      setComparison("");
      setToastOpen(true);
      setActiveStep((prev) => (prev === 0 ? 1 : prev));
    } catch (error) {
      console.error("Failed to save pasted resume", error);
      setTextImportError(
        error instanceof Error
          ? error.message
          : "Failed to save resume. Please try again.",
      );
    } finally {
      setTextImportLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!text.trim() || !jobDescription.trim()) return;
    const context = `Resume:\n${text}\n\nJob Description:\n${jobDescription}`;
    const prompt = PROMPT_TEMPLATES.compareResumeToJob?.fullText || "";
    setLoadingCompare(true);
    const response = await askOpenAI({
      context,
      user: prompt,
      system:
        "You are an assistant that compares resumes to job descriptions and highlights matches and gaps.",
      chatHistory: [],
      returnFirstResponse: true,
      logMessagesToChatHistory: false,
    });
    setComparison(response?.message || "");
    setLoadingCompare(false);
  };

  const handleStepNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleStepBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="resume-stepper-title"
      >
        <DialogTitle id="resume-stepper-title">Manage Resumes</DialogTitle>
        <DialogContent dividers>
          <Stepper activeStep={activeStep} alternativeLabel>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          <Box sx={{ mt: 4 }}>
            {activeStep === 0 && (
              <Stack spacing={3}>
                <Typography variant="body1">
                  Upload files or paste your resume text to add it to your library.
                </Typography>
                <Box
                  sx={{
                    pointerEvents:
                      fileImportLoading || textImportLoading ? "none" : "auto",
                    opacity: fileImportLoading ? 0.6 : 1,
                  }}
                  aria-busy={fileImportLoading}
                  aria-label={
                    fileImportLoading ? "Uploading resume" : undefined
                  }
                >
                  <FileUploader
                    accept=".pdf,.docx,.txt,.md"
                    label="Upload your resume"
                    outputType="files"
                    limit={10}
                    onChange={async (filesFromParam) => {
                      if (fileImportLoading || textImportLoading) return;
                      const files = filesFromParam as File[];
                      if (!files || files.length === 0) return;
                      setFileImportError(null);
                      setFileImportLoading(true);
                      try {
                        let latest = resumes;
                        let lastContent = "";
                        for (const file of files) {
                          const { text: content, metadata } = await fileToText(file);
                          const tags = await tagResume(content);
                          let parsed: ResumeEntry["parsed"];
                          try {
                            parsed = parseResumeText(content);
                          } catch (parseError) {
                            console.error("Failed to parse resume text", parseError);
                            throw parseError;
                          }
                          latest = addResume({
                            id: uuid(),
                            userId: "",
                            label: "",
                            title: "",
                            url: "",
                            content,
                            parsed,
                            tags,
                            ...metadata,
                          });
                          lastContent = content;
                        }
                        handleResumesChange(latest);
                        if (files.length === 1 && lastContent) {
                          setText(parsePastedHtml(lastContent));
                          setComparison("");
                        }
                        setToastOpen(true);
                        setActiveStep((prev) => (prev === 0 ? 1 : prev));
                      } catch (error) {
                        console.error("Failed to import resume from file", error);
                        setFileImportError(
                          error instanceof Error
                            ? error.message
                            : "Failed to import resume. Please try again.",
                        );
                      } finally {
                        setFileImportLoading(false);
                      }
                    }}
                  />
                </Box>
                {fileImportError && (
                  <Alert
                    severity="error"
                    onClose={() => setFileImportError(null)}
                  >
                    {fileImportError}
                  </Alert>
                )}
                {fileImportLoading && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center" }}
                    aria-busy="true"
                    aria-label="Processing uploaded resume"
                  >
                    <CircularProgress size={24} />
                  </Box>
                )}
                <TextField
                  label="Paste your resume"
                  multiline
                  minRows={6}
                  fullWidth
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    setTextImportError(null);
                  }}
                  onPaste={(e) => {
                    const pasted =
                      e.clipboardData.getData("text/html") ||
                      e.clipboardData.getData("text/plain");
                    if (pasted) {
                      e.preventDefault();
                      const sanitized = parsePastedHtml(pasted);
                      setText(sanitized);
                      setTextImportError(null);
                    }
                  }}
                />
                {textImportError && (
                  <Alert
                    severity="error"
                    onClose={() => setTextImportError(null)}
                  >
                    {textImportError}
                  </Alert>
                )}
                <Stack direction="row" justifyContent="flex-end" spacing={2}>
                  <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={
                      !text.trim() || textImportLoading || fileImportLoading
                    }
                  >
                    {textImportLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Save"
                    )}
                  </Button>
                </Stack>
              </Stack>
            )}
            {activeStep === 1 && (
              <Stack spacing={3}>
                <Typography variant="body1">
                  Paste a job description to compare it against your resume.
                </Typography>
                <TextField
                  label="Paste job description"
                  multiline
                  minRows={6}
                  fullWidth
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={handleCompare}
                    disabled={
                      !text.trim() || !jobDescription.trim() || loadingCompare
                    }
                  >
                    Compare to Job
                  </Button>
                </Stack>
                {loadingCompare && (
                  <Box
                    sx={{ display: "flex", justifyContent: "center" }}
                    aria-busy="true"
                    aria-label="Comparing resume"
                  >
                    <CircularProgress />
                  </Box>
                )}
                {comparison && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Comparison Result
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                      {comparison}
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}
            {activeStep === 2 && (
              <Stack
                spacing={2}
                aria-busy={loadingResumes}
                aria-label={loadingResumes ? "Loading resumes" : undefined}
              >
                <Typography variant="body1">
                  Filter and manage your saved resumes.
                </Typography>
                <TextField
                  label="Filter by text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <TextField
                  label="Filter by tag"
                  value={searchTag}
                  onChange={(e) => setSearchTag(e.target.value)}
                />
                {loadingResumes ? (
                  Array.from({ length: 3 }).map((_, idx) => (
                    <Skeleton key={idx} variant="rectangular" height={60} />
                  ))
                ) : (
                  <ResumeVariantList
                    resumes={filteredResumes}
                    setResumes={handleResumesChange}
                  />
                )}
              </Stack>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
          {activeStep > 0 && (
            <Button onClick={handleStepBack}>Back</Button>
          )}
          {activeStep < STEPS.length - 1 && (
            <Button variant="contained" onClick={handleStepNext}>
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        message="Resume saved"
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}
