import { anyToJson } from "@teselagen/bio-parsers";
import {
  amber,
  blue,
  cyan,
  deepOrange,
  deepPurple,
  green,
  indigo,
  lime,
  orange,
  pink,
  purple,
  red,
  teal,
} from "@mui/material/colors";
import { Base, CodingCodon, ParsedSequenceResult, Sequence } from "../_types/types";
import { CODONS_TO_AMINO_ACIDS } from "../_consts/consts";

// Map each nucleotide base to a representative color for display purposes.
// A -> lightblue, T -> lightyellow, G -> lightgreen, C -> lightpink, U -> violet.
export function baseToColor(base: string): string {
  switch (base.toUpperCase()) {
    case "A":
      return "lightblue";
    case "T":
      return "#facc15";
    case "G":
      return "lightgreen";
    case "C":
      return "lightpink";
    case "U":
      return "violet";
    default:
      return "white";
  }
}

export function baseTo2bit(basePair: string): string {
  // .2Bit format is
  // T/U to 00, C to 01, A to 10, and G to 11
  // see https://genome.ucsc.edu/FAQ/FAQformat.html#format7
  /** @todo support other formats listed */
  switch (basePair.toUpperCase()) {
    case "T":
    case "U":
      return "00";
    case "C":
      return "01";
    case "A":
      return "10";
    case "G":
      return "11";
    default:
      return "";
  }
}

export type BPCount = {
  A: number;
  C: number;
  G: number;
  T: number;
  U: number;
  type: string;
  "GC %": string;
  "GC %Label": string;
  name: string;
  count: number;
  [key: string]: string | number;
};

export function getBasepairCounts(seq: string): BPCount[] {
  const A = {
    name: "A",
    count: 0,
  };

  const C = {
    name: "C",
    count: 0,
  };

  const G = {
    name: "G",
    count: 0,
  };

  const T = {
    name: "T",
    count: 0,
  };

  const U = {
    name: "U",
    count: 0,
  };

  const counts = {
    A: 0,
    C: 0,
    G: 0,
    T: 0,
    U: 0,
    type: "basepair counts",
    "GC %": "0",
    "GC %Label": "GC %",
  };

  // Normalize the sequence to uppercase so lowercase bases are counted
  for (const bp of seq.toUpperCase()) {
    switch (bp) {
      case "A":
        A.count += 1;
        counts.A += 1;
        break;
      case "C":
        C.count += 1;
        counts.C += 1;
        break;
      case "G":
        G.count += 1;
        counts.G += 1;
        break;
      case "T":
        T.count += 1;
        counts.T += 1;
        break;
      case "U":
        U.count += 1;
        counts.U += 1;
        break;
      default:
        break;
    }
  }

  const bpCounts = [];

  counts["GC %"] = seq.length ? (((G.count + C.count) / seq.length) * 100).toFixed(2) : "0";

  bpCounts.push({ ...A, ...counts }, { ...C, ...counts }, { ...G, ...counts });
  if (U.count > 0) {
    // only add U if it has a count
    bpCounts.push({ ...U, ...counts });
  } else {
    // otherwise we are DNA and use T
    bpCounts.push({ ...T, ...counts });
  }

  return bpCounts;
}

const CONTRAST_FIRST_BLUE_SEQUENCE_PALETTE: string[] = [
  blue[900],
  blue[200],
  blue[700],
  blue[100],
  blue[500],
  blue.A700,
  blue[300],
  blue.A100,
  blue[800],
  blue[50],
  blue[600],
  blue.A400,
];

const EXTENDED_SEQUENCE_PALETTE: string[] = [
  teal[600],
  deepPurple[500],
  orange[700],
  cyan[700],
  pink[500],
  green[700],
  indigo[500],
  red[600],
  amber[700],
  purple[700],
  deepOrange[600],
  lime[700],
];

const SEQUENCE_COLOR_PALETTE: string[] = [
  ...CONTRAST_FIRST_BLUE_SEQUENCE_PALETTE,
  ...EXTENDED_SEQUENCE_PALETTE,
];

