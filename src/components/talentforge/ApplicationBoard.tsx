"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Drawer,
  CircularProgress,
  IconButton,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { Check, Close, Delete, Edit, ExpandMore } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { marked } from "marked";
import DOMPurify from "dompurify";
import type {
  ApplicationStatus,
  JobApplication,
  OfferHistoryEntry,
  ResumeEntry,
  Offer,
  OfferComp,
  Message,
} from "@/types";
import {
  addJobApplication,
  getJobApplications,
  updateJobApplicationStatus,
  updateJobApplication,
  getResumes,
  getCurrentCompensation,
} from "@/utils/talentforge/dataStore";
import { fetchAllListings } from "@/utils/talentforge/jobAggregator";
import EmptyState from "./EmptyState";
import { askOpenAI, pdfToMarkdown } from "@/utils/talentforge/utils";
import RequireAIKey from "./RequireAIKey";
import FileUploader from "./FileUploader";
import ResumeStepperModal from "./ResumeStepperModal";
import ManageResumesModal from "./ManageResumesModal";
import ChatWorkspace from "./ChatWorkspace";
import { STATUSES, getNextStatus } from "@/utils/talentforge/keyboard";
import { getPromptTile, type PromptContext } from "@/utils/talentforge/promptRegistry";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import ApplicationDetailDrawer from "./ApplicationDetailDrawer";
import CompareOffers from "./offers/CompareOffers";
import useOfferExports from "@/hooks/talentforge/useOfferExports";
import {
  filterApplications,
  hasActiveFilters,
  type ApplicationFilters,
} from "@/utils/talentforge/applicationFilters";

interface Issue {
  severity: "red" | "yellow";
  message: string;
}

interface Analysis {
  summary?: string;
  issues: Issue[];
}

function formatOfferHistoryTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatStatusLabel(status: ApplicationStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}


function Column({
  id,
  title,
  children,
}: {
  id: ApplicationStatus;
  title: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({ id });
  return (
    <Paper
      ref={setNodeRef}
      role="list"
      aria-label={title}
      sx={{
        p: 2,
        width: { xs: "100%", sm: 280, lg: 300 },
        minHeight: 400,
        bgcolor: "background.paper",
        flexShrink: 0,
      }}
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <Stack spacing={1}>{children}</Stack>
    </Paper>
  );
}

function Card({
  app,
  onRunTile,
  onOpenWorkspace,
  onOpenDetails,
  resumes,
  onAssignResume,
  onSetInterviewDate,
  onSetInterviewLocation,
  onKeyDown,
  activeId,
}: {
  app: JobApplication;
  onRunTile: (id: string, context: PromptContext) => void;
  onOpenWorkspace: (app: JobApplication) => void;
  onOpenDetails: (app: JobApplication) => void;
  resumes: ResumeEntry[];
  onAssignResume: (appId: string, resumeId: string) => void;
  onSetInterviewDate: (appId: string, value: string) => void;
  onSetInterviewLocation: (appId: string, value: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  activeId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: app.id });
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  } as const;

  const offerNegotiationTile = getPromptTile("offerNegotiation", {
    contexts: "offers",
  });
  const compareCurrentCompTile = getPromptTile("compareCurrentComp", {
    contexts: "offers",
  });

  const handlePointerDownCapture = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    pointerStart.current = { x: event.clientX, y: event.clientY };
  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const start = pointerStart.current;
    if (start) {
      const dx = event.clientX - start.x;
      const dy = event.clientY - start.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        pointerStart.current = null;
        return;
      }
    }
    const target = event.target as HTMLElement | null;
    if (
      target?.closest(
        "button, [role='button'], a, input, textarea, select, [contenteditable='true']",
      )
    ) {
      pointerStart.current = null;
      return;
    }
    pointerStart.current = null;
    onOpenDetails(app);
  };

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      role="listitem"
      aria-roledescription="draggable"
      aria-grabbed={activeId === app.id}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDownCapture={handlePointerDownCapture}
      onClick={handleClick}
      sx={{
        p: 1,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.default",
        '&:focus-visible': {
          outline: '2px solid',
          outlineColor: 'primary.main',
        },
        ...style,
      }}
    >
      <Typography fontWeight="bold">{app.role.title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {app.role.company} – {app.role.location}
      </Typography>
      {app.role.source && (
        <Typography variant="body2" color="text.secondary">
          Source: {app.role.source}
        </Typography>
      )}
      {resumes.length > 0 && app.status !== "offer" && (
        <TextField
          select
          size="small"
          label="Resume"
          value={app.resumeVariant?.id || ""}
          onChange={(e) => onAssignResume(app.id, e.target.value)}
          sx={{ mt: 1, mb: app.role.description ? 1 : 0 }}
          fullWidth
        >
          {resumes.map((r) => (
            <MenuItem key={r.id} value={r.id}>
              {r.title}
            </MenuItem>
          ))}
        </TextField>
      )}
      {STATUSES.indexOf(app.status) >= STATUSES.indexOf("interview") &&
        app.status !== "offer" && (
          <>
            <TextField
              type="datetime-local"
              size="small"
              label="Interview Time"
              value={app.interviewDateTime || ""}
              onChange={(e) => onSetInterviewDate(app.id, e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ mt: 1 }}
              fullWidth
            />
            <TextField
              size="small"
              label="Meeting URL/Location"
              value={app.interviewLocation || ""}
              onChange={(e) => onSetInterviewLocation(app.id, e.target.value)}
              sx={{ mt: 1, mb: app.role.description ? 1 : 0 }}
              fullWidth
            />
          </>
      )}
      <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
        <Button
          size="small"
          variant="outlined"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onOpenWorkspace(app)}
          fullWidth
        >
          Open Workspace
        </Button>
        {app.role.description && (
          <>
            <Button
              size="small"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => onRunTile("screenRole", "jobSearch")}
              variant="outlined"
              fullWidth
            >
              Analyze Risks
            </Button>
            {app.status !== "offer" && (
              <>
                <Button
                  size="small"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onRunTile("resumeCompare", "resume")}
                  variant="outlined"
                  fullWidth
                >
                  Compare to Resume
                </Button>
                <Button
                  size="small"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onRunTile("coverLetter", "resume")}
                  variant="outlined"
                  fullWidth
                >
                  Cover Letter
                </Button>
              </>
            )}
          </>
        )}
      </Stack>
      {app.status === "offer" && (
        <Box sx={{ mt: 1 }}>
          <Button
            size="small"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRunTile("offerDetails", "offers")}
            variant="outlined"
            fullWidth
          >
            {app.offer ? "Replace Offer Letter" : "Upload Offer Letter"}
          </Button>
          {app.offer && app.offer.compensation.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {app.offer.compensation.map((c) => (
                <Typography key={c.type} variant="body2">
                  {c.type.charAt(0).toUpperCase() + c.type.slice(1)}: {"$"}
                  {c.amount.toLocaleString()} {c.notes ? `(${c.notes})` : ""}
                </Typography>
              ))}
            </Stack>
          )}
          {app.offer?.summary && (
            <>
              <List dense sx={{ mt: 1, listStyleType: "disc", pl: 2 }}>
                {app.offer.summary.map((line, idx) => (
                  <ListItem key={idx} sx={{ display: "list-item", py: 0 }}>
                    <ListItemText
                      primary={line}
                      primaryTypographyProps={{ variant: "body2" }}
                    />
                  </ListItem>
                ))}
              </List>
              <Button
                size="small"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRunTile("offerNegotiation", "offers")}
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
              >
                {offerNegotiationTile?.display || "Renegotiation Offer"}
              </Button>
              <Button
                size="small"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onRunTile("compareCurrentComp", "offers")}
                variant="outlined"
                fullWidth
                sx={{ mt: 1 }}
              >
                {compareCurrentCompTile?.display || "Compare to Current Comp"}
              </Button>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}

