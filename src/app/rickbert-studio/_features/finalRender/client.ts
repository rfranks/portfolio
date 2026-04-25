import type {
  ComicStripSpec,
  ReferenceDocConfig,
  ValidationReport,
} from "@/app/rickbert-studio/_models";
import { requestOpenAIJsonRaw } from "@/utils/openai/client";

export type FinalRenderRequest = {
  apiKey?: string;
  masterPrompt: string;
  referenceDocs: ReferenceDocConfig[];
  stripSpec: ComicStripSpec;
  validationReport: ValidationReport | null;
  outlineDataUrl?: string;
  styleReferenceDataUrl?: string;
  model?: string;
};

export type FinalRenderResponse = {
  imageDataUrl: string;
  responseId?: string | null;
  model?: string | null;
};

type OpenAIErrorPayload = {
  message?: string;
  type?: string;
  code?: string;
  param?: string | null;
};

type OpenAIContentPart =
  | { type: "input_text"; text: string }
  | { type: "input_image"; image_url: string };
const TARGET_LANDSCAPE_SIZE = "1536x1024";
const FINAL_RENDER_TIMEOUT_MS = 240_000;
const IMAGE_TOOL_CONFIG = {
  type: "image_generation",
  size: TARGET_LANDSCAPE_SIZE,
  quality: "high",
} as const;

const REQUIRED_REFERENCE_DOCS = [
  { key: "artStyle", tokens: ["art_style", "art-style", "art style"] },
  {
    key: "characterBible",
    tokens: ["character_bible", "character-bible", "character bible"],
  },
  {
    key: "seriesBehavior",
    tokens: ["series_behavior", "series-behavior", "series behavior"],
  },
  { key: "checklist", tokens: ["checklist"] },
] as const;

type RequiredDocMap = {
  artStyle: string;
  characterBible: string;
  seriesBehavior: string;
  checklist: string;
};

function resolveRequiredDocs(referenceDocs: ReferenceDocConfig[]): RequiredDocMap {
  const resolveDoc = (tokens: readonly string[]): string => {
    const matched = referenceDocs.find((doc) => {
      const idName = `${doc.id} ${doc.name}`.toLowerCase();
      return tokens.some((token) => idName.includes(token));
    });
    return matched?.content?.trim() ?? "";
  };

  const docs: RequiredDocMap = {
    artStyle: resolveDoc(REQUIRED_REFERENCE_DOCS[0].tokens),
    characterBible: resolveDoc(REQUIRED_REFERENCE_DOCS[1].tokens),
    seriesBehavior: resolveDoc(REQUIRED_REFERENCE_DOCS[2].tokens),
    checklist: resolveDoc(REQUIRED_REFERENCE_DOCS[3].tokens),
  };

  const missing = Object.entries(docs)
    .filter(([, content]) => content.length === 0)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Final Render requires non-empty reference docs: ${missing.join(", ")}.`);
  }

  return docs;
}

function summarizeReferenceDocs(referenceDocs: ReferenceDocConfig[]): string {
  return referenceDocs
    .map((doc) => {
      const normalized = doc.content.replace(/\s+/g, " ").trim().slice(0, 1200);
      return `### ${doc.name}\n${normalized}`;
    })
    .join("\n\n");
}