function getGeneratedSequenceColor(overflowIndex: number): string {
  const hue = (23 + overflowIndex * 137.508) % 360;
  const saturation = 70 - (overflowIndex % 3) * 6;
  const lightness = 44 + (overflowIndex % 2) * 16;

  return `hsl(${Math.round(hue)} ${saturation}% ${lightness}%)`;
}

export function getSequenceColor(index: number) {
  const normalizedIndex = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0;
  if (normalizedIndex < SEQUENCE_COLOR_PALETTE.length) {
    return SEQUENCE_COLOR_PALETTE[normalizedIndex];
  }

  return getGeneratedSequenceColor(normalizedIndex - SEQUENCE_COLOR_PALETTE.length);
}

export function getSequenceStrokeColor(index: number) {
  return getSequenceColor(index);
}

export function getSequenceStrokeStyle(index: number) {
  const strokeWidths = [3.5, 3, 2.75, 3.25, 2.5, 3, 2.75, 2.5];

  return {
    stroke: getSequenceStrokeColor(index),
    strokeWidth: strokeWidths[index % strokeWidths.length],
  };
}

export async function parseSequence(
  unparsed: string,
  filename: string,
  onParseSuccess?: (parsedSequence: Sequence) => void,
) {
  for (const sequenceResult of await anyToJson(unparsed)) {
    let hasAmbiguous = false;
    for (const base of sequenceResult.parsedSequence.sequence) {
      if (!["A", "T", "G", "C", "U", "a", "t", "g", "c", "u"].includes(base)) {
        hasAmbiguous = true;
        break;
      }
    }
    try {
      const parsedSequence: Sequence = transformSequence(
        sequenceResult.parsedSequence.description !== undefined
          ? sequenceResult.parsedSequence.name + " " + sequenceResult.parsedSequence.description
          : sequenceResult.parsedSequence.name,
        sequenceResult,
        filename,
        hasAmbiguous,
      );
      onParseSuccess?.(parsedSequence);
    } catch (err) {
      console.error("Error parsing sequence:", err);
    }
  }
}

export function transformSequence(
  description: string,
  sequence: ParsedSequenceResult,
  filename: string,
  hasAmbiguous: boolean,
): Sequence {
  return {
    description,
    sequence: sequence?.parsedSequence?.sequence?.toUpperCase() || "",
    filename,
    hasAmbiguous,
    visualization: {},
    overview: {},
    type: sequence?.parsedSequence?.type || "DNA",
  };
}

export function translateSequenceToAminoAcids(sequence: string): string {
  let aminoAcids = "";
  for (let i = 0; i < sequence.length; i += 3) {
    const codon = sequence.substring(i, i + 3).toUpperCase();
    const aminoAcid = CODONS_TO_AMINO_ACIDS[codon as CodingCodon] || "?"; // Use '?' for unknown codons
    aminoAcids += aminoAcid;
  }
  return aminoAcids;
}

export function translateSequenceToAminoAcidsStartingFromATG(sequence: string): string {
  let aminoAcids = "";
  // Convert the sequence to uppercase to standardize
  sequence = sequence.toUpperCase();
  // Find the index of the first "ATG" codon
  const startIndex = sequence.indexOf("ATG");
  if (startIndex === -1) {
    console.warn("No start codon (ATG) found. Cannot translate sequence.");
    return "";
  }
  // Warn if the sequence length after the start codon is not a multiple of 3
  if ((sequence.length - startIndex) % 3 !== 0) {
    console.warn(
      "Warning: The sequence length from the start codon is not a multiple of 3. Incomplete codon at the end will be ignored.",
    );
  }
  // Translate the sequence starting from the "ATG" codon
  for (let i = startIndex; i < sequence.length; i += 3) {
    if (i + 3 > sequence.length) break; // Stop if the last codon is incomplete
    const codon = sequence.substring(i, i + 3);
    const aminoAcid = CODONS_TO_AMINO_ACIDS[codon as CodingCodon] || "?"; // Use '?' for unknown codons
    aminoAcids += ` ${aminoAcid} `;
  }
  return aminoAcids;
}

export function validBase(base: string): boolean {
  switch (base.toUpperCase()) {
    case "A":
    case "T":
    case "G":
    case "C":
    case "U":
      return true;
    default:
      return false;
  }
}

