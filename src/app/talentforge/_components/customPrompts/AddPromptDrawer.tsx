"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import { v4 as uuid } from "uuid";

import type {
  CustomPromptPlaceholder,
  CustomPromptPlaceholderType,
  CustomPromptTile,
  CustomPromptTileInput,
} from "@/app/talentforge/_utils/dataStore";
import {
  PROMPT_CONTEXT_LABELS,
  PROMPT_CONTEXT_ORDER,
} from "@/app/talentforge/_utils/promptRegistry";
import type { PromptContext } from "@/app/talentforge/_utils/promptTypes";

const PLACEHOLDER_TYPE_OPTIONS: Array<{
  value: CustomPromptPlaceholderType;
  label: string;
  description: string;
}> = [
  {
    value: "shortText",
    label: "Short text",
    description: "Collect a single-line response entered by the user.",
  },
  {
    value: "longText",
    label: "Long text",
    description: "Capture multi-line input such as descriptions or summaries.",
  },
  {
    value: "resume",
    label: "Resume picker",
    description: "Let the user select one of their uploaded resumes.",
  },
  {
    value: "jobApplication",
    label: "Job application",
    description: "Select from saved job applications to provide context.",
  },
  {
    value: "offer",
    label: "Offer",
    description: "Insert details from a recorded offer.",
  },
  {
    value: "currentCompensation",
    label: "Current compensation",
    description: "Automatically include the user's saved compensation.",
  },
  {
    value: "userProfile",
    label: "User profile",
    description: "Insert contact information from the user's profile.",
  },
  {
    value: "goals",
    label: "Goals",
    description: "Reference the goals selected during onboarding.",
  },
];

interface PlaceholderFormState extends CustomPromptPlaceholder {
  key: string;
  idLocked: boolean;
}

interface FormErrors {
  displayName?: string;
  contexts?: string;
  placeholdersGeneral?: string;
  placeholderIds?: Record<string, string | undefined>;
  placeholderLabels?: Record<string, string | undefined>;
}

