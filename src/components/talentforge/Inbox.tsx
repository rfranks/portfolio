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
import { getStoredTokens } from "@/utils/talentforge/oauth";

interface InboxMessage {
  id: string;
  source: string;
  sender: string;
  subject: string;
  content: string;
  tags: string[];
  archived: boolean;
  quickReply?: string;
}

export default function Inbox() {
  const [messages, setMessages] = React.useState<InboxMessage[]>([]);
  const [tagInputs, setTagInputs] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  const [pageTokens, setPageTokens] = React.useState<Record<string, string | undefined>>({});
  const [loadingMore, setLoadingMore] = React.useState(false);

  const fetchMessages = React.useCallback(
    async (provider: string, pageToken?: string) => {
      const tokens = getStoredTokens(provider);
      if (!tokens?.accessToken) {
        return { messages: [] as InboxMessage[], nextPageToken: undefined as string | undefined };
      }
      const params = pageToken ? `?pageToken=${encodeURIComponent(pageToken)}` : "";
      const res = await fetch(`/api/messages/${provider}${params}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });
      if (!res.ok) {
        return { messages: [] as InboxMessage[], nextPageToken: undefined as string | undefined };
      }
      const data = (await res.json()) as {
        messages: InboxMessage[];
        nextPageToken?: string;
      };
      return data;
    },
    []
  );

  React.useEffect(() => {
    const load = async () => {
      const providers = ["gmail", "linkedin"];
      const all: InboxMessage[] = [];
      const tokens: Record<string, string | undefined> = {};
      for (const p of providers) {
        const data = await fetchMessages(p);
        all.push(
          ...data.messages.map((m) => ({ ...m, tags: m.tags || [], archived: false }))
        );
        if (data.nextPageToken) tokens[p] = data.nextPageToken;
      }
      setMessages(all);
      setPageTokens(tokens);
    };
    void load();
  }, [fetchMessages]);

  const handleTagAdd = (id: string) => {
    const tag = (tagInputs[id] || "").trim();
    if (!tag) return;
    setMessages((msgs) =>
      msgs.map((m) => (m.id === id ? { ...m, tags: [...m.tags, tag] } : m))
    );
    setTagInputs((t) => ({ ...t, [id]: "" }));
  };

  const handleTagDelete = (id: string, tag: string) => {
    setMessages((msgs) =>
      msgs.map((m) =>
        m.id === id ? { ...m, tags: m.tags.filter((t) => t !== tag) } : m
      )
    );
  };

  const toggleArchive = (id: string) => {
    setMessages((msgs) =>
      msgs.map((m) => (m.id === id ? { ...m, archived: !m.archived } : m))
    );
  };

  const handleQuickReply = async (id: string) => {
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

  const loadMore = async () => {
    setLoadingMore(true);
    const providers = Object.keys(pageTokens).filter((p) => pageTokens[p]);
    const fetched: InboxMessage[] = [];
    const newTokens: Record<string, string | undefined> = {};
    for (const p of providers) {
      const data = await fetchMessages(p, pageTokens[p]);
      fetched.push(
        ...data.messages.map((m) => ({ ...m, tags: m.tags || [], archived: false }))
      );
      newTokens[p] = data.nextPageToken;
    }
    setMessages((prev) => [...prev, ...fetched]);
    setPageTokens((prev) => ({ ...prev, ...newTokens }));
    setLoadingMore(false);
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
      {Object.values(pageTokens).some(Boolean) && (
        <Button variant="outlined" onClick={loadMore} disabled={loadingMore}>
          Load more
        </Button>
      )}
    </Stack>
  );
}

