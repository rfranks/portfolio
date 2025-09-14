"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Skeleton,
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

import {
  askOpenAI,
  hasOpenAIKey,
  pdfToMarkdown,
} from "@/utils/talentforge/utils";
import { parseResumeText } from "@/utils/talentforge/pdfParser";
import { PROMPT_TEMPLATES } from "@/consts/prompts";
import OpenAiKeyModal from "./OpenAiKeyModal";
import FileUploader from "./FileUploader";
import ResumeVariantList from "./ResumeVariants/List";

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
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    setResumes(getResumes());
    setLoadingResumes(false);
  }, []);

  const handleSave = async () => {
    if (!hasOpenAIKey()) {
      setOpenKeyModal(true);
      return;
    }
    if (!text.trim()) return;
    const tags = await suggestTags(text);
    const parsed = parseResumeText(text);
    const newResume = { id: uuid(), content: text, parsed, tags };
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
      <FileUploader
        accept=".pdf,.txt,.md"
        label="Upload your resume"
        outputType="files"
        sx={{ mb: 2 }}
        onChange={async (filesFromParam) => {
          const files = filesFromParam as File[];
          if (!files || files.length === 0) return;
          const file = files[0];
          const content =
            file.type === "application/pdf"
              ? await pdfToMarkdown(file)
              : await file.text();
          setText(content);
        }}
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
        {loadingResumes ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <Skeleton key={idx} variant="rectangular" height={60} />
          ))
        ) : (
          <ResumeVariantList
            resumes={filteredResumes}
            setResumes={setResumes}
          />
        )}
      </Stack>
    </Box>
  );
}

