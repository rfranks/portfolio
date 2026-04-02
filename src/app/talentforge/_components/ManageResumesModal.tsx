"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { ResumeEntry } from "@/types";
import { filterByTag, filterByText } from "@/utils/search";
import { getResumes } from "@/app/talentforge/_utils/dataStore";
import ResumeVariantList from "./ResumeVariants/List";

interface ManageResumesModalProps {
  open: boolean;
  onClose: () => void;
  onResumesUpdated?: (resumes: ResumeEntry[]) => void;
}

export default function ManageResumesModal({
  open,
  onClose,
  onResumesUpdated,
}: ManageResumesModalProps) {
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [searchText, setSearchText] = useState("");
  const [searchTag, setSearchTag] = useState("");
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    if (!open) {
      setSearchText("");
      setSearchTag("");
      setLoadingResumes(true);
      return;
    }

    const id = window.setTimeout(() => {
      const existing = getResumes();
      setResumes(existing);
      onResumesUpdated?.(existing);
      setLoadingResumes(false);
    }, 0);

    return () => window.clearTimeout(id);
  }, [open, onResumesUpdated]);

  const filteredResumes = useMemo(
    () => filterByTag(filterByText(resumes, searchText, ["content"]), searchTag),
    [resumes, searchText, searchTag],
  );

  const handleResumesChange = (updated: ResumeEntry[]) => {
    setResumes(updated);
    onResumesUpdated?.(updated);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Manage Resumes</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} aria-busy={loadingResumes}>
          <Typography variant="body1">
            Filter, organize, and compare the resumes saved in your library.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Filter by text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              fullWidth
            />
            <TextField
              label="Filter by tag"
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              fullWidth
            />
          </Stack>
          {loadingResumes ? (
            <Stack spacing={1}>
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} variant="rectangular" height={60} />
              ))}
            </Stack>
          ) : (
            <Box>
              <ResumeVariantList resumes={filteredResumes} setResumes={handleResumesChange} />
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
