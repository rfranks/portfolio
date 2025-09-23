"use client";

import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
  Stack,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { filterByText } from "@/utils/search";

import {
  autoReply,
  buildAutoReplyMessages,
  AutoReplyTemplate,
} from "@/utils/autoReply";
import { askOpenAI } from "@/utils/talentforge/utils";

import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import { useSearchParams } from "next/navigation";
import type {
  ApplicationStatus,
  JobApplication,
  Message,
  RecruiterEntry,
} from "@/types";
import { v4 as uuidv4 } from "uuid";
import { ContentCopy } from "@mui/icons-material";
import PromptSelector from "./PromptSelector";
import Tile from "./promptTiles/Tile";
import { getPromptTile } from "@/utils/talentforge/promptRegistry";
import EmptyState from "./EmptyState";
import { STATUSES } from "@/utils/talentforge/keyboard";

const NO_COMPANY_FILTER = "__no_company__";
type StatusFilterValue = ApplicationStatus | "all" | "unlinked";

const formatStatus = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1);

type QuickReplyChannel = "email" | "linkedin" | "indeed";
type QuickReplyType = "followUp" | "decline";

interface QuickReplyContent {
  email: string;
  linkedin: string;
  indeed: string;
}

interface QuickReplyEntry {
  contextKey: string;
  content: QuickReplyContent;
}

const QUICK_REPLY_CHANNELS: QuickReplyChannel[] = [
  "email",
  "linkedin",
  "indeed",
];

