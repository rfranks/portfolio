"use client";

import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { askOpenAI } from "@/utils/talentforge/utils";
import { PROMPT_TEMPLATES } from "@/consts/prompts";
import EmptyState from "./EmptyState";
import RequireAIKey from "./RequireAIKey";

interface Issue {
  severity: "red" | "yellow";
  message: string;
}

interface Analysis {
  summary?: string;
  issues: Issue[];
}

export default function JobDescriptionRisk() {
  const [jobDescription, setJobDescription] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    if (!jobDescription.trim()) return;
    const context = `Job Description:\n${jobDescription}`;
    const prompt = PROMPT_TEMPLATES.jobDescriptionRisk?.fullText || "";
    setLoading(true);
    const response = await askOpenAI({
      context,
      user: prompt,
      system:
        "You are an assistant that reviews job descriptions and flags potential issues. Respond in JSON with a 'summary' and an array 'issues' with objects containing 'severity' (\"red\" or \"yellow\") and 'message'.",
      chatHistory: [],
      returnFirstResponse: true,
    });
    const message = response?.message || "";
    try {
      const parsed = JSON.parse(message);
      setAnalysis({
        summary: parsed.summary,
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
      });
    } catch {
      setAnalysis({ summary: message, issues: [] });
    }
    setLoading(false);
  };

  return (
    <RequireAIKey>
      <Box>
      <TextField
        label="Paste job description"
        multiline
        minRows={6}
        fullWidth
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={analyze}
        disabled={!jobDescription || loading}
      >
        Analyze
      </Button>
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {analysis ? (
        <Box sx={{ mt: 2 }}>
          {analysis.issues.map((issue, idx) => (
            <Stack
              key={idx}
              direction="row"
              spacing={1}
              alignItems="flex-start"
              sx={{ mb: 1 }}
            >
              <Typography>{issue.severity === "red" ? "🚩" : "⚠️"}</Typography>
              <Typography variant="body2">{issue.message}</Typography>
            </Stack>
          ))}
          {analysis.summary && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              {analysis.summary}
            </Typography>
          )}
        </Box>
      ) : (
        !loading && (
          <EmptyState
            message="No analysis yet"
            helperText="Paste a job description and click Analyze."
          />
        )
      )}
      </Box>
    </RequireAIKey>
  );
}

