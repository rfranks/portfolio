"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Link,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
  Divider,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { Close, Delete, Download, Visibility } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import DOMPurify from "dompurify";
import { marked } from "marked";

import type {
  ApplicationAttachment,
  ApplicationStatus,
  JobApplication,
  OfferDecisionStatus,
} from "@/types";
import {
  OFFER_DECISION_DEFAULT_STATUS,
  OFFER_DECISION_STATUS_LABELS,
  OFFER_DECISION_STATUSES,
} from "@/types";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import PromptTileGrid from "./promptTiles/PromptTileGrid";
import FileUploader from "./FileUploader";
import {
  getPromptTiles,
  type PromptContext,
} from "@/utils/talentforge/promptRegistry";
import { STATUSES } from "@/utils/talentforge/keyboard";

interface ApplicationDetailDrawerProps {
  open: boolean;
  application: JobApplication | null;
  onClose: () => void;
  promptDrawerOpen?: boolean;
  onUpdateStatus: (
    id: string,
    status: ApplicationStatus,
    options?: { reason?: string; changedAt?: string },
  ) => void;
  onSaveAction: (
    id: string,
    updates: Partial<Pick<JobApplication, "nextAction" | "dueAt">>,
  ) => void;
  onUpdateAttachments: (
    id: string,
    attachments: ApplicationAttachment[],
  ) => void;
  onSaveDecision: (
    id: string,
    updates: {
      status: OfferDecisionStatus;
      decidedAt?: string;
      notes?: string;
    },
  ) => void;
}

interface ConnectorStatus {
  key: string;
  label: string;
  connected: boolean;
}

const slugifyConnector = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const ensureValidIso = (value?: string): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const toDateTimeLocalValue = (iso: string): string => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
};

const toIsoFromLocalValue = (value: string): string => {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
};

const toIsoOrUndefined = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
};

