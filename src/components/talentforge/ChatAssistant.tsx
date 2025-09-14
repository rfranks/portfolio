"use client";

import { useEffect, useRef, useState } from "react";
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
import { exportElementToPdf } from "@/utils/pdfExport";
import OpenAiKeyModal from "./OpenAiKeyModal";
import { ChatMessage } from "@/types/talentforge/types";

export default function ChatAssistant() {
  const [selectedPrompt, setSelectedPrompt] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<(ChatMessage | null)[]>([]);

  // Load chat history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chatHistory");
      if (stored) {
        setChatHistory(JSON.parse(stored));
      }
    } catch {
      // ignore parsing errors
    }
  }, []);

  // Persist chat history changes to localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory]);
  const [openKeyModal, setOpenKeyModal] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

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
        <Button
          variant="outlined"
          onClick={() =>
            chatRef.current &&
            exportElementToPdf(chatRef.current, "chat-history.pdf")
          }
          disabled={chatHistory.length === 0}
        >
          Export
        </Button>
        <Button
          variant="text"
          onClick={() => {
            setChatHistory([]);
            localStorage.removeItem("chatHistory");
          }}
          disabled={chatHistory.length === 0}
        >
          Clear
        </Button>
        <Stack spacing={1} ref={chatRef}>
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

