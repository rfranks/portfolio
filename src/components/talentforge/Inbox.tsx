"use client";

import { useState } from "react";
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

interface ConnectorMessage {
  id: string;
  connector: string;
  content: string;
  status: "unread" | "read";
}

const MOCK_MESSAGES: ConnectorMessage[] = [
  {
    id: "1",
    connector: "LinkedIn",
    content: "Hi, we'd like to connect with you regarding an opportunity.",
    status: "unread",
  },
  {
    id: "2",
    connector: "Email",
    content: "Your application has been received.",
    status: "read",
  },
  {
    id: "3",
    connector: "Github",
    content: "Invitation to collaborate on a project.",
    status: "unread",
  },
];

export default function Inbox() {
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [templates, setTemplates] = useState<Record<string, AutoReplyTemplate>>({});
  const [search, setSearch] = useState("");

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as "all" | "unread" | "read");
  };

  const filteredMessages = filterByText(MOCK_MESSAGES, search, [
    "content",
    "connector",
  ]).filter((message) => filter === "all" || message.status === filter);

  const handleAutoReply = async (message: ConnectorMessage) => {
    const template = templates[message.id] || "general";
    const reply = await autoReply(
      buildAutoReplyMessages(template, message.content),
    );
    setDrafts((d) => ({ ...d, [message.id]: reply }));
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
                <Button
                  size="small"
                  onClick={() =>
                    setReplyingTo((current) =>
                      current === message.id ? null : message.id,
                    )
                  }
                >
                  Reply
                </Button>
                {replyingTo === message.id && (
                  <Stack spacing={2} sx={{ mt: 1 }}>
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
                      size="small"
                      onClick={() => handleAutoReply(message)}
                    >
                      Generate Reply
                    </Button>
                    <Button variant="contained">Send</Button>
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

