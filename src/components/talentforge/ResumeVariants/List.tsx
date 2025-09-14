"use client";

import { useState } from "react";
import {
  Box,
  Stack,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import DifferenceIcon from "@mui/icons-material/Difference";
import {
  type ResumeEntry,
  deleteResume,
  updateResume,
  cloneResume,
} from "@/utils/talentforge/dataStore";
import { exportElementToPdf } from "@/utils/pdfExport";
import Detail from "./Detail";
import EmptyState from "../EmptyState";
import Diff from "./Diff";

interface Props {
  resumes: ResumeEntry[];
  setResumes: (resumes: ResumeEntry[]) => void;
}

export default function List({ resumes, setResumes }: Props) {
  const [selected, setSelected] = useState<ResumeEntry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ResumeEntry | null>(null);
  const [diffTarget, setDiffTarget] = useState<ResumeEntry | null>(null);

  const handleSave = (resume: ResumeEntry) => {
    const updated = updateResume(resume);
    setResumes(updated);
  };

  const handleClone = (resume: ResumeEntry) => {
    const updated = cloneResume(resume);
    setResumes(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deleteResume(id);
    setResumes(updated);
  };

  const parsedToString = (p: ResumeEntry["parsed"]) =>
    [p.contact, ...p.experience, ...p.education, ...p.skills]
      .filter(Boolean)
      .join("\n");

  if (resumes.length === 0) {
    return (
      <EmptyState
        message="No resumes"
        helperText="Add a resume above to begin."
      />
    );
  }

  return (
    <Box aria-label="Resume list">
      {resumes.map((r) => (
        <Box key={r.id} sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
              {r.id}
            </Typography>
            <IconButton size="small" onClick={() => setSelected(r)} aria-label="edit">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => handleClone(r)} aria-label="clone">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" onClick={() => setDiffTarget(r)} aria-label="diff">
              <DifferenceIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setConfirmDelete(r)}
              aria-label="delete"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                const temp = document.createElement("div");
                temp.textContent = r.content;
                exportElementToPdf(temp, `${r.id}.pdf`);
              }}
              aria-label="export"
            >
              <FileDownloadIcon fontSize="small" />
            </IconButton>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {r.tags.map((tag) => (
              <Chip key={tag} label={tag} sx={{ mb: 1 }} />
            ))}
          </Stack>
        </Box>
      ))}
      {selected && (
        <Detail
          resume={selected}
          onClose={() => setSelected(null)}
          onSave={(res) => {
            handleSave(res);
          }}
        />
      )}
      {diffTarget && (
        <Dialog open onClose={() => setDiffTarget(null)} fullWidth maxWidth="md">
          <DialogTitle>Diff {diffTarget.id}</DialogTitle>
          <DialogContent dividers>
            <Diff
              original={diffTarget.content}
              updated={parsedToString(diffTarget.parsed)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiffTarget(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      {confirmDelete && (
        <Dialog open onClose={() => setConfirmDelete(null)}>
          <DialogTitle>Delete Resume</DialogTitle>
          <DialogContent>
            Are you sure you want to delete {confirmDelete.id}?
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button
              color="error"
              onClick={() => {
                handleDelete(confirmDelete.id);
                setConfirmDelete(null);
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

