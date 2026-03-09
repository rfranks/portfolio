import {
  ComicStripSpecSchema,
  StripInputSchema,
  type CharacterInstance,
  type ComicStripSpec,
  type DialogueLine,
  type Layout,
  type PanelSpec,
  type PropRequirement,
  type StripInput,
} from "@/rickbert-studio/schemas";
import {
  CANONICAL_CHARACTER_ORDER,
  CHARACTER_CONFIGS,
  normalizeCharacterName,
} from "@/rickbert-studio/domain/characterConfigs";
import { SERIES_DEFAULT_PANEL_COUNT } from "@/rickbert-studio/rules/styleRules";
import { compactWhitespace, splitLines } from "@/rickbert-studio/utils/text";

const PANEL_HEADING_REGEX = /^#{2,4}\s*Panel\s*(\d+)/i;
type ParseStripOptions = {
  customCharacterNames?: string[];
  characterOverrides?: Record<string, string>;
};

function extractSection(stripRequest: string, heading: string): string {
  const pattern = new RegExp(
    `${heading}:([\\s\\S]*?)(?:\\n\\s*(?:Additional Character design rules for this strip|Comic premise|Panel-by-panel script):|$)`,
    "i"
  );
  const match = stripRequest.match(pattern);
  return match?.[1]?.trim() ?? "";
}

function findReferenceDoc(stripInput: StripInput, tokens: string[]): string {
  const matched = stripInput.referenceDocs.find((doc) => {
    const target = `${doc.id} ${doc.name}`.toLowerCase();
    return tokens.some((token) => target.includes(token));
  });
  return matched?.content ?? "";
}

function deriveArtStyle(stripInput: StripInput): string {
  const artStyleDoc = findReferenceDoc(stripInput, ["art_style", "art-style", "art"]);
  if (!artStyleDoc) {
    return "clean flat syndicated newspaper office comic; thin black outlines; muted office palette";
  }

  const snippet = artStyleDoc
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8)
    .join(" ");
  const normalized = compactWhitespace(snippet).slice(0, 220);
  const requiredTerms = ["flat", "clean", "office", "muted", "readable", "deadpan"];
  const missingTerms = requiredTerms.filter(
    (term) => !normalized.toLowerCase().includes(term)
  );
  return compactWhitespace(`${normalized} ${missingTerms.join(" ")}`);
}

