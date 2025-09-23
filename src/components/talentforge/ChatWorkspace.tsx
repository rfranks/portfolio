"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import type { ResumeEntry } from "@/types";
import {
  getPromptTiles,
  type PromptContext,
  type PromptTileWithMetadata,
} from "@/utils/talentforge/promptRegistry";
import {
  addCustomPromptTile,
  deleteCustomPromptTile,
  getCustomPromptTiles,
  getCurrentCompensation,
  getGoals,
  getJobApplications,
  getOffers,
  getUserProfile,
  updateCustomPromptTile,
  type CustomPromptPlaceholder,
  type CustomPromptTile,
  type CustomPromptTileInput,
} from "@/utils/talentforge/dataStore";
import {
  formatCurrentCompensationForPrompt,
  formatGoalsForPrompt,
  formatJobApplicationForPrompt,
  formatOfferForPrompt,
  formatResumeForPrompt,
  formatUserProfileForPrompt,
} from "@/utils/talentforge/customPromptFormatting";
import { askOpenAI } from "@/utils/talentforge/utils";
import useAIErrorHandler from "@/hooks/talentforge/useAIErrorHandler";

import RequireAIKey from "./RequireAIKey";
import AddPromptDrawer from "./customPrompts/AddPromptDrawer";

interface ChatWorkspaceProps {
  onInsertIntoInbox?: (text: string) => void;
  onSaveResumeVariant?: (text: string, resumeId?: string) => void;
  initialJobDescription?: string;
  initialResumeId?: string;
  resumes?: ResumeEntry[];
}

const WORKSPACE_CONTEXTS: PromptContext[] = ["resume", "jobSearch"];
const HIGHLIGHT_TIMEOUT = 2000;

interface WorkspaceTile extends PromptTileWithMetadata {
  source: "default" | "custom";
  customTile?: CustomPromptTile;
}

