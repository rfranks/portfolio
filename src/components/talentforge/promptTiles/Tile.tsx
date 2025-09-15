"use client";

import { useEffect, useState } from "react";
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

import OpenAIKeyModal from "../OpenAiKeyModal";
import { askOpenAI, hasValidOpenAIKey } from "@/utils/talentforge/utils";
import {
  getResumes,
  addResume,
  addOffer,
  type ResumeEntry,
  type Offer,
} from "@/utils/talentforge/dataStore";
import { tagResume } from "@/utils/talentforge/tagging";
import { parseResumeText } from "@/utils/talentforge/resumeIngest";
import { v4 as uuid } from "uuid";
import type { ApplicationRecord } from "@/types";

export interface PromptTileProps {
  id: string;
  display: string;
  fullPrompt: string;
  inputs: string[];
  onInsert?: (text: string) => void;
  onResponse?: (response: string) => void;
  initialValues?: Record<string, string>;
}

export default function Tile({
  id,
  display,
  fullPrompt,
  inputs,
  onInsert,
  onResponse,
  initialValues = {},
}: PromptTileProps) {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [openKeyModal, setOpenKeyModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offerDrafts, setOfferDrafts] = useState<
    { email: string; linkedin: string; indeed: string } | null
  >(null);
  const [nudgeDrafts, setNudgeDrafts] = useState<
    | {
        followUp: { email: string; linkedin: string; indeed: string };
        decline: { email: string; linkedin: string; indeed: string };
      }
    | null
  >(null);
  const [activeTab, setActiveTab] = useState(0);
  const [nudgeMode, setNudgeMode] = useState<"followUp" | "decline">(
    "followUp",
  );

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const loadSelectedResume = () =>
    getResumes().find((r) => r.id === values["resumeVariantId"]);

  const handleRun = async () => {
    const valid = await hasValidOpenAIKey();
    if (!valid) {
      setOpenKeyModal(true);
      return;
    }
    setLoading(true);
    try {
      setResponse("");
      setOfferDrafts(null);
      setNudgeDrafts(null);
      let prompt = fullPrompt;
      for (const key of inputs) {
        prompt = prompt.replaceAll(`{{${key}}}`, values[key] || "");
      }

      let context = "";
      if (id === "resumeRewrite" || id === "resumeCompare") {
        const resume = loadSelectedResume();
        if (!resume) {
          setResponse("Resume not found");
          return;
        }
        if (id === "resumeRewrite") {
          context = `Job Description:\n${values["jobDescription"]}\n\nResume:\n${resume.content}`;
        } else {
          prompt = prompt.replaceAll("{{resumeContent}}", resume.content);
        }
      }

      if (id === "compareOffers") {
        const context = `Offer A:\n${values["offerA"] || ""}\n\nOffer B:\n${values["offerB"] || ""}`;
        const res = await askOpenAI({
          context,
          user: prompt,
          system: "You compare job offers and highlight key differences.",
          returnFirstResponse: true,
          chatHistory: [],
        });
        const message = res?.message || "";
        setResponse(message);
        const offer: Offer = {
          id: uuid(),
          application: {} as ApplicationRecord,
          compensation: [],
          summary: [
            ...message
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean),
          ],
        };
        addOffer(offer);
        onResponse?.(message);
        onInsert?.(message);
        return;
      }

      if (id === "negotiateOffer") {
        setOfferDrafts(null);
        setNudgeDrafts(null);
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
          setOfferDrafts({
            email: parsed.email || "",
            linkedin: parsed.linkedin || "",
            indeed: parsed.indeed || "",
          });
        } catch {
          setOfferDrafts({ email: message, linkedin: "", indeed: "" });
        }
        onResponse?.(message);
        onInsert?.(message);
        return;
      }

      if (id === "recruiterNudge") {
        setOfferDrafts(null);
        setNudgeDrafts(null);
        setActiveTab(0);
        setNudgeMode("followUp");
        const res = await askOpenAI({
          context: "",
          user: prompt,
          system:
            "You craft professional recruiter follow-up and decline messages.",
          returnFirstResponse: true,
          chatHistory: [],
        });
        const message = res?.message || "";
        try {
          const parsed = JSON.parse(message) as {
            followUp?: { email?: string; linkedin?: string; indeed?: string };
            decline?: { email?: string; linkedin?: string; indeed?: string };
          };
          setNudgeDrafts({
            followUp: {
              email: parsed.followUp?.email || "",
              linkedin: parsed.followUp?.linkedin || "",
              indeed: parsed.followUp?.indeed || "",
            },
            decline: {
              email: parsed.decline?.email || "",
              linkedin: parsed.decline?.linkedin || "",
              indeed: parsed.decline?.indeed || "",
            },
          });
        } catch {
          setResponse(message);
        }
        onResponse?.(message);
        onInsert?.(message);
        return;
      }

      const res = await askOpenAI({
        context,
        user: prompt,
        system: "You are a helpful assistant. Use the following context:\n{{context}}",
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
    if (!response) return;
    if (id !== "resumeRewrite" || !response) return;
    const resume = loadSelectedResume();
    if (!resume) return;

    setSaving(true);
    try {
      if (id === "resumeRewrite") {
        const resume = getResumes().find(
          (r) => r.id === values["resumeVariantId"],
        );
        if (!resume) return;
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
      } else if (id === "coverLetter") {
        const tags = await tagResume(response);
        const parsed = parseResumeText(response);
        const newResume: ResumeEntry = {
          id: uuid(),
          userId: "",
          label: "",
          title: "",
          url: "",
          content: response,
          parsed,
          tags,
        };
        addResume(newResume);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <OpenAIKeyModal open={openKeyModal} onClose={() => setOpenKeyModal(false)} />
      <Stack spacing={1}>
        <Typography variant="subtitle1">{display}</Typography>
        {inputs.map((name) =>
          name === "jobDescription" ? (
            <TextField
              key={name}
              label={name}
              value={values[name] || ""}
              onChange={(e) => handleChange(name, e.target.value)}
              multiline
              minRows={4}
              fullWidth
            />
          ) : (
            <TextField
              key={name}
              label={name}
              value={values[name] || ""}
              onChange={(e) => handleChange(name, e.target.value)}
              size="small"
            />
          ),
        )}
        <Button variant="contained" onClick={handleRun} disabled={loading}>
          {loading ? "Running..." : "Run"}
        </Button>
        {id === "negotiateOffer" && offerDrafts && (
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
                            ? offerDrafts.email
                            : activeTab === 1
                              ? offerDrafts.linkedin
                              : offerDrafts.indeed,
                        )
                      }
                      size="small"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {activeTab === 0 && <Markdown>{offerDrafts.email}</Markdown>}
              {activeTab === 1 && <Markdown>{offerDrafts.linkedin}</Markdown>}
              {activeTab === 2 && <Markdown>{offerDrafts.indeed}</Markdown>}
            </Box>
          </Box>
        )}
        {id === "recruiterNudge" && nudgeDrafts && (
          <Box>
            <Tabs
              value={nudgeMode === "followUp" ? 0 : 1}
              onChange={(_, v) =>
                setNudgeMode(v === 0 ? "followUp" : "decline")
              }
            >
              <Tab label="Follow Up" />
              <Tab label="Decline" />
            </Tabs>
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
                            ? nudgeDrafts[nudgeMode].email
                            : activeTab === 1
                              ? nudgeDrafts[nudgeMode].linkedin
                              : nudgeDrafts[nudgeMode].indeed,
                        )
                      }
                      size="small"
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {activeTab === 0 && (
                <Markdown>{nudgeDrafts[nudgeMode].email}</Markdown>
              )}
              {activeTab === 1 && (
                <Markdown>{nudgeDrafts[nudgeMode].linkedin}</Markdown>
              )}
              {activeTab === 2 && (
                <Markdown>{nudgeDrafts[nudgeMode].indeed}</Markdown>
              )}
            </Box>
          </Box>
        )}
        {id !== "negotiateOffer" && id !== "recruiterNudge" && response && (
          <>
            <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
              {response}
            </Typography>
            {(id === "resumeRewrite" || id === "coverLetter") && (
              <Button
                variant="outlined"
                onClick={handleSaveVariant}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save as resume variant"}
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

