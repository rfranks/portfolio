import type {
  ComicStripSpec,
  ValidationIssue,
  ValidationReport,
} from "@/app/rickbert-studio/_models";
import { ValidationReportSchema } from "@/app/rickbert-studio/_schemas";
import {
  HOUSE_STYLE_FORBIDDEN_TERMS,
  HOUSE_STYLE_REQUIRED_TERMS,
} from "@/app/rickbert-studio/_rules/styleRules";
import { CANONICAL_CHARACTER_ORDER } from "@/app/rickbert-studio/_domain/characterConfigs";
import { includesAny } from "@/app/rickbert-studio/_utils/text";

const ALLOWED_DEVICE_SPEAKERS = new Set(["harold", "hanz", "ambient scribe"]);

export type PreflightRequirements = {
  requestedPanelCount: number;
  requestedLayout: "ROW_3" | "GRID_2X3";
  titleRequired: boolean;
  requiredTitleText?: string;
  productionLocked: boolean;
  requiredProps: string[];
  requiredLabels: string[];
  requiresAlvinRemote: boolean;
  requiredDialogueByPanel: Record<number, string[]>;
};

function issue(
  category: ValidationIssue["category"],
  severity: ValidationIssue["severity"],
  code: string,
  message: string,
  panelNumber?: number,
  suggestion?: string,
): ValidationIssue {
  return { category, severity, code, message, panelNumber, suggestion };
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export function extractPreflightRequirements(spec: ComicStripSpec): PreflightRequirements {
  const source = spec.sourceText.toLowerCase();
  const requestedPanelCount = /\b6\s*panel/.test(source) ? 6 : spec.panelCount;

  const requestedLayout = requestedPanelCount === 6 ? "GRID_2X3" : "ROW_3";

  const titleRequired =
    /\btitle\b/.test(source) || /\brickbert\b/.test(source) || requestedPanelCount === 6;

  const requiredProps: string[] = [];
  const requiredLabels: string[] = [];

  if (/\bhanz\b|\bharold\b/.test(source)) {
    requiredProps.push("Hanz Device");
    requiredLabels.push("Hanz");
  }
  if (/nameplate|desk nameplate/.test(source)) {
    requiredProps.push("Desk Nameplate");
  }
  if (/name tag|nametag/.test(source)) {
    requiredProps.push("Name Tag");
  }
  if (/window|monitor|video call|remote/.test(source)) {
    requiredProps.push("Remote Video Window");
  }

  const requiredDialogueByPanel: Record<number, string[]> = {};
  for (const panel of spec.panels) {
    requiredDialogueByPanel[panel.panelNumber] = panel.dialogue.map((line) => line.raw);
  }

  return {
    requestedPanelCount,
    requestedLayout,
    titleRequired,
    requiredTitleText: titleRequired ? "RICKBERT" : undefined,
    productionLocked: spec.mode === "PRODUCTION",
    requiredProps: uniqueStrings(requiredProps),
    requiredLabels: uniqueStrings(requiredLabels),
    requiresAlvinRemote: /alvin/.test(source) && /remote|bali|video/.test(source),
    requiredDialogueByPanel,
  };
}

export function validateFormatCompliance(
  spec: ComicStripSpec,
  requirements: PreflightRequirements,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (spec.panelCount !== requirements.requestedPanelCount) {
    issues.push(
      issue(
        "format",
        "error",
        "panel_count_mismatch",
        `Requested ${requirements.requestedPanelCount} panels but parsed ${spec.panelCount}.`,
        undefined,
        "Align panel headings with requested panel count before render.",
      ),
    );
  }

  if (spec.layout !== requirements.requestedLayout) {
    issues.push(
      issue(
        "format",
        "error",
        "layout_mismatch",
        `Layout must be ${requirements.requestedLayout} for ${requirements.requestedPanelCount} panels.`,
        undefined,
        "Force 3 panels to 1x3 and 6 panels to 2x3.",
      ),
    );
  }

  if (requirements.titleRequired && spec.title.trim().length === 0) {
    issues.push(
      issue(
        "format",
        "error",
        "title_missing",
        "Title is required but missing.",
        undefined,
        "Set strip title to RICKBERT when the script requires a title.",
      ),
    );
  }

  return issues;
}

export function validateScriptCompliance(
  spec: ComicStripSpec,
  requirements: PreflightRequirements,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (let expected = 1; expected <= spec.panelCount; expected += 1) {
    const panel = spec.panels.find((entry) => entry.panelNumber === expected);
    if (!panel) {
      issues.push(
        issue(
          "script",
          "error",
          "panel_missing",
          `Panel ${expected} is missing from the parsed script.`,
          expected,
          "Add the missing panel heading and content.",
        ),
      );
      continue;
    }

    if (panel.dialogue.length === 0) {
      issues.push(
        issue(
          "script",
          "error",
          "dialogue_missing",
          `Panel ${expected} does not include dialogue lines.`,
          expected,
          "Add dialogue bullets with speaker attribution.",
        ),
      );
    }

    for (const line of panel.dialogue) {
      if (line.speaker === "Unknown") {
        issues.push(
          issue(
            "script",
            "error",
            "speaker_missing",
            `Panel ${expected} has dialogue without a speaker attribution.`,
            expected,
            "Use bullet format like **Claire:** text.",
          ),
        );
      }
    }

    if (requirements.productionLocked) {
      const expectedRaw = requirements.requiredDialogueByPanel[panel.panelNumber] ?? [];
      if (expectedRaw.length !== panel.dialogue.length) {
        issues.push(
          issue(
            "script",
            "error",
            "production_line_loss",
            `Panel ${expected} lost dialogue lines in production mode.`,
            expected,
            "Preserve every provided dialogue line verbatim.",
          ),
        );
      }
    }
  }

  return issues;
}

export function validateCharacterCompliance(
  spec: ComicStripSpec,
  requirements: PreflightRequirements,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const allowedSpeakers = new Set([
    ...CANONICAL_CHARACTER_ORDER.map((name) => name.toLowerCase()),
    ...Object.keys(spec.characterOverrides).map((name) => name.toLowerCase()),
    ...Array.from(ALLOWED_DEVICE_SPEAKERS),
  ]);

  for (const panel of spec.panels) {
    for (const line of panel.dialogue) {
      if (!allowedSpeakers.has(line.speaker.trim().toLowerCase())) {
        const loweredSpeaker = line.speaker.trim().toLowerCase();
        if (line.speaker !== "Unknown" && !ALLOWED_DEVICE_SPEAKERS.has(loweredSpeaker)) {
          issues.push(
            issue(
              "character",
              "warning",
              "non_canonical_character",
              `Panel ${panel.panelNumber} uses non-canonical speaker "${line.speaker}".`,
              panel.panelNumber,
              "Confirm this character is intentional or map the name to canonical roster.",
            ),
          );
        }
      }
    }
  }

  if (requirements.requiresAlvinRemote) {
    const alvinPanel = spec.panels.find((panel) =>
      panel.characters.some((character) => character.name === "Alvin"),
    );

    if (!alvinPanel) {
      issues.push(
        issue(
          "character",
          "error",
          "alvin_missing",
          "Alvin is required but not present in any panel.",
          undefined,
          "Add Alvin to the required panel.",
        ),
      );
    } else {
      const hasRemoteMarker =
        /remote|bali|video|window|monitor/i.test(alvinPanel.sceneText) ||
        alvinPanel.props.some((prop) => prop.kind === "window") ||
        alvinPanel.characters.some((character) => character.name === "Alvin" && character.isRemote);

      if (!hasRemoteMarker) {
        issues.push(
          issue(
            "character",
            "error",
            "alvin_not_remote",
            "Alvin must appear remotely (window/monitor tile) when required.",
            alvinPanel.panelNumber,
            "Add a remote video window cue for Alvin.",
          ),
        );
      }
    }
  }

  return issues;
}

export function validateVisualRequirements(
  spec: ComicStripSpec,
  requirements: PreflightRequirements,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  const panelText = spec.panels
    .map(
      (panel) =>
        `${panel.sceneText} ${panel.labels.join(" ")} ${panel.props.map((prop) => prop.name).join(" ")}`,
    )
    .join(" ")
    .toLowerCase();
  const sourceText = spec.sourceText.toLowerCase();
  const hasHanzDevice = panelText.includes("hanz device");
  const hasHaroldMention = /harold|hanz/.test(sourceText);

  for (const requiredProp of requirements.requiredProps) {
    if (requiredProp === "Name Tag" && hasHanzDevice && hasHaroldMention) {
      continue;
    }

    if (!panelText.includes(requiredProp.toLowerCase().replace(/\s+/g, " "))) {
      issues.push(
        issue(
          "visual",
          "error",
          "required_prop_missing",
          `Required visual element missing: ${requiredProp}.`,
          undefined,
          "Add the missing prop/label requirement to the panel spec.",
        ),
      );
    }
  }

  for (const label of requirements.requiredLabels) {
    if (!panelText.includes(label.toLowerCase())) {
      issues.push(
        issue(
          "visual",
          "error",
          "required_label_missing",
          `Required label text missing: ${label}.`,
          undefined,
          "Ensure label text is present and spelled exactly.",
        ),
      );
    }
  }

  return issues;
}

export function validateReadability(spec: ComicStripSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const panel of spec.panels) {
    for (const line of panel.dialogue) {
      const length = line.text.length;
      if (length > 120) {
        issues.push(
          issue(
            "readability",
            "error",
            "bubble_overflow_likely",
            `Panel ${panel.panelNumber} has likely speech bubble overflow for speaker ${line.speaker}.`,
            panel.panelNumber,
            "Split long lines into shorter beats.",
          ),
        );
      } else if (length > 80) {
        issues.push(
          issue(
            "readability",
            "warning",
            "bubble_dense",
            `Panel ${panel.panelNumber} has dense dialogue that may reduce legibility.`,
            panel.panelNumber,
            "Shorten wording or increase bubble area.",
          ),
        );
      }
    }
  }

  return issues;
}

