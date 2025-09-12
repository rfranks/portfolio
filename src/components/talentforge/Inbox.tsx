"use client";

import * as React from "react";

import { Box, Chip, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { ArchiveOutlined } from "@mui/icons-material";
import {
  responseTemplates as defaultTemplates,
  ResponseTemplate,
} from "@/consts/talentforge/responseTemplates";

interface InboxMessage {
  id: number;
  source: string;
  sender: string;
  subject: string;
  content: string;
  tags: string[];
  archived: boolean;
  quickReply?: string;
}

const initialMessages: InboxMessage[] = [
  {
    id: 1,
    source: "Email",
    sender: "hr@example.com",
    subject: "Interview Invitation",
    content: "We would love to schedule an interview with you next week.",
    tags: [],
    archived: false,
  },
  {
    id: 2,
    source: "LinkedIn",
    sender: "Jane Recruiter",
    subject: "New Opportunity",
    content: "I came across your profile and think you'd be a great fit...",
    tags: ["networking"],
    archived: false,
  },
];

export default function Inbox() {
  const [messages, setMessages] = React.useState<InboxMessage[]>(initialMessages);
  const [tagInputs, setTagInputs] = React.useState<Record<number, string>>({});
  const [quickReplies, setQuickReplies] = React.useState<ResponseTemplate[]>(
    defaultTemplates
  );
  const [selectedTemplates, setSelectedTemplates] = React.useState<
    Record<number, string>
  >({});

  const handleTagAdd = (id: number) => {
    const tag = (tagInputs[id] || "").trim();
    if (!tag) return;
    setMessages((msgs) =>
      msgs.map((m) => (m.id === id ? { ...m, tags: [...m.tags, tag] } : m))
    );
    setTagInputs((t) => ({ ...t, [id]: "" }));
  };

  const handleTagDelete = (id: number, tag: string) => {
    setMessages((msgs) =>
      msgs.map((m) =>
        m.id === id ? { ...m, tags: m.tags.filter((t) => t !== tag) } : m
      )
    );
  };

  const toggleArchive = (id: number) => {
    setMessages((msgs) =>
      msgs.map((m) => (m.id === id ? { ...m, archived: !m.archived } : m))
    );
  };

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("talentforge-settings");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.quickReplies)) {
            setQuickReplies(parsed.quickReplies);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  return (
    <Stack spacing={2}>
      {messages.map((m) => (
        <Box
          key={m.id}
          sx={{
            p: 2,
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            opacity: m.archived ? 0.5 : 1,
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1 }}
          >
            <Typography variant="subtitle2">
              {m.source} • {m.sender}
            </Typography>
            <IconButton
              aria-label={m.archived ? "unarchive" : "archive"}
              size="small"
              onClick={() => toggleArchive(m.id)}
            >
              <ArchiveOutlined fontSize="small" />
            </IconButton>
          </Stack>
          <Typography variant="subtitle1" fontWeight={600}>
            {m.subject}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {m.content}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 1 }}>
            {m.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                onDelete={() => handleTagDelete(m.id, tag)}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <TextField
              size="small"
              label="Add tag"
              value={tagInputs[m.id] || ""}
              onChange={(e) =>
                setTagInputs((t) => ({ ...t, [m.id]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleTagAdd(m.id);
                }
              }}
            />
            <TextField
              select
              size="small"
              label="Quick Reply"
              value={selectedTemplates[m.id] || ""}
              onChange={(e) => {
                const template = quickReplies.find(
                  (t) => t.id === e.target.value
                );
                setSelectedTemplates((prev) => ({
                  ...prev,
                  [m.id]: e.target.value,
                }));
                setMessages((msgs) =>
                  msgs.map((msg) =>
                    msg.id === m.id
                      ? { ...msg, quickReply: template?.template || "" }
                      : msg
                  )
                );
              }}
            >
              {quickReplies.map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          {m.quickReply && (
            <Box
              sx={{
                mt: 1,
                p: 1,
                bgcolor: "grey.100",
                borderRadius: 1,
              }}
            >
              <Typography variant="caption">Quick Reply:</Typography>
              <Typography variant="body2">{m.quickReply}</Typography>
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}

