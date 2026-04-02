"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";

import RequireAIKey from "../RequireAIKey";
import { askOpenAI } from "@/app/talentforge/_utils/utils";
import {
  getResumes,
  getCustomPromptTileById,
  getJobApplications,
  getOffers,
  getGoals,
  getCurrentCompensation,
  getUserProfile,
  type CustomPromptPlaceholder,
} from "@/app/talentforge/_utils/dataStore";
import {
  formatCurrentCompensationForPrompt,
  formatGoalsForPrompt,
  formatJobApplicationForPrompt,
  formatOfferForPrompt,
  formatResumeForPrompt,
  formatUserProfileForPrompt,
} from "@/app/talentforge/_utils/customPromptFormatting";
import {
  getPromptTiles,
  type PromptContext,
  type PromptTileFilters,
} from "@/app/talentforge/_utils/promptRegistry";

interface PromptTileGridProps {
  onResponse?: (response: string) => void;
  tileIds?: string[];
  initialValues?: Record<string, Record<string, string>>;
  contexts?: PromptContext | PromptContext[];
}

export default function PromptTileGrid({
  onResponse,
  tileIds,
  initialValues = {},
  contexts,
}: PromptTileGridProps) {
  const [values, setValues] = useState<
    Record<string, Record<string, string>>
  >(initialValues);
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const resumes = getResumes();
  const jobApplications = getJobApplications();
  const offers = getOffers();
  const currentCompensation = getCurrentCompensation();
  const goals = getGoals();
  const userProfile = getUserProfile();

  const handleChange = (id: string, key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  };

  const tilesFilters = useMemo(() => {
    const filters: PromptTileFilters = {};
    if (tileIds && tileIds.length > 0) {
      filters.ids = tileIds;
    }
    if (contexts !== undefined) {
      filters.contexts = contexts;
    }
    return filters;
  }, [tileIds, contexts]);

  const tiles = getPromptTiles(tilesFilters);

  const resolveCustomPlaceholderValue = (
    tileId: string,
    placeholder: CustomPromptPlaceholder,
  ): { value: string; ok: boolean; error?: string } => {
    const stored = values[tileId]?.[placeholder.id] || "";
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
        const resume = resumes.find((entry) => entry.id === stored);
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
        const offer = offers.find((entry) => entry.id === stored);
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
    tileId: string,
    placeholder: CustomPromptPlaceholder,
  ) => {
    const stored = values[tileId]?.[placeholder.id] || "";
    const helperText = placeholder.helperText || undefined;
    switch (placeholder.type) {
      case "shortText":
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(tileId, placeholder.id, event.target.value)
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
              handleChange(tileId, placeholder.id, event.target.value)
            }
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            helperText={helperText}
          />
        );
      case "resume":
        if (resumes.length === 0) {
          return (
            <Typography key={placeholder.id} color="text.secondary">
              Upload a resume to use {placeholder.label}.
            </Typography>
          );
        }
        return (
          <TextField
            key={placeholder.id}
            select
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(tileId, placeholder.id, event.target.value)
            }
            fullWidth
            helperText={helperText}
            size="small"
          >
            {resumes.map((resume) => (
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
            select
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(tileId, placeholder.id, event.target.value)
            }
            fullWidth
            helperText={helperText}
            size="small"
          >
            {jobApplications.map((application) => (
              <MenuItem key={application.id} value={application.id}>
                {`${application.role.title} – ${application.role.company}`}
              </MenuItem>
            ))}
          </TextField>
        );
      case "offer":
        if (offers.length === 0) {
          return (
            <Typography key={placeholder.id} color="text.secondary">
              Add an offer to use {placeholder.label}.
            </Typography>
          );
        }
        return (
          <TextField
            key={placeholder.id}
            select
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              handleChange(tileId, placeholder.id, event.target.value)
            }
            fullWidth
            helperText={helperText}
            size="small"
          >
            {offers.map((offer) => (
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

  const runTile = async (id: string) => {
    const tile = tiles.find((entry) => entry.id === id);
    if (!tile) return;

    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const tileValues = values[id] || {};
      const customTile = getCustomPromptTileById(tile.id);

      if (customTile) {
        const resolved = customTile.placeholders.map((placeholder) =>
          resolveCustomPlaceholderValue(tile.id, placeholder),
        );
        const missing = resolved.find((entry) => !entry.ok);
        if (missing) {
          setResponses((prev) => ({
            ...prev,
            [id]: missing.error || "Fill in all required placeholders.",
          }));
          return;
        }
        let prompt = tile.fullPrompt;
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
        setResponses((prev) => ({ ...prev, [id]: message }));
        onResponse?.(message);
        return;
      }

      let prompt = tile.fullPrompt;
      for (const key of tile.inputs) {
        prompt = prompt.replaceAll(`{{${key}}}`, tileValues[key] || "");
      }

      if (tile.id === "resumeRewrite" || tile.id === "resumeCompare") {
        const resume = resumes.find((r) => r.id === tileValues["resumeVariantId"]);
        if (!resume) {
          setResponses((prev) => ({ ...prev, [id]: "Resume not found" }));
          return;
        }
        if (tile.id === "resumeRewrite") {
          prompt = `${prompt}\n\nJob Description:\n${tileValues["jobDescription"]}\n\nResume:\n${resume.content}`;
        } else {
          prompt = prompt.replaceAll("{{resumeContent}}", resume.content);
        }
      }

      const res = await askOpenAI({
        context: "",
        user: prompt,
        system: "You are a helpful assistant.",
        returnFirstResponse: true,
        chatHistory: [],
      });
      const message = res?.message || "";
      setResponses((prev) => ({ ...prev, [id]: message }));
      onResponse?.(message);
    } finally {
      setLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <RequireAIKey>
      <Grid container spacing={2}>
        {tiles.map((tile) => (
          <Grid item xs={12} sm={6} md={4} key={tile.id}>
            <Box>
              <Stack spacing={1}>
                <Typography variant="subtitle1">{tile.display}</Typography>
                {(() => {
                  const customTile = getCustomPromptTileById(tile.id);
                  if (customTile) {
                    return customTile.placeholders.map((placeholder) =>
                      renderCustomPlaceholderInput(tile.id, placeholder),
                    );
                  }
                  return tile.inputs.map((name) =>
                    name === "resumeVariantId" ? (
                      <TextField
                        key={name}
                        label="Resume"
                        select
                        size="small"
                        value={values[tile.id]?.[name] || ""}
                        onChange={(e) =>
                          handleChange(tile.id, name, e.target.value)
                        }
                      >
                        {resumes.map((r) => (
                          <MenuItem key={r.id} value={r.id}>
                            {r.title}
                          </MenuItem>
                        ))}
                      </TextField>
                    ) : name === "jobDescription" ? (
                      <TextField
                        key={name}
                        label={name}
                        value={values[tile.id]?.[name] || ""}
                        onChange={(e) =>
                          handleChange(tile.id, name, e.target.value)
                        }
                        multiline
                        minRows={4}
                        maxRows={10}
                        fullWidth
                      />
                    ) : (
                      <TextField
                        key={name}
                        label={name}
                        size="small"
                        value={values[tile.id]?.[name] || ""}
                        onChange={(e) =>
                          handleChange(tile.id, name, e.target.value)
                        }
                      />
                    ),
                  );
                })()}
                <Button
                  variant="contained"
                  onClick={() => runTile(tile.id)}
                  disabled={loading[tile.id]}
                >
                  {loading[tile.id] ? "Running..." : "Run"}
                </Button>
                {responses[tile.id] && (
                  <Typography
                    variant="body2"
                    sx={{ whiteSpace: "pre-wrap" }}
                  >
                    {responses[tile.id]}
                  </Typography>
                )}
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
    </RequireAIKey>
  );
}
