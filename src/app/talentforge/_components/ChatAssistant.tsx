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

import { PROMPT_TILES } from "@/app/talentforge/_consts/promptTiles";
import { askOpenAI } from "@/app/talentforge/_utils/utils";
import { exportElementToPdf } from "@/utils/pdfExport";
import RequireAIKey from "./RequireAIKey";
import { ChatMessage } from "@/types";
export default function ChatAssistant() {
  const [selectedTile, setSelectedTile] = useState<string>("");
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
  const chatRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (!selectedTile) return;
    const tile = PROMPT_TILES[selectedTile];
    const fullText = tile?.fullPrompt;
    if (!fullText) return;

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
        <Stack spacing={2}>
          <Select
            value={selectedTile}
            onChange={(e: SelectChangeEvent<string>) =>
              setSelectedTile(e.target.value as string)
            }
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>
              Select a prompt
            </MenuItem>
            {Object.values(PROMPT_TILES).map((tile) => (
              <MenuItem key={tile.id} value={tile.id}>
                {tile.display}
              </MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!selectedTile}
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

