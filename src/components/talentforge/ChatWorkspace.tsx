"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Chip,
} from "@mui/material";

import type { ResumeEntry } from "@/types";
import {
  getPromptTiles,
  type PromptContext,
} from "@/utils/talentforge/promptRegistry";
import { askOpenAI } from "@/utils/talentforge/utils";

import RequireAIKey from "./RequireAIKey";

interface ChatWorkspaceProps {
  onInsertIntoInbox?: (text: string) => void;
  onSaveResumeVariant?: (text: string, resumeId?: string) => void;
  initialJobDescription?: string;
  initialResumeId?: string;
  resumes?: ResumeEntry[];
}

const WORKSPACE_CONTEXTS: PromptContext[] = ["resume", "jobSearch"];

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

  const tiles = useMemo(
    () => getPromptTiles({ contexts: WORKSPACE_CONTEXTS }),
    [],
  );

  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [customValues, setCustomValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isRunning, setIsRunning] = useState(false);

  const selectedTile: PromptTileWithMetadata | null = useMemo(
    () => tiles.find((tile) => tile.id === selectedTileId) ?? null,
    [tiles, selectedTileId],
  );

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

  const handleInputChange = (key: string, value: string) => {
    if (!selectedTileId) return;
    if (key === "jobDescription") {
      setJobDescription(value);
      return;
    }
    if (key === "resumeVariantId") {
      setSelectedResumeId(value);
      return;
    }
    setCustomValues((prev) => ({
      ...prev,
      [selectedTileId]: {
        ...prev[selectedTileId],
        [key]: value,
      },
    }));
  };

  const canRunSelectedTile = selectedTile
    ? selectedTile.inputs.every((input) => {
        const value = getInputValue(selectedTile.id, input);
        if (input === "resumeVariantId") {
          return Boolean(value);
        }
        return value.trim().length > 0;
      })
    : false;

  const handleRun = async () => {
    if (!selectedTile) return;

    const inputValues: Record<string, string> = {};
    selectedTile.inputs.forEach((input) => {
      inputValues[input] = getInputValue(selectedTile.id, input) || "";
    });

    setIsRunning(true);
    setOutput("");

    try {
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
    } catch {
      setOutput("An error occurred while running the prompt.");
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

  return (
    <RequireAIKey>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Prompts
              </Typography>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", rowGap: 1 }}
              >
                {tiles.map((tile) => {
                  const isSelected = tile.id === selectedTileId;
                  return (
                    <Chip
                      key={tile.id}
                      label={tile.display}
                      onClick={() => setSelectedTileId(tile.id)}
                      variant={isSelected ? "filled" : "outlined"}
                      color={isSelected ? "primary" : "default"}
                    />
                  );
                })}
              </Stack>
            </Box>
            {selectedTile ? (
              <Stack spacing={2}>
                <Typography variant="h6">{selectedTile.display}</Typography>
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
                        onChange={(e) => handleInputChange(input, e.target.value)}
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
                      onChange={(e) => handleInputChange(input, e.target.value)}
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
            ) : (
              <Typography color="text.secondary">
                Select a prompt chip to get started.
              </Typography>
            )}
          </Stack>
        </Box>
        <Box
          sx={{
            flexBasis: { md: "30%" },
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
              onChange={(e) => setSelectedResumeId(e.target.value)}
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
      </Box>
    </RequireAIKey>
  );
}

