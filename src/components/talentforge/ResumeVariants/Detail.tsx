"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Chip,
} from "@mui/material";
import { type ResumeEntry } from "@/utils/talentforge/dataStore";
import Diff from "./Diff";
import BulletVariants from "./BulletVariants";

interface Props {
  resume: ResumeEntry;
  onClose: () => void;
  onSave: (resume: ResumeEntry) => void;
  onClone: (resume: ResumeEntry) => void;
}

export default function Detail({
  resume,
  onClose,
  onSave,
  onClone,
}: Props) {
  const [content, setContent] = useState(resume.content);
  const [tagsText, setTagsText] = useState(resume.tags.join(", "));
  const [showDiff, setShowDiff] = useState(false);

  const tags = tagsText
    .split(/,|\n/)
    .map((t) => t.trim())
    .filter(Boolean);

  const updatedResume: ResumeEntry = { ...resume, content, tags };

  return (
  <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{resume.id}</DialogTitle>
      <DialogContent dividers>
        {showDiff ? (
          <Diff original={resume.content} updated={content} />
        ) : (
          <Stack spacing={2}>
            <TextField
              label="Content"
              multiline
              minRows={10}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <BulletVariants setContent={setContent} />
            <TextField
              label="Tags"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              helperText="Comma separated"
            />
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {tags.map((t) => (
                <Chip key={t} label={t} />
              ))}
            </Stack>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setShowDiff(!showDiff)}>
          {showDiff ? "Edit" : "Diff"}
        </Button>
        <Button onClick={() => onClone(updatedResume)}>Clone</Button>
        <Button onClick={() => onSave(updatedResume)}>Save</Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