export function isMaxBase(sequence: string, base: Base): boolean {
  const counts = getBasepairCounts(sequence)?.[0];
  const baseCounts: Array<number> = [counts.A, counts.C, counts.G, counts.T, counts.U];
  const maxBasePairCount = Math.max(...baseCounts);
  const numMaxBasePairs = baseCounts.filter((count) => count === maxBasePairCount);
  const hasMultiple = numMaxBasePairs.length > 1;

  if (hasMultiple) {
    return false;
  }

  return counts[base] >= maxBasePairCount;
}

export type SequenceAnalysisRecipeKind = "motif-scan" | "gc-anomaly-scan" | "orf-scan";

export type SequenceAnalysisRecipeConfig = {
  kind: SequenceAnalysisRecipeKind;
  motif?: string;
  windowSize?: number;
  gcThresholdPct?: number;
  minOrfCodons?: number;
};

export type SequenceMotifMatch = {
  motif: string;
  start: number;
  end: number;
};

export type SequenceGcAnomaly = {
  windowStart: number;
  windowEnd: number;
  gcPct: number;
  deviationPct: number;
};

export type SequenceOrfRange = {
  frame: 0 | 1 | 2;
  start: number;
  end: number;
  codons: number;
  sequence: string;
};

export type SequenceAnalysisRecipeResult = {
  kind: SequenceAnalysisRecipeKind;
  summary: string;
  motifMatches?: SequenceMotifMatch[];
  gcAnomalies?: SequenceGcAnomaly[];
  orfs?: SequenceOrfRange[];
};

export type SequenceAnalysisBatchResult = {
  generatedAtIso: string;
  sequenceLength: number;
  recipes: SequenceAnalysisRecipeResult[];
  summary: string;
};

export type SequenceCompareHeatmapRecipeCell = {
  kind: SequenceAnalysisRecipeKind;
  label: string;
  value: number;
  summary: string;
};

export type SequenceCompareHeatmapRow = {
  sequenceDescription: string;
  sequenceType: Sequence["type"];
  sequenceLength: number;
  recipeCells: SequenceCompareHeatmapRecipeCell[];
};

export type SequenceCompareHeatmapReport = {
  generatedAtIso: string;
  recipeKinds: SequenceAnalysisRecipeKind[];
  rows: SequenceCompareHeatmapRow[];
  summary: string;
};

export type SequenceCompareDiffMismatch = {
  position: number;
  baselineBase: string;
  comparisonBase: string;
};

export type SequenceCompareDiffEntry = {
  baselineDescription: string;
  comparisonDescription: string;
  comparedBasepairs: number;
  mismatchCount: number;
  mismatchPct: number;
  lengthDelta: number;
  firstMismatches: SequenceCompareDiffMismatch[];
};

export type SequenceCompareDiffReport = {
  generatedAtIso: string;
  baselineDescription: string;
  entries: SequenceCompareDiffEntry[];
  summary: string;
};

const normalizeInputSequence = (sequence: string): string =>
  sequence
    .toUpperCase()
    .split("")
    .filter((base) => validBase(base))
    .join("");

const normalizeRecipeMotif = (motif: string | undefined): string =>
  (motif || "")
    .toUpperCase()
    .split("")
    .filter((base) => validBase(base))
    .join("");

const calculateGcPct = (value: string): number => {
  if (!value.length) {
    return 0;
  }
  let gcCount = 0;
  for (const base of value) {
    if (base === "G" || base === "C") {
      gcCount += 1;
    }
  }
  return (gcCount / value.length) * 100;
};

const RECIPE_LABELS: Record<SequenceAnalysisRecipeKind, string> = {
  "motif-scan": "Motif matches",
  "gc-anomaly-scan": "GC anomaly windows",
  "orf-scan": "ORF candidates",
};

const resolveRecipeMetric = (recipeResult: SequenceAnalysisRecipeResult): number => {
  if (recipeResult.kind === "motif-scan") {
    return recipeResult.motifMatches?.length ?? 0;
  }
  if (recipeResult.kind === "gc-anomaly-scan") {
    return recipeResult.gcAnomalies?.length ?? 0;
  }
  return recipeResult.orfs?.length ?? 0;
};

