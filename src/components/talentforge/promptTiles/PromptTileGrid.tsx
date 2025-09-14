"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from "@mui/material";

import OpenAiKeyModal from "../OpenAiKeyModal";
import {
  askOpenAI,
  hasValidOpenAIKey,
} from "@/utils/talentforge/utils";
import { getResumes } from "@/utils/talentforge/dataStore";
import { PROMPT_TILES, type PromptTileDefinition } from "@/consts/promptTiles";

const registry: Record<string, PromptTileDefinition> = PROMPT_TILES;

interface PromptTileGridProps {
  onResponse?: (response: string) => void;
  tileIds?: string[];
  initialValues?: Record<string, Record<string, string>>;
}

export default function PromptTileGrid({
  onResponse,
  tileIds,
  initialValues = {},
}: PromptTileGridProps) {
  const [values, setValues] = useState<
    Record<string, Record<string, string>>
  >(initialValues);
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [openKeyModal, setOpenKeyModal] = useState(false);

  const handleChange = (id: string, key: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [id]: { ...prev[id], [key]: value },
    }));
  };

  const runTile = async (id: string) => {
    const tile = registry[id];
    if (!tile) return;

    const valid = await hasValidOpenAIKey();
    if (!valid) {
      setOpenKeyModal(true);
      return;
    }

    setLoading((prev) => ({ ...prev, [id]: true }));
    try {
      const tileValues = values[id] || {};
      let prompt = tile.fullPrompt;
      for (const key of tile.inputs) {
        prompt = prompt.replaceAll(`{{${key}}}`, tileValues[key] || "");
      }

      if (tile.id === "resumeRewrite") {
        const resume = getResumes().find(
          (r) => r.id === tileValues["resumeVariantId"],
        );
        if (!resume) {
          setResponses((prev) => ({ ...prev, [id]: "Resume not found" }));
          return;
        }
        prompt = `${prompt}\n\nJob Description:\n${tileValues["jobDescription"]}\n\nResume:\n${resume.content}`;
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

  const tiles = tileIds
    ? tileIds.map((id) => registry[id]).filter(Boolean)
    : Object.values(registry);

  return (
    <>
      <OpenAiKeyModal
        open={openKeyModal}
        onClose={() => setOpenKeyModal(false)}
      />
      <Grid container spacing={2}>
        {tiles.map((tile) => (
          <Grid item xs={12} sm={6} md={4} key={tile.id}>
            <Box>
              <Stack spacing={1}>
                <Typography variant="subtitle1">{tile.display}</Typography>
                {tile.inputs.map((name) => (
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
                      {getResumes().map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.label}
                        </MenuItem>
                      ))}
                    </TextField>
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
                  )
                ))}
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
    </>
  );
}

