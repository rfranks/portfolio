"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  Grid,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  ApplicationStatus,
  JobApplication,
} from "@/types/talentforge/job";
import {
  loadJobApplications,
  saveJobApplications,
} from "@/utils/talentforge/storage";

const STATUSES: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
];

const emptyApplication: JobApplication = {
  title: "",
  company: "",
  location: "",
  url: "",
  source: "",
  status: "applied",
};

export default function JobTracker() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [form, setForm] = useState<JobApplication>(emptyApplication);

  useEffect(() => {
    loadJobApplications().then((data) => {
      if (data) setApplications(data);
    });
  }, []);

  useEffect(() => {
    saveJobApplications(applications);
  }, [applications]);

  const handleChangeForm = (
    field: keyof JobApplication,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!form.title.trim()) return;
    setApplications((prev) => [...prev, form]);
    setForm(emptyApplication);
  };

  const handleStatusChange = (
    index: number,
    status: ApplicationStatus
  ) => {
    setApplications((prev) =>
      prev.map((app, i) => (i === index ? { ...app, status } : app))
    );
  };

  return (
    <Box sx={{ py: 6 }}>
      <Container maxWidth="lg">
        <Stack spacing={2}>
          <Typography variant="h4" component="h2" align="center">
            Job Tracker
          </Typography>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              label="Title"
              value={form.title}
              onChange={(e) => handleChangeForm("title", e.target.value)}
            />
            <TextField
              label="Company"
              value={form.company}
              onChange={(e) => handleChangeForm("company", e.target.value)}
            />
            <TextField
              label="Location"
              value={form.location}
              onChange={(e) => handleChangeForm("location", e.target.value)}
            />
            <TextField
              label="URL"
              value={form.url}
              onChange={(e) => handleChangeForm("url", e.target.value)}
            />
            <TextField
              label="Source"
              value={form.source}
              onChange={(e) => handleChangeForm("source", e.target.value)}
            />
            <Button variant="contained" onClick={handleAdd}>
              Add
            </Button>
          </Stack>
          <Grid container spacing={2}>
            {STATUSES.map((status) => (
              <Grid item xs={12} md={3} key={status}>
                <Typography
                  variant="h6"
                  sx={{ textTransform: "capitalize", mb: 1 }}
                >
                  {status}
                </Typography>
                <Stack spacing={1}>
                  {applications.map((app, idx) => (
                    app.status === status && (
                      <Box
                        key={idx}
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="subtitle2" fontWeight={600}>
                          {app.title}
                        </Typography>
                        <Typography variant="body2">{app.company}</Typography>
                        <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                          <InputLabel id={`status-label-${idx}`}>Status</InputLabel>
                          <Select
                            labelId={`status-label-${idx}`}
                            value={app.status}
                            label="Status"
                            onChange={(e) =>
                              handleStatusChange(
                                idx,
                                e.target.value as ApplicationStatus
                              )
                            }
                          >
                            {STATUSES.map((s) => (
                              <MenuItem
                                key={s}
                                value={s}
                                sx={{ textTransform: "capitalize" }}
                              >
                                {s}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                          <Link href={app.url} target="_blank" rel="noopener">
                            View
                          </Link>
                          <Link href="#document-generator">Docs</Link>
                        </Stack>
                      </Box>
                    )
                  ))}
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
}

