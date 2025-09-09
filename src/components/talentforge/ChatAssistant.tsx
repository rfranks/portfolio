"use client";

import * as React from "react";
import Markdown from "react-markdown";

import {
  Box,
  IconButton,
  MenuItem,
  OutlinedInput,
  Stack,
  TextField,
} from "@mui/material";
import { SendOutlined } from "@mui/icons-material";

import { jobSearchPrompt } from "@/consts/talentforge/consts";
import { responseTemplates } from "@/consts/talentforge/responseTemplates";
import { ChatMessage } from "@/types/talentforge/types";
import { askOpenAI } from "@/utils/talentforge/utils";

/**
 * ChatAssistant provides an interactive chat experience tailored to job search
 * conversations. It wraps the existing OpenAI chat logic with prompts that
 * focus on resume strengths, potential job matches, and interactions with
 * recruiters.
 */
export default function ChatAssistant() {
  const [chatHistory, setChatHistory] = React.useState<(ChatMessage | null)[]>(
    []
  );
  const [message, setMessage] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [resumeStrengths, setResumeStrengths] = React.useState("");
  const [jobMatches, setJobMatches] = React.useState("");
  const [recruiterNotes, setRecruiterNotes] = React.useState("");

  const chatParentRef = React.useRef<HTMLDivElement>(null);

  const sendMessage = async () => {
    const context = [
      resumeStrengths ? `Resume strengths:\n${resumeStrengths}` : "",
      jobMatches ? `Job matches:\n${jobMatches}` : "",
      recruiterNotes ? `Recruiter interactions:\n${recruiterNotes}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    await askOpenAI({
      context,
      user: message,
      system: jobSearchPrompt,
      returnFirstResponse: true,
      chatHistory,
      onChatHistoryChange: setChatHistory,
    });

    setMessage("");
    setSelectedTemplate("");
  };

  React.useEffect(() => {
    if (chatParentRef.current) {
      chatParentRef.current.scrollTop =
        chatParentRef.current.scrollHeight || 0;
    }
  }, [chatHistory]);

  return (
    <Stack spacing={2} sx={{ width: "100%" }}>
      <Stack spacing={1}>
        <TextField
          label="Resume Strengths"
          multiline
          minRows={2}
          value={resumeStrengths}
          onChange={(e) => setResumeStrengths(e.target.value)}
        />
        <TextField
          label="Job Matches"
          multiline
          minRows={2}
          value={jobMatches}
          onChange={(e) => setJobMatches(e.target.value)}
        />
        <TextField
          label="Recruiter Interactions"
          multiline
          minRows={2}
          value={recruiterNotes}
          onChange={(e) => setRecruiterNotes(e.target.value)}
        />
      </Stack>

      <Stack
        ref={chatParentRef}
        spacing={1}
        sx={{
          maxHeight: 300,
          overflowY: "auto",
          p: 1,
          border: 1,
          borderColor: "divider",
          borderRadius: 1,
        }}
      >
        {chatHistory.map((chat, i) => (
          <Box
            key={i}
            sx={{
              alignSelf:
                chat?.role === "user" ? "flex-end" : "flex-start",
              bgcolor:
                chat?.role === "user" ? "primary.main" : "grey.100",
              color:
                chat?.role === "user"
                  ? "primary.contrastText"
                  : "text.primary",
              p: 1,
              borderRadius: 1,
              maxWidth: "80%",
            }}
          >
            <Markdown>{chat?.message || ""}</Markdown>
          </Box>
        ))}
      </Stack>

      <TextField
        select
        label="Quick responses"
        value={selectedTemplate}
        onChange={(e) => {
          const template = responseTemplates.find(
            (t) => t.id === e.target.value
          );
          setSelectedTemplate(e.target.value);
          if (template) {
            setMessage(template.template);
          }
        }}
      >
        {responseTemplates.map((t) => (
          <MenuItem key={t.id} value={t.id}>
            {t.label}
          </MenuItem>
        ))}
      </TextField>

      <OutlinedInput
        fullWidth
        placeholder="Ask about your job search..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        endAdornment={
          <IconButton
            aria-label="send"
            onClick={sendMessage}
            disabled={!message.trim()}
          >
            <SendOutlined />
          </IconButton>
        }
      />
    </Stack>
  );
}

