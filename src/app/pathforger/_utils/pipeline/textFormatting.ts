import { PathForgerOnboardingInput, PathForgerPitchResult } from "../../_types/pipeline";
import { PathForgerPitchChoice } from "../../_types/pitch";

function normalizeForHeadingMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(/[`*_>#~]/g, " ")
    .replace(/[—–-]/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripRiskHudHeading(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const filtered = lines.filter((line) => {
    const normalized = normalizeForHeadingMatch(line);
    return !normalized.startsWith("risk hud");
  });

  return filtered.join("\n").trim();
}

function injectRiskHudEmojis(markdown: string): string {
  const labelEmojiMap: Array<{ label: string; emoji: string }> = [
    { label: "Success Probability", emoji: "🎯" },
    { label: "Threat Level", emoji: "⚠️" },
    { label: "Injury Risk", emoji: "🩹" },
    { label: "Resource Cost", emoji: "💸" },
    { label: "Reward Potential", emoji: "🏆" },
    { label: "Key Risk Factors", emoji: "🧭" },
  ];

  return markdown
    .split(/\r?\n/)
    .map((line) => {
      let nextLine = line;
      for (const { label, emoji } of labelEmojiMap) {
        if (nextLine.includes(emoji)) {
          continue;
        }

        const labelPattern = new RegExp(`\\b${label.replace(/\s+/g, "\\s+")}\\b`, "i");
        if (labelPattern.test(nextLine)) {
          nextLine = nextLine.replace(labelPattern, `${emoji} $&`);
        }
      }

      return nextLine;
    })
    .join("\n")
    .trim();
}

function toRiskHudLineItems(markdown: string): string {
  const riskMarkers: Array<{ label: string; emoji: string }> = [
    { label: "Success Probability", emoji: "🎯" },
    { label: "Threat Level", emoji: "⚠️" },
    { label: "Injury Risk", emoji: "🩹" },
    { label: "Resource Cost", emoji: "💸" },
    { label: "Reward Potential", emoji: "🏆" },
    { label: "Key Risk Factors", emoji: "🧭" },
  ];

  const markerPatterns = riskMarkers.map(
    ({ label, emoji }) =>
      `${emoji.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*${label.replace(/\s+/g, "\\s+")}\\s*:`,
  );
  const markerAlternation = markerPatterns.join("|");
  const markerChunkPattern = new RegExp(
    `(${markerAlternation})[\\s\\S]*?(?=(${markerAlternation})|$)`,
    "gi",
  );

  const matches = Array.from(markdown.matchAll(markerChunkPattern)).map((match) => match[0].trim());
  if (matches.length === 0) {
    return markdown.trim();
  }

  const normalizedLines = matches
    .map((line) => line.replace(/^\s*[-+•]\s*/, "").trim())
    .filter((line) => line.length > 0);

  if (normalizedLines.length === 0) {
    return markdown.trim();
  }

  // Keep the Risk HUD as plain markdown lines and normalize to single
  // line breaks between sections (instead of forcing bullet list formatting).
  return normalizedLines.join("\n").trim();
}

function normalizeRiskHudMarkdownLayout(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s+/, "")
        .replace(/^\s{0,3}>\s+/, "")
        .replace(/^\s*[-+*•]\s+/, "")
        .replace(/[*_`~]/g, "")
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
}

function sanitizeRiskHudMarkdown(markdown: string): string {
  const withoutHeading = stripRiskHudHeading(markdown);
  const normalized = normalizeRiskHudMarkdownLayout(withoutHeading);
  const withEmojis = injectRiskHudEmojis(normalized);
  return toRiskHudLineItems(withEmojis);
}

