"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  TextField,
  MenuItem,
} from "@mui/material";

import type { ResumeEntry } from "@/types";
import { getPromptTiles } from "@/utils/talentforge/promptRegistry";

import PromptTileGrid from "./promptTiles/PromptTileGrid";

interface ChatWorkspaceProps {
  onInsertIntoInbox?: (text: string) => void;
  onSaveResumeVariant?: (text: string, resumeId?: string) => void;
  initialJobDescription?: string;
  initialResumeId?: string;
  resumes?: ResumeEntry[];
}

const WORKSPACE_CONTEXTS = ["resume", "jobSearch"] as const;

export default function ChatWorkspace({
  onInsertIntoInbox,
  onSaveResumeVariant,
  initialJobDescription,
  initialResumeId,
  resumes = [],
}: ChatWorkspaceProps) {
  const [output, setOutput] = useState("");
  const [jobDescription, setJobDescription] = useState(
    initialJobDescription || "",
  );
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    initialResumeId || "",
  );

  useEffect(() => {
    setJobDescription(initialJobDescription || "");
  }, [initialJobDescription]);

  useEffect(() => {
    if (initialResumeId && resumes.some((resume) => resume.id === initialResumeId)) {
      setSelectedResumeId(initialResumeId);
      return;
    }
    if (resumes.length === 0) {
      setSelectedResumeId("");
      return;
    }
    setSelectedResumeId((prev) => {
      if (prev && resumes.some((resume) => resume.id === prev)) {
        return prev;
      }
      return resumes[0]?.id || "";
    });
  }, [initialResumeId, resumes]);

  const tiles = useMemo(
    () => getPromptTiles({ contexts: WORKSPACE_CONTEXTS }),
    [],
  );

  const initialValues = useMemo(() => {
    const values: Record<string, Record<string, string>> = {};
    tiles.forEach((tile) => {
      const tileValues: Record<string, string> = {};
      if (tile.inputs.includes("jobDescription")) {
        tileValues.jobDescription = jobDescription;
      }
      if (tile.inputs.includes("resumeVariantId")) {
        tileValues.resumeVariantId = selectedResumeId;
      }
      if (Object.keys(tileValues).length > 0) {
        values[tile.id] = tileValues;
      }
    });
    return values;
  }, [tiles, jobDescription, selectedResumeId]);

  const handleCopy = () => {
    if (navigator.clipboard && output) {
      navigator.clipboard.writeText(output);
    }
  };

  const handleInsert = () => {
    if (!output.trim()) return;
    onInsertIntoInbox?.(output);
  };

  const handleSave = () => {
    if (!output.trim()) return;
    onSaveResumeVariant?.(output, selectedResumeId || undefined);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1 }}>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <TextField
            label="Job Description"
            multiline
            minRows={4}
            fullWidth
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          {resumes.length > 0 ? (
            <TextField
              select
              label="Resume Variant"
              value={selectedResumeId}
              onChange={(e) => setSelectedResumeId(e.target.value)}
              fullWidth
            >
              {resumes.map((resume) => (
                <MenuItem key={resume.id} value={resume.id}>
                  {resume.title}
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <Typography color="text.secondary">
              Upload a resume to unlock resume-aware prompts.
            </Typography>
          )}
        </Stack>
        <PromptTileGrid
          onResponse={setOutput}
          initialValues={initialValues}
          contexts={WORKSPACE_CONTEXTS}
        />
      </Box>
      <Box
        sx={{
          flexBasis: { md: "30%" },
          border: 1,
          borderColor: "divider",
          p: 2,
          borderRadius: 1,
          minHeight: 200,
        }}
      >
        <Typography variant="h6" gutterBottom>
          Output
        </Typography>
        <Box sx={{ whiteSpace: "pre-wrap", mb: 2 }}>{output}</Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={handleCopy} disabled={!output}>
            Copy
          </Button>
          <Button
            variant="outlined"
            onClick={handleInsert}
            disabled={!onInsertIntoInbox || !output}
          >
            Insert into Inbox
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={!onSaveResumeVariant || !output}
          >
            Save Resume Variant
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

