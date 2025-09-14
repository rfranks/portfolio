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
import PromptTileGrid from "./promptTiles/PromptTileGrid";

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

function Card({ app }: { app: JobApplication }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: app.id });
  const style = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    opacity: isDragging ? 0.5 : 1,
    cursor: "grab",
  } as const;

  const [tile, setTile] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<
    Record<string, Record<string, string>>
  >({});

  const openTile = (id: string) => {
    const init: Record<string, Record<string, string>> = {};
    if (app.role.description) {
      init[id] = { jobDescription: app.role.description };
    }
    setInitialValues(init);
    setTile(id);
  };

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
          <Button size="small" onClick={() => openTile("screenRole")}>
            Analyze Risks
          </Button>
          <Button size="small" onClick={() => openTile("resumeRewrite")}>
            Compare to Resume
          </Button>
        </Stack>
      )}
      <Dialog open={!!tile} onClose={() => setTile(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {tile === "screenRole" ? "Analyze Risks" : "Compare to Resume"}
        </DialogTitle>
        <DialogContent>
          {tile && (
            <PromptTileGrid
              key={tile}
              tileIds={[tile]}
              initialValues={initialValues}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTile(null)}>Close</Button>
        </DialogActions>
      </Dialog>
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
                    <Card key={app.id} app={app} />
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
    </>
  );
}

