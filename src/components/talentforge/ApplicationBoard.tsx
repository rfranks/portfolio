"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Stack,
  Typography,
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
import type { JobApplication } from "@/utils/talentforge/applicationStore";
import {
  addJobApplication,
  getJobApplications,
  updateJobApplicationStatus,
} from "@/utils/talentforge/applicationStore";
import { fetchAllListings } from "@/utils/talentforge/jobAggregator";
import EmptyState from "./EmptyState";

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
      <Typography fontWeight="bold">{app.title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {app.company} – {app.location}
      </Typography>
    </Box>
  );
}

export default function ApplicationBoard() {
  const [applications, setApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    const existing = getJobApplications();
    if (existing.length === 0) {
      fetchAllListings().then((listings) => {
        let apps = existing;
        listings.forEach((listing) => {
          apps = addJobApplication({
            ...listing,
            id: uuid(),
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

  return (
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
  );
}