export function stripChapterChoicesTail(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const sectionKeywordPattern =
    "(?:path\\s*ledger|pathledger|your\\s+choices?|choices?|option\\s*[ab]|outcome\\s*[ab]|continue\\s+prompt|risk\\s*hud|image\\s*prompts?)";

  const cutIndex = lines.findIndex((line) => {
    const normalized = normalizeForHeadingMatch(line);
    if (
      normalized === "your choices" ||
      normalized.startsWith("your choices ") ||
      normalized === "choices" ||
      normalized === "path ledger" ||
      normalized === "pathledger" ||
      normalized.startsWith("path ledger ") ||
      normalized.startsWith("pathledger ") ||
      normalized.startsWith("option a") ||
      normalized.startsWith("option b") ||
      normalized.startsWith("outcome a") ||
      normalized.startsWith("outcome b") ||
      normalized.startsWith("continue prompt") ||
      normalized.startsWith("risk hud") ||
      normalized.startsWith("image prompts") ||
      normalized.startsWith("image prompt")
    ) {
      return true;
    }

    if (new RegExp(`^\\s*#{1,6}\\s*${sectionKeywordPattern}\\b`, "i").test(line)) {
      return true;
    }

    if (new RegExp(`^\\s*(?:[-+*]\\s*)?${sectionKeywordPattern}\\s*(?:[:—–-]|$)`, "i").test(line)) {
      return true;
    }

    return false;
  });

  const narrative = cutIndex < 0 ? markdown.trim() : lines.slice(0, cutIndex).join("\n").trim();

  return narrative.replace(/\n\s*(?:[-*_]\s*){3,}\s*$/g, "").trim();
}

export function normalizeChoiceRiskHud<T extends { riskHudMarkdown: string }>(choices: T[]): T[] {
  return choices.map((choice) => ({
    ...choice,
    riskHudMarkdown: sanitizeRiskHudMarkdown(choice.riskHudMarkdown),
  }));
}

export function extractCoverTitleHintFromPrompt(prompt: string): string | null {
  const lines = prompt
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    const titleLine = line.match(/^title\s*[:\-]\s*["“]?(.+?)["”]?$/i);
    if (titleLine?.[1]?.trim()) {
      return titleLine[1].trim();
    }
  }

  const quotedTitle = prompt.match(/(?:title|book title)\s*[:\-]?\s*["“]([^"”\n]{2,120})["”]/i);
  if (quotedTitle?.[1]?.trim()) {
    return quotedTitle[1].trim();
  }

  return null;
}

export function markdownToPlainText(markdown: string, maxChars = 360): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]+`/g, " ")
    .replace(/!\[.*?\]\(.*?\)/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_>~]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= maxChars) {
    return plain;
  }

  return `${plain.slice(0, maxChars - 1).trimEnd()}…`;
}

export function buildCoverPromptFromPitch(input: {
  onboarding: PathForgerOnboardingInput;
  pitchResult: PathForgerPitchResult;
  selectedPitch: PathForgerPitchChoice;
}): string {
  const selectedPitch = input.pitchResult.pitches.find((pitch) => pitch.id === input.selectedPitch);

  if (!selectedPitch) {
    throw new Error(`Unable to resolve selected pitch: ${input.selectedPitch}`);
  }

  const selectedPitchTitle = normalizePitchTitle(selectedPitch.title, `Pitch ${selectedPitch.id}`);
  const fallbackAdventureTitle = input.pitchResult.adventureTitle.trim();
  const coverTitle = selectedPitchTitle.length > 0 ? selectedPitchTitle : fallbackAdventureTitle;

  return buildCoverPromptFromTitle({
    onboarding: input.onboarding,
    coverTitle,
    teaserMarkdown: selectedPitch.markdown,
    contextTitle: fallbackAdventureTitle.length > 0 ? fallbackAdventureTitle : undefined,
  });
}

export function buildCoverPromptFromTitle(input: {
  onboarding: PathForgerOnboardingInput;
  coverTitle: string;
  teaserMarkdown?: string;
  contextTitle?: string;
}): string {
  const sanitizedCoverTitle = input.coverTitle.trim();
  const teaser = input.teaserMarkdown ? markdownToPlainText(input.teaserMarkdown, 260) : "";
  const contextTitle = input.contextTitle?.trim() ?? "";

  return [
    "Create a premium front-facing novel book cover illustration.",
    `Book Title: \"${sanitizedCoverTitle}\"`,
    teaser ? `Story Teaser: ${teaser}` : "",
    contextTitle ? `Story Context Title: \"${contextTitle}\"` : "",
    "",
    "Cover requirements:",
    "- The main title text must be large, high-contrast, clean, and legible.",
    "- The title must read exactly as written in the Book Title field.",
    "- Never render chapter labels or chapter titles (e.g., 'Chapter 1', 'Chapter N — ...').",
    "- Do not include any text besides the exact Book Title.",
    "- Composition should feel like a real published book cover (not a scene still).",
    "- Keep supporting text minimal and subordinate to the title.",
    "",
    `Genre: ${input.onboarding.genre}`,
    `Tone: ${input.onboarding.tone}`,
    `Visual Style: ${input.onboarding.visualStyle}`,
    `Age Rating: ${input.onboarding.ageRating}`,
  ].join("\n");
}