const toCsvCell = (value: string | number): string => {
  if (typeof value === "number") {
    return String(value);
  }
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
};

export function runSequenceAnalysisRecipe(
  sequence: string,
  config: SequenceAnalysisRecipeConfig,
): SequenceAnalysisRecipeResult {
  const normalizedSequence = normalizeInputSequence(sequence);

  if (config.kind === "motif-scan") {
    const motif = normalizeRecipeMotif(config.motif);
    if (!motif.length || normalizedSequence.length < motif.length) {
      return {
        kind: "motif-scan",
        summary: "No motif matches found.",
        motifMatches: [],
      };
    }

    const matches: SequenceMotifMatch[] = [];
    for (
      let sequenceIndex = 0;
      sequenceIndex <= normalizedSequence.length - motif.length;
      sequenceIndex += 1
    ) {
      if (normalizedSequence.slice(sequenceIndex, sequenceIndex + motif.length) === motif) {
        matches.push({
          motif,
          start: sequenceIndex + 1,
          end: sequenceIndex + motif.length,
        });
      }
    }

    return {
      kind: "motif-scan",
      summary:
        matches.length > 0
          ? `Found ${matches.length} motif match${matches.length === 1 ? "" : "es"} for ${motif}.`
          : `No motif matches found for ${motif}.`,
      motifMatches: matches,
    };
  }

  if (config.kind === "gc-anomaly-scan") {
    const windowSize = Math.max(8, Math.floor(config.windowSize ?? 24));
    const gcThresholdPct = Math.max(1, config.gcThresholdPct ?? 15);
    if (normalizedSequence.length < windowSize) {
      return {
        kind: "gc-anomaly-scan",
        summary: `Sequence is shorter than the ${windowSize}bp window size.`,
        gcAnomalies: [],
      };
    }

    const globalGcPct = calculateGcPct(normalizedSequence);
    const anomalies: SequenceGcAnomaly[] = [];
    for (
      let sequenceIndex = 0;
      sequenceIndex <= normalizedSequence.length - windowSize;
      sequenceIndex += 1
    ) {
      const windowStart = sequenceIndex + 1;
      const windowEnd = sequenceIndex + windowSize;
      const gcPct = calculateGcPct(
        normalizedSequence.slice(sequenceIndex, sequenceIndex + windowSize),
      );
      const deviationPct = Math.abs(gcPct - globalGcPct);
      if (deviationPct >= gcThresholdPct) {
        anomalies.push({
          windowStart,
          windowEnd,
          gcPct: Number(gcPct.toFixed(2)),
          deviationPct: Number(deviationPct.toFixed(2)),
        });
      }
    }

    return {
      kind: "gc-anomaly-scan",
      summary:
        anomalies.length > 0
          ? `Detected ${anomalies.length} GC anomaly window${anomalies.length === 1 ? "" : "s"} (threshold ${gcThresholdPct.toFixed(1)}%).`
          : `No GC anomaly windows exceeded ${gcThresholdPct.toFixed(1)}%.`,
      gcAnomalies: anomalies,
    };
  }

  const minOrfCodons = Math.max(5, Math.floor(config.minOrfCodons ?? 10));
  const startCodon = "ATG";
  const stopCodons = new Set(["TAA", "TAG", "TGA"]);
  const ranges: SequenceOrfRange[] = [];

  for (let frame = 0 as 0 | 1 | 2; frame < 3; frame = (frame + 1) as 0 | 1 | 2) {
    let index = frame;
    while (index <= normalizedSequence.length - 3) {
      const codon = normalizedSequence.slice(index, index + 3);
      if (codon !== startCodon) {
        index += 3;
        continue;
      }

      let stopIndex = index + 3;
      while (stopIndex <= normalizedSequence.length - 3) {
        const stopCodon = normalizedSequence.slice(stopIndex, stopIndex + 3);
        if (stopCodons.has(stopCodon)) {
          const endIndex = stopIndex + 3;
          const codons = (endIndex - index) / 3;
          if (codons >= minOrfCodons) {
            ranges.push({
              frame,
              start: index + 1,
              end: endIndex,
              codons,
              sequence: normalizedSequence.slice(index, endIndex),
            });
          }
          break;
        }
        stopIndex += 3;
      }

      index += 3;
    }
  }

  return {
    kind: "orf-scan",
    summary:
      ranges.length > 0
        ? `Detected ${ranges.length} ORF candidate${ranges.length === 1 ? "" : "s"} (min ${minOrfCodons} codons).`
        : `No ORF candidates found with at least ${minOrfCodons} codons.`,
    orfs: ranges,
  };
}

