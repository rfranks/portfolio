"use client";

import { useState } from "react";
import {
  Box,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteIcon from "@mui/icons-material/Delete";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DifferenceIcon from "@mui/icons-material/Difference";
import { v4 as uuid } from "uuid";
import type { ResumeEntry } from "@/types";
import {
  deleteResume,
  updateResume,
  cloneResume,
  addResume,
} from "@/app/talentforge/_utils/dataStore";
import Detail from "./Detail";
import EmptyState from "../EmptyState";
import Diff from "./Diff";
import Chip from "@/components/fabric/Chip";

interface Props {
  resumes: ResumeEntry[];
  setResumes: (resumes: ResumeEntry[]) => void;
}

const importDateFormatter =
  typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function"
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

function formatResumeMetadata(resume: ResumeEntry): string | null {
  const parts: string[] = [];
  if (resume.sourceFilename) {
    parts.push(resume.sourceFilename);
  }
  if (resume.importedAt) {
    const date = new Date(resume.importedAt);
    if (!Number.isNaN(date.getTime())) {
      const formatted = importDateFormatter
        ? importDateFormatter.format(date)
        : date.toLocaleString();
      parts.push(`Imported ${formatted}`);
    }
  }
  if (!parts.length) {
    return null;
  }
  return parts.join(" • ");
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

  const handleExport = (resume: ResumeEntry) => {
    const data = {
      content: resume.content,
      tags: resume.tags,
      parsed: resume.parsed,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resume.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const { content, tags, parsed } = JSON.parse(text) as {
        content: string;
        tags: string[];
        parsed: ResumeEntry["parsed"];
      };
      const newResume: ResumeEntry = {
        id: uuid(),
        userId: "",
        label: "",
        title: "",
        url: "",
        content,
        tags: tags || [],
        parsed: parsed || {
          contact: "",
          experience: [],
          education: [],
          skills: [],
        },
        sourceFilename: file.name || "Imported resume",
        importedAt: new Date().toISOString(),
      };
      const updated = addResume(newResume);
      setResumes(updated);
    } catch (err) {
      // ignore invalid files
      console.error("Failed to import resume", err);
    }
  };

  const parsedToString = (p: ResumeEntry["parsed"]) =>
    [p.contact, ...p.experience, ...p.education, ...p.skills].filter(Boolean).join("\n");

  if (resumes.length === 0) {
    return <EmptyState message="No resumes" helperText="Add a resume above to begin." />;
  }

  return (
    <Box aria-label="Resume list">
      {resumes.map((r) => {
        const metadataLabel = formatResumeMetadata(r);
        return (
          <Box key={r.id} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                value={r.title}
                onChange={(e) =>
                  setResumes(
                    resumes.map((res) =>
                      res.id === r.id ? { ...res, title: e.target.value } : res,
                    ),
                  )
                }
                onBlur={(e) => handleSave({ ...r, title: e.target.value })}
                sx={{ flexGrow: 1 }}
                inputProps={{ "aria-label": "Resume title" }}
              />
              <IconButton size="small" onClick={() => setSelected(r)} aria-label="edit">
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleClone(r)} aria-label="clone">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setDiffTarget(r)} aria-label="diff">
                <DifferenceIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => setConfirmDelete(r)} aria-label="delete">
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={() => handleExport(r)} aria-label="export">
                <FileDownloadIcon fontSize="small" />
              </IconButton>
              <IconButton component="label" size="small" aria-label="import">
                <UploadFileIcon fontSize="small" />
                <input
                  type="file"
                  hidden
                  accept="application/json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void handleImport(file);
                    e.target.value = "";
                  }}
                />
              </IconButton>
            </Stack>
            {metadataLabel && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {metadataLabel}
              </Typography>
            )}
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {r.tags.map((tag) => (
                <Chip key={tag} label={tag} sx={{ mb: 1 }} />
              ))}
            </Stack>
          </Box>
        );
      })}
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
          <DialogTitle>Diff {diffTarget.title}</DialogTitle>
          <DialogContent dividers>
            <Diff original={diffTarget.content} updated={parsedToString(diffTarget.parsed)} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDiffTarget(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
      {confirmDelete && (
        <Dialog open onClose={() => setConfirmDelete(null)}>
          <DialogTitle>Delete Resume</DialogTitle>
          <DialogContent>Are you sure you want to delete {confirmDelete.title}?</DialogContent>
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
