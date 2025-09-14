"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  List,
  ListItem,
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
import { Message, RecruiterEntry } from "@/utils/talentforge/dataStore";
import { v4 as uuidv4 } from "uuid";
import EmptyState from "./EmptyState";

export default function Inbox() {
  const data = useTalentForgeData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Record<string, AutoReplyTemplate>>({});
  const [quickTones, setQuickTones] = useState<Record<string, AutoReplyTemplate>>({});
  const [search, setSearch] = useState("");
  const [recruiters, setRecruiters] = useState<RecruiterEntry[]>([]);

  useEffect(() => {
    setMessages(data.getMessages());
    setRecruiters(data.getRecruiters());
  }, [data]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as "all" | "unread" | "read");
  };

  const filteredMessages = filterByText(messages, search, [
    "body",
    "connector",
  ]).filter((message) => filter === "all" || message.status === filter);

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
    const reply = { id: uuidv4(), body: text, sentAt: new Date().toISOString() };
    const updated = data.addMessageReply(message.id, reply);
    setMessages(updated);
  };

  const handleSendReply = (message: Message) => {
    const text = drafts[message.id];
    if (!text) return;
    const reply = { id: uuidv4(), body: text, sentAt: new Date().toISOString() };
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

  const handleLinkRecruiter = (threadId: string, recruiterId: string) => {
    const updated = data.linkThreadToRecruiter(threadId, recruiterId);
    setMessages(updated);
    setRecruiters(data.getRecruiters());
  };

  const handleOpenThread = (message: Message) => {
    const isCurrent = replyingTo === message.id;
    setReplyingTo((current) => (current === message.id ? null : message.id));
    if (!isCurrent && !drafts[message.id]) {
      void handleAutoReply(message);
    }
    if (message.status === "unread") {
      const updated = data.updateMessageStatus(message.id, "read");
      setMessages(updated);
    }
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
        {filteredMessages.length === 0 ? (
          <EmptyState text="No messages yet. Connect accounts to receive messages." />
        ) : (
          <List aria-label="messages">
            {filteredMessages.map((message) => (
              <ListItem key={message.id} alignItems="flex-start">
                <Stack spacing={1} sx={{ width: "100%" }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight="bold">
                        {message.connector}
                      </Typography>
                    }
                    secondary={message.body}
                  />
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Button
                      size="small"
                      onClick={() => handleOpenThread(message)}
                      aria-label="reply to message"
                    >
                      Reply
                    </Button>
                    <Button
                      size="small"
                      onClick={() => handleToggleStatus(message)}
                      aria-label="toggle read status"
                    >
                      {message.status === "unread" ? "Mark read" : "Mark unread"}
                    </Button>
                    <Select
                      size="small"
                      displayEmpty
                      value={message.recruiterId || ""}
                      onChange={(e) =>
                        handleLinkRecruiter(message.id, e.target.value as string)
                      }
                      sx={{ minWidth: 160 }}
                      aria-label="link recruiter"
                    >
                      <MenuItem value="">
                        <em>No recruiter</em>
                      </MenuItem>
                      {recruiters.map((r) => (
                        <MenuItem key={r.id} value={r.id}>
                          {r.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </Stack>
                  {replyingTo === message.id && (
                    <Stack spacing={2} sx={{ mt: 1 }}>
                      {message.replies.map((r) => (
                        <Typography key={r.id} variant="body2">
                          {r.body}
                        </Typography>
                      ))}
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Select
                          size="small"
                          value={quickTones[message.id] || "politeFollowUp"}
                          onChange={(e) =>
                            setQuickTones((t) => ({
                              ...t,
                              [message.id]: e.target.value as AutoReplyTemplate,
                            }))
                          }
                          sx={{ maxWidth: 200 }}
                          aria-label="auto reply tone"
                        >
                          <MenuItem value="politeFollowUp">Polite follow-up</MenuItem>
                          <MenuItem value="politeDecline">Politely decline</MenuItem>
                        </Select>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => void handleQuickInsert(message)}
                          aria-label="quick insert"
                        >
                          Quick insert
                        </Button>
                      </Stack>
                      <TextField
                        label="Your reply"
                        multiline
                        rows={4}
                        fullWidth
                        value={drafts[message.id] || ""}
                        onChange={(e) =>
                          setDrafts((d) => ({ ...d, [message.id]: e.target.value }))
                        }
                        aria-label="reply text"
                      />
                      <Select
                      size="small"
                      value={templates[message.id] || "general"}
                      onChange={(e) =>
                        setTemplates((t) => ({
                          ...t,
                          [message.id]: e.target.value as AutoReplyTemplate,
                        }))
                      }
                      sx={{ maxWidth: 200 }}
                    >
                      <MenuItem value="general">General</MenuItem>
                      <MenuItem value="politeDecline">Politely decline</MenuItem>
                      <MenuItem value="requestMoreInfo">Request more info</MenuItem>
                    </Select>
                    <Button
                      variant="contained"
                      onClick={() => handleSendReply(message)}
                    >
                      Send
                    </Button>
                  </Stack>
                )}
              </Stack>
            </ListItem>
          ))}
        </List>
      </Stack>
    </Box>
  );
}