export function validateStyleCompliance(spec: ComicStripSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const style = spec.artStyle.toLowerCase();

  for (const term of HOUSE_STYLE_REQUIRED_TERMS) {
    if (!style.includes(term)) {
      issues.push(
        issue(
          "style",
          "warning",
          "house_style_term_missing",
          `House style descriptor missing from art style summary: ${term}.`,
          undefined,
          "Include required house style terms in the render spec.",
        ),
      );
    }
  }

  for (const forbidden of HOUSE_STYLE_FORBIDDEN_TERMS) {
    if (style.includes(forbidden)) {
      issues.push(
        issue(
          "style",
          "error",
          "forbidden_style_marker",
          `Style drift detected toward forbidden style: ${forbidden}.`,
          undefined,
          "Reset art style to flat newspaper office comic constraints.",
        ),
      );
    }
  }

  const sourceAndScene = `${spec.sourceText}\n${spec.panels.map((p) => p.sceneText).join("\n")}`;
  if (includesAny(sourceAndScene, ["diagram", "wireframe", "stick figure"])) {
    issues.push(
      issue(
        "style",
        "warning",
        "fallback_style_risk",
        "Prompt includes terms associated with diagram/stick-figure fallback risk.",
        undefined,
        "Reinforce anti-fallback negatives before render.",
      ),
    );
  }

  return issues;
}

export function createValidationReport(spec: ComicStripSpec): ValidationReport {
  const requirements = extractPreflightRequirements(spec);
  const issues = [
    ...validateFormatCompliance(spec, requirements),
    ...validateScriptCompliance(spec, requirements),
    ...validateCharacterCompliance(spec, requirements),
    ...validateVisualRequirements(spec, requirements),
    ...validateReadability(spec),
    ...validateStyleCompliance(spec),
  ];

  const issueCounts = {
    error: issues.filter((entry) => entry.severity === "error").length,
    warning: issues.filter((entry) => entry.severity === "warning").length,
    info: issues.filter((entry) => entry.severity === "info").length,
  };

  return ValidationReportSchema.parse({
    pass: issueCounts.error === 0,
    issues,
    issueCounts,
    generatedAt: new Date().toISOString(),
  });
}
