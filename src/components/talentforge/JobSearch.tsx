"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { searchIndeedJobs, IndeedSearchFilters } from "@/utils/talentforge/indeedApi";
import type { JobListing } from "@/types/talentforge/job";

type Filters = IndeedSearchFilters;

const loadFilters = (): Filters => {
  if (typeof window === "undefined") return { roles: [], locations: [] };
  try {
    const saved = window.localStorage.getItem("talentforge-settings");
    if (!saved) return { roles: [], locations: [] };
    const parsed = JSON.parse(saved);
    const roles = typeof parsed.roles === "string"
      ? parsed.roles.split(",").map((r: string) => r.trim()).filter(Boolean)
      : [];
    const locations = typeof parsed.locations === "string"
      ? parsed.locations.split(",").map((l: string) => l.trim()).filter(Boolean)
      : [];
    const salaryMin = parsed.salaryMin ? Number(parsed.salaryMin) : undefined;
    const salaryMax = parsed.salaryMax ? Number(parsed.salaryMax) : undefined;
    return { roles, locations, salaryMin, salaryMax };
  } catch {
    return { roles: [], locations: [] };
  }
};

export default function JobSearch() {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [filters, setFilters] = useState<Filters>({ roles: [], locations: [] });

  useEffect(() => {
    setFilters(loadFilters());
  }, []);

  const handleSearch = async () => {
    const results = await searchIndeedJobs(query, filters);
    setJobs(results);
  };

  const hasFilters =
    (filters.roles && filters.roles.length > 0) ||
    (filters.locations && filters.locations.length > 0) ||
    typeof filters.salaryMin === "number" ||
    typeof filters.salaryMax === "number";

  return (
    <Box sx={{ py: 6 }}>
      <Stack spacing={2}>
        <Typography variant="h4" component="h2" align="center">
          Job Search
        </Typography>
        <TextField
          label="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button
          variant="contained"
          disabled={!query.trim()}
          onClick={handleSearch}
          sx={{ alignSelf: "flex-start" }}
        >
          Search
        </Button>
        {hasFilters && (
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {filters.roles?.map((role) => (
              <Chip key={`role-${role}`} label={`Role: ${role}`} />
            ))}
            {filters.locations?.map((loc) => (
              <Chip key={`loc-${loc}`} label={`Location: ${loc}`} />
            ))}
            {typeof filters.salaryMin === "number" && (
              <Chip label={`Min: $${filters.salaryMin}`} />
            )}
            {typeof filters.salaryMax === "number" && (
              <Chip label={`Max: $${filters.salaryMax}`} />
            )}
          </Stack>
        )}
        <Stack spacing={1}>
          {jobs.map((job, idx) => (
            <Box
              key={idx}
              sx={{
                p: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                {job.title}
              </Typography>
              <Typography variant="body2">{job.company}</Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {job.location}
              </Typography>
              <Link href={job.url} target="_blank" rel="noopener">
                View Job
              </Link>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Box>
  );
}

