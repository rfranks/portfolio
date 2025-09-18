"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import {
  Box,
  Button,
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
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import { Close } from "@mui/icons-material";
import DOMPurify from "dompurify";
import { marked } from "marked";

import type { ApplicationStatus, JobApplication } from "@/types";
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

export default function ApplicationDetailDrawer({
  open,
  application,
  onClose,
  onUpdateStatus,
  promptDrawerOpen = false,
}: ApplicationDetailDrawerProps) {
  const data = useTalentForgeData();

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

  useEffect(() => {
    if (!application) {
      setStatusDraft("applied");
      setDateDraft(toDateTimeLocalValue(new Date().toISOString()));
      setReasonDraft("");
      return;
    }
    const latest = history[history.length - 1];
    setStatusDraft(application.status);
    const iso = ensureValidIso(latest?.changedAt);
    setDateDraft(toDateTimeLocalValue(iso));
    setReasonDraft(latest?.reason ?? "");
  }, [application, history]);

  const handleStatusDraftChange = (
    event: SelectChangeEvent<ApplicationStatus>,
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
                      onChange={handleStatusDraftChange}
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
  );
}