function deriveGlobalConstraints(stripInput: StripInput): string[] {
  const seriesDoc = findReferenceDoc(stripInput, ["series_behavior", "series-behavior"]);
  const checklistDoc = findReferenceDoc(stripInput, ["checklist"]);
  const additionalRules = extractSection(
    stripInput.stripRequest,
    "Additional Character design rules for this strip"
  )
    .split(/\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  const baselineRules = [
    ...seriesDoc
      .split(/\r?\n/)
      .filter((line) => /default|setup|escalation|punchline|one beat/i.test(line))
      .slice(0, 4)
      .map((line) => line.replace(/^[-*]\s*/, "").trim()),
    ...checklistDoc
      .split(/\r?\n/)
      .filter((line) => /hard rule|production|layout|no paraphrase|no merge/i.test(line))
      .slice(0, 5)
      .map((line) => line.replace(/^[-*]\s*/, "").trim()),
  ];

  return [...additionalRules, ...baselineRules].filter(Boolean);
}

function parseDialogueLine(rawLine: string): DialogueLine {
  const line = rawLine.trim();
  const matched =
    line.match(/^(?:[-*]\s*)?\*\*(.+?):\*\*\s*(.*)$/) ??
    line.match(/^(?:[-*]\s*)?\*\*(.+?)\*\*:\s*(.*)$/) ??
    line.match(/^(?:[-*]\s*)?([^:]+):\s*(.*)$/);

  if (!matched) {
    return {
      speaker: "Unknown",
      text: line,
      isSilent: /^\[silent\]$/i.test(line),
      raw: line,
    };
  }

  const speakerToken = matched[1].trim();
  const text = matched[2].trim();
  const speakerMatch = speakerToken.match(/^(.+?)\s*\((.+)\)$/);
  const speaker = normalizeCharacterName(
    speakerMatch ? speakerMatch[1].trim() : speakerToken
  );
  const qualifier = speakerMatch?.[2]?.trim();

  return {
    speaker,
    qualifier,
    text,
    isSilent: /^\[silent\]$/i.test(text),
    raw: line,
  };
}

function inferPropRequirements(
  sceneText: string,
  dialogue: DialogueLine[],
  panelNumber: number
): PropRequirement[] {
  const combined = `${sceneText}\n${dialogue.map((line) => line.raw).join("\n")}`.toLowerCase();

  const definitions: Array<{ match: RegExp; prop: PropRequirement }> = [
    {
      match: /nameplate|desk nameplate/,
      prop: {
        name: "Desk Nameplate",
        kind: "nameplate",
        panelNumber,
      },
    },
    {
      match: /name tag|nametag/,
      prop: {
        name: "Name Tag",
        kind: "nameTag",
        panelNumber,
      },
    },
    {
      match: /harold|hanz/,
      prop: {
        name: "Name Tag",
        kind: "nameTag",
        requiredText: "HAROLD",
        panelNumber,
      },
    },
    {
      match: /remote window|video window|monitor tile|video call|monitor/,
      prop: {
        name: "Remote Video Window",
        kind: "window",
        panelNumber,
      },
    },
    {
      match: /hanz|harold|device/,
      prop: {
        name: "Hanz Device",
        kind: "device",
        requiredText: "Hanz",
        panelNumber,
      },
    },
    {
      match: /label|labeled|sticker/,
      prop: {
        name: "Panel Label",
        kind: "label",
        panelNumber,
      },
    },
  ];

  return definitions
    .filter((definition) => definition.match.test(combined))
    .map((definition) => definition.prop);
}

function inferCharacters(
  sceneText: string,
  dialogue: DialogueLine[],
  customCharacterNames: Set<string>
): CharacterInstance[] {
  const found = new Set<string>();
  const loweredScene = sceneText.toLowerCase();

  for (const line of dialogue) {
    found.add(normalizeCharacterName(line.speaker));
  }

  for (const name of CANONICAL_CHARACTER_ORDER) {
    if (sceneText.toLowerCase().includes(name.toLowerCase())) {
      found.add(name);
    }
  }

  return Array.from(found)
    .filter((name) => CHARACTER_CONFIGS[name] || customCharacterNames.has(name))
    .map((name) => {
      const canonical = CHARACTER_CONFIGS[name];

      if (!canonical) {
        return {
          name,
          expression: "deadpan",
          pose: "neutral",
          wardrobe: "white",
          isRemote: /remote|bali|video|window|monitor/i.test(
            sceneText + dialogue.map((d) => d.raw).join(" ")
          ),
        };
      }

      return {
        name,
        expression: canonical.defaultExpression,
        pose:
          name === "Rickbert" &&
          /palm-to-face|palm to face|facepalm/.test(loweredScene)
            ? "palmFace"
            : canonical.defaultPose,
        wardrobe: canonical.shirtStyle,
        isRemote:
          name === "Alvin" &&
          /remote|bali|video|window|monitor/i.test(
            sceneText + dialogue.map((d) => d.raw).join(" ")
          ),
      };
    });
}

function parsePanelSection(
  panelNumber: number,
  body: string,
  customCharacterNames: Set<string>
): PanelSpec {
  const lines = splitLines(body);
  const sceneLines: string[] = [];
  const dialogueLines: string[] = [];
  let mode: "scene" | "dialogue" | null = null;

  for (const line of lines) {
    const sceneMatch = line.match(/^Scene:\s*(.*)$/i);
    if (sceneMatch) {
      mode = "scene";
      if (sceneMatch[1].trim()) {
        sceneLines.push(sceneMatch[1].trim());
      }
      continue;
    }

    const dialogueMatch = line.match(/^Dialogue:\s*(.*)$/i);
    if (dialogueMatch) {
      mode = "dialogue";
      if (dialogueMatch[1].trim()) {
        dialogueLines.push(dialogueMatch[1].trim());
      }
      continue;
    }

    if (mode === "scene") {
      sceneLines.push(line);
    } else if (mode === "dialogue") {
      dialogueLines.push(line);
    }
  }

  const sceneText = sceneLines.join(" ").trim();
  const dialogue = dialogueLines.map(parseDialogueLine).filter((line) => line.text.length > 0);
  const characters = inferCharacters(sceneText, dialogue, customCharacterNames);
  const props = inferPropRequirements(sceneText, dialogue, panelNumber);

  return {
    panelNumber,
    sceneText,
    characters,
    dialogue,
    props,
    labels: props
      .filter((prop) => prop.kind === "label" || prop.kind === "nameTag" || prop.kind === "nameplate")
      .map((prop) => prop.name),
    camera: "medium",
    mood: "deadpan",
  };
}

function parsePanelsFromScript(
  stripRequest: string,
  customCharacterNames: Set<string>
): PanelSpec[] {
  const lines = stripRequest.split(/\r?\n/);
  const sections: Array<{ panelNumber: number; lines: string[] }> = [];
  let current: { panelNumber: number; lines: string[] } | null = null;

  for (const line of lines) {
    const headingMatch = line.trim().match(PANEL_HEADING_REGEX);
    if (headingMatch) {
      if (current) {
        sections.push(current);
      }
      current = { panelNumber: Number(headingMatch[1]), lines: [] };
      continue;
    }

    if (current) {
      current.lines.push(line);
    }
  }

  if (current) {
    sections.push(current);
  }

  return sections
    .sort((a, b) => a.panelNumber - b.panelNumber)
    .map((section) =>
      parsePanelSection(
        section.panelNumber,
        section.lines.join("\n"),
        customCharacterNames
      )
    );
}

function buildDefaultPanelSpec(
  panelNumber: number,
  sceneText: string,
  dialogue: Array<[string, string]>,
  customCharacterNames: Set<string>
): PanelSpec {
  const parsedDialogue = dialogue.map(([speaker, text]) => ({
    speaker,
    text,
    isSilent: /^\[silent\]$/i.test(text),
    raw: `**${speaker}:** ${text}`,
  }));

  return parsePanelSection(
    panelNumber,
    `Scene: ${sceneText}\nDialogue:\n${parsedDialogue
      .map((line) => `- **${line.speaker}:** ${line.text}`)
      .join("\n")}`,
    customCharacterNames
  );
}

function createStandardSpec(
  stripInput: StripInput,
  customCharacterNames: Set<string>,
  characterOverrides: Record<string, string>
): ComicStripSpec {
  const sixPanelRequested = /\b6\s*panel/i.test(stripInput.stripRequest);
  const panelCount = sixPanelRequested ? 6 : SERIES_DEFAULT_PANEL_COUNT;

  const premiseText =
    extractSection(stripInput.stripRequest, "Comic premise") || stripInput.stripRequest;
  const concisePremise = compactWhitespace(premiseText);

  const basePanels: PanelSpec[] = [
    buildDefaultPanelSpec(1, "Office standup near a whiteboard.", [
      ["Claire", "Quick product ask, Rickbert."],
      ["Rickbert", "This sounds dangerous already."],
    ], customCharacterNames),
    buildDefaultPanelSpec(2, "Conference table with prototype gadget.", [
      ["Mr. Barrel", "Can we ship this by Friday?"],
      ["Rickbert", "Technically yes. Morally unclear."],
    ], customCharacterNames),
    buildDefaultPanelSpec(3, "Deadpan reaction beat.", [
      ["Claire", "Users still need this."],
      ["Rickbert", "Fine. Put it in the roadmap."],
    ], customCharacterNames),
  ];

  while (basePanels.length < panelCount) {
    const n = basePanels.length + 1;
    basePanels.push(
      buildDefaultPanelSpec(n, `Additional office beat ${n}.`, [
        ["Blair", "Sales already promised it."],
        ["Rickbert", "Of course they did."],
      ], customCharacterNames)
    );
  }

  return ComicStripSpecSchema.parse({
    title: "RICKBERT",
    panelCount,
    layout: panelCount === 6 ? "GRID_2X3" : "ROW_3",
    mode: "STANDARD",
    artStyle: deriveArtStyle(stripInput),
    panels: basePanels.slice(0, panelCount),
    globalConstraints: deriveGlobalConstraints(stripInput).concat([
      concisePremise,
    ]),
    characterOverrides,
    sourceText: stripInput.stripRequest,
  });
}

export function parseStripInput(
  stripInputRaw: StripInput,
  options: ParseStripOptions = {}
): ComicStripSpec {
  const stripInput = StripInputSchema.parse(stripInputRaw);
  const customCharacterNames = new Set(
    (options.customCharacterNames ?? []).map((name) => normalizeCharacterName(name))
  );
  const characterOverrides = options.characterOverrides ?? {};
  const panels = parsePanelsFromScript(stripInput.stripRequest, customCharacterNames);

  if (panels.length === 0) {
    return createStandardSpec(stripInput, customCharacterNames, characterOverrides);
  }

  const panelCount = panels.length;
  const layout: Layout = panelCount === 6 ? "GRID_2X3" : "ROW_3";

  return ComicStripSpecSchema.parse({
    title: /\btitle\b/i.test(stripInput.stripRequest) || panelCount === 6 ? "RICKBERT" : "",
    panelCount,
    layout,
    mode: "PRODUCTION",
    artStyle: deriveArtStyle(stripInput),
    panels,
    globalConstraints: deriveGlobalConstraints(stripInput),
    characterOverrides,
    sourceText: stripInput.stripRequest,
  });
}