export function runSelectedSequenceAnalysisRecipes(
  sequence: string,
  configs: SequenceAnalysisRecipeConfig[],
): SequenceAnalysisBatchResult {
  const normalizedSequence = normalizeInputSequence(sequence);
  const recipes = configs.map((config) => runSequenceAnalysisRecipe(normalizedSequence, config));
  const summary =
    recipes.length > 0
      ? `Ran ${recipes.length} analysis recipe${recipes.length === 1 ? "" : "s"} on ${normalizedSequence.length.toLocaleString("en-US")} basepairs.`
      : "No analysis recipes were selected.";

  return {
    generatedAtIso: new Date().toISOString(),
    sequenceLength: normalizedSequence.length,
    recipes,
    summary,
  };
}

export function buildSequenceCompareHeatmapReport(
  sequences: Sequence[],
  configs: SequenceAnalysisRecipeConfig[],
): SequenceCompareHeatmapReport {
  const recipeKinds = Array.from(new Set(configs.map((config) => config.kind)));
  const rows = sequences.map((sequence) => {
    const report = runSelectedSequenceAnalysisRecipes(sequence.sequence, configs);
    const recipeByKind = new Map(report.recipes.map((recipe) => [recipe.kind, recipe] as const));

    return {
      sequenceDescription: sequence.description,
      sequenceType: sequence.type,
      sequenceLength: report.sequenceLength,
      recipeCells: recipeKinds.map((kind) => {
        const recipe = recipeByKind.get(kind);
        const safeRecipe: SequenceAnalysisRecipeResult = recipe ?? {
          kind,
          summary: "No recipe data.",
        };
        return {
          kind,
          label: RECIPE_LABELS[kind],
          value: resolveRecipeMetric(safeRecipe),
          summary: safeRecipe.summary,
        };
      }),
    } satisfies SequenceCompareHeatmapRow;
  });

  return {
    generatedAtIso: new Date().toISOString(),
    recipeKinds,
    rows,
    summary:
      rows.length > 0
        ? `Compared ${rows.length} sequence${rows.length === 1 ? "" : "s"} across ${
            recipeKinds.length
          } recipe metric${recipeKinds.length === 1 ? "" : "s"}.`
        : "No sequences were available for compare workspace output.",
  };
}

export function buildSequenceCompareDiffReport(
  sequences: Sequence[],
  maxMismatchesPerEntry = 25,
): SequenceCompareDiffReport {
  const baseline = sequences[0];
  const baselineDescription = baseline?.description ?? "n/a";
  if (!baseline || sequences.length < 2) {
    return {
      generatedAtIso: new Date().toISOString(),
      baselineDescription,
      entries: [],
      summary: "Select at least two sequences to build a diff report.",
    };
  }

  const baselineSequence = normalizeInputSequence(baseline.sequence);
  const entries = sequences.slice(1).map((sequence) => {
    const comparisonSequence = normalizeInputSequence(sequence.sequence);
    const comparedBasepairs = Math.min(baselineSequence.length, comparisonSequence.length);
    const firstMismatches: SequenceCompareDiffMismatch[] = [];
    let mismatchCount = 0;

    for (let index = 0; index < comparedBasepairs; index += 1) {
      const baselineBase = baselineSequence[index];
      const comparisonBase = comparisonSequence[index];
      if (baselineBase === comparisonBase) {
        continue;
      }
      mismatchCount += 1;
      if (firstMismatches.length < maxMismatchesPerEntry) {
        firstMismatches.push({
          position: index + 1,
          baselineBase,
          comparisonBase,
        });
      }
    }

    const mismatchPct = comparedBasepairs > 0 ? (mismatchCount / comparedBasepairs) * 100 : 0;

    return {
      baselineDescription,
      comparisonDescription: sequence.description,
      comparedBasepairs,
      mismatchCount,
      mismatchPct: Number(mismatchPct.toFixed(2)),
      lengthDelta: comparisonSequence.length - baselineSequence.length,
      firstMismatches,
    } satisfies SequenceCompareDiffEntry;
  });

  return {
    generatedAtIso: new Date().toISOString(),
    baselineDescription,
    entries,
    summary: `Compared baseline "${baselineDescription}" against ${entries.length} additional sequence${
      entries.length === 1 ? "" : "s"
    }.`,
  };
}

