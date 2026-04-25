"use client";

import * as React from "react";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

import { OpenAIKeyInterstitialContent } from "@/components/shared";
import { getOpenAIKeySnapshot, setOpenAIKey } from "@/contexts/OpenAIKeyContext";
import type { Sequence } from "../_types/types";
import { withBasePath } from "@/utils/basePath";
import {
  explainHowToAnswerSequencePromptWithAI,
  explainSequencesWithAI,
  type SequenceAnalysisExplainOutput,
  type SequenceAnalysisOutput,
} from "../_utils/ai";
import { validateOpenAIKey } from "@/app/talentforge/_utils/utils";

type SequenceAIProps = {
  activeSequences: Sequence[];
  sequences: Record<string, Sequence>;
};

const TYPEWRITER_CHARS_PER_TICK = 10;
const TYPEWRITER_INTERVAL_MS = 16;
const EXPLAIN_REQUEST_MAX_TOTAL_BASES = 12_000;

function getTotalBaseCount(sequences: Sequence[]): number {
  return sequences.reduce((total, sequence) => total + sequence.sequence.length, 0);
}

function totalChars(segments: string[]): number {
  return segments.reduce((sum, segment) => sum + segment.length, 0);
}

function revealSegments(segments: string[], visibleChars: number): string[] {
  let remaining = visibleChars;

  return segments.map((segment) => {
    if (remaining <= 0) {
      return "";
    }

    if (remaining >= segment.length) {
      remaining -= segment.length;
      return segment;
    }

    const partial = segment.slice(0, remaining);
    remaining = 0;
    return partial;
  });
}

function formatElapsedTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export default function SequenceAI({ activeSequences, sequences }: SequenceAIProps) {
  const [apiKeyReady, setApiKeyReady] = React.useState(false);
  const [draftKey, setDraftKey] = React.useState("");
  const [keyError, setKeyError] = React.useState("");
  const [submittingKey, setSubmittingKey] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [elapsedSeconds, setElapsedSeconds] = React.useState(0);
  const [response, setResponse] = React.useState<SequenceAnalysisOutput | null>(null);
  const [explainResponse, setExplainResponse] =
    React.useState<SequenceAnalysisExplainOutput | null>(null);
  const [typedExplainChars, setTypedExplainChars] = React.useState(0);
  const [typedResponseChars, setTypedResponseChars] = React.useState(0);
  const [error, setError] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const requestIdRef = React.useRef(0);

  React.useEffect(() => {
    const snapshot = getOpenAIKeySnapshot();
    setDraftKey(snapshot.key);
    setApiKeyReady(snapshot.key.trim().length > 0);
  }, []);

  React.useEffect(() => {
    if (!apiKeyReady) {
      inputRef.current?.focus();
    }
  }, [apiKeyReady]);

  const allSequences = React.useMemo(() => Object.values(sequences), [sequences]);
  const requestSequences = React.useMemo(() => {
    if (activeSequences.length === 1) {
      return activeSequences;
    }

    return allSequences;
  }, [activeSequences, allSequences]);
  const hasSequences = requestSequences.length > 0;
  const isSingleSequence = requestSequences.length === 1;
  const shouldRunExplainRequest = React.useMemo(
    () => getTotalBaseCount(requestSequences) <= EXPLAIN_REQUEST_MAX_TOTAL_BASES,
    [requestSequences],
  );

  React.useEffect(() => {
    setResponse(null);
    setExplainResponse(null);
    setElapsedSeconds(0);
    setTypedExplainChars(0);
    setTypedResponseChars(0);
    setError("");
  }, [requestSequences]);

  React.useEffect(() => {
    if (!loading) {
      setElapsedSeconds(0);
      return;
    }

    const startedAt = Date.now();
    const intervalId = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [loading]);

  const explainSegments = React.useMemo(() => {
    if (!explainResponse) {
      return [];
    }

    return [explainResponse.title, explainResponse.explanation, ...explainResponse.steps];
  }, [explainResponse]);
  const responseSegments = React.useMemo(() => {
    if (!response) {
      return [];
    }

    return [
      response.comparisonOfNucleotideSequences,
      ...response.characteristics,
      ...response.differentiators,
      ...response.sequenceAnalysisImplications,
      ...response.evolutionaryRelationships,
      response.summary,
    ];
  }, [response]);
  const totalExplainChars = React.useMemo(() => totalChars(explainSegments), [explainSegments]);
  const totalResponseChars = React.useMemo(() => totalChars(responseSegments), [responseSegments]);

  React.useEffect(() => {
    if (!explainResponse) {
      setTypedExplainChars(0);
      return;
    }

    setTypedExplainChars(0);
    const intervalId = window.setInterval(() => {
      setTypedExplainChars((current) => {
        if (current >= totalExplainChars) {
          window.clearInterval(intervalId);
          return current;
        }

        return Math.min(current + TYPEWRITER_CHARS_PER_TICK, totalExplainChars);
      });
    }, TYPEWRITER_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [explainResponse, totalExplainChars]);

  React.useEffect(() => {
    if (!response) {
      setTypedResponseChars(0);
      return;
    }

    setTypedResponseChars(0);
    const intervalId = window.setInterval(() => {
      setTypedResponseChars((current) => {
        if (current >= totalResponseChars) {
          window.clearInterval(intervalId);
          return current;
        }

        return Math.min(current + TYPEWRITER_CHARS_PER_TICK, totalResponseChars);
      });
    }, TYPEWRITER_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [response, totalResponseChars]);

  const typedExplainSegments = React.useMemo(
    () => revealSegments(explainSegments, typedExplainChars),
    [explainSegments, typedExplainChars],
  );
  const typedResponseSegments = React.useMemo(
    () => revealSegments(responseSegments, typedResponseChars),
    [responseSegments, typedResponseChars],
  );
  const typedExplainTitle = typedExplainSegments[0] || "";
  const typedExplainText = typedExplainSegments[1] || "";
  const typedExplainSteps = typedExplainSegments.slice(2).filter(Boolean);
  const typedComparison = typedResponseSegments[0] || "";
  const characteristicOffset = 1;
  const differentiatorOffset = characteristicOffset + (response?.characteristics.length || 0);
  const implicationOffset = differentiatorOffset + (response?.differentiators.length || 0);
  const relationshipOffset =
    implicationOffset + (response?.sequenceAnalysisImplications.length || 0);
  const summaryOffset = relationshipOffset + (response?.evolutionaryRelationships.length || 0);
  const typedCharacteristics = typedResponseSegments
    .slice(characteristicOffset, differentiatorOffset)
    .filter(Boolean);
  const typedDifferentiators = typedResponseSegments
    .slice(differentiatorOffset, implicationOffset)
    .filter(Boolean);
  const typedImplications = typedResponseSegments
    .slice(implicationOffset, relationshipOffset)
    .filter(Boolean);
  const typedRelationships = typedResponseSegments
    .slice(relationshipOffset, summaryOffset)
    .filter(Boolean);
  const typedSummary = typedResponseSegments[summaryOffset] || "";
  const isExplainTyping = Boolean(explainResponse) && typedExplainChars < totalExplainChars;
  const isResponseTyping = Boolean(response) && typedResponseChars < totalResponseChars;

  const handleKeySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = draftKey.trim();
    if (!trimmed) {
      return;
    }

    setSubmittingKey(true);
    setKeyError("");

    try {
      const result = await validateOpenAIKey(trimmed);
      if (!result.ok) {
        setKeyError(result.error || "OpenAI rejected that API key.");
        return;
      }

      setOpenAIKey(trimmed, { persist: true, validity: "valid" });
      setDraftKey(trimmed);
      setApiKeyReady(true);
    } finally {
      setSubmittingKey(false);
    }
  };

  const handleAskAI = async () => {
    if (!hasSequences) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setLoading(true);
    setElapsedSeconds(0);
    setResponse(null);
    setExplainResponse(null);
    setTypedExplainChars(0);
    setTypedResponseChars(0);
    setError("");

    let answerWon = false;

    if (shouldRunExplainRequest) {
      void explainHowToAnswerSequencePromptWithAI(requestSequences)
        .then((nextExplainResponse) => {
          if (requestIdRef.current !== requestId || answerWon) {
            return;
          }

          setExplainResponse(nextExplainResponse);
        })
        .catch(() => {
          // The explainer is opportunistic. The full answer remains authoritative.
        });
    }

    try {
      const nextResponse = await explainSequencesWithAI(requestSequences);
      if (requestIdRef.current !== requestId) {
        return;
      }

      answerWon = true;
      setResponse(nextResponse);
      setExplainResponse(null);
    } catch (nextError) {
      if (requestIdRef.current !== requestId) {
        return;
      }

      setError(nextError instanceof Error ? nextError.message : "Failed to get an AI response.");
    } finally {
      if (requestIdRef.current === requestId) {
        setLoading(false);
      }
    }
  };

  if (!apiKeyReady) {
    return (
      <Paper
        sx={{
          width: "100%",
          overflow: "auto",
          backgroundColor: "transparent",
          backgroundImage: "none",
          border: "none",
          boxShadow: "none",
        }}
      >
        <OpenAIKeyInterstitialContent
          appName="GeneBoard AI"
          logoAlt="GeneBoard AI logo"
          logoSrc={withBasePath("/apps/dna/images/geneboard_banner.png")}
          logoFrameSx={{
            backgroundColor: "#ffffff",
            borderRadius: "22px",
            px: 2,
            py: 1.5,
            boxShadow: "var(--dna-shadow-soft)",
          }}
          value={draftKey}
          onChange={setDraftKey}
          onSubmit={handleKeySubmit}
          inputRef={inputRef}
          buttonLabel="Enable AI"
          textFieldName="geneboardOpenAIKey"
          isSubmitting={submittingKey}
          errorText={keyError}
        />
      </Paper>
    );
  }

  return (
    <Paper
      sx={{
        p: 3,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        minWidth: 0,
      }}
    >
      <Box>
        <Typography variant="h5" gutterBottom>
          Sequence AI
        </Typography>
        <Typography color="text.secondary">
          {isSingleSequence
            ? `Ask AI to explain the characteristics of ${requestSequences[0].description} from a FASTA payload.`
            : `Ask AI to compare ${requestSequences.length} sequences and explain what differentiates them.`}
        </Typography>
        {!isSingleSequence && activeSequences.length !== 1 ? (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Select exactly one active sequence if you want single-sequence FASTA analysis. Otherwise
            GeneBoard compares all loaded sequences.
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Button variant="contained" onClick={handleAskAI} disabled={!hasSequences || loading}>
          {loading ? (
            <>
              <CircularProgress size={18} color="inherit" sx={{ mr: 1 }} />
              {`Ask AI (${formatElapsedTime(elapsedSeconds)})`}
            </>
          ) : (
            "Ask AI"
          )}
        </Button>
        {!hasSequences ? (
          <Typography color="text.secondary">Add at least one sequence to analyze.</Typography>
        ) : null}
      </Box>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {!response && explainResponse ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pr: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              {typedExplainTitle}
            </Typography>
            <Typography>{typedExplainText}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              How I Would Approach It
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 3 }}>
              {typedExplainSteps.map((item) => (
                <li key={item}>
                  <Typography component="span">{item}</Typography>
                </li>
              ))}
            </Box>
          </Box>
          {isExplainTyping ? <Typography color="text.secondary">Thinking...</Typography> : null}
        </Box>
      ) : null}
      {response ? (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pr: 1 }}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Comparison of Nucleotide Sequences
            </Typography>
            <Typography>{typedComparison}</Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Characteristics
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 3 }}>
              {typedCharacteristics.map((item) => (
                <li key={item}>
                  <Typography component="span">{item}</Typography>
                </li>
              ))}
            </Box>
          </Box>
          {typedDifferentiators.length > 0 ? (
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Differentiators
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 3 }}>
                {typedDifferentiators.map((item) => (
                  <li key={item}>
                    <Typography component="span">{item}</Typography>
                  </li>
                ))}
              </Box>
            </Box>
          ) : null}
          <Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                Sequence Analysis Implications
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 3 }}>
                {typedImplications.map((item) => (
                  <li key={item}>
                    <Typography component="span">{item}</Typography>
                  </li>
                ))}
              </Box>
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Evolutionary Relationships
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 3 }}>
              {typedRelationships.map((item) => (
                <li key={item}>
                  <Typography component="span">{item}</Typography>
                </li>
              ))}
            </Box>
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
              Summary
            </Typography>
            <Typography>{typedSummary}</Typography>
          </Box>
          {isResponseTyping ? <Typography color="text.secondary">Thinking...</Typography> : null}
        </Box>
      ) : null}
    </Paper>
  );
}