export default function Inbox() {
  const data = useTalentForgeData();
  const [threads, setThreads] = useState<Message[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilterValue>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [templateSelections, setTemplateSelections] =
    useState<Record<string, AutoReplyTemplate>>({});
  const [quickReplyCache, setQuickReplyCache] = useState<
    Record<string, Partial<Record<QuickReplyType, QuickReplyEntry>>>
  >({});
  const [quickReplyType, setQuickReplyType] =
    useState<QuickReplyType>("followUp");
  const [quickReplyChannel, setQuickReplyChannel] =
    useState<QuickReplyChannel>("email");
  const [quickReplyLoading, setQuickReplyLoading] = useState(false);
  const [quickReplyError, setQuickReplyError] = useState<string | null>(null);
  const [templateDefs, setTemplateDefs] = useState<Record<string, string>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTemplates, setEditorTemplates] = useState<
    Array<{ name: string; prompt: string }>
  >([]);
  const [search, setSearch] = useState("");
  const [recruiters, setRecruiters] = useState<RecruiterEntry[]>([]);
  const [aiThread, setAiThread] = useState<string | null>(null);
  const [promptKey, setPromptKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = setTimeout(() => {
      setThreads(data.getThreads());
      setApplications(data.getJobApplications());
      setRecruiters(data.getRecruiters());
      setTemplateDefs(data.getAutoReplyTemplates());
      setLoading(false);
    }, 0);
    return () => clearTimeout(id);
  }, [data]);

  useEffect(() => {
    const threadId = searchParams.get("threadId");
    if (threadId) {
      setSelectedId(threadId);
    }
  }, [searchParams]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as "all" | "unread" | "read");
  };

  const handleStatusFilterChange = (event: SelectChangeEvent) => {
    setStatusFilter(event.target.value as StatusFilterValue);
  };

  const handleCompanyFilterChange = (event: SelectChangeEvent) => {
    setCompanyFilter(event.target.value as string);
  };

  const applicationById = useMemo(() => {
    const map: Record<string, JobApplication> = {};
    for (const app of applications) {
      map[app.id] = app;
    }
    return map;
  }, [applications]);

  const sortedApplications = useMemo(() => {
    return [...applications].sort((a, b) => {
      const companyCompare = a.role.company.localeCompare(b.role.company);
      if (companyCompare !== 0) return companyCompare;
      return a.role.title.localeCompare(b.role.title);
    });
  }, [applications]);

  const companyOptions = useMemo(() => {
    const companies = new Set<string>();
    applications.forEach((app) => {
      if (app.role.company.trim()) {
        companies.add(app.role.company);
      }
    });
    return Array.from(companies).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const filteredThreads = filterByText(threads, search, ["body", "connector"]).filter(
    (m) => {
      if (filter !== "all" && m.status !== filter) return false;

      const application = m.applicationId
        ? applicationById[m.applicationId]
        : undefined;

      if (statusFilter === "unlinked") {
        if (application) return false;
      } else if (statusFilter !== "all") {
        if (!application || application.status !== statusFilter) {
          return false;
        }
      }

      if (companyFilter === NO_COMPANY_FILTER) {
        if (application) return false;
      } else if (companyFilter !== "all") {
        if (!application || application.role.company !== companyFilter) {
          return false;
        }
      }

      return true;
    },
  );

  const buildQuickReplyContext = (message: Message) => {
    const parts: string[] = [];
    const application = message.applicationId
      ? applicationById[message.applicationId]
      : undefined;
    const recruiter = message.recruiterId
      ? recruiters.find((r) => r.id === message.recruiterId)
      : undefined;

    const sentDate = new Date(message.sentAt);
    const formattedSentDate = Number.isNaN(sentDate.getTime())
      ? message.sentAt
      : sentDate.toLocaleString();

    parts.push(
      `Recruiter message received via ${message.connector} on ${formattedSentDate}:\n${message.body.trim()}`,
    );

    if (application) {
      parts.push(
        `Linked application: ${application.role.title} at ${application.role.company} (status: ${formatStatus(application.status)}).`,
      );
    }

    if (recruiter) {
      const note = recruiter.notes?.trim();
      parts.push(
        note
          ? `Recruiter: ${recruiter.name}. Notes: ${note}`
          : `Recruiter: ${recruiter.name}.`,
      );
    }

    if (message.replies.length > 0) {
      parts.push("Previous replies from the candidate:");
      for (const reply of message.replies) {
        const replyDate = new Date(reply.sentAt);
        const formattedReplyDate = Number.isNaN(replyDate.getTime())
          ? reply.sentAt
          : replyDate.toLocaleString();
        parts.push(
          `Sent via ${reply.connector} on ${formattedReplyDate}:\n${reply.body.trim()}`,
        );
      }
    }

    return parts.filter(Boolean).join("\n\n");
  };

  const parseQuickReplyContent = (raw: string): QuickReplyContent | null => {
    const sanitize = (value: unknown) =>
      typeof value === "string" ? value.trim() : "";

    const attemptFromObject = (
      obj: Record<string, unknown>,
    ): QuickReplyContent | null => {
      const channelKeys: Record<QuickReplyChannel, string[]> = {
        email: ["email", "Email", "EMAIL"],
        linkedin: ["linkedin", "LinkedIn", "Linkedin", "LINKEDIN"],
        indeed: ["indeed", "Indeed", "INDEED"],
      };

      const result: Partial<Record<QuickReplyChannel, string>> = {};

      for (const channel of QUICK_REPLY_CHANNELS) {
        for (const key of channelKeys[channel]) {
          if (key in obj) {
            const text = sanitize(obj[key]);
            if (text) {
              result[channel] = text;
              break;
            }
          }
        }
      }

      if (result.email || result.linkedin || result.indeed) {
        return {
          email: result.email || "",
          linkedin: result.linkedin || "",
          indeed: result.indeed || "",
        };
      }

      for (const value of Object.values(obj)) {
        if (value && typeof value === "object" && !Array.isArray(value)) {
          const nested = attemptFromObject(value as Record<string, unknown>);
          if (nested) {
            return nested;
          }
        }
      }

      return null;
    };

    const trimmed = raw.trim();
    if (!trimmed) return null;

    const candidates = [trimmed];
    const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      candidates.unshift(fencedMatch[1]);
    }

    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate) as unknown;
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const content = attemptFromObject(parsed as Record<string, unknown>);
          if (content) {
            return content;
          }
        }
      } catch {
        continue;
      }
    }

    return null;
  };

  const selected = threads.find((m) => m.id === selectedId) || null;

  const selectedApplication = selected?.applicationId
    ? applicationById[selected.applicationId]
    : undefined;

  const selectedRecruiter = selected?.recruiterId
    ? recruiters.find((r) => r.id === selected.recruiterId)
    : undefined;

  const recruiterNotes = selectedRecruiter?.notes?.trim() || "";
  const linkedApplicationMissing = Boolean(
    selected?.applicationId && !selectedApplication,
  );

  const quickReplyEntry = selected
    ? quickReplyCache[selected.id]?.[quickReplyType]
    : undefined;
  const quickReplyContent = quickReplyEntry?.content;
  const currentQuickReplyText = quickReplyContent
    ? quickReplyContent[quickReplyChannel]
    : "";

  const templateNames = Object.keys(templateDefs) as AutoReplyTemplate[];
  const defaultTemplate: AutoReplyTemplate = templateDefs.general
    ? "general"
    : templateNames[0];

  const handleSelectThread = (message: Message) => {
    setSelectedId(message.id);
    setQuickReplyChannel("email");
    setQuickReplyError(null);
    if (!drafts[message.id]) void handleAutoReply(message);
    if (message.status === "unread") {
      const updated = data.updateThreadStatus(message.id, "read");
      setThreads(updated);
    }
  };

  const handleAutoReply = async (message: Message) => {
    const template = templateSelections[message.id] || defaultTemplate;
    const reply = await autoReply(
      buildAutoReplyMessages(template, message.body, templateDefs),
    );
    setDrafts((d) => ({ ...d, [message.id]: reply }));
  };

  const handleGenerateQuickReply = async (message: Message) => {
    setQuickReplyError(null);
    setQuickReplyChannel("email");

    const context = buildQuickReplyContext(message);
    const cached = quickReplyCache[message.id]?.[quickReplyType];
    if (cached && cached.contextKey === context) {
      return;
    }

    const tileId =
      quickReplyType === "followUp"
        ? "recruiterFollowUp"
        : "recruiterDecline";
    const tile = getPromptTile(tileId, { contexts: "messaging" });
    if (!tile) {
      setQuickReplyError("This prompt is unavailable in the current workspace.");
      return;
    }

    let prompt = tile.fullPrompt;
    for (const input of tile.inputs) {
      const value = input === "messageContext" ? context : "";
      prompt = prompt.replaceAll(`{{${input}}}`, value);
    }

    setQuickReplyLoading(true);

    try {
      const systemPrompt =
        quickReplyType === "followUp"
          ? "You craft professional recruiter follow-up messages. Always respond with strictly valid JSON containing keys email, linkedin, and indeed. Do not add markdown fences or commentary."
          : "You craft professional recruiter decline messages. Always respond with strictly valid JSON containing keys email, linkedin, and indeed. Do not add markdown fences or commentary.";

      const response = await askOpenAI({
        context: "",
        user: prompt,
        system: systemPrompt,
        returnFirstResponse: true,
        chatHistory: [],
      });

      const messageText = response?.message?.trim() || "";
      const parsed = parseQuickReplyContent(messageText);

      if (!parsed) {
        const fallback = messageText;
        if (!fallback) {
          setQuickReplyError("The AI response was empty. Please try again.");
          return;
        }

        setQuickReplyError(
          "We couldn't parse the AI response into channels. The same text is available for each option.",
        );

        const fallbackContent: QuickReplyContent = {
          email: fallback,
          linkedin: fallback,
          indeed: fallback,
        };

        setQuickReplyCache((prev) => ({
          ...prev,
          [message.id]: {
            ...prev[message.id],
            [quickReplyType]: {
              contextKey: context,
              content: fallbackContent,
            },
          },
        }));

        return;
      }

      setQuickReplyCache((prev) => ({
        ...prev,
        [message.id]: {
          ...prev[message.id],
          [quickReplyType]: { contextKey: context, content: parsed },
        },
      }));
    } catch (error) {
      setQuickReplyError(
        error instanceof Error
          ? error.message
          : "Failed to generate a quick reply.",
      );
    } finally {
      setQuickReplyLoading(false);
    }
  };

  const handleQuickReplyTypeChange = (
    _event: MouseEvent<HTMLElement>,
    value: QuickReplyType | null,
  ) => {
    if (!value) return;
    setQuickReplyType(value);
    setQuickReplyChannel("email");
    setQuickReplyError(null);
  };

  const handleQuickReplyChannelChange = (
    _event: unknown,
    value: QuickReplyChannel,
  ) => {
    setQuickReplyChannel(value);
  };

  const handleInsertQuickReply = (messageId: string, text: string) => {
    if (!text) return;
    setDrafts((prev) => ({
      ...prev,
      [messageId]: text,
    }));
  };

  const handleCopyQuickReply = async (text: string) => {
    if (!text || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore clipboard errors; users can still manually copy.
    }
  };

  const handleSendReply = (message: Message) => {
    const text = drafts[message.id];
    if (!text) return;
    const reply = {
      id: uuidv4(),
      body: text,
      sentAt: new Date().toISOString(),
      connector: message.connector,
    };
    let updated = data.addThreadReply(message.id, reply);

    const matchedRecruiter = recruiters.find(
      (r) => r.connector.toLowerCase() === message.connector.toLowerCase(),
    );
    if (matchedRecruiter) {
      updated = data.linkThreadToRecruiter(message.id, matchedRecruiter.id);
      setRecruiters(data.getRecruiters());
    }

    setThreads(updated);
    setDrafts((d) => ({ ...d, [message.id]: "" }));
  };

  const handleToggleStatus = (message: Message) => {
    const updated = data.updateThreadStatus(
      message.id,
      message.status === "unread" ? "read" : "unread",
    );
    setThreads(updated);
  };

  const handleLinkApplication = (threadId: string, applicationId: string) => {
    const updated = data.linkThreadToApplication(
      threadId,
      applicationId ? applicationId : undefined,
    );
    setThreads(updated);
  };

  const handleLinkRecruiter = (threadId: string, recruiterId: string) => {
    const updated = data.linkThreadToRecruiter(threadId, recruiterId);
    setThreads(updated);
    setRecruiters(data.getRecruiters());
  };

  const handleDraftWithAI = (threadId: string) => {
    setAiThread(threadId);
    setPromptKey("");
  };

  const handleInsertAIDraft = (text: string) => {
    if (aiThread) {
      setDrafts((d) => ({ ...d, [aiThread]: text }));
    }
    setAiThread(null);
  };

  const openTemplateEditor = () => {
    setEditorTemplates(
      Object.entries(templateDefs).map(([name, prompt]) => ({ name, prompt })),
    );
    setEditorOpen(true);
  };

  const handleTemplateChange = (
    index: number,
    field: "name" | "prompt",
    value: string,
  ) => {
    setEditorTemplates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddTemplate = () => {
    setEditorTemplates((prev) => [...prev, { name: "", prompt: "" }]);
  };

  const handleDeleteTemplate = (index: number) => {
    setEditorTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTemplates = () => {
    const defs: Record<string, string> = {};
    for (const { name, prompt } of editorTemplates) {
      if (name.trim()) defs[name.trim()] = prompt;
    }
    setTemplateDefs(defs);
    data.saveAutoReplyTemplates(defs);
    setEditorOpen(false);
  };

  if (loading) {
    return (
      <Stack spacing={2} aria-label="Loading inbox" aria-busy="true">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} variant="rectangular" height={60} />
        ))}
      </Stack>
    );
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        message="No messages"
        helperText="Your recruiter conversations will appear here."
      />
    );
  }

  const selectedPromptTile =
    promptKey !== ""
      ? getPromptTile(promptKey, { contexts: "messaging" })
      : undefined;

  const promptTileInitialValues =
    promptKey === "recruiterNudge" && aiThread
      ? {
          messageContext: threads.find((m) => m.id === aiThread)?.body || "",
        }
      : undefined;

  return (
    <Box aria-busy={loading} aria-label={loading ? "Loading inbox" : undefined}>
      <Stack direction="row" spacing={2} sx={{ height: "100%" }}>
        <Box sx={{ width: 300 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Inbox</Typography>
            <Select
              value={filter}
              onChange={handleFilterChange}
              sx={{ maxWidth: 200 }}
              aria-label="Filter threads"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="unread">Unread</MenuItem>
              <MenuItem value="read">Read</MenuItem>
            </Select>
            <Select
              value={statusFilter}
              onChange={handleStatusFilterChange}
              sx={{ maxWidth: 200 }}
              displayEmpty
              aria-label="Filter by application status"
            >
              <MenuItem value="all">All application statuses</MenuItem>
              <MenuItem value="unlinked">No linked application</MenuItem>
              {STATUSES.map((status) => (
                <MenuItem key={status} value={status}>
                  {formatStatus(status)}
                </MenuItem>
              ))}
            </Select>
            <Select
              value={companyFilter}
              onChange={handleCompanyFilterChange}
              sx={{ maxWidth: 200 }}
              displayEmpty
              aria-label="Filter by company"
            >
              <MenuItem value="all">All companies</MenuItem>
              <MenuItem value={NO_COMPANY_FILTER}>No linked application</MenuItem>
              {companyOptions.map((company) => (
                <MenuItem key={company} value={company}>
                  {company}
                </MenuItem>
              ))}
            </Select>
            <TextField
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ maxWidth: 300 }}
            />
            <List aria-label="Thread list">
              {filteredThreads.map((message) => (
                <ListItem key={message.id} disablePadding>
                  <ListItemButton
                    selected={selectedId === message.id}
                    onClick={() => handleSelectThread(message)}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" fontWeight="bold">
                          {message.connector}
                        </Typography>
                      }
                      secondary={message.body}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Stack>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          {selected ? (
            <Stack spacing={2}>
              <Typography variant="h6">{selected.connector}</Typography>
              <Stack spacing={1}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Linked application
                    </Typography>
                    {selectedApplication ? (
                      <>
                        <Typography variant="body1" fontWeight={600}>
                          {`${selectedApplication.role.title} · ${selectedApplication.role.company}`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Status: {formatStatus(selectedApplication.status)}
                        </Typography>
                        {selectedApplication.resumeVariant && (
                          <Typography variant="body2" color="text.secondary">
                            Resume: {selectedApplication.resumeVariant.title}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No application linked.
                      </Typography>
                    )}
                  </Stack>
                </Box>
                {selectedRecruiter && (
                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 1,
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "background.paper",
                    }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Recruiter notes
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        sx={{ whiteSpace: "pre-wrap" }}
                      >
                        {recruiterNotes || "No notes saved yet."}
                      </Typography>
                    </Stack>
                  </Box>
                )}
              </Stack>
              <Typography>{selected.body}</Typography>
              {selected.replies.map((r) => (
                <Typography key={r.id} variant="body2">
                  {r.body}
                </Typography>
              ))}
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexWrap: "wrap", rowGap: 1 }}
              >
                <Button
                  size="small"
                  onClick={() => handleToggleStatus(selected)}
                  aria-label="Toggle read status"
                >
                  {selected.status === "unread" ? "Mark read" : "Mark unread"}
                </Button>
                <Select
                  size="small"
                  displayEmpty
                  value={selected.recruiterId || ""}
                  onChange={(e) =>
                    handleLinkRecruiter(selected.id, e.target.value as string)
                  }
                  sx={{ minWidth: 160 }}
                  aria-label="Linked recruiter"
                >
                  <MenuItem value="">
                    <em>No recruiter</em>
                  </MenuItem>
                  {recruiters.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))}
                </Select>
                <Select
                  size="small"
                  displayEmpty
                  value={selected.applicationId || ""}
                  onChange={(e) =>
                    handleLinkApplication(selected.id, e.target.value as string)
                  }
                  sx={{ minWidth: 200 }}
                  aria-label="Linked application"
                >
                  <MenuItem value="">
                    <em>No application</em>
                  </MenuItem>
                  {linkedApplicationMissing && selected.applicationId && (
                    <MenuItem value={selected.applicationId}>
                      Unknown application
                    </MenuItem>
                  )}
                  {sortedApplications.map((app) => (
                    <MenuItem key={app.id} value={app.id}>
                      {app.role.company} – {app.role.title}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary">
                  Quick replies
                </Typography>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ flexWrap: "wrap", rowGap: 1 }}
                >
                  <ToggleButtonGroup
                    size="small"
                    exclusive
                    value={quickReplyType}
                    onChange={handleQuickReplyTypeChange}
                    aria-label="Quick reply type"
                  >
                    <ToggleButton value="followUp">Follow up</ToggleButton>
                    <ToggleButton value="decline">Decline</ToggleButton>
                  </ToggleButtonGroup>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => void handleGenerateQuickReply(selected)}
                    disabled={quickReplyLoading}
                    aria-label="Generate quick reply"
                  >
                    {quickReplyLoading ? "Generating..." : "Generate"}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleDraftWithAI(selected.id)}
                    aria-label="Draft with AI"
                  >
                    Draft with AI
                  </Button>
                </Stack>
                {quickReplyError && (
                  <Alert severity="warning" variant="outlined">
                    {quickReplyError}
                  </Alert>
                )}
                {quickReplyLoading && !quickReplyContent && (
                  <Typography variant="body2" color="text.secondary">
                    Generating quick reply…
                  </Typography>
                )}
                {quickReplyContent && (
                  <Box
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                      bgcolor: "background.paper",
                    }}
                  >
                    <Tabs
                      value={quickReplyChannel}
                      onChange={handleQuickReplyChannelChange}
                      aria-label="Quick reply channel"
                    >
                      <Tab label="Email" value="email" />
                      <Tab label="LinkedIn" value="linkedin" />
                      <Tab label="Indeed" value="indeed" />
                    </Tabs>
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      sx={{ mt: 1 }}
                    >
                      <Tooltip title="Copy to clipboard" arrow>
                        <IconButton
                          aria-label="Copy quick reply"
                          size="small"
                          onClick={() => handleCopyQuickReply(currentQuickReplyText)}
                        >
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Button
                        size="small"
                        onClick={() =>
                          handleInsertQuickReply(selected.id, currentQuickReplyText)
                        }
                      >
                        Insert into draft
                      </Button>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{ whiteSpace: "pre-wrap", mt: 1 }}
                    >
                      {currentQuickReplyText}
                    </Typography>
                  </Box>
                )}
              </Stack>
              <TextField
                label="Your reply"
                multiline
                rows={4}
                fullWidth
                value={drafts[selected.id] || ""}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [selected.id]: e.target.value }))
                }
              />
              <Stack direction="row" spacing={1} alignItems="center">
                <Select
                  size="small"
                  value={templateSelections[selected.id] || defaultTemplate}
                  onChange={(e) =>
                    setTemplateSelections((t) => ({
                      ...t,
                      [selected.id]: e.target.value as AutoReplyTemplate,
                    }))
                  }
                  sx={{ maxWidth: 200 }}
                  aria-label="Template"
                >
                  {templateNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={openTemplateEditor}
                  aria-label="Edit templates"
                >
                  Edit
                </Button>
              </Stack>
              <Button
                variant="contained"
                onClick={() => handleSendReply(selected)}
                aria-label="Send reply"
              >
                Send
              </Button>
            </Stack>
          ) : (
            <Typography>Select a thread to view messages</Typography>
          )}
        </Box>
      </Stack>
      <Dialog open={aiThread !== null} onClose={() => setAiThread(null)} fullWidth maxWidth="sm">
        <DialogTitle>Draft with AI</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <PromptSelector
              value={promptKey}
              onChange={setPromptKey}
              contexts="messaging"
            />
            {promptKey && !selectedPromptTile && (
              <Typography color="text.secondary">
                The selected prompt is unavailable in this workspace.
              </Typography>
            )}
            {selectedPromptTile && (
              <Tile
                {...selectedPromptTile}
                onInsert={handleInsertAIDraft}
                initialValues={promptTileInitialValues}
              />
            )}
          </Stack>
        </DialogContent>
      </Dialog>
      <Dialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Templates</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {editorTemplates.map((t, idx) => (
              <Stack key={idx} spacing={1}>
                <TextField
                  label="Name"
                  value={t.name}
                  onChange={(e) =>
                    handleTemplateChange(idx, "name", e.target.value)
                  }
                />
                <TextField
                  label="Prompt"
                  value={t.prompt}
                  onChange={(e) =>
                    handleTemplateChange(idx, "prompt", e.target.value)
                  }
                  multiline
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDeleteTemplate(idx)}
                  aria-label="Delete template"
                >
                  Delete
                </Button>
              </Stack>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={handleAddTemplate}
              aria-label="Add template"
            >
              Add template
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveTemplates}
              aria-label="Save templates"
            >
              Save
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

