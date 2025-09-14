"use client";

import { useEffect, useState } from "react";
import {
  Box,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import type {
  ApplicationStatus,
  JobApplication,
} from "@/types/talentforge";
import {
  getJobApplications,
  updateJobApplicationStatus,
} from "@/utils/talentforge/applicationStore";

const STATUS_OPTIONS: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
];

export default function JobApplications() {
  const [applications, setApplications] = useState<JobApplication[]>([]);

  useEffect(() => {
    setApplications(getJobApplications());
  }, []);

  const handleStatusChange = (
    id: string,
    event: SelectChangeEvent<ApplicationStatus>,
  ) => {
    const updated = updateJobApplicationStatus(
      id,
      event.target.value as ApplicationStatus,
    );
    setApplications(updated);
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Job Applications
      </Typography>
      <Stack spacing={2}>
        {applications.map((app) => (
          <Box
            key={app.id}
            sx={{ display: "flex", alignItems: "center", gap: 2 }}
          >
            <Box sx={{ flexGrow: 1 }}>
              <Typography fontWeight="bold">{app.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {app.company} – {app.location}
              </Typography>
            </Box>
            <Select
              size="small"
              value={app.status}
              onChange={(e) => handleStatusChange(app.id, e)}
              aria-label="application status"
            >
              {STATUS_OPTIONS.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

