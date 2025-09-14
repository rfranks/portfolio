"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { filterByText } from "@/utils/search";

import {
  autoReply,
  buildAutoReplyMessages,
  AutoReplyTemplate,
} from "@/utils/autoReply";

import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import { Message } from "@/utils/talentforge/dataStore";
import { v4 as uuidv4 } from "uuid";
import PromptTileGrid from "./promptTiles/PromptTileGrid";

const CONNECTORS = ["Email", "LinkedIn", "Indeed"];

export default function Inbox() {
  const data = useTalentForgeData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Record<string, AutoReplyTemplate>>(
    {},
  );
  const [quickTones, setQuickTones] = useState<
    Record<string, AutoReplyTemplate>
  >({});
  const [replyConnectors, setReplyConnectors] = useState<
    Record<string, string>
  >({});
  const [search, setSearch] = useState("");
  const [openAi, setOpenAi] = useState(false);

  useEffect(() => {
    setMessages(data.getMessages());
  }, [data]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as "all" | "unread" | "read");
  };

  const filteredMessages = filterByText(messages, search, [
    "body",
    "connector",
  ]).filter((m) => filter === "all" || m.status === filter);

  const selected = messages.find((m) => m.id === selectedId) || null;

  const handleAutoReply = async (message: Message) => {
    const template = templates[message.id] || "general";
    const reply = await autoReply(
      buildAutoReplyMessages(template, message.body),
    );
    setDrafts((d) => ({ ...d, [message.id]: reply }));
  };

  const handleQuickInsert = async (message: Message) => {
    const tone = quickTones[message.id] || "politeFollowUp";
    const text = await autoReply(
      buildAutoReplyMessages(tone, message.body),
    );
    const connector = replyConnectors[message.id] || message.connector;
    const reply = {
      id: uuidv4(),
      body: text,
      sentAt: new Date().toISOString(),
      connector,
    };
    const updated = data.addMessageReply(message.id, reply);
    setMessages(updated);
  };

  const handleSendReply = (message: Message) => {
    const text = drafts[message.id];
    if (!text) return;
    const connector = replyConnectors[message.id] || message.connector;
    const reply = {
      id: uuidv4(),
      body: text,
      sentAt: new Date().toISOString(),
      connector,
    };
    const updated = data.addMessageReply(message.id, reply);
    setMessages(updated);
    setDrafts((d) => ({ ...d, [message.id]: "" }));
  };

  const handleToggleStatus = (message: Message) => {
    const updated = data.updateMessageStatus(
      message.id,
      message.status === "unread" ? "read" : "unread",
    );
    setMessages(updated);
  };

  const handleSelect = (message: Message) => {
    setSelectedId(message.id);
    if (!drafts[message.id]) {
      void handleAutoReply(message);
    }
    if (message.status === "unread") {
      const updated = data.updateMessageStatus(message.id, "read");
      setMessages(updated);
    }
  };

  const insertFromAi = (text: string) => {
    if (!selected) return;
    setDrafts((d) => ({ ...d, [selected.id]: text }));
    setOpenAi(false);
  };

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h5">Inbox</Typography>
        <Select value={filter} onChange={handleFilterChange} sx={{ maxWidth: 200 }}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="unread">Unread</MenuItem>
          <MenuItem value="read">Read</MenuItem>
        </Select>
        <TextField
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ maxWidth: 300 }}
        />
        <Box sx={{ display: "flex", gap: 2 }}>
          <List sx={{ width: 300, flexShrink: 0 }}>
            {filteredMessages.map((message) => (
              <ListItemButton
                key={message.id}
                selected={selectedId === message.id}
                onClick={() => handleSelect(message)}
                alignItems="flex-start"
              >
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {message.connector}
                    </Typography>
                  }
                  secondary={message.body}
                />
              </ListItemButton>
            ))}
          </List>
          <Box sx={{ flexGrow: 1 }}>
            {selected ? (
              <Stack spacing={2}>
                <Typography variant="h6">{selected.connector}</Typography>
                <Typography>{selected.body}</Typography>
                {selected.replies.map((r) => (
                  <Typography key={r.id} variant="body2">
                    [{r.connector}] {r.body}
                  </Typography>
                ))}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Select
                    size="small"
                    value={quickTones[selected.id] || "politeFollowUp"}
                    onChange={(e) =>
                      setQuickTones((t) => ({
                        ...t,
                        [selected.id]: e.target.value as AutoReplyTemplate,
                      }))
                    }
                    sx={{ maxWidth: 200 }}
                  >
                    <MenuItem value="politeFollowUp">Polite follow-up</MenuItem>
                    <MenuItem value="politeDecline">Politely decline</MenuItem>
                  </Select>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => void handleQuickInsert(selected)}
                  >
                    Quick insert
                  </Button>
                </Stack>
                <TextField
                  label="Your reply"
                  multiline
                  rows={4}
                  fullWidth
                  value={drafts[selected.id] || ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [selected.id]: e.target.value }))
                  }
                />
                <Select
                  size="small"
                  value={templates[selected.id] || "general"}
                  onChange={(e) =>
                    setTemplates((t) => ({
                      ...t,
                      [selected.id]: e.target.value as AutoReplyTemplate,
                    }))
                  }
                  sx={{ maxWidth: 200 }}
                >
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="politeDecline">Politely decline</MenuItem>
                  <MenuItem value="requestMoreInfo">Request more info</MenuItem>
                </Select>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Select
                    size="small"
                    value={replyConnectors[selected.id] || selected.connector}
                    onChange={(e) =>
                      setReplyConnectors((c) => ({
                        ...c,
                        [selected.id]: e.target.value,
                      }))
                    }
                    sx={{ maxWidth: 200 }}
                  >
                    {CONNECTORS.map((c) => (
                      <MenuItem key={c} value={c}>
                        {c}
                      </MenuItem>
                    ))}
                  </Select>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => setOpenAi(true)}
                  >
                    Draft with AI
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => handleSendReply(selected)}
                  >
                    Send
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleToggleStatus(selected)}
                  >
                    {selected.status === "unread"
                      ? "Mark read"
                      : "Mark unread"}
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Typography>Select a thread</Typography>
            )}
          </Box>
        </Box>
      </Stack>
      <Dialog
        open={openAi}
        onClose={() => setOpenAi(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Draft with AI</DialogTitle>
        <DialogContent>
          <PromptTileGrid onInsert={insertFromAi} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAi(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

