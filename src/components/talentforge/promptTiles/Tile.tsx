"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  IconButton,
  Tooltip,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import Markdown from "react-markdown";

import OpenAiKeyModal from "../OpenAiKeyModal";
import { askOpenAI, hasValidOpenAIKey } from "@/utils/talentforge/utils";
import { getResumes, addResume, type ResumeEntry } from "@/utils/talentforge/dataStore";
import { tagResume } from "@/utils/talentforge/tagging";
import { parseResumeText } from "@/utils/talentforge/pdfParser";
import { v4 as uuid } from "uuid";

interface Issue {
  severity: "red" | "yellow";
  message: string;
}

interface Analysis {
  summary?: string;
  issues: Issue[];
}

export interface PromptTileProps {
  id: string;
  display: string;
  fullPrompt: string;
  inputs: string[];
  onInsert?: (text: string) => void;
  onResponse?: (response: string) => void;
}

export default function Tile({
  id,
  display,
  fullPrompt,
  inputs,
  onInsert,
  onResponse,
  }: PromptTileProps) {
    const [values, setValues] = useState<Record<string, string>>({});
    const [response, setResponse] = useState("");
    const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [openKeyModal, setOpenKeyModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleRun = async () => {
    const valid = await hasValidOpenAIKey();
    if (!valid) {
      setOpenKeyModal(true);
      return;
    }
    setResponse("");
    setAnalysis(null);
    setLoading(true);
      try {
        let prompt = fullPrompt;
        for (const key of inputs) {
          prompt = prompt.replaceAll(`{{${key}}}`, values[key] || "");
        }

        if (id === "resumeRewrite") {
          const resume = getResumes().find(
            (r) => r.id === values["resumeVariantId"],
          );
          if (!resume) {
            setResponse("Resume not found");
            return;
          }
          prompt = `${prompt}\n\nJob Description:\n${values["jobDescription"]}\n\nResume:\n${resume.content}`;
        }

        const res = await askOpenAI({
          context: "",
          user: prompt,
          system: "You are a helpful assistant.",
          returnFirstResponse: true,
          chatHistory: [],
        });
        const message = res?.message || "";
        if (id === "jobDescriptionRisk") {
          try {
            const parsed = JSON.parse(message);
            const issues: Issue[] = Array.isArray(parsed.issues)
              ? (parsed.issues as Issue[]).sort(
                  (a, b) =>
                    (a.severity === "red" ? 0 : 1) -
                    (b.severity === "red" ? 0 : 1),
                )
              : [];
            setAnalysis({ summary: parsed.summary, issues });
          } catch {
            setAnalysis({ summary: message, issues: [] });
          }
          setResponse("");
        } else {
          setResponse(message);
          onResponse?.(message);
          onInsert?.(message);
        }
      } finally {
        setLoading(false);
      }
    };

  const handleSaveVariant = async () => {
    if (id !== "resumeRewrite" || !response) return;
    const resume = getResumes().find(
      (r) => r.id === values["resumeVariantId"],
    );
    if (!resume) return;
    setSaving(true);
    try {
      const tags = await tagResume(response);
      const parsed = parseResumeText(response);
      const newResume: ResumeEntry = {
        ...resume,
        id: uuid(),
        content: response,
        parsed,
        tags,
      };
      addResume(newResume);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <OpenAiKeyModal open={openKeyModal} onClose={() => setOpenKeyModal(false)} />
      <Stack spacing={1}>
        <Typography variant="subtitle1">{display}</Typography>
        {inputs.map((name) => (
          <TextField
            key={name}
            label={name}
            value={values[name] || ""}
            onChange={(e) => handleChange(name, e.target.value)}
            size="small"
          />
        ))}
        <Button variant="contained" onClick={handleRun} disabled={loading}>
          {loading ? "Running..." : "Run"}
        </Button>
          {id === "jobDescriptionRisk"
            ? analysis && (
                <Box>
                  {analysis.issues.map((issue, idx) => (
                    <Stack
                      key={idx}
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                      sx={{ mb: 1 }}
                    >
                      <Typography>
                        {issue.severity === "red" ? "🚩" : "⚠️"}
                      </Typography>
                      <Typography variant="body2">
                        {issue.message}
                      </Typography>
                    </Stack>
                  ))}
                  {analysis.summary && (
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      {analysis.summary}
                    </Typography>
                  )}
                </Box>
              )
            : response && (
                <>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {response}
                  </Typography>
                  {id === "resumeRewrite" && (
                    <Button
                      variant="outlined"
                      onClick={handleSaveVariant}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save as new variant"}
                    </Button>
                  )}
                  <Box>
                    <Box display="flex" justifyContent="flex-end">
                      {navigator.clipboard && (
                        <Tooltip title="copy to clipboard" arrow>
                          <IconButton
                            aria-label="copy response to clipboard"
                            onClick={() => navigator.clipboard.writeText(response)}
                            size="small"
                          >
                            <ContentCopy fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <Markdown>{response}</Markdown>
                  </Box>
                </>
              )}
        </Stack>
      </Box>
    );
  }

