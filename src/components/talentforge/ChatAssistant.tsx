"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";

import { PROMPT_TEMPLATES } from "@/consts/prompts";
import {
  askOpenAI,
  hasValidOpenAIKey,
} from "@/utils/talentforge/utils";
import { exportElementToPdf } from "@/utils/pdfExport";
import OpenAIKeyModal from "./OpenAiKeyModal";
import RequireAIKey from "./RequireAIKey";
import { ChatMessage } from "@/types/talentforge/types";
import PromptSelector from "./PromptSelector";

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

  const handleSubmit = async () => {
    if (!selectedPrompt) return;
    const fullText = PROMPT_TEMPLATES[selectedPrompt]?.fullText;
    if (!fullText) return;
    const valid = await hasValidOpenAIKey();
    if (!valid) {
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
    <RequireAIKey>
      <Box>
        <OpenAIKeyModal
          open={openKeyModal}
          onClose={() => setOpenKeyModal(false)}
        />
        <Stack spacing={2}>
          <PromptSelector value={selectedPrompt} onChange={setSelectedPrompt} />
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
    </RequireAIKey>
  );
}