export function resolvePitchDisplayTitle(input: {
  pitchResult: PathForgerPitchResult;
  selectedPitch: PathForgerPitchChoice;
}): string {
  const selectedPitch = input.pitchResult.pitches.find((pitch) => pitch.id === input.selectedPitch);
  const title = selectedPitch
    ? normalizePitchTitle(selectedPitch.title, `Pitch ${input.selectedPitch}`)
    : "";
  if (title && title.length > 0) {
    return title;
  }

  return `Pitch ${input.selectedPitch}`;
}

const MAX_PITCH_TITLE_WORDS = 6;
const MAX_PITCH_TITLE_CHARS = 56;

function clampTitleLength(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }

  const cutoff = value.slice(0, maxChars);
  const lastSpace = cutoff.lastIndexOf(" ");
  if (lastSpace >= 0) {
    return cutoff.slice(0, lastSpace).trim();
  }
  return cutoff.trim();
}

function normalizePitchTitle(rawTitle: string, fallbackTitle: string): string {
  const titleWithoutParens = rawTitle.replace(/\([^)]*\)/g, " ").replace(/\[[^\]]*\]/g, " ");

  const firstPartOnly = titleWithoutParens.split(/[:|]/)[0]?.split(/\s+[—–-]\s+/)[0];

  const normalized = (firstPartOnly ?? titleWithoutParens)
    .replace(/[`*_#]/g, " ")
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "")
    .replace(/[.,;!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const words = normalized.split(/\s+/).filter(Boolean).slice(0, MAX_PITCH_TITLE_WORDS);
  const byWords = words.join(" ").trim();
  const byChars = clampTitleLength(byWords, MAX_PITCH_TITLE_CHARS);
  const clean = byChars.replace(/\s+/g, " ").trim();

  if (clean.length > 0) {
    return clean;
  }
  return fallbackTitle;
}

export function normalizePitchResultTitles(
  pitchResult: PathForgerPitchResult,
): PathForgerPitchResult {
  const usedTitles = new Set<string>();
  const pitches = pitchResult.pitches.map((pitch) => {
    const fallback = `Pitch ${pitch.id}`;
    let title = normalizePitchTitle(pitch.title, fallback);

    const dedupeKey = title.toLowerCase();
    if (usedTitles.has(dedupeKey)) {
      const suffix = pitch.id;
      const base = clampTitleLength(title, Math.max(8, MAX_PITCH_TITLE_CHARS - suffix.length - 1));
      title = `${base} ${suffix}`.trim();
    }

    usedTitles.add(title.toLowerCase());

    return {
      ...pitch,
      title,
    };
  });

  return {
    ...pitchResult,
    pitches,
  };
}
