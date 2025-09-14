"use client";

import { useState } from "react";
import Markdown from "react-markdown";
import { v4 as uuid } from "uuid";

import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import FileUploader from "./FileUploader";
import {
  askOpenAI,
  pdfToMarkdown,
  hasOpenAIKey,
} from "@/utils/talentforge/utils";
import OpenAIKeyModal from "./OpenAiKeyModal";
import {
  addOffer,
  type Offer,
  type Message,
} from "@/utils/talentforge/dataStore";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";
import type { ApplicationRecord } from "@/types";

interface OfferCompareProps {
  onSave?: () => void;
}

export default function OfferCompare({ onSave }: OfferCompareProps) {
  const data = useTalentForgeData();
  const [offerText, setOfferText] = useState("");
  const [compensation, setCompensation] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [drafts, setDrafts] = useState({
    email: "",
    linkedin: "",
    indeed: "",
  });
  const [loading, setLoading] = useState(false);
  const [openKeyModal, setOpenKeyModal] = useState(false);

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
    if (!hasOpenAIKey()) {
      setOpenKeyModal(true);
      return;
    }
    const context = `Offer Letter:\n${offerText}\n\nCurrent Compensation:\n${compensation}`;
    const prompt =
      "Compare the offer letter to the current compensation and summarize key differences. " +
      "Then draft professional replies for email, LinkedIn, and Indeed. " +
      "Respond in JSON with keys analysis, email, linkedin, indeed.";
    setLoading(true);
    const response = await askOpenAI({
      context,
      user: prompt,
      system:
        "You analyze offers and produce structured response drafts.",
      chatHistory: [],
      returnFirstResponse: true,
    });
    const message = response?.message || "";
    try {
      const parsed = JSON.parse(message) as {
        analysis?: string;
        email?: string;
        linkedin?: string;
        indeed?: string;
      };
      setAnalysis(parsed.analysis || "");
      setDrafts({
        email: parsed.email || "",
        linkedin: parsed.linkedin || "",
        indeed: parsed.indeed || "",
      });
      const offer: Offer = {
        id: uuid(),
        application: {} as ApplicationRecord,
        compensation: [{ type: "note", amount: 0, notes: compensation }],
        summary: [
          `Analysis: ${parsed.analysis || ""}`,
          `Email Draft: ${parsed.email || ""}`,
          `LinkedIn Draft: ${parsed.linkedin || ""}`,
          `Indeed Draft: ${parsed.indeed || ""}`,
        ],
      };
      addOffer(offer);
    } catch {
      setAnalysis(message);
      setDrafts({ email: "", linkedin: "", indeed: "" });
      const offer: Offer = {
        id: uuid(),
        application: {} as ApplicationRecord,
        compensation: [{ type: "note", amount: 0, notes: compensation }],
        summary: [message],
      };
      addOffer(offer);
    }
    setLoading(false);
    onSave?.();
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
    <Box>
      <OpenAIKeyModal
        open={openKeyModal}
        onClose={() => setOpenKeyModal(false)}
      />
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
  );
}

