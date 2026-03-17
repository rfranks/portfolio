"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  INPUT_DELIMITERS,
  MAX_TAG_LENGTH,
  normalizeTags,
  tagsEqual,
  validateTag,
} from "@/utils/talentforge/tagUtils";
import Chip from "@/components/fabric/Chip";

interface ResumeStepperModalProps {
  open: boolean;
  onClose: () => void;
  onResumesUpdated?: (resumes: ResumeEntry[]) => void;
}

const STEPS = ["Upload", "Manage", "Compare"] as const;

const STEP_INDEX = {
  upload: 0,
  manage: 1,
  compare: 2,
} as const;

function inferTitleFromFilename(filename?: string | null): string | null {
  if (!filename) return null;
  const withoutExt = filename.replace(/\.[^.]+$/, "");
  const cleaned = withoutExt.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  return cleaned || null;
}

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
  const [loadingResumes, setLoadingResumes] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(STEP_INDEX.upload);
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
  const [titleDraft, setTitleDraft] = useState("");
  const [titleError, setTitleError] = useState<string | null>(null);
  const editingInputRef = useRef<HTMLInputElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [tagging, setTagging] = useState(false);
  const [tagFeedback, setTagFeedback] = useState<
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
      setActiveStep(STEP_INDEX.upload);
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
      setTitleDraft("");
      setTitleError(null);
      setTagFeedback(null);
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
      setTitleDraft("");
      setTitleError(null);
      setTagFeedback(null);
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
    setTitleDraft(selectedResume.title);
    setTitleError(null);
    setTagFeedback(null);
    setCopyTagsFeedback(null);
    setCopyResumeFeedback(null);
    setTagging(false);
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
      setTagFeedback(null);
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

  const handleTitleCommit = (): boolean => {
    if (!selectedResume) return true;
    const trimmed = titleDraft.trim();
    if (!trimmed) {
      setTitleError("Resume name cannot be empty.");
      return false;
    }
    if (trimmed === selectedResume.title) {
      setTitleDraft(selectedResume.title);
      setTitleError(null);
      return true;
    }
    const updatedResume = { ...selectedResume, title: trimmed };
    const updated = updateResume(updatedResume);
    handleResumesChange(updated);
    const saved = updated.find((resume) => resume.id === updatedResume.id);
    if (saved) {
      setTitleDraft(saved.title);
      setSelectedResumeId(saved.id);
    } else {
      setTitleDraft(trimmed);
    }
    setTitleError(null);
    return true;
  };

  const handleTitleCancel = () => {
    if (!selectedResume) {
      setTitleDraft("");
    } else {
      setTitleDraft(selectedResume.title);
    }
    setTitleError(null);
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

  const handleRegenerateTags = async () => {
    if (!selectedResume) return;
    if (!selectedResume.content.trim()) {
      setTagFeedback({
        type: "error",
        message: "Resume content is empty, so no tags can be generated.",
      });
      return;
    }
    setTagging(true);
    setTagFeedback(null);
    try {
      const aiTags = await tagResume(selectedResume.content);
      const normalized = normalizeTags(
        aiTags.filter((tag) => tag.trim().length <= MAX_TAG_LENGTH),
      );
      if (!normalized.length) {
        setTagFeedback({
          type: "error",
          message: "AI couldn't suggest any tags.",
        });
        return;
      }
      const changed = applyTags(normalized, { fromAi: true });
      setTagFeedback({
        type: "success",
        message: changed
          ? "Tags updated from AI suggestions."
          : "Tags already match the AI suggestions.",
      });
    } catch (error) {
      setTagFeedback({
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
      setSelectedResumeId(newResume.id);
      setText(sanitized);
      setComparison("");
      setToastOpen(true);
      setActiveStep((prev) =>
        prev === STEP_INDEX.upload ? STEP_INDEX.manage : prev,
      );
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
    if (activeStep === STEP_INDEX.manage) {
      const titleCommitted = handleTitleCommit();
      const tagsCommitted = handleEditCommit();
      if (!titleCommitted) {
        window.setTimeout(() => titleInputRef.current?.focus(), 0);
        return;
      }
      if (!tagsCommitted) {
        window.setTimeout(() => editingInputRef.current?.focus(), 0);
        return;
      }
    }
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  };

  const handleStepBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, STEP_INDEX.upload));
  };

  const renderResumeManagement = ({
    intro,
    emptyLibraryMessage,
    emptySelectionMessage,
    showOverview = false,
  }: {
    intro: string;
    emptyLibraryMessage: string;
    emptySelectionMessage: string;
    showOverview?: boolean;
  }) => (
    <Stack spacing={3}>
      <Typography variant="body1">{intro}</Typography>
      {loadingResumes ? (
        <Box
          sx={{ display: "flex", justifyContent: "center" }}
          aria-busy="true"
          aria-label="Loading resumes"
        >
          <CircularProgress size={24} />
        </Box>
      ) : resumes.length === 0 ? (
        <Alert severity="info">{emptyLibraryMessage}</Alert>
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
                <Typography variant="subtitle1">Resume name</Typography>
                <TextField
                  size="small"
                  label="Resume name"
                  value={titleDraft}
                  onChange={(e) => {
                    setTitleDraft(e.target.value);
                    if (titleError) setTitleError(null);
                  }}
                  onBlur={() => {
                    const committed = handleTitleCommit();
                    if (!committed) {
                      window.setTimeout(() => titleInputRef.current?.focus(), 0);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const committed = handleTitleCommit();
                      if (!committed) {
                        window.setTimeout(() => titleInputRef.current?.focus(), 0);
                      }
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      handleTitleCancel();
                    } else if (e.key === "Tab") {
                      const committed = handleTitleCommit();
                      if (!committed) {
                        e.preventDefault();
                        window.setTimeout(
                          () => titleInputRef.current?.focus(),
                          0,
                        );
                      }
                    }
                  }}
                  helperText={
                    titleError
                      ?? "This name appears anywhere you reference the resume."
                  }
                  error={Boolean(titleError)}
                  FormHelperTextProps={{ sx: { ml: 0 } }}
                  inputRef={titleInputRef}
                  inputProps={{ "aria-label": "Resume name" }}
                  fullWidth
                />
              </Stack>
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
                          } else if (e.key === "Backspace" || e.key === "Delete") {
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
                  onClick={handleRegenerateTags}
                  disabled={tagging || !selectedResume.content.trim()}
                  startIcon={
                    tagging ? (
                      <CircularProgress size={18} />
                    ) : (
                      <AutoAwesomeIcon fontSize="small" />
                    )
                  }
                >
                  {tagging ? "Regenerating tags..." : "Regen tags from AI"}
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
              {tagFeedback && (
                <Typography
                  variant="body2"
                  color={
                    tagFeedback.type === "success" ? "success.main" : "error"
                  }
                >
                  {tagFeedback.message}
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
              {showOverview && selectedResume && (
                <Stack spacing={2}>
                  <Typography variant="subtitle1">Structured overview</Typography>
                  <Stack spacing={1}>
                    <Typography variant="subtitle2">Contact</Typography>
                    {selectedResume.parsed.contact ? (
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
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
              )}
            </Stack>
          ) : (
            <Alert severity="info">{emptySelectionMessage}</Alert>
          )}
        </Stack>
      )}
    </Stack>
  );

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
            {activeStep === STEP_INDEX.upload && (
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
                          const { text: content, metadata } = await fileToText(file);
                          const inferredTitle = inferTitleFromFilename(
                            metadata.sourceFilename ?? file.name,
                          );
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
                            title: inferredTitle ?? "",
                            url: "",
                            content,
                            parsed,
                            tags,
                            ...metadata,
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
                        setActiveStep((prev) =>
                          prev === STEP_INDEX.upload
                            ? STEP_INDEX.manage
                            : prev,
                        );
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
            {activeStep === STEP_INDEX.manage &&
              renderResumeManagement({
                intro:
                  "Rename your resume, curate tags, and review structured details to organize your library.",
                emptyLibraryMessage:
                  "Upload a resume in the first step to start managing it.",
                emptySelectionMessage: "Select a resume to manage.",
                showOverview: true,
              })}
            {activeStep === STEP_INDEX.compare && (
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