function buildSystemPrompt(
  masterPrompt: string,
  referenceDocs: ReferenceDocConfig[],
  requiredDocs: RequiredDocMap,
): string {
  return [
    "You are a senior comic production renderer for the RICKBERT office comic series.",
    "Generate one final high-quality image from structured production inputs.",
    "Hard requirements:",
    `- Output canvas must be ${TARGET_LANDSCAPE_SIZE} landscape ratio (not square).`,
    "- Keep all title text, panel borders, speech bubbles, and characters fully inside the image bounds.",
    "- Reserve safe margins around all edges so no content is cropped.",
    "- Preserve panel count, order, layout, and title exactly.",
    "- Preserve dialogue text verbatim; do not paraphrase.",
    "- Preserve required props/labels/name tags/nameplates/video windows.",
    "- Keep characters visually consistent across panels.",
    "- House style must be clean, flat, office-comic, muted, readable, deadpan.",
    "- Avoid stick figures, wireframes, storyboard look, or infographic style.",
    "- Characters must have full cartoon anatomy and expressive but subtle poses.",
    "- If an outline image is provided, use it as loose layout guidance only; do not copy rough placeholder drawing style.",
    "- If a style reference image is provided, match its finish quality, line confidence, and rendering richness.",
    "",
    "MASTER PROMPT:",
    masterPrompt.slice(0, 4000),
    "",
    "ART_STYLE (authoritative):",
    requiredDocs.artStyle.slice(0, 2200),
    "",
    "CHARACTER_BIBLE (authoritative):",
    requiredDocs.characterBible.slice(0, 2200),
    "",
    "SERIES_BEHAVIOR (authoritative):",
    requiredDocs.seriesBehavior.slice(0, 1800),
    "",
    "CHECKLIST (authoritative):",
    requiredDocs.checklist.slice(0, 2600),
    "",
    "ADDITIONAL REFERENCE DOCS:",
    summarizeReferenceDocs(referenceDocs),
  ].join("\n");
}

function buildUserPrompt(payload: FinalRenderRequest): string {
  const report = payload.validationReport;
  const validationSummary = report
    ? `Validation status: ${report.pass ? "PASS" : "FAIL"}. Errors: ${report.issueCounts.error}, warnings: ${report.issueCounts.warning}.`
    : "Validation report not provided.";

  return [
    "Render the final polished strip image from the production spec.",
    validationSummary,
    `The output must be one landscape strip image sized ${TARGET_LANDSCAPE_SIZE}.`,
    "Do not crop any panel, dialogue bubble, title text, or characters at the left/right edges.",
    "Respect all text exactly and keep speech bubbles readable.",
    payload.outlineDataUrl
      ? "An outline guide image is provided; treat it as layout guidance only."
      : "No outline guide image is provided; compose the strip from spec and style instructions.",
    "Output only the image result.",
    "",
    "COMIC_STRIP_SPEC_JSON:",
    JSON.stringify(payload.stripSpec),
  ].join("\n");
}

type ExtractedImage = {
  base64: string;
  mimeType: string;
};

function parseImageCandidate(raw: string): ExtractedImage | null {
  const value = raw.trim();
  if (!value) {
    return null;
  }

  const dataUrlMatch = value.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    return {
      mimeType: dataUrlMatch[1],
      base64: dataUrlMatch[2],
    };
  }

  return {
    mimeType: "image/png",
    base64: value,
  };
}

function pushCandidate(bucket: ExtractedImage[], raw: unknown): void {
  if (typeof raw !== "string") {
    return;
  }

  const parsed = parseImageCandidate(raw);
  if (parsed) {
    bucket.push(parsed);
  }
}

