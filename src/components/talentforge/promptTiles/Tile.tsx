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
  Tabs,
  Tab,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import Markdown from "react-markdown";

import OpenAiKeyModal from "../OpenAiKeyModal";
import { askOpenAI, hasValidOpenAIKey } from "@/utils/talentforge/utils";
import { getResumes, addResume, type ResumeEntry } from "@/utils/talentforge/dataStore";
import { tagResume } from "@/utils/talentforge/tagging";
import { parseResumeText } from "@/utils/talentforge/pdfParser";
import { v4 as uuid } from "uuid";

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
  const [loading, setLoading] = useState(false);
  const [openKeyModal, setOpenKeyModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drafts, setDrafts] = useState<
    | { email: string; linkedin: string; indeed: string }
    | null
  >(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleRun = async () => {
    const valid = await hasValidOpenAIKey();
    if (!valid) {
      setOpenKeyModal(true);
      return;
    }
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

      if (id === "negotiateOffer") {
        setDrafts(null);
        setActiveTab(0);
        const context = `Offer Letter:\n${values["offerLetter"] || ""}\n\nCurrent Compensation:\n${values["currentComp"] || ""}`;
        const res = await askOpenAI({
          context,
          user: prompt,
          system:
            "You analyze offers and produce structured negotiation drafts.",
          returnFirstResponse: true,
          chatHistory: [],
        });
        const message = res?.message || "";
        try {
          const parsed = JSON.parse(message) as {
            email?: string;
            linkedin?: string;
            indeed?: string;
          };
          setDrafts({
            email: parsed.email || "",
            linkedin: parsed.linkedin || "",
            indeed: parsed.indeed || "",
          });
        } catch {
          setDrafts({ email: message, linkedin: "", indeed: "" });
        }
        onResponse?.(message);
        onInsert?.(message);
        return;
      }

      const res = await askOpenAI({
        context: "",
        user: prompt,
        system: "You are a helpful assistant.",
        returnFirstResponse: true,
        chatHistory: [],
      });
      const message = res?.message || "";
      setResponse(message);
      onResponse?.(message);
      onInsert?.(message);
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
        {id === "negotiateOffer" && drafts && (
          <Box>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
              <Tab label="Email" />
              <Tab label="LinkedIn" />
              <Tab label="Indeed" />
            </Tabs>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="flex-end">
                {navigator.clipboard && (
                  <Tooltip title="copy to clipboard" arrow>
                    <IconButton
                      aria-label="copy response to clipboard"
                      onClick={() =>
                        navigator.clipboard.writeText(
                          activeTab === 0
                            ? drafts.email
                            : activeTab === 1
                              ? drafts.linkedin
                              : drafts.indeed,
                        )
                      }
                      size="small"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {activeTab === 0 && <Markdown>{drafts.email}</Markdown>}
              {activeTab === 1 && <Markdown>{drafts.linkedin}</Markdown>}
              {activeTab === 2 && <Markdown>{drafts.indeed}</Markdown>}
            </Box>
          </Box>
        )}
        {id !== "negotiateOffer" && response && (
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