export default function ApplicationBoard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<ApplicationFilters["status"]>(
    "all",
  );
  const [companyFilter, setCompanyFilter] = useState("");
  const [recruiterFilter, setRecruiterFilter] = useState("");
  const [resumeFilter, setResumeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [source, setSource] = useState("Company Site");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerTileId, setDrawerTileId] = useState("");
  const [drawerPrompt, setDrawerPrompt] = useState("");
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerMessages, setDrawerMessages] = useState<
    {
      role: "user" | "assistant";
      text?: string;
      data?: { compensation?: OfferComp[]; summary?: string[] };
    }[]
  >([]);
  const [drawerAnalysis, setDrawerAnalysis] = useState<Analysis | null>(null);
  const [drawerMode, setDrawerMode] = useState<
    "chat" | "resumeCompare" | "offerUpload"
  >("chat");
  const [drawerApp, setDrawerApp] = useState<JobApplication | null>(null);
  const [resumeCompareApp, setResumeCompareApp] =
    useState<JobApplication | null>(null);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [workspaceApp, setWorkspaceApp] = useState<JobApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [resumes, setResumes] = useState<ResumeEntry[]>(() => getResumes());
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [manageResumesOpen, setManageResumesOpen] = useState(false);
  const [compareOffersOpen, setCompareOffersOpen] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(null);
  const [editingHistoryLabel, setEditingHistoryLabel] = useState("");
  const negotiationRef = useRef<HTMLDivElement | null>(null);
  const {
    downloadMarkdown: downloadNegotiationMarkdown,
    downloadPdf: downloadNegotiationPdf,
    getContent: getNegotiationContent,
  } = useOfferExports({
    contentRef: negotiationRef,
    baseFileName: "renegotiation",
  });
  const data = useTalentForgeData();
  const selectedApplication = useMemo(() => {
    if (!selectedApplicationId) {
      return null;
    }
    return (
      applications.find((application) => application.id === selectedApplicationId) || null
    );
  }, [applications, selectedApplicationId]);

  useEffect(() => {
    const existing = getJobApplications();
    if (existing.length === 0) {
      fetchAllListings("").then((listings) => {
        let apps = existing;
        listings.forEach((listing) => {
          apps = addJobApplication({
            id: uuid(),
            applicant: { id: "", name: "", email: "" },
            role: { ...listing, id: uuid() },
            status: "applied",
            history: [
              { status: "applied", changedAt: new Date().toISOString() },
            ],
          });
        });
        setApplications(apps);
        setLoading(false);
      });
    } else {
      setApplications(existing);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setEditingHistoryId(null);
    setEditingHistoryLabel("");
  }, [drawerApp?.id]);

  useEffect(() => {
    if (!drawerOpen) {
      setEditingHistoryId(null);
      setEditingHistoryLabel("");
    }
  }, [drawerOpen]);

  useEffect(() => {
    if (detailDrawerOpen && !selectedApplication) {
      setDetailDrawerOpen(false);
      setSelectedApplicationId(null);
    }
  }, [detailDrawerOpen, selectedApplication]);

  const filters = useMemo<ApplicationFilters>(() => ({
    searchText: searchQuery,
    status: statusFilter,
    company: companyFilter,
    recruiterId: recruiterFilter,
    resumeId: resumeFilter,
  }), [searchQuery, statusFilter, companyFilter, recruiterFilter, resumeFilter]);

  const filteredApplications = useMemo(
    () => filterApplications(applications, filters),
    [applications, filters],
  );

  const filtersApplied = useMemo(() => hasActiveFilters(filters), [filters]);

  const companies = useMemo(() => {
    const uniqueCompanies = new Set<string>();
    applications.forEach((app) => {
      if (app.role.company) {
        uniqueCompanies.add(app.role.company);
      }
    });
    return Array.from(uniqueCompanies).sort((a, b) => a.localeCompare(b));
  }, [applications]);

  const recruiterOptions = useMemo(() => {
    const options = data.getRecruiters();
    return [...options].sort((a, b) => a.name.localeCompare(b.name));
  }, [applications, data]);

  const hasApplications = applications.length > 0;
  const hasMatches = filteredApplications.length > 0;

  const hasMultipleOffers = data.getOffers().length >= 2;

  useEffect(() => {
    if (!hasMultipleOffers && compareOffersOpen) {
      setCompareOffersOpen(false);
    }
  }, [hasMultipleOffers, compareOffersOpen]);

  if (loading) {
    return (
      <Stack
        spacing={2}
        alignItems="center"
        aria-busy="true"
        aria-label="Loading applications"
      >
        <CircularProgress />
      </Stack>
    );
  }

  const offerHistoryEntries = drawerApp?.offerHistory ?? [];

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as ApplicationStatus;
    const updated = updateJobApplicationStatus(active.id as string, newStatus);
    setApplications(updated);
    const movedApp = updated.find((a) => a.id === active.id);
    if (movedApp) {
      setLiveMessage(`${movedApp.role.title} moved to ${newStatus}`);
    }
  };

  const handleKeyboardMove = (appId: string, key: string) => {
    const app = applications.find((a) => a.id === appId);
    if (!app) return;
    const newStatus = getNextStatus(app.status, key);
    if (newStatus !== app.status) {
      const updated = updateJobApplicationStatus(appId, newStatus);
      setApplications(updated);
      const movedApp = updated.find((a) => a.id === appId);
      if (movedApp) {
        setLiveMessage(`${movedApp.role.title} moved to ${newStatus}`);
      }
    }
  };

  const handleCardKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    app: JobApplication,
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (activeId === app.id) {
        setActiveId(null);
        setLiveMessage(`${app.role.title} dropped in ${app.status}`);
      } else {
        setActiveId(app.id);
        setLiveMessage(`${app.role.title} picked up`);
      }
      return;
    }
    if (
      activeId === app.id &&
      ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(e.key)
    ) {
      e.preventDefault();
      handleKeyboardMove(app.id, e.key);
    }
  };

  const handleOpenDetails = (app: JobApplication) => {
    setSelectedApplicationId(app.id);
    setDetailDrawerOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailDrawerOpen(false);
    setSelectedApplicationId(null);
  };

  const handleDetailStatusUpdate = (
    appId: string,
    status: ApplicationStatus,
    options?: { reason?: string; changedAt?: string },
  ) => {
    const updated = updateJobApplicationStatus(appId, status, options);
    setApplications(updated);
    const updatedApp = updated.find((a) => a.id === appId);
    if (updatedApp) {
      setLiveMessage(`${updatedApp.role.title} updated to ${status}`);
    }
  };

  const handleOpenWorkspace = (app: JobApplication) => {
    setWorkspaceApp(app);
    setWorkspaceOpen(true);
    setDrawerOpen(false);
    setDrawerApp(null);
    setDrawerTitle("");
    setDrawerTileId("");
    setDrawerMessages([]);
    setDrawerAnalysis(null);
    setDrawerPrompt("");
    setDrawerMode("chat");
    setResumeCompareApp(null);
    setDrawerLoading(false);
    setRejectReason("");
  };

  const handleCloseWorkspace = () => {
    setWorkspaceOpen(false);
    setWorkspaceApp(null);
  };

  const handleWorkspaceInsertDraft = (text: string) => {
    if (!workspaceApp) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const connectorLabel = [workspaceApp.role.company, workspaceApp.role.title]
      .filter(Boolean)
      .join(" – ")
      .trim();
    const connector = connectorLabel || "Workspace Draft";
    const message: Message = {
      id: uuid(),
      threadId: uuid(),
      senderId: "workspace",
      sentAt: new Date().toISOString(),
      body: text,
      connector,
      status: "unread",
      replies: [],
    };
    data.addThread(message);
    setLiveMessage(`Draft added to inbox for ${connector}`);
  };

  const handleWorkspaceSaveResume = (text: string, resumeId?: string) => {
    if (!workspaceApp) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    const baseResume =
      (resumeId ? resumes.find((r) => r.id === resumeId) : undefined) ||
      (workspaceApp.resumeVariant
        ? resumes.find((r) => r.id === workspaceApp.resumeVariant?.id)
        : undefined) ||
      resumes[0];
    if (!baseResume) {
      setLiveMessage("Upload a resume before saving a variant.");
      return;
    }
    const newResumeId = uuid();
    const roleTitle = workspaceApp.role.title || "Workspace Variant";
    const companySuffix = workspaceApp.role.company
      ? ` at ${workspaceApp.role.company}`
      : "";
    const generatedTitle = `${baseResume.title} – ${roleTitle}`;
    const newResume: ResumeEntry = {
      ...baseResume,
      id: newResumeId,
      title: generatedTitle,
      label: `${baseResume.label || baseResume.title} – ${roleTitle}`,
      content: text,
      notes: `Generated for ${roleTitle}${companySuffix}`.trim(),
      importedAt: new Date().toISOString(),
    };
    const updatedResumes = data.addResume(newResume);
    setResumes(updatedResumes);
    const storedResume =
      updatedResumes.find((resume) => resume.id === newResumeId) || newResume;
    const updatedApps = updateJobApplication(workspaceApp.id, {
      resumeVariant: storedResume,
    });
    setApplications(updatedApps);
    const refreshed =
      updatedApps.find((application) => application.id === workspaceApp.id) ||
      ({ ...workspaceApp, resumeVariant: storedResume } as JobApplication);
    setWorkspaceApp(refreshed);
    if (drawerApp?.id === refreshed.id) {
      setDrawerApp(refreshed);
    }
    setLiveMessage(
      `Saved resume variant ${storedResume.title} for ${workspaceApp.role.title}`,
    );
  };

  const handleAdd = () => {
    const resume = resumes.find((r) => r.id === resumeId);
    const newApp: JobApplication = {
      id: uuid(),
      applicant: { id: "", name: "", email: "" },
      role: { id: uuid(), title, company, location, description, source },
      resumeVariant: resume,
      status: "applied",
      history: [{ status: "applied", changedAt: new Date().toISOString() }],
    };
    const updated = addJobApplication(newApp);
    setApplications(updated);
    setDialogOpen(false);
    setTitle("");
    setCompany("");
    setLocation("");
    setDescription("");
    setResumeId("");
    setSource("Company Site");
  };

  const runTile = async (
    tileId: string,
    context: PromptContext,
    app: JobApplication,
  ) => {
    const tile = getPromptTile(tileId, { contexts: context });
    if (!tile) return;
    setWorkspaceOpen(false);
    setWorkspaceApp(null);
    if (tileId === "resumeCompare") {
      if (resumes.length === 0) {
        setDrawerTitle(tile.display);
        setDrawerTileId(tile.id);
        setDrawerMessages([{ role: "assistant", text: "No resumes available" }]);
        setDrawerAnalysis(null);
        setDrawerOpen(true);
        setDrawerApp(app);
        return;
      }
      setDrawerTitle(tile.display);
      setDrawerTileId(tile.id);
      setDrawerMessages([
        {
          role: "assistant",
          text: "Select a resume to compare with the job description.",
        },
      ]);
      setDrawerAnalysis(null);
      setDrawerOpen(true);
      setDrawerMode("resumeCompare");
      setResumeCompareApp(app);
      setDrawerApp(app);
      return;
    }
    if (tileId === "offerDetails") {
      setDrawerTitle(tile.display);
      setDrawerTileId(tile.id);
      setDrawerMessages([]);
      setDrawerAnalysis(null);
      setDrawerOpen(true);
      setDrawerMode("offerUpload");
      setDrawerApp(app);
      return;
    }
    if (tileId === "offerNegotiation") {
      setDrawerTitle(tile.display);
      setDrawerTileId(tile.id);
      setDrawerMessages([
        { role: "assistant", text: "Gathering market data..." },
      ]);
      setDrawerAnalysis(null);
      setDrawerOpen(true);
      setDrawerApp(app);
      const resume: ResumeEntry | undefined = app.resumeVariant
        ? resumes.find((r) => r.id === app.resumeVariant?.id)
        : resumes[0];
      const offerLines: string[] = [];
      app.offer?.compensation.forEach((c) =>
        offerLines.push(
          `${c.type}: $${c.amount.toLocaleString()}${
            c.notes ? ` (${c.notes})` : ""
          }`
        )
      );
      app.offer?.summary?.forEach((s) => offerLines.push(s));
      const offerSummary = offerLines.join("\n");
      const listings = await fetchAllListings(app.role.title);
      const marketData = listings
        .map((l) => `${l.title} at ${l.company} – ${l.location}`)
        .join("\n");
      const prompt = tile.fullPrompt
        .replaceAll("{{jobDescription}}", app.role.description || "")
        .replaceAll("{{resumeContent}}", resume?.content || "")
        .replaceAll("{{offerSummary}}", offerSummary)
        .replaceAll("{{marketData}}", marketData);
      setDrawerPrompt(prompt);
      setDrawerMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Generating negotiation..." },
      ]);
      setDrawerLoading(true);
      try {
        const res = await askOpenAI({
          context: "",
          user: prompt,
          system: "You are a helpful assistant.",
          returnFirstResponse: true,
          chatHistory: [],
        });
        const message = res?.message || "";
        setDrawerMessages((prev) => [
          ...prev,
          { role: "assistant", text: message },
        ]);
      } finally {
        setDrawerLoading(false);
      }
      return;
    }
    if (tileId === "compareCurrentComp") {
      setDrawerTitle(tile.display);
      setDrawerTileId(tile.id);
      setDrawerMessages([{ role: "assistant", text: "Analyzing offer..." }]);
      setDrawerAnalysis(null);
      setDrawerOpen(true);
      setDrawerMode("chat");
      setDrawerApp(app);
      const offerLines: string[] = [];
      app.offer?.compensation.forEach((c) =>
        offerLines.push(
          `${c.type}: $${c.amount.toLocaleString()}${
            c.notes ? ` (${c.notes})` : ""
          }`
        )
      );
      app.offer?.summary?.forEach((s) => offerLines.push(s));
      const offerText = offerLines.join("\n");
      const current = getCurrentCompensation();
      const currentLines: string[] = [];
      if (current.salary) currentLines.push(`Salary: ${current.salary}`);
      if (current.benefits) currentLines.push(`Benefits: ${current.benefits}`);
      if (current.stock) currentLines.push(`Stock: ${current.stock}`);
      const currentComp = currentLines.join("\n");
      const prompt = tile.fullPrompt
        .replaceAll("{{offer}}", offerText)
        .replaceAll("{{currentComp}}", currentComp);
      setDrawerPrompt(prompt);
      setDrawerLoading(true);
      try {
        const res = await askOpenAI({
          context: "",
          user: prompt,
          system: "You are a helpful assistant.",
          returnFirstResponse: true,
          chatHistory: [],
        });
        const message = res?.message || "";
        // Wrap response with newlines so Markdown tables render properly
        setDrawerMessages([{ role: "assistant", text: `\n${message}\n` }]);
      } finally {
        setDrawerLoading(false);
      }
      return;
    }
    setDrawerTitle(tile.display);
    setDrawerTileId(tile.id);
    setDrawerMessages([]);
    setDrawerAnalysis(null);
    setDrawerOpen(true);
    setDrawerApp(app);
    setDrawerPrompt("");
    let prompt = tile.fullPrompt;
    const values: Record<string, string> = {};
    if (tileId === "screenRole" || tileId === "coverLetter") {
      values.jobDescription = app.role.description || "";
    }
    if (tileId === "coverLetter") {
      values.position = app.role.title;
      values.company = app.role.company;
    }
    for (const key of tile.inputs) {
      prompt = prompt.replaceAll(`{{${key}}}`, values[key] || "");
    }
    if (tileId === "coverLetter") {
      const resume: ResumeEntry | undefined = app.resumeVariant
        ? resumes.find((r) => r.id === app.resumeVariant?.id)
        : resumes[0];
      if (resume) {
        prompt = `${prompt}\n\nJob Description:\n${values.jobDescription}\n\nResume:\n${resume.content}`;
      } else if (values.jobDescription) {
        prompt = `${prompt}\n\nJob Description:\n${values.jobDescription}`;
      }
    }
    if (tileId !== "screenRole") {
      setDrawerMessages([{ role: "user", text: prompt }]);
    }
    setDrawerPrompt(prompt);
    setDrawerLoading(true);
    try {
      const res = await askOpenAI({
        context: "",
        user: prompt,
        system: "You are a helpful assistant.",
        returnFirstResponse: true,
        chatHistory: [],
      });
      const message = res?.message || "";
      if (tileId === "screenRole") {
        try {
          const parsed = JSON.parse(message);
          setDrawerAnalysis({
            summary: parsed.summary,
            issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          });
        } catch {
          setDrawerMessages([{ role: "assistant", text: message }]);
        }
      } else {
        setDrawerMessages((prev) => [
          ...prev,
          { role: "assistant", text: message },
        ]);
      }
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleAssignResume = (appId: string, resId: string) => {
    const resume = resumes.find((r) => r.id === resId);
    if (!resume) return;
    const updated = updateJobApplication(appId, { resumeVariant: resume });
    setApplications(updated);
  };

  const handleInterviewDate = (appId: string, value: string) => {
    const updated = updateJobApplication(appId, { interviewDateTime: value });
    setApplications(updated);
  };

  const handleInterviewLocation = (appId: string, value: string) => {
    const updated = updateJobApplication(appId, { interviewLocation: value });
    setApplications(updated);
  };

  const handleOfferUpload = async (file: File) => {
    if (!drawerApp) return;
    setDrawerMessages([
      { role: "assistant", text: "Extracting text from offer..." },
    ]);
    setDrawerLoading(true);
    try {
      const text =
        file.type === "application/pdf"
          ? await pdfToMarkdown(file)
          : await file.text();
      setDrawerMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Parsing offer details..." },
      ]);
      const offerTile = getPromptTile("offerDetails", { contexts: "offers" });
      if (!offerTile) {
        setDrawerMessages([
          { role: "assistant", text: "Offer analysis prompt unavailable." },
        ]);
        return;
      }
      const prompt = offerTile.fullPrompt.replace("{{offerText}}", text);
      const res = await askOpenAI({
        context: "",
        user: prompt,
        system: "You are a helpful assistant.",
        returnFirstResponse: true,
        chatHistory: [],
      });
      const message = res?.message || "";
      let parsed: { compensation?: OfferComp[]; summary?: string[] | string } =
        {};
      try {
        parsed = JSON.parse(message);
      } catch {
        parsed.summary = message;
      }
      const summaryLines = Array.isArray(parsed.summary)
        ? parsed.summary
        : (parsed.summary || "")
            .split(/\r?\n/)
            .map((line) => line.replace(/^\-\s*/, "").trim())
            .filter(Boolean);
      const offer: Offer = {
        id: uuid(),
        application: drawerApp,
        compensation: parsed.compensation || [],
        summary: summaryLines,
      };
      const updated = updateJobApplication(drawerApp.id, { offer });
      setApplications(updated);
      setDrawerMessages([
        {
          role: "assistant",
          data: { compensation: offer.compensation, summary: offer.summary },
        },
      ]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleResumeCompareSelect = async (resId: string) => {
    const resume = resumes.find((r) => r.id === resId);
    if (!resume || !resumeCompareApp) return;
    setDrawerMessages((prev) => [
      ...prev,
      { role: "user", text: `Using resume: ${resume.title}` },
    ]);
    const resumeTile = getPromptTile("resumeCompare", {
      contexts: ["resume", "jobSearch"],
    });
    if (!resumeTile) {
      setDrawerMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Resume comparison prompt unavailable." },
      ]);
      setDrawerLoading(false);
      setDrawerMode("chat");
      setResumeCompareApp(null);
      return;
    }
    const prompt = resumeTile.fullPrompt
      .replaceAll("{{jobDescription}}", resumeCompareApp.role.description || "")
      .replaceAll("{{resumeContent}}", resume.content);
    setDrawerLoading(true);
    try {
      const res = await askOpenAI({
        context: "",
        user: prompt,
        system: "You are a helpful assistant.",
        returnFirstResponse: true,
        chatHistory: [],
      });
      const message = res?.message || "";
      setDrawerMessages((prev) => [
        ...prev,
        { role: "assistant", text: message },
      ]);
    } finally {
      setDrawerLoading(false);
      setDrawerMode("chat");
      setResumeCompareApp(null);
    }
  };

  const handleReject = (source: "drawer" | "workspace") => {
    const app = source === "drawer" ? drawerApp : workspaceApp;
    if (!app) return;
    const trimmedReason = rejectReason.trim();
    const updated = updateJobApplicationStatus(
      app.id,
      "rejected",
      trimmedReason ? { reason: trimmedReason } : undefined,
    );
    setApplications(updated);
    setRejectReason("");
    if (source === "drawer") {
      setDrawerOpen(false);
      setDrawerApp(null);
      setDrawerTileId("");
      setDrawerPrompt("");
    } else {
      setWorkspaceOpen(false);
      setWorkspaceApp(null);
    }
  };

  const updateDrawerOfferHistory = (history: OfferHistoryEntry[]) => {
    if (!drawerApp) return null;
    const updated = updateJobApplication(drawerApp.id, { offerHistory: history });
    setApplications(updated);
    const refreshed = updated.find((a) => a.id === drawerApp.id) || null;
    setDrawerApp(refreshed);
    return refreshed;
  };

  const handleDownloadNegotiationMd = () => {
    downloadNegotiationMarkdown();
  };

  const handleDownloadNegotiationPdf = () => {
    downloadNegotiationPdf();
  };

  const handleAttachOfferHistory = () => {
    if (!drawerApp) return;
    const content = getNegotiationContent();
    const existingHistory = drawerApp.offerHistory || [];
    const nextIndex = existingHistory.length + 1;
    const trimmedTitle = drawerTitle.trim();
    const baseLabel = trimmedTitle || "Offer negotiation";
    const label = nextIndex > 1 ? `${baseLabel} (${nextIndex})` : baseLabel;
    const entry: OfferHistoryEntry = {
      id: uuid(),
      createdAt: new Date().toISOString(),
      sourceLabel: label,
      content,
    };
    updateDrawerOfferHistory([...existingHistory, entry]);
    setLiveMessage(`${label} saved to offer history`);
  };

  const handleBeginRenameHistoryEntry = (entry: OfferHistoryEntry) => {
    setEditingHistoryId(entry.id);
    setEditingHistoryLabel(entry.sourceLabel);
  };

  const handleCancelRenameHistoryEntry = () => {
    setEditingHistoryId(null);
    setEditingHistoryLabel("");
  };

  const handleSaveHistoryEntryLabel = (entryId: string) => {
    if (!drawerApp) return;
    const trimmed = editingHistoryLabel.trim();
    if (!trimmed) return;
    const history = drawerApp.offerHistory || [];
    const updatedHistory = history.map((entry) =>
      entry.id === entryId ? { ...entry, sourceLabel: trimmed } : entry,
    );
    updateDrawerOfferHistory(updatedHistory);
    setEditingHistoryId(null);
    setEditingHistoryLabel("");
    setLiveMessage(`Offer history renamed to ${trimmed}`);
  };

  const handleDeleteHistoryEntry = (entryId: string) => {
    if (!drawerApp) return;
    const history = drawerApp.offerHistory || [];
    const updatedHistory = history.filter((entry) => entry.id !== entryId);
    updateDrawerOfferHistory(updatedHistory);
    if (editingHistoryId === entryId) {
      setEditingHistoryId(null);
      setEditingHistoryLabel("");
    }
    setLiveMessage("Offer history entry removed");
  };

  const handleResumesUpdated = (updated: ResumeEntry[]) => {
    setResumes(updated);
    if (resumeId && !updated.some((r) => r.id === resumeId)) {
      setResumeId("");
    }
    if (resumeFilter && !updated.some((r) => r.id === resumeFilter)) {
      setResumeFilter("");
    }
  };

  const handleResumeModalClose = () => {
    setResumeModalOpen(false);
    handleResumesUpdated(getResumes());
  };

  const handleManageModalClose = () => {
    setManageResumesOpen(false);
    handleResumesUpdated(getResumes());
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCompanyFilter("");
    setRecruiterFilter("");
    setResumeFilter("");
  };

  return (
    <RequireAIKey>
      <>
      <Box
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
        aria-live="polite"
      >
        {liveMessage}
      </Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Add Application
        </Button>
        <Button variant="outlined" onClick={() => setResumeModalOpen(true)}>
          Upload Resume
        </Button>
        <Button
          variant="outlined"
          onClick={() => setManageResumesOpen(true)}
        >
          Manage Resumes
        </Button>
        {hasMultipleOffers && (
          <Button
            variant="outlined"
            onClick={() => setCompareOffersOpen(true)}
          >
            Compare Offers
          </Button>
        )}
      </Stack>
      <Paper
        component="section"
        aria-label="Filter applications"
        sx={{ p: 2, mb: 2 }}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          useFlexGap
          sx={{ flexWrap: "wrap" }}
        >
          <TextField
            label="Search applications"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            size="small"
            sx={{
              flexGrow: 1,
              minWidth: { xs: "100%", md: 240 },
              width: { xs: "100%", md: "auto" },
            }}
          />
          <TextField
            label="Status"
            select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ApplicationFilters["status"])
            }
            size="small"
            sx={{
              minWidth: { xs: "100%", md: 180 },
              width: { xs: "100%", md: "auto" },
            }}
          >
            <MenuItem value="all">All statuses</MenuItem>
            {STATUSES.map((status) => (
              <MenuItem key={status} value={status}>
                {formatStatusLabel(status)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Company"
            select
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            size="small"
            sx={{
              minWidth: { xs: "100%", md: 180 },
              width: { xs: "100%", md: "auto" },
            }}
          >
            <MenuItem value="">All companies</MenuItem>
            {companies.map((company) => (
              <MenuItem key={company} value={company}>
                {company}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Recruiter"
            select
            value={recruiterFilter}
            onChange={(event) => setRecruiterFilter(event.target.value)}
            size="small"
            sx={{
              minWidth: { xs: "100%", md: 200 },
              width: { xs: "100%", md: "auto" },
            }}
          >
            <MenuItem value="">All recruiters</MenuItem>
            {recruiterOptions.map((recruiter) => (
              <MenuItem key={recruiter.id} value={recruiter.id}>
                {recruiter.name}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Resume"
            select
            value={resumeFilter}
            onChange={(event) => setResumeFilter(event.target.value)}
            size="small"
            sx={{
              minWidth: { xs: "100%", md: 200 },
              width: { xs: "100%", md: "auto" },
            }}
            disabled={resumes.length === 0}
          >
            <MenuItem value="">All resumes</MenuItem>
            {resumes.map((resume) => (
              <MenuItem key={resume.id} value={resume.id}>
                {resume.title}
              </MenuItem>
            ))}
          </TextField>
          <Button
            variant="outlined"
            onClick={handleClearFilters}
            disabled={!filtersApplied}
            sx={{
              alignSelf: { xs: "stretch", md: "center" },
              width: { xs: "100%", md: "auto" },
            }}
          >
            Clear filters
          </Button>
        </Stack>
      </Paper>
      <ResumeStepperModal
        open={resumeModalOpen}
        onClose={handleResumeModalClose}
        onResumesUpdated={handleResumesUpdated}
      />
      <ManageResumesModal
        open={manageResumesOpen}
        onClose={handleManageModalClose}
        onResumesUpdated={handleResumesUpdated}
      />
      <Dialog
        open={compareOffersOpen}
        onClose={() => setCompareOffersOpen(false)}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Compare Offers</DialogTitle>
        <DialogContent dividers>
          <CompareOffers />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareOffersOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <DndContext onDragEnd={handleDragEnd}>
        {!hasApplications ? (
          <EmptyState
            message="No applications yet"
            helperText="Start tracking your job applications here."
          />
        ) : !hasMatches ? (
          <EmptyState
            message="No applications match your filters"
            helperText="Try adjusting the search or filter selections."
          />
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "stretch", md: "flex-start" },
              gap: 2,
              overflowX: { xs: "visible", md: "auto" },
              pb: 2,
            }}
          >
            {STATUSES.map((status) => (
              <Column
                key={status}
                id={status}
                title={formatStatusLabel(status)}
              >
                {filteredApplications
                  .filter((app) => app.status === status)
                  .map((app) => (
                    <Card
                      key={app.id}
                      app={app}
                      onRunTile={(id, context) => runTile(id, context, app)}
                      onOpenWorkspace={handleOpenWorkspace}
                      onOpenDetails={handleOpenDetails}
                      resumes={resumes}
                      onAssignResume={handleAssignResume}
                      onSetInterviewDate={handleInterviewDate}
                      onSetInterviewLocation={handleInterviewLocation}
                      onKeyDown={(e) => handleCardKeyDown(e, app)}
                      activeId={activeId}
                    />
                  ))}
              </Column>
            ))}
          </Box>
        )}
      </DndContext>
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
        <DialogTitle>New Application</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Job Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
            <TextField
              label="Company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              fullWidth
            />
            <TextField
              label="Location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
            />
            <TextField
              label="Source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              select
              fullWidth
            >
              {["LinkedIn", "Indeed", "Company Site"].map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
            </TextField>
            {resumes.length > 0 && (
              <TextField
                label="Resume"
                select
                value={resumeId}
                onChange={(e) => setResumeId(e.target.value)}
                fullWidth
              >
                {resumes.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.title}
                  </MenuItem>
                ))}
              </TextField>
            )}
            <TextField
              label="Job Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              minRows={4}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!title || !company}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <ApplicationDetailDrawer
        open={detailDrawerOpen && Boolean(selectedApplication)}
        application={selectedApplication}
        onClose={handleCloseDetails}
        promptDrawerOpen={drawerOpen}
        onUpdateStatus={handleDetailStatusUpdate}
      />
      {drawerOpen && (
        <Drawer
          anchor="right"
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              width: { xs: "100%", md: 420, lg: 520 },
              maxWidth: "100vw",
              p: 2,
            },
          }}
        >
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ alignSelf: "flex-end" }}
            size="small"
          >
            <Close />
          </IconButton>
          {drawerTileId === "screenRole" || drawerTileId === "offerNegotiation" ? (
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6">{drawerTitle}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                  {drawerPrompt}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ) : (
            <Typography variant="h6" gutterBottom>
              {drawerTitle}
            </Typography>
          )}
          {drawerAnalysis ? (
            <Box sx={{ mt: 2 }}>
              {drawerAnalysis.issues.map((issue, idx) => (
                <Stack
                  key={idx}
                  direction="row"
                  spacing={1}
                  alignItems="flex-start"
                  sx={{ mb: 1 }}
                >
                  <Typography>
                    {issue.severity === "red" ? "🚩" : "⚠️"}
                  </Typography>
                  <Typography variant="body2">{issue.message}</Typography>
                </Stack>
              ))}
              {drawerAnalysis.summary && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  {drawerAnalysis.summary}
                </Typography>
              )}
            </Box>
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              {drawerMode === "offerUpload" && (
                <FileUploader
                  accept=".pdf,.txt,.md"
                  label="Upload Offer"
                  variant="upload"
                  outputType="files"
                  onChange={(files) => {
                    const f = (files as File[])[0];
                    if (f) handleOfferUpload(f);
                  }}
                />
              )}
              {drawerMessages.map((m, idx) => (
                <Box
                  key={idx}
                  ref={
                    drawerTileId === "offerNegotiation" &&
                    m.role === "assistant" &&
                    m.text
                      ? negotiationRef
                      : undefined
                  }
                  sx={{
                    alignSelf: m.role === "user" ? "flex-start" : "flex-end",
                    bgcolor: m.role === "user" ? "grey.200" : "primary.main",
                    color:
                      m.role === "user"
                        ? "text.primary"
                        : "primary.contrastText",
                    p: 1.5,
                    borderRadius: 1,
                    maxWidth: "100%",
                  }}
                >
                  {m.text ? (
                    <Box
                      dangerouslySetInnerHTML={{
                        __html: DOMPurify.sanitize(
                          marked.parse(m.text) as string
                        ),
                      }}
                    />
                  ) : m.data ? (
                    <>
                      {m.data.compensation &&
                        m.data.compensation.length > 0 && (
                          <Stack spacing={0.5}>
                            {m.data.compensation.map((c) => (
                              <Typography key={c.type} variant="body2">
                                {c.type.charAt(0).toUpperCase() +
                                  c.type.slice(1)}
                                : {"$"}
                                {c.amount.toLocaleString()}{" "}
                                {c.notes ? `(${c.notes})` : ""}
                              </Typography>
                            ))}
                          </Stack>
                        )}
                      {m.data.summary && (
                        <List
                          dense
                          sx={{ mt: 1, listStyleType: "disc", pl: 2 }}
                        >
                          {m.data.summary.map((line, i) => (
                            <ListItem key={i} sx={{ display: "list-item", py: 0 }}>
                              <ListItemText
                                primary={line}
                                primaryTypographyProps={{ variant: "body2" }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </>
                  ) : null}
                </Box>
              ))}
              {drawerTileId === "offerNegotiation" && !drawerLoading && (
                <>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleDownloadNegotiationPdf}
                  >
                    Download PDF
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleDownloadNegotiationMd}
                  >
                    Download MD
                  </Button>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={handleAttachOfferHistory}
                    disabled={!drawerApp}
                  >
                    Attach to Offer History
                  </Button>
                </>
              )}
              {drawerTileId === "offerNegotiation" &&
                offerHistoryEntries.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Offer History
                    </Typography>
                    <List dense disablePadding sx={{ mt: 1 }}>
                      {offerHistoryEntries.map((entry) => {
                        const isEditing = editingHistoryId === entry.id;
                        const timestamp = formatOfferHistoryTimestamp(
                          entry.createdAt,
                        );
                        const disableSave = editingHistoryLabel.trim().length === 0;
                        return (
                          <ListItem
                            key={entry.id}
                            disableGutters
                            alignItems="flex-start"
                            sx={{
                              flexDirection: "column",
                              alignItems: "stretch",
                              border: "1px solid",
                              borderColor: "divider",
                              borderRadius: 1,
                              p: 1.5,
                              mb: 1,
                              bgcolor: "background.default",
                            }}
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{
                                width: "100%",
                                flexWrap: "wrap",
                                rowGap: 1,
                              }}
                            >
                              {isEditing ? (
                                <TextField
                                  size="small"
                                  label="Source label"
                                  value={editingHistoryLabel}
                                  onChange={(event) =>
                                    setEditingHistoryLabel(event.target.value)
                                  }
                                  sx={{ flexGrow: 1 }}
                                />
                              ) : (
                                <Typography
                                  variant="subtitle2"
                                  sx={{ flexGrow: 1, minWidth: 160 }}
                                >
                                  {entry.sourceLabel}
                                </Typography>
                              )}
                              {!isEditing && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ whiteSpace: "nowrap" }}
                                >
                                  {timestamp}
                                </Typography>
                              )}
                              <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                                {isEditing ? (
                                  <>
                                    <IconButton
                                      size="small"
                                      aria-label="Save label"
                                      onClick={() => handleSaveHistoryEntryLabel(entry.id)}
                                      disabled={disableSave}
                                    >
                                      <Check fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      aria-label="Cancel rename"
                                      onClick={handleCancelRenameHistoryEntry}
                                    >
                                      <Close fontSize="small" />
                                    </IconButton>
                                  </>
                                ) : (
                                  <>
                                    <IconButton
                                      size="small"
                                      aria-label="Rename history entry"
                                      onClick={() => handleBeginRenameHistoryEntry(entry)}
                                    >
                                      <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                      size="small"
                                      aria-label="Delete history entry"
                                      onClick={() => handleDeleteHistoryEntry(entry.id)}
                                    >
                                      <Delete fontSize="small" />
                                    </IconButton>
                                  </>
                                )}
                              </Stack>
                            </Stack>
                            {isEditing && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 1 }}
                              >
                                {timestamp}
                              </Typography>
                            )}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ mt: 1, whiteSpace: "pre-wrap" }}
                            >
                              {entry.content}
                            </Typography>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Box>
                )}
              {drawerMode === "resumeCompare" && !drawerLoading && (
                <TextField
                  select
                  label="Resume"
                  value=""
                  onChange={(e) => handleResumeCompareSelect(e.target.value)}
                >
                  {resumes.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.title}
                    </MenuItem>
                  ))}
                </TextField>
              )}
              {drawerLoading && (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}
            </Stack>
          )}
          <Box sx={{ mt: 3 }}>
            <TextField
              label="Rejection Reason (optional)"
              size="small"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 1 }}
            />
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleReject("drawer")}
              disabled={!drawerApp || drawerApp.status === "rejected"}
            >
              Reject Application
            </Button>
          </Box>
        </Drawer>
      )}
      {workspaceOpen && (
        <Drawer
          anchor="right"
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              width: { xs: "100%", md: 420, lg: 520 },
              maxWidth: "100vw",
              p: 2,
            },
          }}
        >
          <IconButton
            onClick={handleCloseWorkspace}
            sx={{ alignSelf: "flex-end" }}
            size="small"
          >
            <Close />
          </IconButton>
          <Typography variant="h6" gutterBottom>
            {workspaceApp ? `${workspaceApp.role.title} Workspace` : "Workspace"}
          </Typography>
          {workspaceApp ? (
            <Box sx={{ mt: 2 }}>
              <ChatWorkspace
                key={workspaceApp.id}
                onInsertIntoInbox={handleWorkspaceInsertDraft}
                onSaveResumeVariant={handleWorkspaceSaveResume}
                initialJobDescription={workspaceApp.role.description}
                initialResumeId={workspaceApp.resumeVariant?.id}
                resumes={resumes}
              />
            </Box>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              Select an application to open the workspace.
            </Typography>
          )}
          <Box sx={{ mt: 3 }}>
            <TextField
              label="Rejection Reason (optional)"
              size="small"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              fullWidth
              multiline
              minRows={2}
              sx={{ mb: 1 }}
            />
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleReject("workspace")}
              disabled={!workspaceApp || workspaceApp.status === "rejected"}
            >
              Reject Application
            </Button>
          </Box>
        </Drawer>
      )}
    </>
    </RequireAIKey>
  );
}
