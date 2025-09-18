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

import PromptTileGrid from "./promptTiles/PromptTileGrid";

interface ChatWorkspaceProps {
  onInsertIntoInbox?: (text: string) => void;
  onSaveResumeVariant?: (text: string) => void;
  jobDescription?: string;
  resumes?: ResumeEntry[];
  selectedResumeId?: string | null;
  onResumeSelect?: (resumeId: string) => void;
}

export default function ChatWorkspace({
  onInsertIntoInbox,
  onSaveResumeVariant,
  jobDescription: initialJobDescription = "",
  resumes = [],
  selectedResumeId = null,
  onResumeSelect,
}: ChatWorkspaceProps) {
  const [output, setOutput] = useState("");
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [resumeId, setResumeId] = useState<string>(selectedResumeId || "");
  const [resumeContent, setResumeContent] = useState<string>("");

  useEffect(() => {
    setJobDescription(initialJobDescription);
  }, [initialJobDescription]);

  useEffect(() => {
    if (selectedResumeId && selectedResumeId !== resumeId) {
      setResumeId(selectedResumeId);
    } else if (!selectedResumeId && !resumeId && resumes.length > 0) {
      setResumeId(resumes[0].id);
    }
  }, [selectedResumeId, resumes, resumeId]);

  useEffect(() => {
    const selected = resumes.find((resume) => resume.id === resumeId);
    setResumeContent(selected?.content || "");
  }, [resumeId, resumes]);

  const promptInitialValues = useMemo(() => {
    const base: Record<string, Record<string, string>> = {
      jdRequirements: { jobDescription },
      jobRequirements: { jobDescription },
      screenRole: { jobDescription },
    };
    if (resumeId) {
      base.resumeRewrite = { jobDescription, resumeVariantId: resumeId };
      base.resumeCompare = { jobDescription, resumeVariantId: resumeId };
    } else {
      base.resumeRewrite = { jobDescription };
      base.resumeCompare = { jobDescription };
    }
    return base;
  }, [jobDescription, resumeId]);

  const handleCopy = () => {
    if (navigator.clipboard && output) {
      navigator.clipboard.writeText(output);
    }
  };

  const handleInsert = () => {
    onInsertIntoInbox?.(output);
  };

  const handleSave = () => {
    onSaveResumeVariant?.(output);
  };

  const handleResumeChange = (value: string) => {
    setResumeId(value);
    onResumeSelect?.(value);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", xl: "row" },
        gap: 2,
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack spacing={2}>
          <TextField
            label="Job Description"
            multiline
            minRows={4}
            fullWidth
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
          {resumes.length > 0 && (
            <TextField
              label="Resume"
              select
              value={resumeId}
              onChange={(e) => handleResumeChange(e.target.value)}
              fullWidth
            >
              {resumes.map((resume) => (
                <MenuItem key={resume.id} value={resume.id}>
                  {resume.title}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="Resume Preview"
            multiline
            minRows={6}
            fullWidth
            value={resumeContent}
            placeholder={
              resumes.length
                ? "Select a resume to view its content"
                : "Upload a resume to enable resume-based prompts"
            }
            InputProps={{ readOnly: true }}
          />
          <PromptTileGrid
            onResponse={setOutput}
            initialValues={promptInitialValues}
          />
        </Stack>
      </Box>
      <Box
        sx={{
          flexBasis: { xl: "32%" },
          border: 1,
          borderColor: "divider",
          p: 2,
          borderRadius: 1,
          minHeight: 200,
          minWidth: { xl: 300 },
        }}
      >
        <Typography variant="h6" gutterBottom>
          Output
        </Typography>
        <Box
          sx={{
            whiteSpace: "pre-wrap",
            mb: 2,
            maxHeight: { xs: 240, xl: "unset" },
            overflowY: "auto",
          }}
        >
          {output}
        </Box>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
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

