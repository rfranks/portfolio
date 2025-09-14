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

import { autoReply } from "@/utils/autoReply";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import { Message } from "@/utils/talentforge/dataStore";
import { v4 as uuidv4 } from "uuid";

export default function Inbox() {
  const data = useTalentForgeData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");

  useEffect(() => {
    setMessages(data.getMessages());
  }, [data]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as "all" | "unread" | "read");
  };

  const filteredMessages = filterByText(messages, search, [
    "content",
    "connector",
  ]).filter((message) => filter === "all" || message.status === filter);

  const handleAutoReply = async (message: Message) => {
    const reply = await autoReply([
      {
        role: "system",
        content:
          "You are a helpful assistant crafting concise professional replies to incoming messages.",
      },
      { role: "user", content: message.content },
    ]);
    setDrafts((d) => ({ ...d, [message.id]: reply }));
  };

  const handleSendReply = (message: Message) => {
    const text = drafts[message.id];
    if (!text) return;
    const reply = { id: uuidv4(), content: text, sentAt: new Date().toISOString() };
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

  const handleOpenThread = (message: Message) => {
    setReplyingTo((current) => (current === message.id ? null : message.id));
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
        <List>
          {filteredMessages.map((message) => (
            <ListItem key={message.id} alignItems="flex-start">
              <Stack spacing={1} sx={{ width: "100%" }}>
                <ListItemText
                  primary={
                    <Typography variant="subtitle1" fontWeight="bold">
                      {message.connector}
                    </Typography>
                  }
                  secondary={message.content}
                />
                <Stack direction="row" spacing={1}>
                  <Button size="small" onClick={() => handleOpenThread(message)}>
                    Reply
                  </Button>
                  <Button size="small" onClick={() => handleToggleStatus(message)}>
                    {message.status === "unread" ? "Mark read" : "Mark unread"}
                  </Button>
                </Stack>
                {replyingTo === message.id && (
                  <Stack spacing={2} sx={{ mt: 1 }}>
                    {message.replies.map((r) => (
                      <Typography key={r.id} variant="body2">
                        {r.content}
                      </Typography>
                    ))}
                    <TextField
                      label="Your reply"
                      multiline
                      rows={4}
                      fullWidth
                      value={drafts[message.id] || ""}
                      onChange={(e) =>
                        setDrafts((d) => ({ ...d, [message.id]: e.target.value }))
                      }
                    />
                    <Button size="small" onClick={() => handleAutoReply(message)}>
                      Generate Reply
                    </Button>
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

