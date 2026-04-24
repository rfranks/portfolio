import { anyToJson } from "@teselagen/bio-parsers";
import { blue } from "@mui/material/colors";
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

export function getSequenceColor(index: number) {
  return blue[
    Object.keys(blue)[index % Object.keys(blue).length] as
      | 50
      | 100
      | 200
      | 300
      | 400
      | 500
      | 600
      | 700
      | 800
      | 900
      | "A100"
      | "A200"
      | "A400"
      | "A700"
  ];
}

export function getSequenceStrokeColor(index: number) {
  const strokePalette = [
    blue[900],
    blue[700],
    blue[500],
    blue[300],
    blue.A700,
    blue.A400,
    blue[800],
    blue[600],
  ];

  return strokePalette[index % strokePalette.length];
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
