"use client";

import { useEffect, useRef, useState } from "react";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import {
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ResumeEntry } from "@/types";
import { updateResume } from "@/utils/talentforge/dataStore";
import { tagResume } from "@/utils/talentforge/tagging";
import {
  INPUT_DELIMITERS,
  MAX_TAG_LENGTH,
  normalizeTags,
  tagsEqual,
  validateTag as validateTagValue,
} from "@/utils/talentforge/tagUtils";

const importDateFormatter =
  typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function"
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

function formatResumeMetadata(resume: ResumeEntry): string | null {
  const parts: string[] = [];
  if (resume.sourceFilename) {
    parts.push(resume.sourceFilename);
  }
  if (resume.importedAt) {
    const date = new Date(resume.importedAt);
    if (!Number.isNaN(date.getTime())) {
      const formatted = importDateFormatter
        ? importDateFormatter.format(date)
        : date.toLocaleString();
      parts.push(`Imported ${formatted}`);
    }
  }
  if (!parts.length) {
    return null;
  }
  return parts.join(" • ");
}

interface Props {
  resume: ResumeEntry;
  onClose: () => void;
  onSave: (resume: ResumeEntry) => void;
}

export default function Detail({ resume, onClose, onSave }: Props) {
  const [tags, setTags] = useState<string[]>(() => [...resume.tags]);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingError, setEditingError] = useState<string | null>(null);
  const editingInputRef = useRef<HTMLInputElement | null>(null);
  const [newTag, setNewTag] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [retagging, setRetagging] = useState(false);
  const [retagError, setRetagError] = useState<string | null>(null);
  const [retagSuccess, setRetagSuccess] = useState(false);
  const prevResumeIdRef = useRef(resume.id);
  const hasContent = resume.content.trim().length > 0;

  useEffect(() => {
    if (prevResumeIdRef.current === resume.id) {
      return;
    }
    prevResumeIdRef.current = resume.id;
    setTags([...resume.tags]);
    setNewTag("");
    setInputError(null);
    setEditingIdx(null);
    setEditingValue("");
    setEditingError(null);
    setRetagError(null);
    setRetagSuccess(false);
  }, [resume.id, resume.tags]);

  useEffect(() => {
    setTags((prev) => {
      if (tagsEqual(prev, resume.tags)) {
        return prev;
      }
      return [...resume.tags];
    });
  }, [resume.tags]);

  useEffect(() => {
    if (editingIdx !== null) {
      editingInputRef.current?.focus();
      editingInputRef.current?.select();
    }
  }, [editingIdx]);

  const applyTags = (values: string[], options?: { fromRetag?: boolean }) => {
    const normalized = normalizeTags(values);
    setTags(normalized);
    if (!tagsEqual(normalized, tags)) {
      const updatedResume = { ...resume, tags: normalized };
      updateResume(updatedResume);
      onSave(updatedResume);
    }
    if (options?.fromRetag) {
      setRetagSuccess(true);
      setRetagError(null);
    }
    return normalized;
  };

  const commitManualTags = (values: string[]) => {
    applyTags(values);
    setRetagSuccess(false);
    setRetagError(null);
  };

  const validateTag = (value: string, idx?: number): string | null =>
    validateTagValue(value, tags, { ignoreIndex: idx });

  const handleDelete = (idx: number) => {
    if (editingIdx !== null) {
      if (editingIdx === idx) {
        setEditingIdx(null);
        setEditingValue("");
        setEditingError(null);
      } else if (editingIdx > idx) {
        setEditingIdx(editingIdx - 1);
      }
    }
    commitManualTags(tags.filter((_, i) => i !== idx));
  };

  const handleEditStart = (idx: number) => {
    setEditingIdx(idx);
    setEditingValue(tags[idx]);
    setEditingError(null);
  };

  const handleEditCommit = (): boolean => {
    if (editingIdx === null) return true;
    const error = validateTag(editingValue, editingIdx);
    if (error) {
      setEditingError(error);
      return false;
    }
    const updated = [...tags];
    updated[editingIdx] = editingValue.trim();
    setEditingIdx(null);
    setEditingValue("");
    setEditingError(null);
    commitManualTags(updated);
    return true;
  };

  const handleEditCancel = () => {
    setEditingIdx(null);
    setEditingValue("");
    setEditingError(null);
  };

  const handleAdd = () => {
    const error = validateTag(newTag);
    if (error) {
      setInputError(error);
      return;
    }
    const trimmed = newTag.trim();
    commitManualTags([...tags, trimmed]);
    setNewTag("");
    setInputError(null);
  };

  const handleRetag = async () => {
    if (!hasContent || retagging) return;
    setRetagging(true);
    setRetagError(null);
    setRetagSuccess(false);
    try {
      const aiTags = await tagResume(resume.content);
      const normalized = normalizeTags(
        aiTags.filter((tag) => tag.trim().length <= MAX_TAG_LENGTH)
      );
      if (!normalized.length) {
        setRetagError("AI couldn't suggest any tags.");
        return;
      }
      applyTags(normalized, { fromRetag: true });
    } catch (error) {
      setRetagError(
        error instanceof Error && error.message
          ? error.message
          : "Unable to refresh tags right now."
      );
      setRetagSuccess(false);
    } finally {
      setRetagging(false);
    }
  };

  const { contact, experience, education, skills } = resume.parsed;
  const metadataLabel = formatResumeMetadata(resume);

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{resume.title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {metadataLabel && (
            <Typography variant="body2" color="text.secondary">
              {metadataLabel}
            </Typography>
          )}
          <Stack spacing={0.5}>
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              alignItems="center"
            >
              {tags.map((tag, idx) =>
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
                        setTimeout(() => editingInputRef.current?.focus(), 0);
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
                      editingError ?? "Press Enter to save or Esc to cancel."
                    }
                    FormHelperTextProps={{ sx: { ml: 0 } }}
                    inputProps={{ "aria-label": `Edit tag ${tag}` }}
                    sx={{ mb: 1, minWidth: 120 }}
                  />
                ) : (
                  <Chip
                    key={`${tag}-${idx}`}
                    label={tag}
                    onDelete={() => handleDelete(idx)}
                    onClick={() => handleEditStart(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleEditStart(idx);
                      } else if (e.key === "Backspace" || e.key === "Delete") {
                        e.preventDefault();
                        handleDelete(idx);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Edit tag ${tag}`}
                    sx={{ mb: 1 }}
                  />
                )
              )}
              <TextField
                size="small"
                value={newTag}
                onChange={(e) => {
                  setNewTag(e.target.value);
                  if (inputError) setInputError(null);
                }}
                onKeyDown={(e) => {
                  if (INPUT_DELIMITERS.has(e.key)) {
                    if (newTag.trim()) {
                      e.preventDefault();
                      handleAdd();
                    }
                  } else if (e.key === "Backspace" && !newTag && tags.length) {
                    e.preventDefault();
                    handleDelete(tags.length - 1);
                  } else if (e.key === "Escape" && newTag) {
                    e.preventDefault();
                    setNewTag("");
                    setInputError(null);
                  }
                }}
                placeholder="Add tag"
                inputProps={{ "aria-label": "Add new tag" }}
                error={Boolean(inputError)}
                sx={{ mb: 1, minWidth: 160 }}
              />
            </Stack>
            <Typography
              variant="caption"
              color={inputError ? "error" : "text.secondary"}
            >
              {inputError
                ? inputError
                : "Press Enter, Tab, or comma to add a tag. Backspace removes the last tag."}
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Contact</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {contact}
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Experience
            </Typography>
            {experience.map((line, i) => (
              <Typography key={i} variant="body2">
                {line}
              </Typography>
            ))}

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Education
            </Typography>
            {education.map((line, i) => (
              <Typography key={i} variant="body2">
                {line}
              </Typography>
            ))}

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Skills
            </Typography>
            {skills.map((line, i) => (
              <Typography key={i} variant="body2">
                {line}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ flexGrow: 1 }}
        >
          <Button
            variant="outlined"
            onClick={handleRetag}
            disabled={retagging || !hasContent}
            startIcon={
              retagging ? (
                <CircularProgress size={18} />
              ) : (
                <AutoAwesomeIcon fontSize="small" />
              )
            }
          >
            Retag with AI
          </Button>
          {retagError ? (
            <Typography variant="body2" color="error">
              {retagError}
            </Typography>
          ) : retagSuccess ? (
            <Typography variant="body2" color="success.main">
              Tags updated from AI suggestions.
            </Typography>
          ) : null}
        </Stack>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
