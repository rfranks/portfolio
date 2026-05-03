import { toJSONSchema, z } from "zod";

import { ensureOpenAIKey } from "@/contexts/OpenAIKeyContext";
import type { AIPrompt } from "@/types/ai/prompt";
import { requestOpenAIChatCompletions } from "@/utils/openai/client";
import type { HttpRequestProfileOverrides } from "@/types/network/httpClient";
import { sequenceListSchema, sequenceSchema, type Sequence } from "../_types/types";

const fastaPayloadSchema = z.object({
  filename: z.string().min(1),
  content: z.string().min(1),
});

export const sequenceAnalysisInputSchema = z.object({
  mode: z.enum(["single-sequence", "compare-sequences"]),
  sequences: sequenceListSchema,
  fastaFile: fastaPayloadSchema.optional(),
});

export const sequenceAnalysisOutputSchema = z.object({
  comparisonOfNucleotideSequences: z.string().min(1),
  summary: z.string().min(1),
  characteristics: z.array(z.string().min(1)).min(2).max(8),
  differentiators: z.array(z.string().min(1)).max(8).default([]),
  sequenceAnalysisImplications: z.array(z.string().min(1)).min(1).max(8),
  evolutionaryRelationships: z.array(z.string().min(1)).min(1).max(8),
});

export const sequenceAnalysisExplainOutputSchema = z.object({
  title: z.string().min(1),
  explanation: z.string().min(1),
  steps: z.array(z.string().min(1)).min(2).max(6),
});

export type SequenceAnalysisInput = z.infer<typeof sequenceAnalysisInputSchema>;
export type SequenceAnalysisOutput = z.infer<typeof sequenceAnalysisOutputSchema>;
export type SequenceAnalysisExplainOutput = z.infer<typeof sequenceAnalysisExplainOutputSchema>;

const DNA_SEQUENCE_ANALYSIS_MODEL = "gpt-5-2025-08-07";
const DNA_ANALYSIS_REQUEST_PROFILE_OVERRIDES: HttpRequestProfileOverrides = {
  timeoutMs: 240_000,
  retries: 3,
  retryDelayMs: 1_000,
};
const DNA_EXPLAIN_REQUEST_PROFILE_OVERRIDES: HttpRequestProfileOverrides = {
  timeoutMs: 45_000,
  retries: 1,
  retryDelayMs: 600,
};

export const sequenceAnalysisPrompt: AIPrompt<
  typeof sequenceAnalysisInputSchema,
  typeof sequenceAnalysisOutputSchema
> = {
  id: "gene-sequence-analysis",
  inputSchema: sequenceAnalysisInputSchema,
  outputSchema: sequenceAnalysisOutputSchema,
  promptText: (input) => {
    if (input.mode === "single-sequence" && input.fastaFile) {
      return [
        "Explain the observable characteristics of this nucleotide sequence.",
        "Use only evidence available from the sequence itself.",
        "Do not pretend to know organism, phenotype, or lab-confirmed function unless it is directly inferable from the supplied sequence.",
        "Focus on composition, structure hints, coding implications, ambiguity, and notable patterns.",
        'For the "Comparison of Nucleotide Sequences" section, state that only one sequence was provided and summarize the sequence on its own merits.',
        "",
        `FASTA filename: ${input.fastaFile.filename}`,
        input.fastaFile.content,
      ].join("\n");
    }

    return [
      "Compare these nucleotide sequences and explain what differentiates them.",
      "Use only evidence available from the supplied sequences.",
      "Highlight meaningful differences in composition, ambiguity, sequence length, and any obvious coding or structural contrasts.",
      "Do not invent biological provenance or certainty beyond what the data supports.",
      "The response must cover these sections: Comparison of Nucleotide Sequences, Characteristics, Differentiators, Sequence Analysis Implications, Evolutionary Relationships, Summary.",
    ].join("\n");
  },
};

export const sequenceAnalysisExplainPrompt: AIPrompt<
  typeof sequenceAnalysisInputSchema,
  typeof sequenceAnalysisExplainOutputSchema
> = {
  id: "gene-sequence-analysis-explain",
  inputSchema: sequenceAnalysisInputSchema,
  outputSchema: sequenceAnalysisExplainOutputSchema,
  promptText: (input) => {
    const scope =
      input.mode === "single-sequence"
        ? "a single nucleotide sequence"
        : `${input.sequences.length} nucleotide sequences`;

    return [
      "Explain how you would answer the user's sequence-analysis question before actually answering it.",
      "Do not answer the biological question itself.",
      "Describe the reasoning approach, what evidence in the sequence data matters most, and how you would avoid overclaiming.",
      `The analysis target is ${scope}.`,
      "Return a concise explanation suitable to show while the full answer is still being generated.",
    ].join("\n");
  },
};

function chunkSequence(sequence: string, size = 80): string {
  const chunks: string[] = [];

  for (let index = 0; index < sequence.length; index += size) {
    chunks.push(sequence.slice(index, index + size));
  }

  return chunks.join("\n");
}

function buildFasta(sequence: Sequence): z.infer<typeof fastaPayloadSchema> {
  const parsed = sequenceSchema.parse(sequence);
  const headerParts = [parsed.description];

  if (parsed.filename) {
    headerParts.push(parsed.filename);
  }

  return {
    filename: parsed.filename,
    content: `>${headerParts.join(" | ")}\n${chunkSequence(parsed.sequence)}`,
  };
}