const slugifyId = (value: string) =>
  value
    .trim()
    .replace(/[^a-zA-Z0-9_]+/g, "_")
    .replace(/_{2,}/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();

function createPlaceholderState(): PlaceholderFormState {
  return {
    key: uuid(),
    id: "",
    label: "",
    type: "shortText",
    helperText: "",
    required: true,
    idLocked: false,
  };
}

function ensureUniqueId(
  placeholders: PlaceholderFormState[],
  candidate: string,
  currentKey: string,
): string {
  const existing = new Set(
    placeholders
      .filter((placeholder) => placeholder.key !== currentKey)
      .map((placeholder) => placeholder.id.toLowerCase()),
  );
  if (!candidate) {
    let index = placeholders.length + 1;
    let generated = `field_${index}`;
    while (existing.has(generated.toLowerCase())) {
      index += 1;
      generated = `field_${index}`;
    }
    return generated;
  }
  let base = candidate;
  let suffix = 1;
  while (existing.has(base.toLowerCase())) {
    base = `${candidate}_${suffix}`;
    suffix += 1;
  }
  return base;
}

interface AddPromptDrawerProps {
  open: boolean;
  mode: "create" | "edit";
  onClose: () => void;
  onSave: (tile: CustomPromptTileInput) => void;
  initialValue?: CustomPromptTile | null;
}

export default function AddPromptDrawer({
  open,
  mode,
  onClose,
  onSave,
  initialValue,
}: AddPromptDrawerProps) {
  const [displayName, setDisplayName] = useState("");
  const [fullText, setFullText] = useState("");
  const [contexts, setContexts] = useState<PromptContext[]>(["resume"]);
  const [placeholders, setPlaceholders] = useState<PlaceholderFormState[]>([
    createPlaceholderState(),
  ]);
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (!open) return;
    if (initialValue) {
      setDisplayName(initialValue.displayName);
      setFullText(initialValue.fullText || "");
      setContexts(initialValue.contexts.length > 0 ? initialValue.contexts : ["resume"]);
      setPlaceholders(
        initialValue.placeholders.length > 0
          ? initialValue.placeholders.map((placeholder) => ({
              ...placeholder,
              key: uuid(),
              idLocked: true,
            }))
          : [createPlaceholderState()],
      );
    } else {
      setDisplayName("");
      setFullText("");
      setContexts(["resume"]);
      setPlaceholders([createPlaceholderState()]);
    }
    setErrors({});
  }, [open, initialValue]);

  const contextSelections = useMemo(
    () => new Set(contexts),
    [contexts],
  );

  const toggleContext = (context: PromptContext) => {
    setContexts((prev) => {
      const set = new Set(prev);
      if (set.has(context)) {
        set.delete(context);
      } else {
        set.add(context);
      }
      return Array.from(set);
    });
  };

  const handlePlaceholderLabelChange = (key: string, value: string) => {
    setPlaceholders((prev) =>
      prev.map((placeholder) => {
        if (placeholder.key !== key) return placeholder;
        const next: PlaceholderFormState = { ...placeholder, label: value };
        if (!placeholder.idLocked) {
          const normalized = slugifyId(value);
          next.id = ensureUniqueId(prev, normalized, key);
        }
        return next;
      }),
    );
  };

  const handlePlaceholderIdChange = (key: string, value: string) => {
    setPlaceholders((prev) =>
      prev.map((placeholder) => {
        if (placeholder.key !== key) return placeholder;
        const normalized = slugifyId(value);
        return {
          ...placeholder,
          id: ensureUniqueId(prev, normalized, key),
          idLocked: true,
        };
      }),
    );
  };

  const handlePlaceholderTypeChange = (
    key: string,
    type: CustomPromptPlaceholderType,
  ) => {
    setPlaceholders((prev) =>
      prev.map((placeholder) =>
        placeholder.key === key ? { ...placeholder, type } : placeholder,
      ),
    );
  };

  const handlePlaceholderHelperChange = (key: string, value: string) => {
    setPlaceholders((prev) =>
      prev.map((placeholder) =>
        placeholder.key === key
          ? { ...placeholder, helperText: value }
          : placeholder,
      ),
    );
  };

  const handlePlaceholderRequiredChange = (key: string, required: boolean) => {
    setPlaceholders((prev) =>
      prev.map((placeholder) =>
        placeholder.key === key ? { ...placeholder, required } : placeholder,
      ),
    );
  };

  const handleRemovePlaceholder = (key: string) => {
    setPlaceholders((prev) =>
      prev.length > 1 ? prev.filter((placeholder) => placeholder.key !== key) : prev,
    );
  };

  const handleAddPlaceholder = () => {
    setPlaceholders((prev) => [...prev, createPlaceholderState()]);
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      nextErrors.displayName = "Add a display name for this prompt.";
    }
    if (contexts.length === 0) {
      nextErrors.contexts = "Select at least one workspace context.";
    }
    if (placeholders.length === 0) {
      nextErrors.placeholdersGeneral = "Add at least one placeholder.";
    }
    const idErrors: Record<string, string | undefined> = {};
    const labelErrors: Record<string, string | undefined> = {};
    const normalizedIds = placeholders.map((placeholder) =>
      slugifyId(placeholder.id || placeholder.label),
    );
    placeholders.forEach((placeholder, index) => {
      const trimmedId = normalizedIds[index];
      const trimmedLabel = placeholder.label.trim();
      if (!trimmedId) {
        idErrors[placeholder.key] = "Provide a placeholder identifier.";
      }
      if (!trimmedLabel) {
        labelErrors[placeholder.key] = "Provide a placeholder label.";
      }
      if (
        trimmedId &&
        normalizedIds.filter((value) => value === trimmedId).length > 1 &&
        !idErrors[placeholder.key]
      ) {
        idErrors[placeholder.key] = "Each placeholder needs a unique identifier.";
      }
    });
    if (Object.keys(idErrors).length > 0) {
      nextErrors.placeholderIds = idErrors;
    }
    if (Object.keys(labelErrors).length > 0) {
      nextErrors.placeholderLabels = labelErrors;
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const normalizedPlaceholders: CustomPromptPlaceholder[] = placeholders.map(
      ({ id, label, type, helperText, required }) => ({
        id: slugifyId(id || label),
        label: label.trim(),
        type,
        helperText: helperText?.trim() || undefined,
        required: required !== false,
      }),
    );
    const payload: CustomPromptTileInput = {
      id: initialValue?.id,
      displayName: displayName.trim(),
      fullText,
      contexts: contexts.length > 0 ? contexts : ["resume"],
      placeholders: normalizedPlaceholders,
    };
    onSave(payload);
    onClose();
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose} keepMounted>
      <Box
        sx={{
          width: 420,
          maxWidth: "100vw",
          display: "flex",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <Stack direction="row" alignItems="center" sx={{ p: 2 }} spacing={1}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {mode === "create" ? "Add custom prompt" : "Edit custom prompt"}
          </Typography>
          <IconButton onClick={onClose} aria-label="Close prompt drawer">
            <CloseIcon />
          </IconButton>
        </Stack>
        <Divider />
        <Box sx={{ p: 3, overflowY: "auto", flexGrow: 1 }}>
          <Stack spacing={3}>
            <Stack spacing={1}>
              <TextField
                label="Display name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                error={Boolean(errors.displayName)}
                helperText={errors.displayName}
                fullWidth
              />
              <TextField
                label="Prompt text"
                value={fullText}
                onChange={(event) => setFullText(event.target.value)}
                multiline
                minRows={6}
                maxRows={12}
                fullWidth
                helperText="This text is sent to the model with placeholder values substituted."
              />
            </Stack>
            <FormControl error={Boolean(errors.contexts)} component="fieldset">
              <FormLabel component="legend">Contexts</FormLabel>
              <FormGroup>
                {PROMPT_CONTEXT_ORDER.map((context) => (
                  <FormControlLabel
                    key={context}
                    control={
                      <Checkbox
                        checked={contextSelections.has(context)}
                        onChange={() => toggleContext(context)}
                      />
                    }
                    label={PROMPT_CONTEXT_LABELS[context]}
                  />
                ))}
              </FormGroup>
              {errors.contexts && (
                <FormHelperText>{errors.contexts}</FormHelperText>
              )}
            </FormControl>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  Placeholders
                </Typography>
                <IconButton
                  aria-label="Add placeholder"
                  onClick={handleAddPlaceholder}
                  size="small"
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Stack>
              {errors.placeholdersGeneral && (
                <FormHelperText error>{errors.placeholdersGeneral}</FormHelperText>
              )}
              {placeholders.map((placeholder) => {
                const idError = errors.placeholderIds?.[placeholder.key];
                const labelError = errors.placeholderLabels?.[placeholder.key];
                return (
                  <Box
                    key={placeholder.key}
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 2,
                    }}
                  >
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <TextField
                          label="Placeholder label"
                          value={placeholder.label}
                          onChange={(event) =>
                            handlePlaceholderLabelChange(
                              placeholder.key,
                              event.target.value,
                            )
                          }
                          error={Boolean(labelError)}
                          helperText={labelError || "Shown beside the input control."}
                          fullWidth
                        />
                        <TextField
                          label="Identifier"
                          value={placeholder.id}
                          onChange={(event) =>
                            handlePlaceholderIdChange(
                              placeholder.key,
                              event.target.value,
                            )
                          }
                          error={Boolean(idError)}
                          helperText={
                            idError ||
                            "Used inside the prompt as {{identifier}}"
                          }
                          fullWidth
                        />
                        <IconButton
                          aria-label="Remove placeholder"
                          onClick={() => handleRemovePlaceholder(placeholder.key)}
                          size="small"
                          disabled={placeholders.length === 1}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                      <Stack spacing={1}>
                        <FormControl fullWidth>
                          <InputLabel id={`placeholder-type-${placeholder.key}`}>
                            Placeholder type
                          </InputLabel>
                          <Select
                            labelId={`placeholder-type-${placeholder.key}`}
                            value={placeholder.type}
                            label="Placeholder type"
                            onChange={(event) =>
                              handlePlaceholderTypeChange(
                                placeholder.key,
                                event.target.value as CustomPromptPlaceholderType,
                              )
                            }
                          >
                            {PLACEHOLDER_TYPE_OPTIONS.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                <Stack spacing={0.5}>
                                  <Typography>{option.label}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.description}
                                  </Typography>
                                </Stack>
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Helper text"
                          value={placeholder.helperText || ""}
                          onChange={(event) =>
                            handlePlaceholderHelperChange(
                              placeholder.key,
                              event.target.value,
                            )
                          }
                          multiline
                          minRows={2}
                          maxRows={4}
                          fullWidth
                          helperText="Optional guidance shown under the input."
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={placeholder.required !== false}
                              onChange={(event) =>
                                handlePlaceholderRequiredChange(
                                  placeholder.key,
                                  event.target.checked,
                                )
                              }
                            />
                          }
                          label="Required placeholder"
                        />
                      </Stack>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          </Stack>
        </Box>
        <Divider />
        <Stack direction="row" spacing={2} sx={{ p: 2, justifyContent: "flex-end" }}>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {mode === "create" ? "Save prompt" : "Update prompt"}
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
