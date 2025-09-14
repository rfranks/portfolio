"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { filterByTag, filterByText } from "@/utils/search";

import {
  getResumes,
  addResume,
  type ResumeEntry,
} from "@/utils/talentforge/dataStore";

import { askOpenAI, hasOpenAIKey } from "@/utils/talentforge/utils";
import { PROMPT_TEMPLATES } from "@/consts/prompts";
import { exportElementToPdf } from "@/utils/pdfExport";
import OpenAiKeyModal from "./OpenAiKeyModal";

const suggestTags = async (content: string): Promise<string[]> => {
  try {
    const res = await askOpenAI({
      context: content,
      user: "Suggest tags for this resume",
      system:
        "You are an assistant that extracts up to 5 concise tags from resume text. Return tags separated by commas.",
      logMessagesToChatHistory: false,
      returnFirstResponse: true,
      chatHistory: [],
    });
    const message = res?.message?.trim() ?? "";
    return message
      .split(/,|\n/)
      .map((t) => t.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

export default function ResumeManager() {
  const [resumes, setResumes] = useState<ResumeEntry[]>([]);
  const [text, setText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [comparison, setComparison] = useState("");
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [openKeyModal, setOpenKeyModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchTag, setSearchTag] = useState("");

  useEffect(() => {
    setResumes(getResumes());
  }, []);

  const handleSave = async () => {
    if (!hasOpenAIKey()) {
      setOpenKeyModal(true);
      return;
    }
    if (!text.trim()) return;
    const tags = await suggestTags(text);
    const newResume = { id: uuid(), content: text, tags };
    const updated = addResume(newResume);
    setResumes(updated);
    setText("");
  };

  const handleCompare = async () => {
    if (!hasOpenAIKey()) {
      setOpenKeyModal(true);
      return;
    }
    if (!text.trim() || !jobDescription.trim()) return;
    const context = `Resume:\n${text}\n\nJob Description:\n${jobDescription}`;
    const prompt = PROMPT_TEMPLATES.compareResumeToJob?.fullText || "";
    setLoadingCompare(true);
    const response = await askOpenAI({
      context,
      user: prompt,
      system:
        "You are an assistant that compares resumes to job descriptions and highlights matches and gaps.",
      chatHistory: [],
      returnFirstResponse: true,
      logMessagesToChatHistory: false,
    });
    setComparison(response?.message || "");
    setLoadingCompare(false);
  };

  const filteredResumes = filterByTag(
    filterByText(resumes, searchText, ["content"]),
    searchTag,
  );

  return (
    <Box>
      <OpenAiKeyModal
        open={openKeyModal}
        onClose={() => setOpenKeyModal(false)}
      />
      <TextField
        label="Paste your resume"
        multiline
        minRows={6}
        fullWidth
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <TextField
        label="Paste job description"
        multiline
        minRows={6}
        fullWidth
        sx={{ mt: 2 }}
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handleSave}>
          Save
        </Button>
        <Button
          variant="outlined"
          onClick={handleCompare}
          disabled={!text || !jobDescription || loadingCompare}
        >
          Compare to Job
        </Button>
      </Stack>
      {loadingCompare && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {comparison && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Comparison Result
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
            {comparison}
          </Typography>
        </Box>
      )}
      <Stack spacing={2} sx={{ mt: 4 }}>
        <TextField
          label="Filter by text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <TextField
          label="Filter by tag"
          value={searchTag}
          onChange={(e) => setSearchTag(e.target.value)}
        />
        {filteredResumes.map((resume) => (
          <Box key={resume.id}>
            <Typography variant="subtitle1" gutterBottom>
              {resume.id}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {resume.tags.map((tag) => (
                <Chip key={tag} label={tag} sx={{ mb: 1 }} />
              ))}
            </Stack>
            <Button
              size="small"
              sx={{ mt: 1 }}
              onClick={() => {
                const temp = document.createElement("div");
                temp.textContent = resume.content;
                exportElementToPdf(temp, `${resume.id}.pdf`);
              }}
            >
              Export
            </Button>
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