export function createSequenceCompareHeatmapCsv(report: SequenceCompareHeatmapReport): string {
  const header = [
    "Sequence",
    "Type",
    "Length",
    ...report.recipeKinds.map((kind) => RECIPE_LABELS[kind]),
  ];
  const lines = [header.map(toCsvCell).join(",")];

  report.rows.forEach((row) => {
    const metricsByKind = new Map(row.recipeCells.map((cell) => [cell.kind, cell.value] as const));
    lines.push(
      [
        row.sequenceDescription,
        row.sequenceType,
        row.sequenceLength,
        ...report.recipeKinds.map((kind) => metricsByKind.get(kind) ?? 0),
      ]
        .map(toCsvCell)
        .join(","),
    );
  });

  return lines.join("\n");
}

export function createSequenceCompareDiffCsv(report: SequenceCompareDiffReport): string {
  const header = [
    "Baseline",
    "Comparison",
    "ComparedBasepairs",
    "MismatchCount",
    "MismatchPct",
    "LengthDelta",
    "FirstMismatches",
  ];
  const lines = [header.map(toCsvCell).join(",")];

  report.entries.forEach((entry) => {
    const mismatchPreview = entry.firstMismatches
      .map(
        (mismatch) => `bp ${mismatch.position} ${mismatch.baselineBase}>${mismatch.comparisonBase}`,
      )
      .join("; ");

    lines.push(
      [
        report.baselineDescription,
        entry.comparisonDescription,
        entry.comparedBasepairs,
        entry.mismatchCount,
        entry.mismatchPct,
        entry.lengthDelta,
        mismatchPreview,
      ]
        .map(toCsvCell)
        .join(","),
    );
  });

  return lines.join("\n");
}

export function createSequenceAnalysisReportMarkdown(report: SequenceAnalysisBatchResult): string {
  const sections: string[] = [
    "# DNA Analysis Report",
    "",
    `Generated: ${report.generatedAtIso}`,
    `Sequence Length: ${report.sequenceLength.toLocaleString("en-US")} basepairs`,
    "",
    report.summary,
    "",
  ];

  report.recipes.forEach((recipe, index) => {
    sections.push(`## ${index + 1}. ${recipe.kind}`);
    sections.push("");
    sections.push(recipe.summary);
    sections.push("");

    if (recipe.kind === "motif-scan" && recipe.motifMatches?.length) {
      sections.push("| Motif | Start | End |");
      sections.push("| --- | ---: | ---: |");
      recipe.motifMatches.forEach((match) => {
        sections.push(`| ${match.motif} | ${match.start} | ${match.end} |`);
      });
      sections.push("");
    }

    if (recipe.kind === "gc-anomaly-scan" && recipe.gcAnomalies?.length) {
      sections.push("| Window Start | Window End | GC % | Deviation % |");
      sections.push("| ---: | ---: | ---: | ---: |");
      recipe.gcAnomalies.forEach((anomaly) => {
        sections.push(
          `| ${anomaly.windowStart} | ${anomaly.windowEnd} | ${anomaly.gcPct.toFixed(2)} | ${anomaly.deviationPct.toFixed(2)} |`,
        );
      });
      sections.push("");
    }

    if (recipe.kind === "orf-scan" && recipe.orfs?.length) {
      sections.push("| Frame | Start | End | Codons |");
      sections.push("| ---: | ---: | ---: | ---: |");
      recipe.orfs.forEach((orf) => {
        sections.push(`| ${orf.frame} | ${orf.start} | ${orf.end} | ${orf.codons} |`);
      });
      sections.push("");
    }
  });

  return sections.join("\n").trimEnd();
}
