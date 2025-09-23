"use client";

import { useEffect, useMemo, useState } from "react";
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
  MenuItem,
} from "@mui/material";
import { ContentCopy } from "@mui/icons-material";
import Markdown from "react-markdown";

import { askOpenAI } from "@/utils/talentforge/utils";
import {
  getResumes,
  addResume,
  addOffer,
  getCustomPromptTileById,
  getJobApplications,
  getOffers,
  getCurrentCompensation,
  getGoals,
  getUserProfile,
  type CustomPromptPlaceholder,
} from "@/utils/talentforge/dataStore";
import {
  formatCurrentCompensationForPrompt,
  formatGoalsForPrompt,
  formatJobApplicationForPrompt,
  formatOfferForPrompt,
  formatResumeForPrompt,
  formatUserProfileForPrompt,
} from "@/utils/talentforge/customPromptFormatting";
import { tagResume } from "@/utils/talentforge/tagging";
import { parseResumeText } from "@/utils/talentforge/resumeIngest";
import { v4 as uuid } from "uuid";
import type { ApplicationRecord, ResumeEntry, Offer } from "@/types";

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

  const resumesList = getResumes();
  const jobApplications = getJobApplications();
  const offersList = getOffers();
  const currentCompensation = getCurrentCompensation();
  const goals = getGoals();
  const userProfile = getUserProfile();

  const inputsKey = useMemo(() => inputs.join("|"), [inputs]);
  const customTile = useMemo(
    () => getCustomPromptTileById(id),
    [id, fullPrompt, inputsKey],
  );

  const loadSelectedResume = () =>
    resumesList.find((r) => r.id === values["resumeVariantId"]);

  const resolveCustomPlaceholderValue = (
    placeholder: CustomPromptPlaceholder,
  ): { value: string; ok: boolean; error?: string } => {
    const stored = values[placeholder.id] || "";
    switch (placeholder.type) {
      case "shortText":
      case "longText": {
        const ok = placeholder.required === false || stored.trim().length > 0;
        return {
          value: stored,
          ok,
          error: ok ? undefined : `Enter a value for ${placeholder.label}.`,
        };
      }
      case "resume": {
        const resume = resumesList.find((entry) => entry.id === stored);
        if (!resume) {
          const ok = placeholder.required === false;
          return {
            value: "",
            ok,
            error: ok
              ? undefined
              : `Select a resume for ${placeholder.label}.`,
          };
        }
        return { value: formatResumeForPrompt(resume), ok: true };
      }
      case "jobApplication": {
        const application = jobApplications.find((entry) => entry.id === stored);
        if (!application) {
          const ok = placeholder.required === false;
          return {
            value: "",
            ok,
            error: ok
              ? undefined
              : `Choose a job application for ${placeholder.label}.`,
          };
        }
        return { value: formatJobApplicationForPrompt(application), ok: true };
      }
      case "offer": {
        const offer = offersList.find((entry) => entry.id === stored);
        if (!offer) {
          const ok = placeholder.required === false;
          return {
            value: "",
            ok,
            error: ok
              ? undefined
              : `Select an offer for ${placeholder.label}.`,
          };
        }
        return { value: formatOfferForPrompt(offer), ok: true };
      }
      case "currentCompensation": {
        const value = formatCurrentCompensationForPrompt(currentCompensation);
        const ok = placeholder.required === false || value.trim().length > 0;
        return {
          value,
          ok,
          error: ok
            ? undefined
            : "Add your current compensation in Settings to use this placeholder.",
        };
      }
      case "userProfile": {
        const value = formatUserProfileForPrompt(userProfile);
        const ok = placeholder.required === false || value.trim().length > 0;
        return {
          value,
          ok,
          error: ok
            ? undefined
            : "Update your profile details to use this placeholder.",
        };
      }
      case "goals": {
        const value = formatGoalsForPrompt(goals);
        const ok = placeholder.required === false || goals.length > 0;
        return {
          value,
          ok,
          error: ok
            ? undefined
            : "Select at least one goal to use this placeholder.",
        };
      }
      default:
        return { value: stored, ok: true };
    }
  };

  const renderCustomPlaceholderInput = (
    placeholder: CustomPromptPlaceholder,
  ) => {
    const stored = values[placeholder.id] || "";
    const helperText = placeholder.helperText || undefined;
    switch (placeholder.type) {
      case "shortText":
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(placeholder.id, event.target.value)
            }
            fullWidth
            size="small"
            helperText={helperText}
          />
        );
      case "longText":
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(placeholder.id, event.target.value)
            }
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            helperText={helperText}
          />
        );
      case "resume":
        if (resumesList.length === 0) {
          return (
            <Typography key={placeholder.id} color="text.secondary">
              Upload a resume to use {placeholder.label}.
            </Typography>
          );
        }
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(placeholder.id, event.target.value)
            }
            select
            fullWidth
            size="small"
            helperText={helperText}
          >
            {resumesList.map((resume) => (
              <MenuItem key={resume.id} value={resume.id}>
                {resume.title}
              </MenuItem>
            ))}
          </TextField>
        );
      case "jobApplication":
        if (jobApplications.length === 0) {
          return (
            <Typography key={placeholder.id} color="text.secondary">
              Track a job application to use {placeholder.label}.
            </Typography>
          );
        }
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(placeholder.id, event.target.value)
            }
            select
            fullWidth
            size="small"
            helperText={helperText}
          >
            {jobApplications.map((application) => (
              <MenuItem key={application.id} value={application.id}>
                {`${application.role.title} – ${application.role.company}`}
              </MenuItem>
            ))}
          </TextField>
        );
      case "offer":
        if (offersList.length === 0) {
          return (
            <Typography key={placeholder.id} color="text.secondary">
              Add an offer to use {placeholder.label}.
            </Typography>
          );
        }
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(placeholder.id, event.target.value)
            }
            select
            fullWidth
            size="small"
            helperText={helperText}
          >
            {offersList.map((offer) => (
              <MenuItem key={offer.id} value={offer.id}>
                {offer.application.role.title} – {offer.application.role.company}
              </MenuItem>
            ))}
          </TextField>
        );
      case "currentCompensation": {
        const value = formatCurrentCompensationForPrompt(currentCompensation);
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={value || "No compensation details saved."}
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            InputProps={{ readOnly: true }}
            helperText={helperText}
          />
        );
      }
      case "userProfile": {
        const value = formatUserProfileForPrompt(userProfile);
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={value || "Add profile details to use this placeholder."}
            fullWidth
            multiline
            minRows={2}
            maxRows={6}
            InputProps={{ readOnly: true }}
            helperText={helperText}
          />
        );
      }
      case "goals": {
        const value = formatGoalsForPrompt(goals);
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={value || "Select goals during onboarding to use this placeholder."}
            fullWidth
            InputProps={{ readOnly: true }}
            helperText={helperText}
          />
        );
      }
      default:
        return null;
    }
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      setResponse("");
      setOfferDrafts(null);
      setNudgeDrafts(null);

      if (customTile) {
        const resolved = customTile.placeholders.map((placeholder) =>
          resolveCustomPlaceholderValue(placeholder),
        );
        const missing = resolved.find((entry) => !entry.ok);
        if (missing) {
          setResponse(missing.error || "Fill in all required placeholders.");
          return;
        }
        let prompt = fullPrompt;
        customTile.placeholders.forEach((placeholder, index) => {
          prompt = prompt.replaceAll(
            `{{${placeholder.id}}}`,
            resolved[index].value,
          );
        });
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
        return;
      }

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
        const comparisonContext = `Offer A:\n${values["offerA"] || ""}\n\nOffer B:\n${values["offerB"] || ""}`;
        const res = await askOpenAI({
          context: comparisonContext,
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
        const negotiateContext = `Offer Letter:\n${values["offerLetter"] || ""}\n\nCurrent Compensation:\n${values["currentComp"] || ""}`;
        const res = await askOpenAI({
          context: negotiateContext,
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
        const sourceResume = resumesList.find(
          (entry) => entry.id === values["resumeVariantId"],
        );
        if (!sourceResume) return;
        const tags = await tagResume(response);
        const parsed = parseResumeText(response);
        const newResume: ResumeEntry = {
          ...sourceResume,
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
      <Stack spacing={1}>
        <Typography variant="subtitle1">{display}</Typography>
        {customTile ? (
          customTile.placeholders.length === 0 ? (
            <Typography color="text.secondary">
              No inputs required. Run the prompt to generate a response.
            </Typography>
          ) : (
            customTile.placeholders.map((placeholder) =>
              renderCustomPlaceholderInput(placeholder),
            )
          )
        ) : (
          inputs.map((name) =>
            name === "jobDescription" ? (
              <TextField
                key={name}
                label={name}
                value={values[name] || ""}
                onChange={(e) => handleChange(name, e.target.value)}
                multiline
                minRows={4}
                maxRows={10}
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
          )
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