export default function ChatWorkspace({
  onInsertIntoInbox,
  onSaveResumeVariant,
  initialJobDescription,
  initialResumeId,
  resumes = [],
}: ChatWorkspaceProps) {
  const [output, setOutput] = useState("");
  const [jobDescription, setJobDescription] = useState(
    initialJobDescription || "",
  );
  const [selectedResumeId, setSelectedResumeId] = useState<string>(
    initialResumeId || "",
  );
  const [customPrompts, setCustomPrompts] = useState<CustomPromptTile[]>(() =>
    getCustomPromptTiles(),
  );
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isRunning, setIsRunning] = useState(false);
  const [promptSearch, setPromptSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create" | "edit">("create");
  const [editingTile, setEditingTile] = useState<CustomPromptTile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CustomPromptTile | null>(
    null,
  );
  const [highlightedTileId, setHighlightedTileId] = useState<string | null>(
    null,
  );
  const notifyAIError = useAIErrorHandler();

  useEffect(() => {
    setJobDescription(initialJobDescription || "");
  }, [initialJobDescription]);

  useEffect(() => {
    if (initialResumeId && resumes.some((resume) => resume.id === initialResumeId)) {
      setSelectedResumeId(initialResumeId);
      return;
    }
    if (resumes.length === 0) {
      setSelectedResumeId("");
      return;
    }
    setSelectedResumeId((prev) => {
      if (prev && resumes.some((resume) => resume.id === prev)) {
        return prev;
      }
      return resumes[0]?.id || "";
    });
  }, [initialResumeId, resumes]);

  useEffect(() => {
    if (!highlightedTileId) return;
    const timer = window.setTimeout(() => setHighlightedTileId(null), HIGHLIGHT_TIMEOUT);
    return () => window.clearTimeout(timer);
  }, [highlightedTileId]);

  const customPromptMap = useMemo(
    () => new Map(customPrompts.map((tile) => [tile.id, tile])),
    [customPrompts],
  );

  const tiles = useMemo<WorkspaceTile[]>(() => {
    const baseTiles = getPromptTiles({ contexts: WORKSPACE_CONTEXTS });
    return baseTiles.map((tile) => {
      const customTile = customPromptMap.get(tile.id);
      return {
        ...tile,
        source: customTile ? "custom" : "default",
        customTile,
      };
    });
  }, [customPromptMap]);

  const [promptSearchQuery, filteredTiles] = useMemo(() => {
    const query = promptSearch.trim().toLowerCase();
    if (!query) {
      return ["", tiles] as const;
    }
    return [query, tiles.filter((tile) => tile.display.toLowerCase().includes(query))] as const;
  }, [tiles, promptSearch]);

  const selectedTile: WorkspaceTile | null = useMemo(
    () => tiles.find((tile) => tile.id === selectedTileId) ?? null,
    [tiles, selectedTileId],
  );

  const jobApplications = getJobApplications();
  const offers = getOffers();
  const currentCompensation = getCurrentCompensation();
  const goals = getGoals();
  const userProfile = getUserProfile();

  const getInputLabel = (key: string) => {
    switch (key) {
      case "jobDescription":
        return "Job Description";
      case "resumeVariantId":
        return "Resume Variant";
      default:
        return key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (char) => char.toUpperCase());
    }
  };

  const isLongTextInput = (key: string) =>
    /(description|summary|context|bullet|offer|letter|market)/i.test(key);

  const getInputValue = (tileId: string, key: string): string => {
    if (key === "jobDescription") {
      return jobDescription;
    }
    if (key === "resumeVariantId") {
      return selectedResumeId;
    }
    return customValues[tileId]?.[key] || "";
  };

  const updatePlaceholderValue = (tileId: string, placeholderId: string, value: string) => {
    setCustomValues((prev) => ({
      ...prev,
      [tileId]: {
        ...prev[tileId],
        [placeholderId]: value,
      },
    }));
  };
  const resolvePlaceholderValue = (
    tile: WorkspaceTile,
    placeholder: CustomPromptPlaceholder,
  ): { value: string; ok: boolean; error?: string } => {
    const stored = customValues[tile.id]?.[placeholder.id] || "";
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

  const canRunSelectedTile = useMemo(() => {
    if (!selectedTile) return false;
    if (selectedTile.source === "custom" && selectedTile.customTile) {
      return selectedTile.customTile.placeholders.every((placeholder) =>
        resolvePlaceholderValue(selectedTile, placeholder).ok,
      );
    }
    return selectedTile.inputs.every((input) => {
      const value = getInputValue(selectedTile.id, input);
      if (input === "resumeVariantId") {
        return Boolean(value);
      }
      return value.trim().length > 0;
    });
  }, [
    selectedTile,
    customValues,
    jobDescription,
    selectedResumeId,
    resumes,
    jobApplications,
    offers,
    currentCompensation,
    goals,
    userProfile,
  ]);

  const handleRun = async () => {
    if (!selectedTile) return;

    setIsRunning(true);
    setOutput("");

    try {
      if (selectedTile.source === "custom" && selectedTile.customTile) {
        const resolved = selectedTile.customTile.placeholders.map((placeholder) =>
          resolvePlaceholderValue(selectedTile, placeholder),
        );
        const missing = resolved.find((entry) => !entry.ok);
        if (missing) {
          setOutput(missing.error || "Fill in all required placeholders.");
          return;
        }
        let prompt = selectedTile.fullPrompt;
        selectedTile.customTile.placeholders.forEach((placeholder, index) => {
          prompt = prompt.replaceAll(`{{${placeholder.id}}}`, resolved[index].value);
        });

        const res = await askOpenAI({
          context: "",
          user: prompt,
          system: "You are a helpful assistant.",
          returnFirstResponse: true,
          chatHistory: [],
        });
        const message = res?.message || "";
        setOutput(message);
        return;
      }

      const inputValues: Record<string, string> = {};
      selectedTile.inputs.forEach((input) => {
        inputValues[input] = getInputValue(selectedTile.id, input) || "";
      });

      let prompt = selectedTile.fullPrompt;

      if (
        selectedTile.id === "resumeRewrite" ||
        selectedTile.id === "resumeCompare"
      ) {
        const resumeId = inputValues["resumeVariantId"];
        const resume = resumes.find((r) => r.id === resumeId);
        if (!resume) {
          setOutput("Resume not found");
          return;
        }

        if (selectedTile.id === "resumeRewrite") {
          prompt = `${prompt}\n\nJob Description:\n${
            inputValues["jobDescription"] || ""
          }\n\nResume:\n${resume.content}`;
        } else {
          prompt = prompt.replaceAll("{{resumeContent}}", resume.content);
        }
      }

      for (const key of selectedTile.inputs) {
        if (
          key === "resumeVariantId" &&
          (selectedTile.id === "resumeRewrite" ||
            selectedTile.id === "resumeCompare")
        ) {
          continue;
        }
        prompt = prompt.replaceAll(`{{${key}}}`, inputValues[key] || "");
      }

      const res = await askOpenAI({
        context: "",
        user: prompt,
        system: "You are a helpful assistant.",
        returnFirstResponse: true,
        chatHistory: [],
      });
      const message = res?.message || "";
      setOutput(message);
    } catch (error) {
      const { message } = notifyAIError(error, {
        getToastMessage: (msg) => `We couldn't run that prompt. ${msg}`,
        retry: () => handleRun(),
      });
      setOutput(`We couldn't run that prompt. ${message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard && output) {
      navigator.clipboard.writeText(output);
    }
  };

  const handleInsert = () => {
    if (!output.trim()) return;
    onInsertIntoInbox?.(output);
  };

  const handleSave = () => {
    if (!output.trim()) return;
    onSaveResumeVariant?.(output, selectedResumeId || undefined);
  };

  const openCreateDrawer = () => {
    setDrawerMode("create");
    setEditingTile(null);
    setDrawerOpen(true);
  };

  const openEditDrawer = (tile: CustomPromptTile) => {
    setDrawerMode("edit");
    setEditingTile(tile);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingTile(null);
  };

  const handleCreatePrompt = (tile: CustomPromptTileInput) => {
    const previousIds = new Set(customPrompts.map((prompt) => prompt.id));
    const updated = addCustomPromptTile(tile);
    setCustomPrompts(updated);
    const created = updated.find((prompt) => !previousIds.has(prompt.id));
    const newId = created?.id || tile.id || null;
    if (newId) {
      setSelectedTileId(newId);
      setHighlightedTileId(newId);
    }
  };

  const handleUpdatePrompt = (tile: CustomPromptTileInput) => {
    if (!tile.id) return;
    const updated = updateCustomPromptTile(tile);
    setCustomPrompts(updated);
    setSelectedTileId(tile.id);
    setHighlightedTileId(tile.id);
  };

  const handleDeletePrompt = (tile: CustomPromptTile) => {
    const updated = deleteCustomPromptTile(tile.id);
    setCustomPrompts(updated);
    setCustomValues((prev) => {
      if (!(tile.id in prev)) return prev;
      const next = { ...prev };
      delete next[tile.id];
      return next;
    });
    if (selectedTileId === tile.id) {
      setSelectedTileId(null);
      setOutput("");
    }
  };

  const handleDrawerSave = (tile: CustomPromptTileInput) => {
    if (drawerMode === "create") {
      handleCreatePrompt(tile);
    } else {
      handleUpdatePrompt(tile);
    }
  };
  const renderCustomPlaceholderInput = (
    tile: WorkspaceTile,
    placeholder: CustomPromptPlaceholder,
  ) => {
    const stored = customValues[tile.id]?.[placeholder.id] || "";
    const helperText = placeholder.helperText || undefined;
    switch (placeholder.type) {
      case "shortText":
        return (
          <TextField
            key={placeholder.id}
            label={placeholder.label}
            value={stored}
            onChange={(event) =>
              updatePlaceholderValue(tile.id, placeholder.id, event.target.value)
            }
            fullWidth
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
              updatePlaceholderValue(tile.id, placeholder.id, event.target.value)
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
              updatePlaceholderValue(tile.id, placeholder.id, event.target.value)
            }
            fullWidth
            helperText={helperText}
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
              updatePlaceholderValue(tile.id, placeholder.id, event.target.value)
            }
            fullWidth
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
              updatePlaceholderValue(tile.id, placeholder.id, event.target.value)
            }
            fullWidth
            helperText={helperText}
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

  return (
    <RequireAIKey>
      <Stack spacing={2}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Prompts
            </Typography>
            <Stack spacing={1}>
              <TextField
                label="Search prompts"
                value={promptSearch}
                onChange={(event) => setPromptSearch(event.target.value)}
                fullWidth
                InputProps={{
                  endAdornment: promptSearch ? (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="Clear prompt search"
                        onClick={() => setPromptSearch("")}
                        edge="end"
                        size="small"
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : undefined,
                }}
              />
              {filteredTiles.length > 0 ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ flexWrap: "wrap", rowGap: 1 }}
                >
                  {filteredTiles.map((tile) => {
                    const isSelected = tile.id === selectedTileId;
                    const isHighlighted = tile.id === highlightedTileId && !isSelected;
                    return (
                      <Chip
                        key={tile.id}
                        label={tile.display}
                        onClick={() => setSelectedTileId(tile.id)}
                        variant={isSelected || isHighlighted ? "filled" : "outlined"}
                        color={isSelected || isHighlighted ? "primary" : "default"}
                        sx={{
                          transition:
                            "background-color 300ms ease, color 300ms ease, border-color 300ms ease",
                        }}
                      />
                    );
                  })}
                  <Chip
                    icon={<AddIcon fontSize="small" />}
                    label="Add Prompt"
                    onClick={openCreateDrawer}
                    variant="outlined"
                    color="primary"
                    sx={{
                      transition:
                        "background-color 300ms ease, color 300ms ease, border-color 300ms ease",
                    }}
                  />
                </Stack>
              ) : (
                <Typography color="text.secondary">
                  {promptSearchQuery
                    ? "No prompts match your search."
                    : "No prompts available."}
                </Typography>
              )}
            </Stack>
          </Box>
          {selectedTile ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6">{selectedTile.display}</Typography>
                {selectedTile.source === "custom" && selectedTile.customTile && (
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<EditIcon fontSize="small" />}
                      onClick={() => openEditDrawer(selectedTile.customTile!)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      startIcon={<DeleteIcon fontSize="small" />}
                      onClick={() => setConfirmDelete(selectedTile.customTile!)}
                    >
                      Delete
                    </Button>
                  </Stack>
                )}
              </Stack>
              {selectedTile.source === "custom" && selectedTile.customTile ? (
                <Stack spacing={2}>
                  {selectedTile.customTile.placeholders.length === 0 && (
                    <Typography color="text.secondary">
                      No inputs required. Run the prompt to generate a response.
                    </Typography>
                  )}
                  {selectedTile.customTile.placeholders.map((placeholder) => (
                    <Stack key={placeholder.id} spacing={1}>
                      {renderCustomPlaceholderInput(selectedTile, placeholder)}
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Stack spacing={2}>
                  {selectedTile.inputs.length === 0 && (
                    <Typography color="text.secondary">
                      No additional information required. Run the prompt to generate a response.
                    </Typography>
                  )}
                  {selectedTile.inputs.map((input) => {
                    if (input === "resumeVariantId") {
                      if (resumes.length === 0) {
                        return (
                          <Typography key={input} color="text.secondary">
                            Upload a resume to unlock resume-aware prompts.
                          </Typography>
                        );
                      }
                      return (
                        <TextField
                          key={input}
                          select
                          label={getInputLabel(input)}
                          value={selectedResumeId}
                          onChange={(event) => setSelectedResumeId(event.target.value)}
                          fullWidth
                        >
                          {resumes.map((resume) => (
                            <MenuItem key={resume.id} value={resume.id}>
                              {resume.title}
                            </MenuItem>
                          ))}
                        </TextField>
                      );
                    }

                    const value = getInputValue(selectedTile.id, input);
                    const isLong = isLongTextInput(input);
                    const minRows = input === "jobDescription" ? 4 : isLong ? 3 : undefined;

                    return (
                      <TextField
                        key={input}
                        label={getInputLabel(input)}
                        value={value}
                        onChange={(event) =>
                          setCustomValues((prev) => ({
                            ...prev,
                            [selectedTile.id]: {
                              ...prev[selectedTile.id],
                              [input]: event.target.value,
                            },
                          }))
                        }
                        fullWidth
                        multiline={Boolean(minRows)}
                        minRows={minRows}
                      />
                    );
                  })}
                  <Button
                    variant="contained"
                    onClick={handleRun}
                    disabled={isRunning || !canRunSelectedTile}
                  >
                    {isRunning ? "Running..." : "Run Prompt"}
                  </Button>
                </Stack>
              )}
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Select a prompt chip to get started.
            </Typography>
          )}
        </Stack>
        <Box
          sx={{
            border: 1,
            borderColor: "divider",
            p: 2,
            borderRadius: 1,
            minHeight: 200,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Output
          </Typography>
          <Box
            sx={{
              whiteSpace: "pre-wrap",
              mb: 2,
              minHeight: 140,
              color: output || isRunning ? "inherit" : "text.secondary",
            }}
          >
            {isRunning
              ? "Generating response..."
              : output || "Select a prompt and run it to see results here."}
          </Box>
          {onSaveResumeVariant && resumes.length > 0 && (
            <TextField
              select
              label="Resume Variant"
              value={selectedResumeId}
              onChange={(event) => setSelectedResumeId(event.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            >
              {resumes.map((resume) => (
                <MenuItem key={resume.id} value={resume.id}>
                  {resume.title}
                </MenuItem>
              ))}
            </TextField>
          )}
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", rowGap: 1 }}>
            <Chip
              label="Copy"
              onClick={handleCopy}
              disabled={!output}
              variant="outlined"
            />
            {onInsertIntoInbox && (
              <Chip
                label="Insert into Inbox"
                onClick={handleInsert}
                disabled={!output}
                variant="outlined"
              />
            )}
            {onSaveResumeVariant && (
              <Chip
                label="Save Resume Variant"
                onClick={handleSave}
                disabled={!onSaveResumeVariant || !output}
                color="primary"
                variant="filled"
              />
            )}
          </Stack>
        </Box>
      </Stack>
      <AddPromptDrawer
        open={drawerOpen}
        mode={drawerMode}
        onClose={closeDrawer}
        onSave={handleDrawerSave}
        initialValue={drawerMode === "edit" ? editingTile ?? undefined : undefined}
      />
      <Dialog open={Boolean(confirmDelete)} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Delete prompt</DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDelete
              ? `Are you sure you want to delete ${confirmDelete.displayName}?`
              : "Are you sure you want to delete this prompt?"}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (confirmDelete) {
                handleDeletePrompt(confirmDelete);
              }
              setConfirmDelete(null);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </RequireAIKey>
  );
}
