"use client";

import * as React from "react";

import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ArchiveOutlined, ReplyOutlined } from "@mui/icons-material";

import { askOpenAI } from "@/utils/talentforge/utils";

interface InboxMessage {
  id: number;
  source: string;
  sender: string;
  subject: string;
  content: string;
  tags: string[];
  archived: boolean;
  quickReply?: string;
  suggestedTags?: string[];
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
  const [loading, setLoading] = React.useState<Record<number, boolean>>({});
  const [tagSuggestionsLoading, setTagSuggestionsLoading] =
    React.useState<Record<number, boolean>>({});

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
    messages.forEach((msg) => {
      if (msg.suggestedTags === undefined && !tagSuggestionsLoading[msg.id]) {
        setTagSuggestionsLoading((l) => ({ ...l, [msg.id]: true }));
        (async () => {
          const response = await askOpenAI({
            context: msg.content,
            user:
              "Suggest up to three short tags that describe the message, as a comma-separated list.",
            system:
              "You analyze the given message and return concise descriptive tags separated by commas.",
            chatHistory: [],
            returnFirstResponse: true,
          });
          const tags =
            response?.message
              ?.split(",")
              .map((t) => t.trim())
              .filter(Boolean) || [];
          setMessages((msgs) =>
            msgs.map((m) =>
              m.id === msg.id ? { ...m, suggestedTags: tags } : m
            )
          );
          setTagSuggestionsLoading((l) => ({ ...l, [msg.id]: false }));
        })();
      }
    });
  }, [messages, tagSuggestionsLoading]);

  const handleSuggestedTagConfirm = (id: number, tag: string) => {
    setMessages((msgs) =>
      msgs.map((m) =>
        m.id === id
          ? {
              ...m,
              tags: [...m.tags, tag],
              suggestedTags: m.suggestedTags?.filter((t) => t !== tag),
            }
          : m
      )
    );
  };

  const handleSuggestedTagDiscard = (id: number, tag: string) => {
    setMessages((msgs) =>
      msgs.map((m) =>
        m.id === id
          ? {
              ...m,
              suggestedTags: m.suggestedTags?.filter((t) => t !== tag),
            }
          : m
      )
    );
  };

  const handleQuickReply = async (id: number) => {
    const msg = messages.find((m) => m.id === id);
    if (!msg) return;
    setLoading((l) => ({ ...l, [id]: true }));
    const response = await askOpenAI({
      context: msg.content,
      user: "Draft a brief professional reply to the above message.",
      system:
        "You are an assistant that crafts concise, professional replies to messages based on the provided context. Reply directly without preamble.",
      chatHistory: [],
      returnFirstResponse: true,
    });
    setLoading((l) => ({ ...l, [id]: false }));
    setMessages((msgs) =>
      msgs.map((m) =>
        m.id === id ? { ...m, quickReply: response?.message || "" } : m
      )
    );
  };

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
          {m.suggestedTags && m.suggestedTags.length > 0 && (
            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              sx={{ mb: 1 }}
            >
              {m.suggestedTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  onClick={() => handleSuggestedTagConfirm(m.id, tag)}
                  onDelete={() => handleSuggestedTagDiscard(m.id, tag)}
                />
              ))}
            </Stack>
          )}
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
            <Button
              variant="outlined"
              size="small"
              startIcon={<ReplyOutlined />}
              onClick={() => handleQuickReply(m.id)}
              disabled={loading[m.id]}
            >
              Quick Reply
            </Button>
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
              <Typography variant="caption">AI Reply:</Typography>
              <Typography variant="body2">{m.quickReply}</Typography>
            </Box>
          )}
        </Box>
      ))}
    </Stack>
  );
}