function extractImageBase64(payload: unknown): ExtractedImage | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const candidates: ExtractedImage[] = [];

  pushCandidate(candidates, value.image_base64);

  if (Array.isArray(value.data)) {
    for (const entry of value.data as Array<Record<string, unknown>>) {
      pushCandidate(candidates, entry?.b64_json);
      pushCandidate(candidates, entry?.image_base64);
    }
  }

  if (Array.isArray(value.output)) {
    for (const entry of value.output as Array<Record<string, unknown>>) {
      if (entry?.type === "image_generation_call") {
        pushCandidate(candidates, entry.result);
        if (entry.result && typeof entry.result === "object") {
          const nested = entry.result as Record<string, unknown>;
          pushCandidate(candidates, nested.b64_json);
          pushCandidate(candidates, nested.image_base64);
        }
      }

      if (Array.isArray(entry?.content)) {
        for (const item of entry.content as Array<Record<string, unknown>>) {
          pushCandidate(candidates, item?.image_base64);
          pushCandidate(candidates, item?.b64_json);
        }
      }
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Some responses include multiple image payloads. Prefer the largest payload,
  // which is typically the highest-resolution final image rather than an interim preview.
  return candidates.reduce((largest, current) =>
    current.base64.length > largest.base64.length ? current : largest,
  );
}

function extractErrorMessage(payload: Record<string, unknown>): string {
  const errorPayload =
    typeof payload?.error === "object" && payload.error
      ? (payload.error as OpenAIErrorPayload)
      : null;
  const apiMessage =
    errorPayload?.message || (typeof payload?.error === "string" ? payload.error : "");
  return apiMessage;
}

function shouldRetryWithMinimalToolOptions(status: number, apiMessage: string): boolean {
  if (status !== 400 || !apiMessage) {
    return false;
  }

  const lower = apiMessage.toLowerCase();
  return (
    lower.includes("unknown parameter") ||
    lower.includes("invalid tool") ||
    lower.includes("tool_choice")
  );
}

export async function requestFinalRender(
  payload: FinalRenderRequest,
): Promise<FinalRenderResponse> {
  if (!payload.validationReport?.pass) {
    throw new Error("Final Render requires a passing validation report. Please Validate first.");
  }

  const apiKey = payload.apiKey?.trim() || process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim() || "";
  if (!apiKey) {
    throw new Error("OpenAI API key is missing.");
  }

  const model = payload.model?.trim() || "gpt-5.2";
  const requiredDocs = resolveRequiredDocs(payload.referenceDocs);
  const normalizedModel = model.toLowerCase();
  const supportsExplicitAction =
    normalizedModel.includes("gpt-image-1.5") || normalizedModel.includes("chatgpt-image-latest");
  const action = payload.outlineDataUrl || payload.styleReferenceDataUrl ? "edit" : "generate";
  const imageTool = supportsExplicitAction ? { ...IMAGE_TOOL_CONFIG, action } : IMAGE_TOOL_CONFIG;
  const userContent: OpenAIContentPart[] = [{ type: "input_text", text: buildUserPrompt(payload) }];

  if (payload.outlineDataUrl) {
    userContent.push({
      type: "input_image",
      image_url: payload.outlineDataUrl,
    });
  }

  if (payload.styleReferenceDataUrl) {
    userContent.push({
      type: "input_image",
      image_url: payload.styleReferenceDataUrl,
    });
  }

  const baseRequestBody = {
    model,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: buildSystemPrompt(payload.masterPrompt, payload.referenceDocs, requiredDocs),
          },
        ],
      },
      {
        role: "user",
        content: userContent,
      },
    ],
  };

  const requestWithPreferredToolOptions = {
    ...baseRequestBody,
    tools: [imageTool],
    tool_choice: { type: "image_generation" },
  };
  const requestWithMinimalToolOptions = {
    ...baseRequestBody,
    tools: [{ type: "image_generation", size: TARGET_LANDSCAPE_SIZE }],
  };

  const runRequest = async (
    body: Record<string, unknown>,
  ): Promise<{ response: Response; data: Record<string, unknown> }> => {
    return requestOpenAIJsonRaw<Record<string, unknown>>({
      apiKey,
      path: "/responses",
      method: "POST",
      body,
      profileOverrides: {
        timeoutMs: FINAL_RENDER_TIMEOUT_MS,
        retries: 0,
      },
    });
  };

  let { response, data } = await runRequest(
    requestWithPreferredToolOptions as unknown as Record<string, unknown>,
  );

  const firstAttemptMessage = extractErrorMessage(data);
  if (shouldRetryWithMinimalToolOptions(response.status, firstAttemptMessage)) {
    ({ response, data } = await runRequest(
      requestWithMinimalToolOptions as unknown as Record<string, unknown>,
    ));
  }

  if (!response.ok) {
    const apiMessage = extractErrorMessage(data);
    const message =
      apiMessage.length > 0 ? apiMessage : `Final render failed (${response.status}).`;
    throw new Error(message);
  }

  const imageBase64 = extractImageBase64(data);
  if (!imageBase64) {
    throw new Error("Final render response did not include an image.");
  }

  return {
    imageDataUrl: `data:${imageBase64.mimeType};base64,${imageBase64.base64}`,
    responseId: typeof data.id === "string" ? data.id : null,
    model,
  };
}
