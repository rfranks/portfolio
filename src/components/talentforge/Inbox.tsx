"use client";

import * as React from "react";

import { Box, Chip, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { ArchiveOutlined } from "@mui/icons-material";
import {
  responseTemplates as defaultTemplates,
  ResponseTemplate,
} from "@/consts/talentforge/responseTemplates";
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
  suggestedTags?: string[];
}

export default function Inbox() {
  const [messages, setMessages] = React.useState<InboxMessage[]>([]);
  const [tagInputs, setTagInputs] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState<Record<string, boolean>>({});
  const [pageTokens, setPageTokens] = React.useState<Record<string, string | undefined>>({});
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [tagInputs, setTagInputs] = React.useState<Record<number, string>>({});
  const [quickReplies, setQuickReplies] = React.useState<ResponseTemplate[]>(
    defaultTemplates
  );
  const [selectedTemplates, setSelectedTemplates] = React.useState<
    Record<number, string>
  >({});
  const [tagSuggestionsLoading, setTagSuggestionsLoading] =
    React.useState<Record<number, boolean>>({});

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
      {Object.values(pageTokens).some(Boolean) && (
        <Button variant="outlined" onClick={loadMore} disabled={loadingMore}>
          Load more
        </Button>
      )}
    </Stack>
  );
}

