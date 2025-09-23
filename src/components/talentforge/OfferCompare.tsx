"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { v4 as uuid } from "uuid";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import FileUploader from "./FileUploader";
import { askOpenAI, pdfToMarkdown } from "@/utils/talentforge/utils";
import RequireAIKey from "./RequireAIKey";
import { addOffer } from "@/utils/talentforge/dataStore";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import type { Message } from "@/types";
import { analyzeOfferWithAI, type OfferDrafts } from "./offerAnalysis";
import useAIErrorHandler from "@/hooks/talentforge/useAIErrorHandler";

interface OfferCompareProps {
  onSave?: () => void;
}

export default function OfferCompare({ onSave }: OfferCompareProps) {
  const data = useTalentForgeData();
  const notifyAIError = useAIErrorHandler();
  const [offerText, setOfferText] = useState("");
  const [compensation, setCompensation] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [drafts, setDrafts] = useState<OfferDrafts>({
    email: "",
    linkedin: "",
    indeed: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (
    filesFromParam: File[] | string | { filename: string; type: string; content: string } | undefined
  ): void => {
    const files = filesFromParam as File[];
    if (files && files.length > 0) {
      const file = files[0];
      void (async () => {
        const text =
          file.type === "application/pdf" ? await pdfToMarkdown(file) : await file.text();
        setOfferText(text);
      })();
    }
  };

  const analyzeOffer = async () => {
    const context = `Offer Letter:\n${offerText}\n\nCurrent Compensation:\n${compensation}`;
    const prompt =
      "Using the provided offer and compensation context, compare the offer letter to the current compensation and summarize key differences. " +
      "Then draft professional replies for email, LinkedIn, and Indeed. " +
      "Respond in JSON with keys analysis, email, linkedin, indeed.";
    setLoading(true);
    setError(null);
    await analyzeOfferWithAI({
      context,
      prompt,
      compensation,
      setAnalysis,
      setDrafts,
      setError,
      setLoading,
      onSave,
      ask: askOpenAI,
      addOfferFn: addOffer,
      onAskError: (info) => {
        notifyAIError(info, {
          retry: () => analyzeOffer(),
        });
      },
    });
  };

  const insertDraft = (connector: string, body: string) => {
    if (!body) return;
    const message: Message = {
      id: uuid(),
      threadId: uuid(),
      senderId: connector,
      sentAt: new Date().toISOString(),
      body,
      connector,
      status: "unread",
      replies: [],
    };
    data.addMessage(message);
  };

  return (
    <RequireAIKey>
      <Box>
      <Stack spacing={2}>
        <FileUploader
          accept=".pdf,.txt"
          label="Upload offer letter"
          outputType="files"
          onChange={handleFileChange}
        />
        <TextField
          label="Current compensation details"
          multiline
          minRows={4}
          value={compensation}
          onChange={(e) => setCompensation(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          disabled={!offerText || !compensation || loading}
          onClick={analyzeOffer}
        >
          Analyze Offer
        </Button>
        {error && (
          <Alert
            severity="error"
            onClose={() => setError(null)}
            sx={{ mt: 1 }}
          >
            {error}
          </Alert>
        )}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <CircularProgress />
          </Box>
        )}
        {analysis && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Analysis
            </Typography>
            <Typography variant="body2" component="div">
              <Markdown>{analysis}</Markdown>
            </Typography>
          </Box>
        )}
        {(drafts.email || drafts.linkedin || drafts.indeed) && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Draft Replies
            </Typography>
            {drafts.email && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Email</Typography>
                <Typography variant="body2" component="div">
                  <Markdown>{drafts.email}</Markdown>
                </Typography>
                <Button
                  size="small"
                  onClick={() => insertDraft("Email", drafts.email)}
                  sx={{ mt: 1 }}
                >
                  Insert into Inbox
                </Button>
              </Box>
            )}
            {drafts.linkedin && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">LinkedIn</Typography>
                <Typography variant="body2" component="div">
                  <Markdown>{drafts.linkedin}</Markdown>
                </Typography>
                <Button
                  size="small"
                  onClick={() => insertDraft("LinkedIn", drafts.linkedin)}
                  sx={{ mt: 1 }}
                >
                  Insert into Inbox
                </Button>
              </Box>
            )}
            {drafts.indeed && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2">Indeed</Typography>
                <Typography variant="body2" component="div">
                  <Markdown>{drafts.indeed}</Markdown>
                </Typography>
                <Button
                  size="small"
                  onClick={() => insertDraft("Indeed", drafts.indeed)}
                  sx={{ mt: 1 }}
                >
                  Insert into Inbox
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Stack>
      </Box>
    </RequireAIKey>
  );
}

