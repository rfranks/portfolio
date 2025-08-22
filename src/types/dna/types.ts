export type Base = "A" | "C" | "G" | "T" | "U";

export type CodingCodon =
  | "GCT"
  | "GCC"
  | "GCA"
  | "GCG"
  | "CGT"
  | "CGC"
  | "CGA"
  | "CGG"
  | "AGA"
  | "AGG"
  | "AAT"
  | "AAC"
  | "GAT"
  | "GAC"
  | "TGT"
  | "TGC"
  | "CAA"
  | "CAG"
  | "GAA"
  | "GAG"
  | "GGT"
  | "GGC"
  | "GGA"
  | "GGG"
  | "CAT"
  | "CAC"
  | "ATT"
  | "ATC"
  | "ATA"
  | "CTT"
  | "CTC"
  | "CTA"
  | "CTG"
  | "TTA"
  | "TTG"
  | "AAA"
  | "AAG"
  | "ATG"
  | "TTT"
  | "TTC"
  | "CCT"
  | "CCC"
  | "CCA"
  | "CCG"
  | "TCT"
  | "TCC"
  | "TCA"
  | "TCG"
  | "AGT"
  | "AGC"
  | "ACT"
  | "ACC"
  | "ACA"
  | "ACG"
  | "TGG"
  | "TAT"
  | "TAC"
  | "GTT"
  | "GTC"
  | "GTA"
  | "GTG"
  | "TAA"
  | "TAG"
  | "TGA";

export type ProteinCode =
  | "A"
  | "R"
  | "N"
  | "D"
  | "C"
  | "Q"
  | "E"
  | "G"
  | "H"
  | "I"
  | "L"
  | "K"
  | "M"
  | "F"
  | "P"
  | "S"
  | "T"
  | "W"
  | "Y"
  | "V"
  | "";

export type Protein = {
  /**
   * The shortened, abbreviated name for the protein.  Typically 3-4 chars.
   */
  abbrevName: string;
  /**
   * The adopted single letter code for the protein.
   */
  charCode: ProteinCode;
  /**
   * A codon is a sequence of three nucleotides that together form a unit of genetic code in a DNA or RNA molecule.
   * Each codon corresponds to a specific amino acid or signal during protein synthesis.
   *
   * The genetic code is universal among most organisms, meaning that the same codon specifies the same amino acid across species,
   * with some exceptions in mitochondria and in a few organisms.
   *
   * There are 64 possible codons (4^3, because there are four types of nucleotides and each codon is three nucleotides long).
   * Out of these, 61 codons encode the 20 standard amino acids, making the genetic code degenerate, meaning that most amino acids are encoded by more than one codon.
   *
   * The remaining three codons are stop codons ("UAA", "UAG", and "UGA" in RNA; "TAA", "TAG", and "TGA" in DNA), which signal the termination of protein synthesis,
   * indicating that the polypeptide chain is complete and can be released from the ribosome.
   *
   * The codon "AUG" serves a dual role: it codes for the amino acid methionine and also acts as the start codon, initiating the synthesis of proteins by signaling the start site for translation.
   */
  codons: CodingCodon[];
  /**
   * The charge of an amino acid depends on the pH of its environment. We'll consider their charge at physiological pH (approximately 7.4).
   */
  charge?: "positive" | "neutral" | "neutral/neg" | "neutral/pos" | "negative";
  chargeNotes?: string;
  description?: string;
  fullName?: string;
  chemicalFormula?: string;
  essentialNotes?: string;
  /**
   * An essential amino acid is one that cannot be synthesized by the human body and must be obtained from the diet.
   *
   * "Conditionally essential" amino acids are typically non-essential under normal circumstances but may become essential in specific situations, such as illness or stress.
   */
  isEssential?: boolean | "conditionally";
  isStopCodon: boolean;
  isStartCodon: boolean;
  /**
   * Polarity in amino acids refers to the tendency of their side chains to interact with water or other polar solvents.
   *
   * Polar amino acids tend to be hydrophilic (water-loving), meaning they are more likely to be found on the surface of proteins,
   * interacting with the aqueous environment.
   *
   * Nonpolar amino acids, on the other hand, are hydrophobic (water-fearing) and are typically found in the interior of proteins, away from water.
   */
  polar?: boolean;
};

export type ChartMethod =
  | ""
  | "bpcontent"
  | "sequence"
  | "squiggle"
  | "gates"
  | "qi"
  | "randic"
  | "yau"
  | "yau_bp"
  | "yau_int";

export type Sequence = {
  description: string;
  sequence: string;
  type: "DNA" | "RNA";
  filename: string;
  hasAmbiguous: boolean;
  visualization: Record<string, unknown>;
  overview: Record<string, unknown>;
};

export type ParsedSequenceResult = {
  messages?: string[];
  parsedSequence?: ParsedSequence;
  success?: boolean;
};

export type ParsedSequence = {
  circular?: boolean;
  comments?: string[];
  extraLines?: string[];
  features?: string[];
  name?: string;
  sequence?: string;
  size?: number;
  type?: "DNA" | "RNA";
};
