"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { filterByTag, filterByText } from "@/utils/search";

import { askOpenAI, hasOpenAIKey } from "@/utils/talentforge/utils";
import { exportElementToPdf } from "@/utils/pdfExport";
import OpenAiKeyModal from "./OpenAiKeyModal";

interface StoredResume {
  id: string;
  content: string;
  tags: string[];
}

const STORAGE_KEY = "resumes";

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
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [text, setText] = useState("");
  const [openKeyModal, setOpenKeyModal] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [searchTag, setSearchTag] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setResumes(JSON.parse(stored));
      } catch {
        setResumes([]);
      }
    }
  }, []);

  const handleSave = async () => {
    if (!hasOpenAIKey()) {
      setOpenKeyModal(true);
      return;
    }
    if (!text.trim()) return;
    const tags = await suggestTags(text);
    const newResume: StoredResume = { id: uuid(), content: text, tags };
    const updated = [...resumes, newResume];
    setResumes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setText("");
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
      <Button variant="contained" sx={{ mt: 2 }} onClick={handleSave}>
        Save
      </Button>
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

