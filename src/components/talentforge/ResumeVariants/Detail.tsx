"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Chip,
  TextField,
  Typography,
} from "@mui/material";
import type { ResumeEntry } from "@/utils/talentforge/dataStore";

interface Props {
  resume: ResumeEntry;
  onClose: () => void;
  onSave: (resume: ResumeEntry) => void;
}

export default function Detail({ resume, onClose, onSave }: Props) {
  const [tags, setTags] = useState<string[]>(resume.tags);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [newTag, setNewTag] = useState("");

  const updateTags = (updated: string[]) => {
    setTags(updated);
    onSave({ ...resume, tags: updated });
  };

  const handleDelete = (tag: string) => {
    updateTags(tags.filter((t) => t !== tag));
  };

  const handleEditCommit = (idx: number, value: string) => {
    const updated = [...tags];
    updated[idx] = value.trim();
    updateTags(updated.filter(Boolean));
    setEditingIdx(null);
  };

  const handleAdd = () => {
    const value = newTag.trim();
    if (!value) return;
    updateTags([...tags, value]);
    setNewTag("");
  };

  const { contact, experience, education, skills } = resume.parsed;

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{resume.id}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            {tags.map((tag, idx) =>
              editingIdx === idx ? (
                <TextField
                  key={idx}
                  size="small"
                  value={tag}
                  onChange={(e) => {
                    const updated = [...tags];
                    updated[idx] = e.target.value;
                    setTags(updated);
                  }}
                  onBlur={() => handleEditCommit(idx, tags[idx])}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEditCommit(idx, tags[idx]);
                    }
                  }}
                />
              ) : (
                <Chip
                  key={idx}
                  label={tag}
                  onDelete={() => handleDelete(tag)}
                  onClick={() => setEditingIdx(idx)}
                  sx={{ mb: 1 }}
                />
              )
            )}
            <TextField
              size="small"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAdd();
              }}
              placeholder="Add tag"
              sx={{ mb: 1, minWidth: 120 }}
            />
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2">Contact</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {contact}
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Experience
            </Typography>
            {experience.map((line, i) => (
              <Typography key={i} variant="body2">
                {line}
              </Typography>
            ))}

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Education
            </Typography>
            {education.map((line, i) => (
              <Typography key={i} variant="body2">
                {line}
              </Typography>
            ))}

            <Typography variant="subtitle2" sx={{ mt: 2 }}>
              Skills
            </Typography>
            {skills.map((line, i) => (
              <Typography key={i} variant="body2">
                {line}
              </Typography>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
