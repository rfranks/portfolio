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
import { askOpenAI, pdfToMarkdown, hasOpenAIKey } from "@/utils/talentforge/utils";
import OpenAiKeyModal from "./OpenAiKeyModal";
import { PROMPT_TEMPLATES } from "@/consts/prompts";
import { addOffer } from "@/utils/talentforge/dataStore";
import type { Offer } from "@/utils/talentforge/dataStore";

interface OfferCompareProps {
  onSave?: () => void;
}

export default function OfferCompare({ onSave }: OfferCompareProps) {
  const [offerText, setOfferText] = useState("");
  const [compensation, setCompensation] = useState("");
  const [result, setResult] = useState("");
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
    const prompt = PROMPT_TEMPLATES.negotiateOffer?.fullText || "";
    setLoading(true);
    const response = await askOpenAI({
      context,
      user: prompt,
      system:
        "You are an assistant that compares job offers with current compensation and drafts negotiation responses.",
      chatHistory: [],
      returnFirstResponse: true,
    });
    const message = response?.message || "";
    setResult(message);
    const offer: Offer = {
      id: uuid(),
      application: {} as any,
      compensation: [{ type: "note", amount: 0, notes: compensation }],
      summary: message,
    };
    addOffer(offer);
    setLoading(false);
    onSave?.();
  };

  return (
    <Box>
      <OpenAiKeyModal
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
        {result && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Draft Response
            </Typography>
            <Typography variant="body2" component="div">
              <Markdown>{result}</Markdown>
            </Typography>
          </Box>
        )}
      </Stack>
    </Box>
  );
}

