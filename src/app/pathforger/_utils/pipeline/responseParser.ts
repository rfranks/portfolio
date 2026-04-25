export function extractTextFromResponse(payload: unknown): string {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const value = payload as Record<string, unknown>;
  if (typeof value.output_text === "string" && value.output_text.trim().length > 0) {
    return value.output_text.trim();
  }

  const chunks: string[] = [];

  if (Array.isArray(value.output)) {
    for (const item of value.output as Array<Record<string, unknown>>) {
      if (typeof item?.text === "string") {
        chunks.push(item.text);
      }

      if (Array.isArray(item?.content)) {
        for (const entry of item.content as Array<Record<string, unknown>>) {
          if (typeof entry?.text === "string") {
            chunks.push(entry.text);
          }
          if (typeof entry?.output_text === "string") {
            chunks.push(entry.output_text);
          }
        }
      }
    }
  }

  return chunks.join("\n").trim();
}

function extractJsonCandidate(raw: string): string {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const maybeJson = fencedMatch?.[1]?.trim() ?? raw.trim();

  if (maybeJson.startsWith("{") && maybeJson.endsWith("}")) {
    return maybeJson;
  }

  const firstBrace = maybeJson.indexOf("{");
  const lastBrace = maybeJson.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return maybeJson.slice(firstBrace, lastBrace + 1);
  }

  return maybeJson;
}

export function parseJsonResponse(rawText: string): unknown {
  const candidate = extractJsonCandidate(rawText);

  try {
    return JSON.parse(candidate);
  } catch {
    throw new Error("PathForger text stage returned invalid JSON.");
  }
}
