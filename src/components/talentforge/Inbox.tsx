"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  MenuItem,
  Select,
  SelectChangeEvent,
  Skeleton,
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

import {
  useTalentForgeData,
  useTalentForgeSelector,
} from "@/contexts/TalentForgeDataContext";
import type { Message, RecruiterEntry } from "@/types";
import { v4 as uuidv4 } from "uuid";
import PromptSelector from "./PromptSelector";
import Tile from "./promptTiles/Tile";
import { getPromptTile } from "@/utils/talentforge/promptRegistry";
import EmptyState from "./EmptyState";

export default function Inbox() {
  const data = useTalentForgeData();
  const threads = useTalentForgeSelector((store) => store.getThreads());
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [templateSelections, setTemplateSelections] =
    useState<Record<string, AutoReplyTemplate>>({});
  const [quickTones, setQuickTones] = useState<Record<string, AutoReplyTemplate>>({});
  const templateDefs = useTalentForgeSelector((store) =>
    store.getAutoReplyTemplates(),
  );
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorTemplates, setEditorTemplates] = useState<
    Array<{ name: string; prompt: string }>
  >([]);
  const [search, setSearch] = useState("");
  const recruiters = useTalentForgeSelector((store) =>
    store.getRecruiters(),
  );
  const [aiThread, setAiThread] = useState<string | null>(null);
  const [promptKey, setPromptKey] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, [threads, recruiters, templateDefs]);

  const handleFilterChange = (event: SelectChangeEvent) => {
    setFilter(event.target.value as "all" | "unread" | "read");
  };

  const filteredThreads = filterByText(threads, search, ["body", "connector"]).filter(
    (m) => filter === "all" || m.status === filter,
  );

  const selected = threads.find((m) => m.id === selectedId) || null;

  const templateNames = Object.keys(templateDefs) as AutoReplyTemplate[];
  const defaultTemplate: AutoReplyTemplate = templateDefs.general
    ? "general"
    : templateNames[0];
  const defaultQuickTone: AutoReplyTemplate = templateDefs.politeFollowUp
    ? "politeFollowUp"
    : defaultTemplate;

  const handleSelectThread = (message: Message) => {
    setSelectedId(message.id);
    if (!drafts[message.id]) void handleAutoReply(message);
    if (message.status === "unread") {
      data.updateThreadStatus(message.id, "read");
    }
  };

  const handleAutoReply = async (message: Message) => {
    const template = templateSelections[message.id] || defaultTemplate;
    const reply = await autoReply(
      buildAutoReplyMessages(template, message.body, templateDefs),
    );
    setDrafts((d) => ({ ...d, [message.id]: reply }));
  };

  const handleQuickInsert = async (message: Message) => {
    const tone = quickTones[message.id] || defaultQuickTone;
    const text = await autoReply(
      buildAutoReplyMessages(tone, message.body, templateDefs),
    );
    const reply = {
      id: uuidv4(),
      body: text,
      sentAt: new Date().toISOString(),
      connector: message.connector,
    };
    data.addThreadReply(message.id, reply);
  };

  const handleSendReply = (message: Message) => {
    const text = drafts[message.id];
    if (!text) return;
    const reply = {
      id: uuidv4(),
      body: text,
      sentAt: new Date().toISOString(),
      connector: message.connector,
    };
    let updated = data.addThreadReply(message.id, reply);

    const matchedRecruiter = recruiters.find(
      (r) => r.connector.toLowerCase() === message.connector.toLowerCase(),
    );
    if (matchedRecruiter) {
      updated = data.linkThreadToRecruiter(message.id, matchedRecruiter.id);
    }

    setDrafts((d) => ({ ...d, [message.id]: "" }));
  };

  const handleToggleStatus = (message: Message) => {
    data.updateThreadStatus(
      message.id,
      message.status === "unread" ? "read" : "unread",
    );
  };

  const handleLinkRecruiter = (threadId: string, recruiterId: string) => {
    data.linkThreadToRecruiter(threadId, recruiterId);
  };

  const handleDraftWithAI = (threadId: string) => {
    setAiThread(threadId);
    setPromptKey("");
  };

  const handleInsertAIDraft = (text: string) => {
    if (aiThread) {
      setDrafts((d) => ({ ...d, [aiThread]: text }));
    }
    setAiThread(null);
  };

  const openTemplateEditor = () => {
    setEditorTemplates(
      Object.entries(templateDefs).map(([name, prompt]) => ({ name, prompt })),
    );
    setEditorOpen(true);
  };

  const handleTemplateChange = (
    index: number,
    field: "name" | "prompt",
    value: string,
  ) => {
    setEditorTemplates((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleAddTemplate = () => {
    setEditorTemplates((prev) => [...prev, { name: "", prompt: "" }]);
  };

  const handleDeleteTemplate = (index: number) => {
    setEditorTemplates((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveTemplates = () => {
    const defs: Record<string, string> = {};
    for (const { name, prompt } of editorTemplates) {
      if (name.trim()) defs[name.trim()] = prompt;
    }
    data.saveAutoReplyTemplates(defs);
    setEditorOpen(false);
  };

  if (loading) {
    return (
      <Stack spacing={2} aria-label="Loading inbox" aria-busy="true">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Skeleton key={idx} variant="rectangular" height={60} />
        ))}
      </Stack>
    );
  }

  if (threads.length === 0) {
    return (
      <EmptyState
        message="No messages"
        helperText="Your recruiter conversations will appear here."
      />
    );
  }

  const selectedPromptTile =
    promptKey !== ""
      ? getPromptTile(promptKey, { contexts: "messaging" })
      : undefined;

  const promptTileInitialValues =
    promptKey === "recruiterNudge" && aiThread
      ? {
          messageContext: threads.find((m) => m.id === aiThread)?.body || "",
        }
      : undefined;

  return (
    <Box aria-busy={loading} aria-label={loading ? "Loading inbox" : undefined}>
      <Stack direction="row" spacing={2} sx={{ height: "100%" }}>
        <Box sx={{ width: 300 }}>
          <Stack spacing={2}>
            <Typography variant="h5">Inbox</Typography>
            <Select
              value={filter}
              onChange={handleFilterChange}
              sx={{ maxWidth: 200 }}
              aria-label="Filter threads"
            >
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
            <List aria-label="Thread list">
              {filteredThreads.map((message) => (
                <ListItem key={message.id} disablePadding>
                  <ListItemButton
                    selected={selectedId === message.id}
                    onClick={() => handleSelectThread(message)}
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
                </ListItem>
              ))}
            </List>
          </Stack>
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          {selected ? (
            <Stack spacing={2}>
              <Typography variant="h6">{selected.connector}</Typography>
              <Typography>{selected.body}</Typography>
              {selected.replies.map((r) => (
                <Typography key={r.id} variant="body2">
                  {r.body}
                </Typography>
              ))}
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  onClick={() => handleToggleStatus(selected)}
                  aria-label="Toggle read status"
                >
                  {selected.status === "unread" ? "Mark read" : "Mark unread"}
                </Button>
                <Select
                  size="small"
                  displayEmpty
                  value={selected.recruiterId || ""}
                  onChange={(e) =>
                    handleLinkRecruiter(selected.id, e.target.value as string)
                  }
                  sx={{ minWidth: 160 }}
                  aria-label="Linked recruiter"
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
              <Stack direction="row" spacing={1} alignItems="center">
                <Select
                  size="small"
                  value={quickTones[selected.id] || defaultQuickTone}
                  onChange={(e) =>
                    setQuickTones((t) => ({
                      ...t,
                      [selected.id]: e.target.value as AutoReplyTemplate,
                    }))
                  }
                  sx={{ maxWidth: 200 }}
                  aria-label="Quick tone"
                >
                  {templateNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => void handleQuickInsert(selected)}
                  aria-label="Quick insert"
                >
                  Quick insert
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDraftWithAI(selected.id)}
                  aria-label="Draft with AI"
                >
                  Draft with AI
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
              <Stack direction="row" spacing={1} alignItems="center">
                <Select
                  size="small"
                  value={templateSelections[selected.id] || defaultTemplate}
                  onChange={(e) =>
                    setTemplateSelections((t) => ({
                      ...t,
                      [selected.id]: e.target.value as AutoReplyTemplate,
                    }))
                  }
                  sx={{ maxWidth: 200 }}
                  aria-label="Template"
                >
                  {templateNames.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={openTemplateEditor}
                  aria-label="Edit templates"
                >
                  Edit
                </Button>
              </Stack>
              <Button
                variant="contained"
                onClick={() => handleSendReply(selected)}
                aria-label="Send reply"
              >
                Send
              </Button>
            </Stack>
          ) : (
            <Typography>Select a thread to view messages</Typography>
          )}
        </Box>
      </Stack>
      <Dialog open={aiThread !== null} onClose={() => setAiThread(null)} fullWidth maxWidth="sm">
        <DialogTitle>Draft with AI</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <PromptSelector
              value={promptKey}
              onChange={setPromptKey}
              contexts="messaging"
            />
            {promptKey && !selectedPromptTile && (
              <Typography color="text.secondary">
                The selected prompt is unavailable in this workspace.
              </Typography>
            )}
            {selectedPromptTile && (
              <Tile
                {...selectedPromptTile}
                onInsert={handleInsertAIDraft}
                initialValues={promptTileInitialValues}
              />
            )}
          </Stack>
        </DialogContent>
      </Dialog>
      <Dialog
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Templates</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {editorTemplates.map((t, idx) => (
              <Stack key={idx} spacing={1}>
                <TextField
                  label="Name"
                  value={t.name}
                  onChange={(e) =>
                    handleTemplateChange(idx, "name", e.target.value)
                  }
                />
                <TextField
                  label="Prompt"
                  value={t.prompt}
                  onChange={(e) =>
                    handleTemplateChange(idx, "prompt", e.target.value)
                  }
                  multiline
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDeleteTemplate(idx)}
                  aria-label="Delete template"
                >
                  Delete
                </Button>
              </Stack>
            ))}
            <Button
              size="small"
              variant="outlined"
              onClick={handleAddTemplate}
              aria-label="Add template"
            >
              Add template
            </Button>
            <Button
              variant="contained"
              onClick={handleSaveTemplates}
              aria-label="Save templates"
            >
              Save
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}

