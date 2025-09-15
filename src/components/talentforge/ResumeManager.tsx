"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Box,
  Button,
  CircularProgress,
  Skeleton,
  Snackbar,
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
import { pdfToText, parseResumeText } from "@/utils/talentforge/pdfParser";
import { parsePastedHtml } from "@/utils/talentforge/pasteParser";
import { tagResume } from "@/utils/talentforge/tagging";
import { PROMPT_TEMPLATES } from "@/consts/prompts";
import OpenAIKeyModal from "./OpenAiKeyModal";
import FileUploader from "./FileUploader";
import ResumeVariantList from "./ResumeVariants/List";

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
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => {
      setResumes(getResumes());
      setLoadingResumes(false);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return;
    const sanitized = parsePastedHtml(text);
    const tags = await tagResume(sanitized);
    const parsed = parseResumeText(sanitized);
    const newResume: ResumeEntry = {
      id: uuid(),
      userId: "",
      label: "",
      title: "",
      url: "",
      content: sanitized,
      parsed,
      tags,
    };
    const updated = addResume(newResume);
    setResumes(updated);
    setText("");
    setToastOpen(true);
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
      <OpenAIKeyModal
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
              ? await pdfToText(file)
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
        onPaste={(e) => {
          const pasted =
            e.clipboardData.getData("text/html") ||
            e.clipboardData.getData("text/plain");
          if (pasted) {
            e.preventDefault();
            const sanitized = parsePastedHtml(pasted);
            setText(sanitized);
          }
        }}
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
        <Box
          sx={{ display: "flex", justifyContent: "center", mt: 2 }}
          aria-busy="true"
          aria-label="Comparing resume"
        >
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
      <Stack
        spacing={2}
        sx={{ mt: 4 }}
        aria-busy={loadingResumes}
        aria-label={loadingResumes ? "Loading resumes" : undefined}
      >
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
      <Snackbar
        open={toastOpen}
        autoHideDuration={3000}
        message="Resume saved"
        onClose={() => setToastOpen(false)}
      />
    </Box>
  );
}

