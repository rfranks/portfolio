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

import ChatAssistant from "./ChatAssistant";

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

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as "all" | "unread" | "read");
  };

  const filteredMessages = MOCK_MESSAGES.filter(
    (message) => filter === "all" || message.status === filter,
  );

  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h5">Inbox</Typography>
        <Select value={filter} onChange={handleFilterChange} sx={{ maxWidth: 200 }}>
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="unread">Unread</MenuItem>
          <MenuItem value="read">Read</MenuItem>
        </Select>
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
                    />
                    <Typography variant="subtitle2">
                      Draft with ChatAssistant
                    </Typography>
                    <ChatAssistant />
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

