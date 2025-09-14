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
} from "@mui/material";
import { v4 as uuid } from "uuid";
import {
  DndContext,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { ApplicationStatus } from "@/types/talentforge/job";
import type { JobApplication } from "@/utils/talentforge/dataStore";
import {
  addJobApplication,
  getJobApplications,
  updateJobApplicationStatus,
} from "@/utils/talentforge/dataStore";
import { fetchAllListings } from "@/utils/talentforge/jobAggregator";
import EmptyState from "./EmptyState";
import { PROMPT_TILES } from "@/consts/promptTiles";
import { askOpenAI, hasValidOpenAIKey } from "@/utils/talentforge/utils";
import { getResumes } from "@/utils/talentforge/dataStore";
import OpenAIKeyModal from "./OpenAiKeyModal";

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
}: {
  app: JobApplication;
  onRunTile: (id: string, app: JobApplication) => void;
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
            onClick={() => onRunTile("resumeRewrite", app)}
          >
            Compare to Resume
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerMessages, setDrawerMessages] = useState<
    { role: "user" | "assistant"; text: string }[]
  >([]);
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
    const newApp: JobApplication = {
      id: uuid(),
      applicant: { id: "", name: "", email: "" },
      role: { id: uuid(), title, company, location, description },
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
  };

  const runTile = async (tileId: string, app: JobApplication) => {
    const tile = PROMPT_TILES[tileId];
    if (!tile) return;
    const valid = await hasValidOpenAIKey();
    if (!valid) {
      setOpenKeyModal(true);
      return;
    }
    setDrawerTitle(tile.display);
    setDrawerMessages([]);
    setDrawerOpen(true);
    let prompt = tile.fullPrompt;
    const values: Record<string, string> = {};
    if (tileId === "screenRole" || tileId === "resumeRewrite") {
      values.jobDescription = app.role.description || "";
    }
    for (const key of tile.inputs) {
      prompt = prompt.replaceAll(`{{${key}}}`, values[key] || "");
    }
    if (tileId === "resumeRewrite") {
      const resume = getResumes()[0];
      if (!resume) {
        setDrawerMessages([
          { role: "assistant", text: "No resume available" },
        ]);
        return;
      }
      prompt = `${prompt}\n\nJob Description:\n${values.jobDescription}\n\nResume:\n${resume.content}`;
    }
    setDrawerMessages([{ role: "user", text: prompt }]);
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
      setDrawerMessages((prev) => [...prev, { role: "assistant", text: message }]);
    } finally {
      setDrawerLoading(false);
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
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: { xs: "100%", sm: 360 },
            p: 2,
          },
        }}
      >
        <Typography variant="h6" gutterBottom>
          {drawerTitle}
        </Typography>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {drawerMessages.map((m, idx) => (
            <Box
              key={idx}
              sx={{
                alignSelf: m.role === "user" ? "flex-start" : "flex-end",
                bgcolor: m.role === "user" ? "grey.200" : "primary.main",
                color:
                  m.role === "user" ? "text.primary" : "primary.contrastText",
                p: 1.5,
                borderRadius: 1,
                maxWidth: "100%",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.text}
            </Box>
          ))}
          {drawerLoading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Stack>
      </Drawer>
      <OpenAIKeyModal open={openKeyModal} onClose={() => setOpenKeyModal(false)} />
    </>
  );
}

