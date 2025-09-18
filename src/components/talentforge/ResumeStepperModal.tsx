"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DescriptionIcon from "@mui/icons-material/Description";
import { getResumes, addResume, updateResume } from "@/utils/talentforge/dataStore";
import type { ResumeEntry } from "@/types";
import { askOpenAI, hasOpenAIKey } from "@/utils/talentforge/utils";
import { fileToText, parseResumeText } from "@/utils/talentforge/resumeIngest";
import { parsePastedHtml } from "@/utils/talentforge/pasteParser";
import { tagResume } from "@/utils/talentforge/tagging";
import { PROMPT_TEMPLATES } from "@/consts/prompts";
import OpenAIKeyModal from "./OpenAiKeyModal";
import FileUploader from "./FileUploader";
import {
  INPUT_DELIMITERS,
  MAX_TAG_LENGTH,
  normalizeTags,
  tagsEqual,
  validateTag,
} from "@/utils/talentforge/tagUtils";

interface ResumeStepperModalProps {
  open: boolean;
  onClose: () => void;
  onResumesUpdated?: (resumes: ResumeEntry[]) => void;
}

const STEPS = ["Upload", "Compare", "Enhance"] as const;

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
  const [openKeyModal, setOpenKeyModal] = useState(false);
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [fileImportLoading, setFileImportLoading] = useState(false);
  const [fileImportError, setFileImportError] = useState<string | null>(null);
  const [textImportLoading, setTextImportLoading] = useState(false);
  const [textImportError, setTextImportError] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [tagDraft, setTagDraft] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const editingInputRef = useRef<HTMLInputElement | null>(null);
  const [tagging, setTagging] = useState(false);
  const [enhanceFeedback, setEnhanceFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const [copyTagsFeedback, setCopyTagsFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);
  const [copyResumeFeedback, setCopyResumeFeedback] = useState<
    { type: "success" | "error"; message: string } | null
  >(null);

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setText("");
      setJobDescription("");
      setComparison("");
      setToastOpen(false);
      setFileImportLoading(false);
      setTextImportLoading(false);
      setFileImportError(null);
      setTextImportError(null);
      setSelectedResumeId("");
      setTagDraft([]);
      setNewTag("");
      setInputError(null);
      setEditingIdx(null);
      setEditingValue("");
      setEditingError(null);
      setEnhanceFeedback(null);
      setCopyTagsFeedback(null);
      setCopyResumeFeedback(null);
      setTagging(false);
      return;
    }

    setLoadingResumes(true);
    const id = window.setTimeout(() => {
      const existing = getResumes();
      setResumes(existing);
      onResumesUpdated?.(existing);
      setLoadingResumes(false);
      setSelectedResumeId((prev) => {
        if (prev && existing.some((resume) => resume.id === prev)) {
          return prev;
        }
        return existing.length ? existing[existing.length - 1].id : "";
      });
    }, 0);

    return () => window.clearTimeout(id);
  }, [open, onResumesUpdated]);

  const handleResumesChange = (updated: ResumeEntry[]) => {
    setResumes(updated);
    onResumesUpdated?.(updated);
  };

  const selectedResume =
    resumes.find((resume) => resume.id === selectedResumeId) ?? null;

  useEffect(() => {
    if (editingIdx !== null) {
      editingInputRef.current?.focus();
      editingInputRef.current?.select();
    }
  }, [editingIdx]);

  useEffect(() => {
    if (!selectedResume) {
      setTagDraft([]);
      setNewTag("");
      setInputError(null);
      setEditingIdx(null);
      setEditingValue("");
      setEditingError(null);
      setEnhanceFeedback(null);
      setCopyTagsFeedback(null);
      setCopyResumeFeedback(null);
      setTagging(false);
      return;
    }
    setTagDraft(selectedResume.tags);
    setNewTag("");
    setInputError(null);
    setEditingIdx(null);
    setEditingValue("");
    setEditingError(null);
    setEnhanceFeedback(null);
    setCopyTagsFeedback(null);
    setCopyResumeFeedback(null);
  }, [selectedResume]);

  const applyTags = (values: string[], options?: { fromAi?: boolean }) => {
    const normalized = normalizeTags(values);
    setTagDraft(normalized);
    setCopyTagsFeedback(null);
    if (!selectedResume) {
      return false;
    }
    const changed = !tagsEqual(normalized, selectedResume.tags);
    if (changed) {
      const updatedResume = { ...selectedResume, tags: normalized };
      const updated = updateResume(updatedResume);
      handleResumesChange(updated);
      setSelectedResumeId(updatedResume.id);
    }
    if (!options?.fromAi) {
      setEnhanceFeedback(null);
    }
    return changed;
  };

  const handleDeleteTag = (idx: number) => {
    if (editingIdx !== null) {
      if (editingIdx === idx) {
        setEditingIdx(null);
        setEditingValue("");
        setEditingError(null);
      } else if (editingIdx > idx) {
        setEditingIdx(editingIdx - 1);
      }
    }
    applyTags(tagDraft.filter((_, i) => i !== idx));
  };

  const handleEditStart = (idx: number) => {
    setEditingIdx(idx);
    setEditingValue(tagDraft[idx]);
    setEditingError(null);
  };

  const handleEditCommit = (): boolean => {
    if (editingIdx === null) return true;
    const error = validateTag(editingValue, tagDraft, { ignoreIndex: editingIdx });
    if (error) {
      setEditingError(error);
      return false;
    }
    const updated = [...tagDraft];
    updated[editingIdx] = editingValue.trim();
    setEditingIdx(null);
    setEditingValue("");
    setEditingError(null);
    applyTags(updated);
    return true;
  };

  const handleEditCancel = () => {
    setEditingIdx(null);
    setEditingValue("");
    setEditingError(null);
  };

  const handleAddTag = () => {
    const error = validateTag(newTag, tagDraft);
    if (error) {
      setInputError(error);
      return;
    }
    const trimmed = newTag.trim();
    applyTags([...tagDraft, trimmed]);
    setNewTag("");
    setInputError(null);
  };

  const handleGenerateTags = async () => {
    if (!selectedResume) return;
    if (!selectedResume.content.trim()) {
      setEnhanceFeedback({
        type: "error",
        message: "Resume content is empty, so no tags can be generated.",
      });
      return;
    }
    setTagging(true);
    setEnhanceFeedback(null);
    try {
      const aiTags = await tagResume(selectedResume.content);
      const normalized = normalizeTags(
        aiTags.filter((tag) => tag.trim().length <= MAX_TAG_LENGTH),
      );
      if (!normalized.length) {
        setEnhanceFeedback({
          type: "error",
          message: "AI couldn't suggest any tags.",
        });
        return;
      }
      const changed = applyTags(normalized, { fromAi: true });
      setEnhanceFeedback({
        type: "success",
        message: changed
          ? "Tags updated from AI suggestions."
          : "Tags already match the AI suggestions.",
      });
    } catch (error) {
      setEnhanceFeedback({
        type: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : "Unable to refresh tags right now.",
      });
    } finally {
      setTagging(false);
    }
  };

  const handleCopyTags = async () => {
    if (!tagDraft.length) {
      setCopyTagsFeedback({
        type: "error",
        message: "Add tags before copying them.",
      });
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyTagsFeedback({
        type: "error",
        message: "Clipboard access isn't available in this browser.",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(tagDraft.join(", "));
      setCopyTagsFeedback({
        type: "success",
        message: "Tags copied to clipboard.",
      });
    } catch {
      setCopyTagsFeedback({
        type: "error",
        message: "Unable to copy tags right now.",
      });
    }
  };

  const handleCopyResume = async () => {
    if (!selectedResume || !selectedResume.content.trim()) {
      setCopyResumeFeedback({
        type: "error",
        message: "No resume content available to copy.",
      });
      return;
    }
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      setCopyResumeFeedback({
        type: "error",
        message: "Clipboard access isn't available in this browser.",
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedResume.content);
      setCopyResumeFeedback({
        type: "success",
        message: "Resume content copied to clipboard.",
      });
    } catch {
      setCopyResumeFeedback({
        type: "error",
        message: "Unable to copy the resume right now.",
      });
    }
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
      const newResume: ResumeEntry = {
        id: uuid(),
        userId: "",
        label: "",
        title: "",
        url: "",
        content: sanitized,
        parsed,
        tags,
      };
      const updated = addResume(newResume);
      handleResumesChange(updated);
      setSelectedResumeId(newResume.id);
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
    if (!hasOpenAIKey()) {
      setOpenKeyModal(true);
      return;
    }
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
        <DialogTitle id="resume-stepper-title">Upload Resume</DialogTitle>
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
                        let lastAddedId = "";
                        for (const file of files) {
                          const content = await fileToText(file);
                          const tags = await tagResume(content);
                          let parsed: ResumeEntry["parsed"];
                          try {
                            parsed = parseResumeText(content);
                          } catch (parseError) {
                            console.error("Failed to parse resume text", parseError);
                            throw parseError;
                          }
                          const generatedId = uuid();
                          latest = addResume({
                            id: generatedId,
                            userId: "",
                            label: "",
                            title: "",
                            url: "",
                            content,
                            parsed,
                            tags,
                          });
                          lastContent = content;
                          lastAddedId = generatedId;
                        }
                        handleResumesChange(latest);
                        if (lastAddedId) {
                          setSelectedResumeId(lastAddedId);
                        }
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
              <Stack spacing={3}>
                <Typography variant="body1">
                  Generate intelligent tags and review structured details for a
                  specific resume.
                </Typography>
                {loadingResumes ? (
                  <Box
                    sx={{ display: "flex", justifyContent: "center" }}
                    aria-busy="true"
                    aria-label="Loading resumes"
                  >
                    <CircularProgress size={24} />
                  </Box>
                ) : resumes.length === 0 ? (
                  <Alert severity="info">
                    Upload a resume in the first step to start enhancing it.
                  </Alert>
                ) : (
                  <Stack spacing={3}>
                    <TextField
                      select
                      label="Select resume"
                      value={selectedResumeId}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      fullWidth
                    >
                      {resumes.map((resume) => (
                        <MenuItem key={resume.id} value={resume.id}>
                          {resume.title}
                        </MenuItem>
                      ))}
                    </TextField>
                    {selectedResume ? (
                      <Stack spacing={3}>
                        <Stack spacing={1}>
                          <Typography variant="subtitle1">Tags</Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            alignItems="center"
                          >
                            {tagDraft.map((tag, idx) =>
                              editingIdx === idx ? (
                                <TextField
                                  key={`edit-${idx}`}
                                  size="small"
                                  value={editingValue}
                                  inputRef={editingInputRef}
                                  onChange={(e) => {
                                    setEditingValue(e.target.value);
                                    if (editingError) setEditingError(null);
                                  }}
                                  onBlur={() => {
                                    const committed = handleEditCommit();
                                    if (!committed) {
                                      window.setTimeout(
                                        () => editingInputRef.current?.focus(),
                                        0,
                                      );
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleEditCommit();
                                    } else if (e.key === "Escape") {
                                      e.preventDefault();
                                      handleEditCancel();
                                    } else if (e.key === "Tab") {
                                      const committed = handleEditCommit();
                                      if (!committed) {
                                        e.preventDefault();
                                      }
                                    }
                                  }}
                                  error={Boolean(editingError)}
                                  helperText={
                                    editingError
                                      ?? "Press Enter to save or Esc to cancel."
                                  }
                                  FormHelperTextProps={{ sx: { ml: 0 } }}
                                  inputProps={{
                                    "aria-label": `Edit tag ${tag}`,
                                  }}
                                  sx={{ mb: 1, minWidth: 160 }}
                                />
                              ) : (
                                <Chip
                                  key={`${tag}-${idx}`}
                                  label={tag}
                                  onDelete={() => handleDeleteTag(idx)}
                                  onClick={() => handleEditStart(idx)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      handleEditStart(idx);
                                    } else if (
                                      e.key === "Backspace" ||
                                      e.key === "Delete"
                                    ) {
                                      e.preventDefault();
                                      handleDeleteTag(idx);
                                    }
                                  }}
                                  tabIndex={0}
                                  role="button"
                                  aria-label={`Edit tag ${tag}`}
                                  sx={{ mb: 1 }}
                                />
                              ),
                            )}
                          </Stack>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            spacing={1}
                            alignItems={{ sm: "flex-start" }}
                          >
                            <TextField
                              size="small"
                              label="Add tag"
                              value={newTag}
                              onChange={(e) => {
                                setNewTag(e.target.value);
                                if (inputError) setInputError(null);
                              }}
                              onKeyDown={(e) => {
                                if (INPUT_DELIMITERS.has(e.key)) {
                                  if (newTag.trim()) {
                                    e.preventDefault();
                                    handleAddTag();
                                  }
                                } else if (e.key === "Backspace" && !newTag) {
                                  if (tagDraft.length) {
                                    e.preventDefault();
                                    handleDeleteTag(tagDraft.length - 1);
                                  }
                                } else if (e.key === "Escape" && newTag) {
                                  e.preventDefault();
                                  setNewTag("");
                                  setInputError(null);
                                }
                              }}
                              helperText={
                                inputError
                                  ?? "Press Enter, Tab, or comma to add a tag. Backspace removes the last tag."
                              }
                              error={Boolean(inputError)}
                              FormHelperTextProps={{ sx: { ml: 0 } }}
                              inputProps={{ "aria-label": "Add new tag" }}
                              sx={{ mb: { xs: 1, sm: 0 }, flexGrow: 1, minWidth: 200 }}
                            />
                            <Button
                              variant="contained"
                              onClick={handleAddTag}
                              disabled={!newTag.trim()}
                            >
                              Add tag
                            </Button>
                          </Stack>
                        </Stack>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={1}
                          alignItems={{ sm: "center" }}
                        >
                          <Button
                            variant="outlined"
                            onClick={handleGenerateTags}
                            disabled={
                              tagging || !selectedResume.content.trim()
                            }
                            startIcon={
                              tagging ? (
                                <CircularProgress size={18} />
                              ) : (
                                <AutoAwesomeIcon fontSize="small" />
                              )
                            }
                          >
                            {tagging ? "Generating tags..." : "Generate tags with AI"}
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleCopyTags}
                            disabled={!tagDraft.length}
                            startIcon={<ContentCopyIcon fontSize="small" />}
                          >
                            Copy tags
                          </Button>
                          <Button
                            variant="outlined"
                            onClick={handleCopyResume}
                            disabled={!selectedResume.content.trim()}
                            startIcon={<DescriptionIcon fontSize="small" />}
                          >
                            Copy resume text
                          </Button>
                        </Stack>
                        {enhanceFeedback && (
                          <Typography
                            variant="body2"
                            color={
                              enhanceFeedback.type === "success"
                                ? "success.main"
                                : "error"
                            }
                          >
                            {enhanceFeedback.message}
                          </Typography>
                        )}
                        {copyTagsFeedback && (
                          <Typography
                            variant="body2"
                            color={
                              copyTagsFeedback.type === "success"
                                ? "success.main"
                                : "error"
                            }
                          >
                            {copyTagsFeedback.message}
                          </Typography>
                        )}
                        {copyResumeFeedback && (
                          <Typography
                            variant="body2"
                            color={
                              copyResumeFeedback.type === "success"
                                ? "success.main"
                                : "error"
                            }
                          >
                            {copyResumeFeedback.message}
                          </Typography>
                        )}
                        <Stack spacing={2}>
                          <Typography variant="subtitle1">
                            Structured overview
                          </Typography>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2">Contact</Typography>
                            {selectedResume.parsed.contact ? (
                              <Typography
                                variant="body2"
                                sx={{ whiteSpace: "pre-wrap" }}
                              >
                                {selectedResume.parsed.contact}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No contact information detected.
                              </Typography>
                            )}
                          </Stack>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2">Experience</Typography>
                            {selectedResume.parsed.experience.length ? (
                              selectedResume.parsed.experience.map((line, idx) => (
                                <Typography key={idx} variant="body2">
                                  {line}
                                </Typography>
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No experience entries detected.
                              </Typography>
                            )}
                          </Stack>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2">Education</Typography>
                            {selectedResume.parsed.education.length ? (
                              selectedResume.parsed.education.map((line, idx) => (
                                <Typography key={idx} variant="body2">
                                  {line}
                                </Typography>
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No education entries detected.
                              </Typography>
                            )}
                          </Stack>
                          <Stack spacing={1}>
                            <Typography variant="subtitle2">Skills</Typography>
                            {selectedResume.parsed.skills.length ? (
                              selectedResume.parsed.skills.map((line, idx) => (
                                <Typography key={idx} variant="body2">
                                  {line}
                                </Typography>
                              ))
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                No skills detected.
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      </Stack>
                    ) : (
                      <Alert severity="info">Select a resume to enhance.</Alert>
                    )}
                  </Stack>
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
      <OpenAIKeyModal open={openKeyModal} onClose={() => setOpenKeyModal(false)} />
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        message="Resume saved"
        onClose={() => setToastOpen(false)}
      />
    </>
  );
}