const formatTimelineDate = (value: string): string => {
  if (!value) return "Unknown date";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatStatusLabel = (status: ApplicationStatus): string =>
  status.charAt(0).toUpperCase() + status.slice(1);

const formatDecisionStatus = (status: OfferDecisionStatus): string =>
  OFFER_DECISION_STATUS_LABELS[status] ?? status;

export default function ApplicationDetailDrawer({
  open,
  application,
  onClose,
  onUpdateStatus,
  onSaveAction,
  onUpdateAttachments,
  onSaveDecision,
  promptDrawerOpen = false,
}: ApplicationDetailDrawerProps) {
  const data = useTalentForgeData();
  const attachments = application?.attachments ?? [];
  const [previewAttachment, setPreviewAttachment] =
    useState<ApplicationAttachment | null>(null);
  const [uploaderKey, setUploaderKey] = useState(0);

  const promptContexts = useMemo<PromptContext[]>(() => {
    if (!application) return [];
    const contexts: PromptContext[] = ["jobSearch"];
    if (application.resumeVariant) {
      contexts.push("resume");
    }
    if (application.recruiters && application.recruiters.length > 0) {
      contexts.push("messaging");
    }
    if (application.status === "offer" || application.offer) {
      contexts.push("offers");
    }
    return Array.from(new Set(contexts));
  }, [application]);

  const jobDescriptionHtml = useMemo(() => {
    if (!application?.role.description) return "";
    return DOMPurify.sanitize(
      (marked.parse(application.role.description) as string) || "",
    );
  }, [application?.role.description]);

  useEffect(() => {
    setUploaderKey((key) => key + 1);
    setPreviewAttachment(null);
  }, [application?.id]);

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === "string") {
          const separatorIndex = result.indexOf(",");
          resolve(separatorIndex >= 0 ? result.slice(separatorIndex + 1) : result);
        } else {
          reject(new Error("Unable to read file"));
        }
      };
      reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const handleAttachmentUpload = (
    value:
      | File[]
      | string
      | { filename: string; type: string; content: string }
      | undefined,
  ) => {
    if (!application || !Array.isArray(value) || value.length === 0) {
      return;
    }
    const files = value;
    const appId = application.id;
    void Promise.all(
      files.map((file) =>
        readFileAsBase64(file).then((content) => ({
          id: uuid(),
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          content,
        })),
      ),
    )
      .then((newAttachments) => {
        if (newAttachments.length === 0) {
          return;
        }
        const latestApp = data
          .getJobApplications()
          .find((entry) => entry.id === appId);
        const baseAttachments = latestApp?.attachments ?? [];
        onUpdateAttachments(appId, [...baseAttachments, ...newAttachments]);
        setUploaderKey((key) => key + 1);
      })
      .catch(() => {
        // Ignore file read errors
      });
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (!application) {
      return;
    }
    const latestApp = data
      .getJobApplications()
      .find((entry) => entry.id === application.id);
    const baseAttachments = latestApp?.attachments ?? [];
    const nextAttachments = baseAttachments.filter(
      (attachment) => attachment.id !== attachmentId,
    );
    onUpdateAttachments(application.id, nextAttachments);
    if (previewAttachment?.id === attachmentId) {
      setPreviewAttachment(null);
    }
  };

  const handlePreviewAttachment = (attachment: ApplicationAttachment) => {
    setPreviewAttachment(attachment);
  };

  const handleClosePreview = () => {
    setPreviewAttachment(null);
  };

  const handleDownloadAttachment = (attachment: ApplicationAttachment) => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const binary = window.atob(attachment.content);
      const length = binary.length;
      const bytes = new Uint8Array(length);
      for (let i = 0; i < length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], {
        type: attachment.mimeType || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = attachment.name || "attachment";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch {
      // Ignore download errors
    }
  };

  const buildAttachmentDataUrl = (attachment: ApplicationAttachment) => {
    const mimeType = attachment.mimeType || "application/octet-stream";
    return `data:${mimeType};base64,${attachment.content}`;
  };

  const decodeBase64ToText = (value: string): string => {
    if (typeof window === "undefined") {
      return "";
    }
    try {
      const binary = window.atob(value);
      if (typeof TextDecoder !== "undefined") {
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i += 1) {
          bytes[i] = binary.charCodeAt(i);
        }
        return new TextDecoder().decode(bytes);
      }
      return binary;
    } catch {
      return "";
    }
  };

  const renderPreviewContent = (attachment: ApplicationAttachment) => {
    const mimeType = attachment.mimeType || "application/octet-stream";
    const dataUrl = buildAttachmentDataUrl(attachment);
    if (mimeType.startsWith("image/")) {
      return (
        <Box
          component="img"
          src={dataUrl}
          alt={attachment.name}
          sx={{ maxWidth: "100%", maxHeight: 360, display: "block", mx: "auto" }}
        />
      );
    }
    if (mimeType === "application/pdf") {
      return (
        <Box
          component="iframe"
          src={dataUrl}
          title={attachment.name}
          sx={{ width: "100%", height: 360, border: 0 }}
        />
      );
    }
    if (
      mimeType.startsWith("text/") ||
      mimeType.includes("json") ||
      mimeType.includes("+json") ||
      mimeType.includes("xml")
    ) {
      const text = decodeBase64ToText(attachment.content);
      return (
        <Box
          component="pre"
          sx={{ whiteSpace: "pre-wrap", fontFamily: "monospace", m: 0 }}
        >
          {text || "Unable to display text preview."}
        </Box>
      );
    }
    return (
      <Typography variant="body2" color="text.secondary">
        Preview unavailable for this file type. Use the download option instead.
      </Typography>
    );
  };

  const connectors = useMemo<ConnectorStatus[]>(() => {
    if (!application) return [];
    const entries = new Map<string, string>();

    const addConnector = (raw?: string | null) => {
      if (!raw) return;
      const key = slugifyConnector(raw);
      if (!key || entries.has(key)) return;
      entries.set(key, raw);
    };

    addConnector(application.role.source);
    application.recruiters?.forEach((recruiter) => addConnector(recruiter.connector));

    return Array.from(entries.entries()).map(([key, label]) => ({
      key,
      label,
      connected: Boolean(data.getConnectorToken(key)),
    }));
  }, [application, data]);

  const promptInitialValues = useMemo(() => {
    if (!application || promptContexts.length === 0) {
      return {};
    }
    const tiles = getPromptTiles({ contexts: promptContexts });
    if (tiles.length === 0) {
      return {};
    }

    const baseValues: Record<string, string> = {
      jobDescription: application.role.description || "",
      position: application.role.title || "",
      company: application.role.company || "",
      resumeVariantId: application.resumeVariant?.id || "",
    };

    const defaults: Record<string, Record<string, string>> = {};
    tiles.forEach((tile) => {
      const values: Record<string, string> = {};
      tile.inputs.forEach((input) => {
        const value = baseValues[input];
        if (value) {
          values[input] = value;
        }
      });
      if (Object.keys(values).length > 0) {
        defaults[tile.id] = values;
      }
    });

    return defaults;
  }, [application, promptContexts]);

  const history = useMemo(() => {
    if (!application?.history) {
      return [] as JobApplication["history"];
    }
    return [...application.history].sort((a, b) => {
      const timeA = new Date(a.changedAt).getTime();
      const timeB = new Date(b.changedAt).getTime();
      const normalizedA = Number.isNaN(timeA) ? 0 : timeA;
      const normalizedB = Number.isNaN(timeB) ? 0 : timeB;
      return normalizedA - normalizedB;
    });
  }, [application?.history]);

  const latestHistoryEntry = history.length > 0 ? history[history.length - 1] : null;

  const [statusDraft, setStatusDraft] = useState<ApplicationStatus>("applied");
  const [dateDraft, setDateDraft] = useState<string>(() =>
    toDateTimeLocalValue(new Date().toISOString()),
  );
  const [reasonDraft, setReasonDraft] = useState<string>("");
  const [nextActionDraft, setNextActionDraft] = useState<string>("");
  const [dueDraft, setDueDraft] = useState<string>("");
  const [decisionStatusDraft, setDecisionStatusDraft] =
    useState<OfferDecisionStatus>(OFFER_DECISION_DEFAULT_STATUS);
  const [decisionDateDraft, setDecisionDateDraft] = useState<string>("");
  const [decisionNotesDraft, setDecisionNotesDraft] = useState<string>("");

  const decisionInitial = useMemo(() => {
    if (!application) {
      return {
        status: OFFER_DECISION_DEFAULT_STATUS,
        decidedAt: "",
        notes: "",
      };
    }
    const decision = application.decision ?? application.offer?.decision;
    return {
      status: decision?.status ?? OFFER_DECISION_DEFAULT_STATUS,
      decidedAt: decision?.decidedAt
        ? toDateTimeLocalValue(decision.decidedAt)
        : "",
      notes: decision?.notes ?? "",
    };
  }, [application]);

  useEffect(() => {
    if (!application) {
      setStatusDraft("applied");
      setDateDraft(toDateTimeLocalValue(new Date().toISOString()));
      setReasonDraft("");
      setNextActionDraft("");
      setDueDraft("");
      setDecisionStatusDraft(OFFER_DECISION_DEFAULT_STATUS);
      setDecisionDateDraft("");
      setDecisionNotesDraft("");
      return;
    }
    const latest = history[history.length - 1];
    setStatusDraft(application.status);
    const iso = ensureValidIso(latest?.changedAt);
    setDateDraft(toDateTimeLocalValue(iso));
    setReasonDraft(latest?.reason ?? "");
    setNextActionDraft(application.nextAction ?? "");
    setDueDraft(application.dueAt ? toDateTimeLocalValue(application.dueAt) : "");
    setDecisionStatusDraft(decisionInitial.status);
    setDecisionDateDraft(decisionInitial.decidedAt);
    setDecisionNotesDraft(decisionInitial.notes);
  }, [
    application,
    decisionInitial.decidedAt,
    decisionInitial.notes,
    decisionInitial.status,
    history,
  ]);

  const initialNextAction = application?.nextAction ?? "";
  const initialDueDraft = application?.dueAt
    ? toDateTimeLocalValue(application.dueAt)
    : "";
  const trimmedNextActionDraft = nextActionDraft.trim();
  const dueIso = toIsoOrUndefined(dueDraft);
  const dueHasError = Boolean(dueDraft) && !dueIso;
  const hasNextActionChange = trimmedNextActionDraft !== initialNextAction;
  const hasDueDraftChange = dueDraft !== initialDueDraft;
  const hasReminderChanges = hasNextActionChange || hasDueDraftChange;
  const canSaveReminder = Boolean(application) && hasReminderChanges && !dueHasError;

  const handleStatusDraftChange = (
    event: SelectChangeEvent<unknown>,
  ) => {
    const nextStatus = event.target.value as ApplicationStatus;
    setStatusDraft(nextStatus);
    if (!application) {
      setDateDraft(toDateTimeLocalValue(new Date().toISOString()));
      setReasonDraft("");
      return;
    }
    if (nextStatus === application.status) {
      const iso = ensureValidIso(latestHistoryEntry?.changedAt);
      setDateDraft(toDateTimeLocalValue(iso));
      setReasonDraft(latestHistoryEntry?.reason ?? "");
    } else {
      const nowIso = new Date().toISOString();
      setDateDraft(toDateTimeLocalValue(nowIso));
      setReasonDraft("");
    }
  };

  const handleDateDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDateDraft(event.target.value);
  };

  const handleReasonDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setReasonDraft(event.target.value);
  };

  const handleNextActionDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNextActionDraft(event.target.value);
  };

  const handleDueDraftChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDueDraft(event.target.value);
  };

  const trimmedDecisionNotesDraft = decisionNotesDraft.trim();
  const trimmedDecisionInitialNotes = decisionInitial.notes.trim();
  const decisionDateIso = toIsoOrUndefined(decisionDateDraft);
  const decisionDateHasError = Boolean(decisionDateDraft) && !decisionDateIso;
  const decisionHasChanges =
    decisionStatusDraft !== decisionInitial.status ||
    decisionDateDraft !== decisionInitial.decidedAt ||
    trimmedDecisionNotesDraft !== trimmedDecisionInitialNotes;
  const canSaveDecision =
    Boolean(application) && decisionHasChanges && !decisionDateHasError;

  const handleReminderSave = () => {
    if (!application || !hasReminderChanges || dueHasError) {
      return;
    }
    const updates: Partial<Pick<JobApplication, "nextAction" | "dueAt">> = {};
    if (hasNextActionChange) {
      updates.nextAction = trimmedNextActionDraft ? trimmedNextActionDraft : undefined;
    }
    if (hasDueDraftChange) {
      updates.dueAt = dueIso;
    }
    if (Object.keys(updates).length > 0) {
      onSaveAction(application.id, updates);
    }
  };

  const handleReminderReset = () => {
    setNextActionDraft(initialNextAction);
    setDueDraft(initialDueDraft);
  };

  const handleDecisionStatusDraftChange = (
    event: SelectChangeEvent<unknown>,
  ) => {
    setDecisionStatusDraft(event.target.value as OfferDecisionStatus);
  };

  const handleDecisionDateDraftChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setDecisionDateDraft(event.target.value);
  };

  const handleDecisionNotesDraftChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    setDecisionNotesDraft(event.target.value);
  };

  const handleDecisionReset = () => {
    setDecisionStatusDraft(decisionInitial.status);
    setDecisionDateDraft(decisionInitial.decidedAt);
    setDecisionNotesDraft(decisionInitial.notes);
  };

  const handleDecisionSave = () => {
    if (!application || !decisionHasChanges || decisionDateHasError) {
      return;
    }
    onSaveDecision(application.id, {
      status: decisionStatusDraft,
      decidedAt: decisionDateIso,
      notes: trimmedDecisionNotesDraft ? trimmedDecisionNotesDraft : undefined,
    });
  };

  const handleStatusSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!application) return;
    const iso = toIsoFromLocalValue(dateDraft);
    onUpdateStatus(application.id, statusDraft, {
      changedAt: iso,
      reason: reasonDraft,
    });
  };

  return (
    <>
      <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="persistent"
      ModalProps={{ keepMounted: true }}
      sx={{ zIndex: (theme) => theme.zIndex.drawer - 1 }}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 360, md: 380, lg: 420 },
          maxWidth: "100vw",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 0,
          mr: promptDrawerOpen
            ? { xs: 0, md: 420, lg: 520 }
            : 0,
        },
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Stack
          direction="row"
          spacing={1}
          alignItems="flex-start"
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="h6">
              {application ? application.role.title : "Application details"}
            </Typography>
            {application && (
              <>
                <Typography variant="body2" color="text.secondary">
                  {[
                    application.role.company,
                    application.role.location,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </Typography>
                {application.role.url && (
                  <Link
                    href={application.role.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="body2"
                    sx={{ display: "inline-block", mt: 0.5 }}
                  >
                    View job posting
                  </Link>
                )}
              </>
            )}
          </Box>
          <IconButton
            size="small"
            onClick={onClose}
            aria-label="Close application details"
          >
            <Close />
          </IconButton>
        </Stack>
        <Box sx={{ flexGrow: 1, overflowY: "auto", mt: 2, pr: 1 }}>
          <Stack spacing={3} divider={<Divider flexItem />}>
            {application && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Status timeline
                </Typography>
                {history.length > 0 ? (
                  <Stepper
                    orientation="vertical"
                    activeStep={history.length - 1}
                    sx={{ mt: 1 }}
                  >
                    {history.map((entry, index) => (
                      <Step
                        key={`${entry.status}-${entry.changedAt}-${index}`}
                        completed={index < history.length - 1}
                        expanded
                      >
                        <StepLabel
                          optional={
                            <Typography variant="caption" color="text.secondary">
                              {formatTimelineDate(entry.changedAt)}
                            </Typography>
                          }
                        >
                          {formatStatusLabel(entry.status)}
                        </StepLabel>
                        <Box sx={{ pl: 4, pb: index === history.length - 1 ? 0 : 2 }}>
                          <Typography
                            variant="body2"
                            color={entry.reason ? "text.secondary" : "text.disabled"}
                            sx={{ fontStyle: entry.reason ? "normal" : "italic" }}
                          >
                            {entry.reason || "No reason provided"}
                          </Typography>
                        </Box>
                      </Step>
                    ))}
                  </Stepper>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    No status updates logged yet.
                  </Typography>
                )}
                <Box component="form" onSubmit={handleStatusSubmit} noValidate sx={{ mt: 2 }}>
                  <Stack spacing={2}>
                    <TextField
                      label="Status"
                      select
                      size="small"
                      value={statusDraft}
                      SelectProps={{ onChange: handleStatusDraftChange }}
                      fullWidth
                    >
                      {STATUSES.map((status) => (
                        <MenuItem key={status} value={status}>
                          {formatStatusLabel(status)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label="Date"
                      type="datetime-local"
                      size="small"
                      value={dateDraft}
                      onChange={handleDateDraftChange}
                      fullWidth
                      required
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Reason"
                      value={reasonDraft}
                      onChange={handleReasonDraftChange}
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder="Optional details about this status change"
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={!application || !dateDraft}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {statusDraft === application.status
                        ? "Update status"
                        : "Log status change"}
                    </Button>
                  </Stack>
                </Box>
              </Box>
            )}
            {application && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Next action
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Next action"
                    value={nextActionDraft}
                    onChange={handleNextActionDraftChange}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Describe the next follow-up step"
                  />
                  <TextField
                    label="Due date"
                    type="datetime-local"
                    size="small"
                    value={dueDraft}
                    onChange={handleDueDraftChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={dueHasError}
                    helperText={dueHasError ? "Enter a valid date and time" : undefined}
                  />
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
                    <Button
                      variant="contained"
                      onClick={handleReminderSave}
                      disabled={!canSaveReminder}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Save reminder
                    </Button>
                    <Button
                      variant="text"
                      onClick={handleReminderReset}
                      disabled={!hasReminderChanges}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
            {application && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Offer decision
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Decision status"
                    select
                    size="small"
                    value={decisionStatusDraft}
                    SelectProps={{ onChange: handleDecisionStatusDraftChange }}
                    fullWidth
                  >
                    {OFFER_DECISION_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {formatDecisionStatus(status)}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    label="Decision date"
                    type="datetime-local"
                    size="small"
                    value={decisionDateDraft}
                    onChange={handleDecisionDateDraftChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                    error={decisionDateHasError}
                    helperText={
                      decisionDateHasError
                        ? "Enter a valid date and time"
                        : undefined
                    }
                  />
                  <TextField
                    label="Decision notes"
                    value={decisionNotesDraft}
                    onChange={handleDecisionNotesDraftChange}
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Add optional notes about this decision"
                  />
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ flexWrap: "wrap", rowGap: 1 }}
                  >
                    <Button
                      variant="contained"
                      onClick={handleDecisionSave}
                      disabled={!canSaveDecision}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Save decision
                    </Button>
                    <Button
                      variant="text"
                      onClick={handleDecisionReset}
                      disabled={!decisionHasChanges}
                    >
                      Reset
                    </Button>
                  </Stack>
                </Stack>
              </Box>
            )}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Job description
              </Typography>
              {application?.role.description ? (
                <Box
                  sx={{
                    "& ul": { pl: 3 },
                    "& ol": { pl: 3 },
                    "& p": { mt: 0, mb: 1 },
                  }}
                  dangerouslySetInnerHTML={{ __html: jobDescriptionHtml }}
                />
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No description provided for this role.
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Linked resume
              </Typography>
              {application?.resumeVariant ? (
                <Stack spacing={0.5}>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {application.resumeVariant.title}
                  </Typography>
                  {application.resumeVariant.url ? (
                    <Link
                      href={application.resumeVariant.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                    >
                      Open resume
                    </Link>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      This resume is stored locally and does not have a public
                      link.
                    </Typography>
                  )}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No resume is linked to this application.
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Attachments
              </Typography>
              {application ? (
                <Stack spacing={1.5}>
                  {attachments.length > 0 ? (
                    <List dense disablePadding>
                      {attachments.map((attachment) => (
                        <ListItem
                          key={attachment.id}
                          secondaryAction={
                            <Stack direction="row" spacing={0.5}>
                              <Tooltip title="Preview">
                                <IconButton
                                  size="small"
                                  onClick={() => handlePreviewAttachment(attachment)}
                                  aria-label={`Preview ${attachment.name}`}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDownloadAttachment(attachment)}
                                  aria-label={`Download ${attachment.name}`}
                                >
                                  <Download fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteAttachment(attachment.id)}
                                  aria-label={`Delete ${attachment.name}`}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          }
                        >
                          <ListItemText
                            primary={attachment.name}
                            secondary={attachment.mimeType}
                          />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No attachments uploaded yet.
                    </Typography>
                  )}
                  <FileUploader
                    key={`${application.id}-${uploaderKey}`}
                    label="Upload attachments"
                    variant="upload"
                    outputType="files"
                    limit={5}
                    maxFileSize={10 * 1024 * 1024}
                    onChange={handleAttachmentUpload}
                  />
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select an application to manage attachments.
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Recruiter info
              </Typography>
              {application?.recruiters && application.recruiters.length > 0 ? (
                <Stack spacing={2}>
                  {application.recruiters.map((recruiter) => (
                    <Stack key={recruiter.id} spacing={0.5}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {recruiter.name}
                      </Typography>
                      {recruiter.email && (
                        <Link href={`mailto:${recruiter.email}`} variant="body2">
                          {recruiter.email}
                        </Link>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        Connector: {recruiter.connector}
                      </Typography>
                      {recruiter.tags.length > 0 && (
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {recruiter.tags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" />
                          ))}
                        </Stack>
                      )}
                      {recruiter.notes && (
                        <Typography variant="body2" color="text.secondary">
                          {recruiter.notes}
                        </Typography>
                      )}
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recruiters are associated with this application yet.
                </Typography>
              )}
            </Box>
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Connector sync status
              </Typography>
              {connectors.length > 0 ? (
                <Stack spacing={1}>
                  {connectors.map((connector) => (
                    <Stack
                      key={connector.key}
                      direction="row"
                      alignItems="center"
                      spacing={1}
                    >
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {connector.label}
                      </Typography>
                      <Chip
                        label={connector.connected ? "Connected" : "Not connected"}
                        color={connector.connected ? "success" : "default"}
                        size="small"
                      />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  This application is not linked to any connectors.
                </Typography>
              )}
            </Box>
            {application && promptContexts.length > 0 && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Quick prompts
                </Typography>
                <PromptTileGrid
                  contexts={promptContexts}
                  initialValues={promptInitialValues}
                />
              </Box>
            )}
          </Stack>
        </Box>
      </Box>
      </Drawer>
      <Dialog
        open={Boolean(previewAttachment)}
        onClose={handleClosePreview}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {previewAttachment?.name ?? "Attachment preview"}
        </DialogTitle>
        <DialogContent dividers sx={{ minHeight: 200 }}>
          {previewAttachment ? renderPreviewContent(previewAttachment) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button
            onClick={() => {
              if (previewAttachment) {
                handleDownloadAttachment(previewAttachment);
              }
            }}
            startIcon={<Download />}
            variant="contained"
            disabled={!previewAttachment}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
