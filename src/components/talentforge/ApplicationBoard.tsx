"use client";

import { useEffect, useState } from "react";
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
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { v4 as uuid } from "uuid";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import Markdown from "react-markdown";
import type { ApplicationStatus } from "@/types/talentforge/job";
import type { JobApplication, ResumeEntry } from "@/utils/talentforge/dataStore";
import {
  addJobApplication,
  getJobApplications,
  updateJobApplicationStatus,
  updateJobApplication,
  getResumes,
} from "@/utils/talentforge/dataStore";
import { fetchAllListings } from "@/utils/talentforge/jobAggregator";
import EmptyState from "./EmptyState";
import { PROMPT_TILES } from "@/consts/promptTiles";
import { askOpenAI, hasValidOpenAIKey } from "@/utils/talentforge/utils";
import OpenAIKeyModal from "./OpenAiKeyModal";

interface Issue {
  severity: "red" | "yellow";
  message: string;
}

interface Analysis {
  summary?: string;
  issues: Issue[];
}

const STATUSES: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
];

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
      sx={{ p: 2, width: 260, minHeight: 400, bgcolor: "background.paper" }}
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
  resumes,
  onAssignResume,
}: {
  app: JobApplication;
  onRunTile: (id: string, app: JobApplication) => void;
  resumes: ResumeEntry[];
  onAssignResume: (appId: string, resumeId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: app.id });
  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  } as const;

  return (
    <Box
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      sx={{
        p: 1,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.default",
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
      {resumes.length > 0 && (
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
      {app.role.description && (
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRunTile("screenRole", app)}
          >
            Analyze Risks
          </Button>
          <Button
            size="small"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRunTile("resumeCompare", app)}
          >
            Compare to Resume
          </Button>
          <Button
            size="small"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onRunTile("coverLetter", app)}
          >
            Cover Letter
          </Button>
        </Stack>
      )}
    </Box>
  );
}

export default function ApplicationBoard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [resumeId, setResumeId] = useState("");
  const [source, setSource] = useState("Company Site");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerMessages, setDrawerMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
  const [drawerAnalysis, setDrawerAnalysis] = useState<Analysis | null>(null);
  const [drawerMode, setDrawerMode] = useState<"chat" | "resumeCompare">(
    "chat",
  );
  const [resumeCompareApp, setResumeCompareApp] =
    useState<JobApplication | null>(null);
  const [openKeyModal, setOpenKeyModal] = useState(false);

  useEffect(() => {
    const existing = getJobApplications();
    if (existing.length === 0) {
      fetchAllListings().then((listings) => {
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
      });
    } else {
      setApplications(existing);
    }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStatus = over.id as ApplicationStatus;
    const updated = updateJobApplicationStatus(active.id as string, newStatus);
    setApplications(updated);
  };

  const handleAdd = () => {
    const resume = getResumes().find((r) => r.id === resumeId);
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

  const runTile = async (tileId: string, app: JobApplication) => {
    const tile = PROMPT_TILES[tileId];
    if (!tile) return;
    const valid = await hasValidOpenAIKey();
    if (!valid) {
      setOpenKeyModal(true);
      return;
    }
    if (tileId === "resumeCompare") {
      const resumes = getResumes();
      if (resumes.length === 0) {
        setDrawerTitle(tile.display);
        setDrawerMessages([
          { role: "assistant", text: "No resume available" },
        ]);
        setDrawerAnalysis(null);
        setDrawerOpen(true);
        return;
      }
      setDrawerTitle(tile.display);
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
      return;
    }
    setDrawerTitle(tile.display);
    setDrawerMessages([]);
    setDrawerAnalysis(null);
    setDrawerOpen(true);
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
        ? getResumes().find((r) => r.id === app.resumeVariant?.id)
        : getResumes()[0];
      if (resume) {
        prompt = `${prompt}\n\nJob Description:\n${values.jobDescription}\n\nResume:\n${resume.content}`;
      } else if (values.jobDescription) {
        prompt = `${prompt}\n\nJob Description:\n${values.jobDescription}`;
      }
    }
    if (tileId !== "screenRole") {
      setDrawerMessages([{ role: "user", text: prompt }]);
    }
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

  const resumes = getResumes();

  const handleAssignResume = (appId: string, resId: string) => {
    const resume = resumes.find((r) => r.id === resId);
    if (!resume) return;
    const updated = updateJobApplication(appId, { resumeVariant: resume });
    setApplications(updated);
  };

  const handleResumeCompareSelect = async (resId: string) => {
    const resume = getResumes().find((r) => r.id === resId);
    if (!resume || !resumeCompareApp) return;
    setDrawerMessages((prev) => [
      ...prev,
      { role: "user", text: `Using resume: ${resume.title}` },
    ]);
    const prompt = PROMPT_TILES.resumeCompare.fullPrompt
      .replaceAll(
        "{{jobDescription}}",
        resumeCompareApp.role.description || "",
      )
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

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setDialogOpen(true)}
        sx={{ mb: 2 }}
      >
        Add Application
      </Button>
      <DndContext onDragEnd={handleDragEnd}>
        {applications.length === 0 ? (
          <EmptyState
            message="No applications yet"
            helperText="Start tracking your job applications here."
          />
        ) : (
          <Box sx={{ display: "flex", gap: 2 }}>
            {STATUSES.map((status) => (
              <Column
                key={status}
                id={status}
                title={status.charAt(0).toUpperCase() + status.slice(1)}
              >
                {applications
                  .filter((app) => app.status === status)
                  .map((app) => (
                    <Card
                      key={app.id}
                      app={app}
                      onRunTile={(id) => runTile(id, app)}
                      resumes={resumes}
                      onAssignResume={handleAssignResume}
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
              {['LinkedIn', 'Indeed', 'Company Site'].map((s) => (
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
      {drawerOpen && (
        <Drawer
          anchor="right"
          variant="permanent"
          sx={{
            "& .MuiDrawer-paper": {
              width: { xs: "100%", sm: 360 },
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
          <Typography variant="h6" gutterBottom>
            {drawerTitle}
          </Typography>
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
              {drawerMessages.map((m, idx) => (
                <Box
                  key={idx}
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
                  <Markdown>{m.text}</Markdown>
                </Box>
              ))}
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
        </Drawer>
      )}
      <OpenAIKeyModal open={openKeyModal} onClose={() => setOpenKeyModal(false)} />
    </>
  );
}

