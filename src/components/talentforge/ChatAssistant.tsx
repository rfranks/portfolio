"use client";

import { useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";

import { PROMPT_TEMPLATES } from "@/consts/prompts";
import { askOpenAI, hasOpenAIKey } from "@/utils/talentforge/utils";
import OpenAiKeyModal from "./OpenAiKeyModal";
import { ChatMessage } from "@/types/talentforge/types";

export default function ChatAssistant() {
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<(ChatMessage | null)[]>([]);
  const [openKeyModal, setOpenKeyModal] = useState(false);

  const handleChange = (event: SelectChangeEvent) => {
    setSelectedPrompt(event.target.value as string);
  };

  const handleSubmit = () => {
    if (!selectedPrompt) return;
    const fullText = PROMPT_TEMPLATES[selectedPrompt]?.fullText;
    if (!fullText) return;
    if (!hasOpenAIKey()) {
      setOpenKeyModal(true);
      return;
    }

    askOpenAI({
      context: "",
      user: fullText,
      system: "You are a helpful assistant.",
      returnFirstResponse: true,
      chatHistory,
      onChatHistoryChange: setChatHistory,
    });
  };

  return (
    <Box>
      <OpenAiKeyModal
        open={openKeyModal}
        onClose={() => setOpenKeyModal(false)}
      />
      <Stack spacing={2}>
        <Select
          value={selectedPrompt}
          onChange={handleChange}
          displayEmpty
          fullWidth
        >
          <MenuItem value="" disabled>
            Select a prompt
          </MenuItem>
          {Object.entries(PROMPT_TEMPLATES).map(([key, { displayText }]) => (
            <MenuItem key={key} value={key}>
              {displayText}
            </MenuItem>
          ))}
        </Select>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!selectedPrompt}
        >
          Send
        </Button>
        <Stack spacing={1}>
          {chatHistory.map(
            (chat, index) =>
              chat && (
                <Box key={index}>
                  <Typography variant="subtitle2">
                    {chat.role === "user" ? "You" : "Assistant"}
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {chat.message}
                  </Typography>
                </Box>
              )
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

