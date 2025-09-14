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

export interface PromptTileProps {
  id: string;
  display: string;
  fullPrompt: string;
  inputs: string[];
}

export default function Tile({
  id,
  display,
  fullPrompt,
  inputs,
}: PromptTileProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [openKeyModal, setOpenKeyModal] = useState(false);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleRun = async () => {
    const valid = await hasValidOpenAIKey();
    if (!valid) {
      setOpenKeyModal(true);
      return;
    }

    let prompt = fullPrompt;
    for (const key of inputs) {
      prompt = prompt.replaceAll(`{{${key}}}`, values[key] || "");
    }

    setLoading(true);
    try {
      const res = await askOpenAI({
        context: "",
        user: prompt,
        system: "You are a helpful assistant.",
        returnFirstResponse: true,
        chatHistory: [],
      });
      setResponse(res?.message || "");
    } finally {
      setLoading(false);
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
        {response && (
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
        )}
      </Stack>
    </Box>
  );
}