export function buildSequenceAnalysisInput(sequences: Sequence[]): SequenceAnalysisInput {
  const parsedSequences = sequenceListSchema.parse(sequences);

  if (parsedSequences.length === 1) {
    return sequenceAnalysisInputSchema.parse({
      mode: "single-sequence",
      sequences: parsedSequences,
      fastaFile: buildFasta(parsedSequences[0]),
    });
  }

  return sequenceAnalysisInputSchema.parse({
    mode: "compare-sequences",
    sequences: parsedSequences,
  });
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }

        if (
          typeof entry === "object" &&
          entry !== null &&
          "text" in entry &&
          typeof entry.text === "string"
        ) {
          return entry.text;
        }

        return "";
      })
      .join("")
      .trim();
  }

  return "";
}

function toJsonSchemaName(value: string): string {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sanitized || "sequence_analysis_output";
}

export async function runAIPrompt<
  TInputSchema extends z.ZodTypeAny,
  TOutputSchema extends z.ZodTypeAny,
>(
  prompt: AIPrompt<TInputSchema, TOutputSchema>,
  rawInput: z.input<TInputSchema>,
  options?: {
    requestProfileOverrides?: HttpRequestProfileOverrides;
    maxTokens?: number;
  },
): Promise<z.infer<TOutputSchema>> {
  const apiKey = ensureOpenAIKey();
  const input = prompt.inputSchema.parse(rawInput);
  const outputJsonSchema = toJSONSchema(prompt.outputSchema);
  const schemaName = toJsonSchemaName(prompt.id);
  const userContentParts = [prompt.promptText(input)];
  const inputRecord =
    typeof input === "object" && input !== null ? (input as Record<string, unknown>) : null;
  if (inputRecord?.mode === "compare-sequences" && Array.isArray(inputRecord.sequences)) {
    userContentParts.push("", "Input payload:", JSON.stringify(input, null, 2));
  }
  const requestMessages = [
    {
      role: "system" as const,
      content: [
        "You are a careful bioinformatics assistant.",
        "Return only valid JSON.",
        "The JSON must satisfy the provided output schema exactly.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: userContentParts.join("\n"),
    },
  ];

  const requestOpenAI = async (maxCompletionTokens: number | undefined) => {
    try {
      return await requestOpenAIChatCompletions(
        apiKey,
        {
          model: DNA_SEQUENCE_ANALYSIS_MODEL,
          max_completion_tokens: maxCompletionTokens,
          reasoning_effort: "minimal",
          response_format: {
            type: "json_schema",
            json_schema: {
              name: schemaName,
              strict: true,
              schema: outputJsonSchema,
            },
          },
          messages: requestMessages,
        },
        options?.requestProfileOverrides,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        (error.name === "TimeoutError" ||
          error.name === "AbortError" ||
          error.message.toLowerCase().includes("timed out"))
      ) {
        throw new Error(
          "GeneBoard AI request timed out before analysis completed. Retry or reduce the analysis scope.",
        );
      }

      throw error;
    }
  };

  const initialMaxTokens = options?.maxTokens;
  let data = await requestOpenAI(initialMaxTokens);
  let content = extractTextContent(data?.choices?.[0]?.message?.content);
  const firstChoice = data?.choices?.[0];
  if (!content && firstChoice?.finish_reason === "length") {
    const retryMaxTokens = Math.max((initialMaxTokens ?? 1_200) * 2, 2_000);
    data = await requestOpenAI(retryMaxTokens);
    content = extractTextContent(data?.choices?.[0]?.message?.content);
  }

  if (!content) {
    const finishReason = data?.choices?.[0]?.finish_reason;
    const reasoningTokens = data?.usage?.completion_tokens_details?.reasoning_tokens;
    if (finishReason === "length") {
      const reasoningSuffix =
        typeof reasoningTokens === "number"
          ? ` (reasoning tokens consumed: ${reasoningTokens}).`
          : ".";
      throw new Error(
        `OpenAI reached completion length before emitting JSON${reasoningSuffix} Retry, lower analysis scope, or increase completion budget.`,
      );
    }
    throw new Error("OpenAI returned an empty response.");
  }

  let parsedContent: unknown;

  try {
    parsedContent = JSON.parse(content);
  } catch {
    throw new Error("OpenAI returned invalid JSON.");
  }

  return prompt.outputSchema.parse(parsedContent);
}

export async function explainSequencesWithAI(
  sequences: Sequence[],
): Promise<SequenceAnalysisOutput> {
  const input = buildSequenceAnalysisInput(sequences);
  return runAIPrompt(sequenceAnalysisPrompt, input, {
    requestProfileOverrides: DNA_ANALYSIS_REQUEST_PROFILE_OVERRIDES,
    maxTokens: 1_200,
  });
}

export async function explainHowToAnswerSequencePromptWithAI(
  sequences: Sequence[],
): Promise<SequenceAnalysisExplainOutput> {
  const input = buildSequenceAnalysisInput(sequences);
  return runAIPrompt(sequenceAnalysisExplainPrompt, input, {
    requestProfileOverrides: DNA_EXPLAIN_REQUEST_PROFILE_OVERRIDES,
    maxTokens: 420,
  });
}
