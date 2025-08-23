import { anyToJson } from "bio-parsers";
import { blue } from "@mui/material/colors";
import {
  Base,
  CodingCodon,
  ParsedSequenceResult,
  Sequence,
} from "@/types/dna/types";
import { CODONS_TO_AMINO_ACIDS } from "@/consts/dna/consts";

export function baseToColor(base: string): string {
  switch (base.toUpperCase()) {
    case "A":
      return "lightblue";
    case "T":
      return "lightyellow";
    case "G":
      return "lightgreen";
    case "C":
      return "lightpink";
    case "U":
      return "lightpurple";
    default:
      return "white";
  }
}

export function baseTo2bit(basePair: string): string {
  // .2Bit format is
  // T to 00, C to 01, A to 10, and G to 11
  // see https://genome.ucsc.edu/FAQ/FAQformat.html#format7
  /** @todo support other formats listed */
  switch (basePair) {
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

  for (const bp of seq) {
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

  counts["GC %"] = (((G.count + C.count) / (1.0 * seq.length)) * 100).toFixed(
    2
  );

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

export async function parseSequence(
  unparsed: string,
  filename: string,
  onParseSuccess?: (parsedSequence: Sequence) => void
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
          ? sequenceResult.parsedSequence.name +
              " " +
              sequenceResult.parsedSequence.description
          : sequenceResult.parsedSequence.name,
        sequenceResult,
        filename,
        hasAmbiguous
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
  hasAmbiguous: boolean
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

export function translateSequenceToAminoAcidsStartingFromATG(
  sequence: string
): string {
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
      "Warning: The sequence length from the start codon is not a multiple of 3. Incomplete codon at the end will be ignored."
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

export function isMaxBase(sequence: string, base: Base) {
  const counts = getBasepairCounts(sequence)?.[0];
  const baseCounts: Array<number> = [
    counts.A,
    counts.C,
    counts.G,
    counts.T,
    counts.U,
  ];
  const maxBasePairCount = Math.max(...baseCounts);
  const numMaxBasePairs = baseCounts.filter(
    (count) => count === maxBasePairCount
  );
  const hasMultiple = numMaxBasePairs.length > 1;

  if (hasMultiple) {
    return false;
  }

  if (counts[base] >= maxBasePairCount) {
    return true;
  }
}
