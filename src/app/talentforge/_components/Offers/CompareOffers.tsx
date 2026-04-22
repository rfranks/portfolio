"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "react-markdown";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  type SelectChangeEvent,
} from "@mui/material";

import { exportElementToPdf } from "@/utils/pdfExport";
import { getOffers } from "@/app/talentforge/_utils/dataStore";
import { askOpenAI } from "@/app/talentforge/_utils/utils";
import { getPromptTile } from "@/app/talentforge/_utils/promptRegistry";
import RequireAIKey from "../RequireAIKey";
import type { Offer } from "@/types";
import useAIErrorHandler from "@/app/talentforge/_hooks/useAIErrorHandler";

const formatCurrency = (amount: number) => {
  if (!Number.isFinite(amount)) return "—";
  return `$${amount.toLocaleString()}`;
};

const formatCompensationValue = (offer: Offer | null, type: string) => {
  if (!offer) return "—";
  const comp = offer.compensation.find((item) => item.type === type);
  if (!comp) return "—";
  const base = formatCurrency(comp.amount);
  return comp.notes ? `${base} (${comp.notes})` : base;
};

const toTitleCase = (value: string) => {
  if (!value) return "";
  return value
    .split(/[_\s]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const describeOffer = (offer: Offer) => {
  const lines: string[] = [];
  const roleTitle = offer.application?.role?.title;
  const company = offer.application?.role?.company;
  if (roleTitle || company) {
    lines.push([roleTitle, company].filter(Boolean).join(" at ") || "");
  }
  offer.compensation.forEach((comp) => {
    const amount = formatCurrency(comp.amount);
    lines.push(`${toTitleCase(comp.type)}: ${amount}${comp.notes ? ` (${comp.notes})` : ""}`);
  });
  (offer.summary || []).forEach((line) => {
    if (line.trim()) {
      lines.push(line.trim());
    }
  });
  return lines.join("\n");
};

const getOfferLabel = (offer: Offer, index: number) => {
  const roleTitle = offer.application?.role?.title;
  const company = offer.application?.role?.company;
  if (roleTitle && company) {
    return `${roleTitle} at ${company}`;
  }
  if (roleTitle) {
    return roleTitle;
  }
  if (offer.summary && offer.summary.length > 0) {
    return offer.summary[0];
  }
  if (offer.compensation.length > 0) {
    return offer.compensation
      .map((comp) => `${toTitleCase(comp.type)} ${formatCurrency(comp.amount)}`)
      .join(", ");
  }
  return `Offer ${index + 1}`;
};

export default function CompareOffers() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offerAId, setOfferAId] = useState<string>("");
  const [offerBId, setOfferBId] = useState<string>("");
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analysisContainerRef = useRef<HTMLDivElement | null>(null);
  const notifyAIError = useAIErrorHandler();

  useEffect(() => {
    const loaded = getOffers();
    setOffers(loaded);
  }, []);

  useEffect(() => {
    if (offers.length === 0) {
      setOfferAId("");
      setOfferBId("");
      return;
    }
    if (!offerAId && offers.length > 0) {
      setOfferAId(offers[0].id);
    }
    if (!offerBId && offers.length > 1) {
      setOfferBId(offers[1].id);
    }
  }, [offers, offerAId, offerBId]);

  useEffect(() => {
    if (offerAId && !offers.some((offer) => offer.id === offerAId)) {
      setOfferAId("");
    }
    if (offerBId && !offers.some((offer) => offer.id === offerBId)) {
      setOfferBId("");
    }
  }, [offers, offerAId, offerBId]);

  const selectedOfferA = useMemo(
    () => offers.find((offer) => offer.id === offerAId) || null,
    [offers, offerAId],
  );
  const selectedOfferB = useMemo(
    () => offers.find((offer) => offer.id === offerBId) || null,
    [offers, offerBId],
  );

  useEffect(() => {
    setAnalysis("");
    setError(null);
  }, [offerAId, offerBId]);

  const compensationTypes = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    const pushTypes = (offer: Offer | null) => {
      offer?.compensation.forEach((comp) => {
        if (!seen.has(comp.type)) {
          seen.add(comp.type);
          ordered.push(comp.type);
        }
      });
    };
    pushTypes(selectedOfferA);
    pushTypes(selectedOfferB);
    return ordered;
  }, [selectedOfferA, selectedOfferB]);

  const hasEnoughOffers = offers.length >= 2;
  const offersMatch = selectedOfferA && selectedOfferB && selectedOfferA.id === selectedOfferB.id;
  const canCompare =
    hasEnoughOffers && selectedOfferA && selectedOfferB && !offersMatch && !loading;

  const handleReloadOffers = () => {
    setOffers(getOffers());
  };

  const handleSelectOfferA = (event: SelectChangeEvent<unknown>) => {
    setOfferAId(event.target.value as string);
  };

  const handleSelectOfferB = (event: SelectChangeEvent<unknown>) => {
    setOfferBId(event.target.value as string);
  };

  const handleCompare = async () => {
    if (!selectedOfferA || !selectedOfferB) return;
    const tile = getPromptTile("compareOffers", { contexts: "offers" });
    if (!tile) {
      setError("Compare offers prompt is unavailable.");
      return;
    }
    const offerAText = describeOffer(selectedOfferA);
    const offerBText = describeOffer(selectedOfferB);
    const prompt = tile.fullPrompt
      .replaceAll("{{offerA}}", offerAText)
      .replaceAll("{{offerB}}", offerBText);
    const context = `Offer A:\n${offerAText}\n\nOffer B:\n${offerBText}`;

    setLoading(true);
    setError(null);
    try {
      const response = await askOpenAI({
        context,
        user: prompt,
        system: "You compare job offers and highlight key differences.",
        returnFirstResponse: true,
        chatHistory: [],
      });
      const message = response?.message || "";
      setAnalysis(message.trim());
    } catch (error) {
      const { message } = notifyAIError(error, {
        getToastMessage: (msg) => `Unable to generate comparison. ${msg}`,
        retry: () => handleCompare(),
      });
      setError(`Unable to generate comparison. ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportMarkdown = () => {
    if (!selectedOfferA || !selectedOfferB) return;
    const headers = [
      "Component",
      getOfferLabel(selectedOfferA, offers.indexOf(selectedOfferA)),
      getOfferLabel(selectedOfferB, offers.indexOf(selectedOfferB)),
    ];
    const tableRows = compensationTypes.map((type) => [
      toTitleCase(type),
      formatCompensationValue(selectedOfferA, type),
      formatCompensationValue(selectedOfferB, type),
    ]);
    const markdownLines = [
      `| ${headers.join(" | ")} |`,
      `| ${headers.map(() => "---").join(" | ")} |`,
      ...tableRows.map((row) => `| ${row.join(" | ")} |`),
      "",
      "### Offer A Notes",
      selectedOfferA.summary?.length
        ? selectedOfferA.summary.map((line) => `- ${line}`).join("\n")
        : "_No additional notes._",
      "",
      "### Offer B Notes",
      selectedOfferB.summary?.length
        ? selectedOfferB.summary.map((line) => `- ${line}`).join("\n")
        : "_No additional notes._",
    ];
    if (analysis) {
      markdownLines.push("", "### Analysis", analysis);
    }
    const markdown = markdownLines.join("\n");
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "offer-comparison.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    if (!analysisContainerRef.current) return;
    exportElementToPdf(analysisContainerRef.current, "offer-comparison.pdf");
  };

  return (
    <RequireAIKey>
      <Stack spacing={3} sx={{ minWidth: { xs: "auto", md: 560 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
          <TextField
            select
            fullWidth
            label="Offer A"
            value={offerAId}
            SelectProps={{ onChange: handleSelectOfferA }}
            helperText={hasEnoughOffers ? undefined : "Save at least two offers to compare."}
            disabled={offers.length === 0}
          >
            {offers.map((offer, index) => (
              <MenuItem key={offer.id} value={offer.id}>
                {getOfferLabel(offer, index)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            fullWidth
            label="Offer B"
            value={offerBId}
            SelectProps={{ onChange: handleSelectOfferB }}
            disabled={offers.length < 2}
          >
            {offers.map((offer, index) => (
              <MenuItem key={offer.id} value={offer.id}>
                {getOfferLabel(offer, index)}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="outlined" onClick={handleReloadOffers} sx={{ whiteSpace: "nowrap" }}>
            Refresh
          </Button>
        </Stack>

        {!hasEnoughOffers && (
          <Alert severity="info">Add another offer to enable side-by-side comparison.</Alert>
        )}

        {offersMatch && <Alert severity="warning">Select two different offers to compare.</Alert>}

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Button variant="contained" onClick={handleCompare} disabled={!canCompare}>
            Analyze Offers
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportMarkdown}
            disabled={!selectedOfferA || !selectedOfferB}
          >
            Export Markdown
          </Button>
          <Button
            variant="outlined"
            onClick={handleExportPdf}
            disabled={!selectedOfferA || !selectedOfferB}
          >
            Export PDF
          </Button>
        </Stack>

        {loading && (
          <Box display="flex" justifyContent="center">
            <CircularProgress aria-label="Generating offer comparison" />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {selectedOfferA && selectedOfferB && (
          <Box ref={analysisContainerRef}>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small" aria-label="Offer comparison table">
                <TableHead>
                  <TableRow>
                    <TableCell>Component</TableCell>
                    <TableCell>
                      {getOfferLabel(selectedOfferA, offers.indexOf(selectedOfferA))}
                    </TableCell>
                    <TableCell>
                      {getOfferLabel(selectedOfferB, offers.indexOf(selectedOfferB))}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {compensationTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Typography variant="body2" color="text.secondary">
                          No compensation details recorded for either offer.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    compensationTypes.map((type) => (
                      <TableRow key={type}>
                        <TableCell>{toTitleCase(type)}</TableCell>
                        <TableCell>{formatCompensationValue(selectedOfferA, type)}</TableCell>
                        <TableCell>{formatCompensationValue(selectedOfferB, type)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 3 }}>
              <Box flex={1}>
                <Typography variant="subtitle1" gutterBottom>
                  Offer A Notes
                </Typography>
                {selectedOfferA.summary?.length ? (
                  <List dense sx={{ listStyleType: "disc", pl: 2 }}>
                    {selectedOfferA.summary.map((line, idx) => (
                      <ListItem key={idx} sx={{ display: "list-item", py: 0 }}>
                        <ListItemText
                          primary={line}
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No additional notes saved for this offer.
                  </Typography>
                )}
              </Box>
              <Box flex={1}>
                <Typography variant="subtitle1" gutterBottom>
                  Offer B Notes
                </Typography>
                {selectedOfferB.summary?.length ? (
                  <List dense sx={{ listStyleType: "disc", pl: 2 }}>
                    {selectedOfferB.summary.map((line, idx) => (
                      <ListItem key={idx} sx={{ display: "list-item", py: 0 }}>
                        <ListItemText
                          primary={line}
                          primaryTypographyProps={{ variant: "body2" }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No additional notes saved for this offer.
                  </Typography>
                )}
              </Box>
            </Stack>

            {analysis ? (
              <Box>
                <Typography variant="h6" gutterBottom>
                  AI Analysis
                </Typography>
                <Box sx={{ typography: "body2" }}>
                  <Markdown>{analysis}</Markdown>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Run the analysis to generate AI insights comparing these offers.
              </Typography>
            )}
          </Box>
        )}
      </Stack>
    </RequireAIKey>
  );
}
