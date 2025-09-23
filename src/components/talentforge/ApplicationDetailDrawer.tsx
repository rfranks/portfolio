"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Box,
  Button,
  Autocomplete,
  Chip,
  Drawer,
  IconButton,
  Link,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { Close } from "@mui/icons-material";
import DOMPurify from "dompurify";
import { marked } from "marked";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { v4 as uuid } from "uuid";

import type {
  ApplicationStatus,
  JobApplication,
  OfferDecisionStatus,
  RecruiterEntry,
  Message,
} from "@/types";
import {
  OFFER_DECISION_DEFAULT_STATUS,
  OFFER_DECISION_STATUS_LABELS,
  OFFER_DECISION_STATUSES,
} from "@/types";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import PromptTileGrid from "./promptTiles/PromptTileGrid";
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
  onSaveDecision: (
    id: string,
    updates: {
      status: OfferDecisionStatus;
      decidedAt?: string;
      notes?: string;
    },
  ) => void;
  onSetInterviewDate: (id: string, value: string) => void;
  onSetInterviewLocation: (id: string, value: string) => void;
  onDownloadInterviewInvite: (application: JobApplication) => void;
  onUpdateRecruiters: (id: string, recruiters: RecruiterEntry[]) => void;
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
  onSaveDecision,
  onSetInterviewDate,
  onSetInterviewLocation,
  onDownloadInterviewInvite,
  onUpdateRecruiters,
  promptDrawerOpen = false,
}: ApplicationDetailDrawerProps) {
  const data = useTalentForgeData();
  const router = useRouter();

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

  const interviewDateValue = application?.interviewDateTime
    ? toDateTimeLocalValue(application.interviewDateTime) ||
      application.interviewDateTime
    : "";
  const interviewLocationValue = application?.interviewLocation ?? "";
  const interviewDateRaw =
    typeof application?.interviewDateTime === "string"
      ? application.interviewDateTime.trim()
      : "";
  const hasValidInterviewTime =
    Boolean(interviewDateRaw) && !Number.isNaN(new Date(interviewDateRaw).getTime());
  const canDownloadInvite = Boolean(application) && hasValidInterviewTime;

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
  const [allRecruiters, setAllRecruiters] = useState<RecruiterEntry[]>([]);
  const [allThreads, setAllThreads] = useState<Message[]>([]);
  const [linkedRecruiterIds, setLinkedRecruiterIds] = useState<string[]>([]);
  const [recruiterSelection, setRecruiterSelection] =
    useState<RecruiterEntry | null>(null);
  const [viewRecruiter, setViewRecruiter] = useState<RecruiterEntry | null>(
    null,
  );
  const [editingRecruiterId, setEditingRecruiterId] = useState<string | null>(
    null,
  );
  const [editingTags, setEditingTags] = useState<string>("");

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
      setLinkedRecruiterIds([]);
      setRecruiterSelection(null);
      setViewRecruiter(null);
      setEditingRecruiterId(null);
      setEditingTags("");
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
    setLinkedRecruiterIds(
      (application.recruiters ?? []).map((recruiter) => recruiter.id),
    );
    setRecruiterSelection(null);
  }, [
    application,
    decisionInitial.decidedAt,
    decisionInitial.notes,
    decisionInitial.status,
    history,
  ]);

  useEffect(() => {
    setAllRecruiters(data.getRecruiters());
    setAllThreads(data.getMessages());
  }, [data]);

  const recruiterMap = useMemo(() => {
    const map = new Map<string, RecruiterEntry>();
    allRecruiters.forEach((recruiter) => {
      map.set(recruiter.id, recruiter);
    });
    return map;
  }, [allRecruiters]);

  const linkedRecruiters = useMemo(() => {
    const fallback = application?.recruiters ?? [];
    return linkedRecruiterIds
      .map((id) => recruiterMap.get(id) ?? fallback.find((r) => r.id === id))
      .filter((value): value is RecruiterEntry => Boolean(value));
  }, [linkedRecruiterIds, recruiterMap, application?.recruiters]);

  const availableRecruiters = useMemo(
    () =>
      allRecruiters.filter((recruiter) => !linkedRecruiterIds.includes(recruiter.id)),
    [allRecruiters, linkedRecruiterIds],
  );

  const relatedThreads = useMemo(() => {
    if (!application) {
      return [] as Message[];
    }
    const recruiterIds = new Set(linkedRecruiterIds);
    const seen = new Set<string>();
    const matches: Message[] = [];
    for (const thread of allThreads) {
      const matchesApplication = thread.applicationId === application.id;
      const matchesRecruiter = Boolean(
        thread.recruiterId && recruiterIds.has(thread.recruiterId),
      );
      if ((matchesApplication || matchesRecruiter) && !seen.has(thread.id)) {
        matches.push(thread);
        seen.add(thread.id);
      }
    }
    return matches.sort((a, b) => {
      const timeA = new Date(a.sentAt).getTime();
      const timeB = new Date(b.sentAt).getTime();
      return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
    });
  }, [allThreads, application, linkedRecruiterIds]);

  const editingRecruiter = editingRecruiterId
    ? recruiterMap.get(editingRecruiterId) ?? null
    : null;

  const buildRecruiterList = (
    ids: string[],
    map: Map<string, RecruiterEntry>,
  ): RecruiterEntry[] => {
    const fallback = application?.recruiters ?? [];
    return ids
      .map(
        (id) => map.get(id) ?? fallback.find((recruiter) => recruiter.id === id),
      )
      .filter((value): value is RecruiterEntry => Boolean(value));
  };

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

  const handleInterviewDateChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (!application) return;
    onSetInterviewDate(application.id, event.target.value);
  };

  const handleInterviewLocationChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    if (!application) return;
    onSetInterviewLocation(application.id, event.target.value);
  };

  const handleDownloadInvite = () => {
    if (!application) return;
    onDownloadInterviewInvite(application);
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

  const handleLinkRecruiter = (
    _: unknown,
    recruiter: RecruiterEntry | null,
  ) => {
    if (!application || !recruiter) {
      setRecruiterSelection(recruiter);
      return;
    }
    if (linkedRecruiterIds.includes(recruiter.id)) {
      setRecruiterSelection(null);
      return;
    }
    const nextIds = [...linkedRecruiterIds, recruiter.id];
    setLinkedRecruiterIds(nextIds);
    setRecruiterSelection(null);
    const recruiterList = buildRecruiterList(nextIds, recruiterMap);
    onUpdateRecruiters(application.id, recruiterList);
  };

  const handleUnlinkRecruiter = (recruiterId: string) => {
    if (!application) return;
    const nextIds = linkedRecruiterIds.filter((id) => id !== recruiterId);
    setLinkedRecruiterIds(nextIds);
    const recruiterList = buildRecruiterList(nextIds, recruiterMap);
    onUpdateRecruiters(application.id, recruiterList);
  };

  const handleOpenRecruiterView = (recruiterId: string) => {
    const recruiter = recruiterMap.get(recruiterId);
    setViewRecruiter(recruiter ?? null);
  };

  const handleCloseRecruiterView = () => {
    setViewRecruiter(null);
  };

  const handleOpenEditTags = (recruiterId: string) => {
    const recruiter = recruiterMap.get(recruiterId);
    if (!recruiter) return;
    setEditingRecruiterId(recruiterId);
    setEditingTags(recruiter.tags.join(", "));
  };

  const handleCloseEditTags = () => {
    setEditingRecruiterId(null);
    setEditingTags("");
  };

  const handleSaveRecruiterTags = () => {
    if (!application || !editingRecruiterId) return;
    const recruiter = recruiterMap.get(editingRecruiterId);
    if (!recruiter) {
      handleCloseEditTags();
      return;
    }
    const tags = editingTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const updatedRecruiter = { ...recruiter, tags };
    const updatedRecruiterList = data.updateRecruiter(updatedRecruiter);
    setAllRecruiters(updatedRecruiterList);
    const updatedMap = new Map<string, RecruiterEntry>();
    updatedRecruiterList.forEach((entry) => {
      updatedMap.set(entry.id, entry);
    });
    const recruiterList = buildRecruiterList(linkedRecruiterIds, updatedMap);
    onUpdateRecruiters(application.id, recruiterList);
    handleCloseEditTags();
  };

  const handleThreadRecruiterChange = (threadId: string, recruiterId: string) => {
    const updated = data.linkThreadToRecruiter(threadId, recruiterId);
    setAllThreads(updated);
    setAllRecruiters(data.getRecruiters());
  };

  const handleComposeNewThread = () => {
    if (!application) return;
    const connectorLabel = [
      application.role.company,
      application.role.title,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" – ");
    const message: Message = {
      id: uuid(),
      threadId: uuid(),
      senderId: application.applicant?.id || "candidate",
      sentAt: new Date().toISOString(),
      body: "Draft message",
      connector: connectorLabel || "Manual outreach",
      status: "read",
      replies: [],
      applicationId: application.id,
    };
    const updated = data.addThread(message);
    setAllThreads(updated);
    router.push(`/talentforge/inbox?threadId=${message.id}&compose=1`);
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
                  Interview details
                </Typography>
                <Stack spacing={2}>
                  <TextField
                    label="Interview time"
                    type="datetime-local"
                    size="small"
                    value={interviewDateValue}
                    onChange={handleInterviewDateChange}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    alignItems={{ xs: "stretch", sm: "flex-end" }}
                  >
                    <TextField
                      label="Meeting URL/Location"
                      size="small"
                      value={interviewLocationValue}
                      onChange={handleInterviewLocationChange}
                      fullWidth
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleDownloadInvite}
                      disabled={!canDownloadInvite}
                      sx={{
                        alignSelf: { xs: "stretch", sm: "flex-end" },
                        whiteSpace: "nowrap",
                      }}
                    >
                      Download invite
                    </Button>
                  </Stack>
                </Stack>
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
                Recruiter info
              </Typography>
              {linkedRecruiters.length > 0 ? (
                <Stack spacing={2}>
                  {linkedRecruiters.map((recruiter) => (
                    <Box
                      key={recruiter.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Stack
                        direction="row"
                        alignItems="flex-start"
                        justifyContent="space-between"
                        spacing={1}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {recruiter.name}
                          </Typography>
                          {recruiter.email && (
                            <Link
                              href={`mailto:${recruiter.email}`}
                              variant="body2"
                              sx={{ display: "inline-block" }}
                            >
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
                              sx={{ mt: 0.5 }}
                            >
                              {recruiter.tags.map((tag) => (
                                <Chip key={tag} label={tag} size="small" />
                              ))}
                            </Stack>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenRecruiterView(recruiter.id)}
                          >
                            View
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleOpenEditTags(recruiter.id)}
                          >
                            Edit tags
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleUnlinkRecruiter(recruiter.id)}
                          >
                            Unlink
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No recruiters are associated with this application yet.
                </Typography>
              )}
              <Autocomplete
                sx={{ mt: 2 }}
                size="small"
                value={recruiterSelection}
                options={availableRecruiters}
                getOptionLabel={(option) => option.name}
                onChange={handleLinkRecruiter}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={!application || availableRecruiters.length === 0}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Link recruiter"
                    placeholder={
                      availableRecruiters.length === 0
                        ? "All recruiters linked"
                        : "Search recruiters"
                    }
                  />
                )}
                noOptionsText={
                  availableRecruiters.length === 0
                    ? "No additional recruiters available"
                    : "No recruiters found"
                }
              />
            </Box>
            <Box>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Typography variant="subtitle2">Related inbox threads</Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleComposeNewThread}
                  disabled={!application}
                >
                  Compose new message
                </Button>
              </Stack>
              {relatedThreads.length > 0 ? (
                <Stack spacing={2} sx={{ mt: 2 }}>
                  {relatedThreads.map((thread) => (
                    <Box
                      key={thread.id}
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        border: "1px solid",
                        borderColor: "divider",
                        bgcolor: "background.paper",
                      }}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="space-between"
                        alignItems="flex-start"
                      >
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {thread.connector}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Sent {formatTimelineDate(thread.sentAt)}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}
                          >
                            {thread.body || "No preview available."}
                          </Typography>
                        </Box>
                        <Button
                          component={NextLink}
                          href={`/talentforge/inbox?threadId=${thread.id}`}
                          size="small"
                          variant="outlined"
                          sx={{ flexShrink: 0 }}
                        >
                          Open in inbox
                        </Button>
                      </Stack>
                      <TextField
                        select
                        label="Linked recruiter"
                        size="small"
                        value={thread.recruiterId || ""}
                        onChange={(event) =>
                          handleThreadRecruiterChange(
                            thread.id,
                            event.target.value as string,
                          )
                        }
                        sx={{ mt: 1 }}
                        fullWidth
                      >
                        <MenuItem value="">
                          <em>No recruiter</em>
                        </MenuItem>
                        {allRecruiters.map((recruiter) => (
                          <MenuItem key={recruiter.id} value={recruiter.id}>
                            {recruiter.name}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  No inbox threads are linked to this application yet.
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
      <Dialog open={Boolean(viewRecruiter)} onClose={handleCloseRecruiterView}>
        <DialogTitle>Recruiter details</DialogTitle>
        <DialogContent>
          {viewRecruiter ? (
            <Stack spacing={1.5} sx={{ mt: 0.5 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {viewRecruiter.name}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                {viewRecruiter.email ? (
                  <Link href={`mailto:${viewRecruiter.email}`}>
                    {viewRecruiter.email}
                  </Link>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No email available.
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Connector
                </Typography>
                <Typography variant="body2">{viewRecruiter.connector}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Tags
                </Typography>
                {viewRecruiter.tags.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {viewRecruiter.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags have been added yet.
                  </Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {viewRecruiter.notes || "No notes saved."}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Linked threads
                </Typography>
                <Typography variant="body2">
                  {viewRecruiter.threadIds.length}
                  {viewRecruiter.threadIds.length === 1 ? " thread" : " threads"}
                </Typography>
              </Box>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No recruiter selected.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRecruiterView}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(editingRecruiterId)}
        onClose={handleCloseEditTags}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Edit recruiter tags</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              Enter a comma-separated list of tags to help categorize this recruiter.
            </Typography>
            <TextField
              label="Tags"
              value={editingTags}
              onChange={(event) => setEditingTags(event.target.value)}
              placeholder="e.g. responsive, hiring manager"
              autoFocus
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditTags}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRecruiterTags}
            disabled={!editingRecruiter}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Drawer>
  );
}
