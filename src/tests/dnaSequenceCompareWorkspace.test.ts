import type { Sequence } from "@/app/dna/_types/types";
import {
  buildSequenceCompareDiffReport,
  buildSequenceCompareHeatmapReport,
  createSequenceCompareDiffCsv,
  createSequenceCompareHeatmapCsv,
  type SequenceAnalysisRecipeConfig,
} from "@/app/dna/_utils/sequenceUtils";

const createSequence = (overrides: Partial<Sequence>): Sequence => ({
  description: overrides.description ?? "sequence",
  sequence: overrides.sequence ?? "ATGAAATAA",
  type: overrides.type ?? "DNA",
  filename: overrides.filename ?? "sequence.fasta",
  hasAmbiguous: overrides.hasAmbiguous ?? false,
  visualization: overrides.visualization ?? {},
  overview: overrides.overview ?? {},
});

describe("dna multi-sequence compare workspace helpers", () => {
  it("builds heatmap metrics per recipe across active sequences", () => {
    const sequences = [
      createSequence({
        description: "baseline",
        sequence: "ATGAAAACGCCCTAAATGTTTGGGCCCTAG",
      }),
      createSequence({
        description: "comparison-a",
        sequence: "ATGAAACCCGGGTAA",
      }),
    ];

    const configs: SequenceAnalysisRecipeConfig[] = [
      { kind: "motif-scan", motif: "ATG" },
      { kind: "orf-scan", minOrfCodons: 2 },
    ];

    const report = buildSequenceCompareHeatmapReport(sequences, configs);
    const baselineRow = report.rows.find((row) => row.sequenceDescription === "baseline");
    const comparisonRow = report.rows.find((row) => row.sequenceDescription === "comparison-a");

    expect(report.recipeKinds).toEqual(["motif-scan", "orf-scan"]);
    expect(report.rows).toHaveLength(2);
    expect(report.summary).toContain("Compared 2 sequences");
    expect(
      baselineRow?.recipeCells.find((recipeCell) => recipeCell.kind === "motif-scan")?.value,
    ).toBe(2);
    expect(
      baselineRow?.recipeCells.find((recipeCell) => recipeCell.kind === "orf-scan")?.value,
    ).toBe(2);
    expect(
      comparisonRow?.recipeCells.find((recipeCell) => recipeCell.kind === "motif-scan")?.value,
    ).toBe(1);
    expect(
      comparisonRow?.recipeCells.find((recipeCell) => recipeCell.kind === "orf-scan")?.value,
    ).toBe(1);
  });

  it("creates CSV exports for heatmap and diff reports", () => {
    const sequences = [
      createSequence({
        description: "baseline",
        sequence: "AACCGGTT",
      }),
      createSequence({
        description: "comparison-a",
        sequence: "AACCGATTAA",
      }),
      createSequence({
        description: "comparison-b",
        sequence: "AACCGGTT",
      }),
    ];

    const heatmapReport = buildSequenceCompareHeatmapReport(sequences, [
      { kind: "motif-scan", motif: "AA" },
    ]);
    const diffReport = buildSequenceCompareDiffReport(sequences);
    const heatmapCsv = createSequenceCompareHeatmapCsv(heatmapReport);
    const diffCsv = createSequenceCompareDiffCsv(diffReport);

    expect(heatmapCsv).toContain('"Sequence","Type","Length","Motif matches"');
    expect(heatmapCsv).toContain('"baseline"');

    expect(diffReport.entries).toHaveLength(2);
    expect(diffReport.entries[0].mismatchCount).toBe(1);
    expect(diffReport.entries[0].comparedBasepairs).toBe(8);
    expect(diffReport.entries[0].mismatchPct).toBe(12.5);
    expect(diffReport.entries[0].lengthDelta).toBe(2);
    expect(diffReport.entries[0].firstMismatches[0]).toEqual({
      position: 6,
      baselineBase: "G",
      comparisonBase: "A",
    });

    expect(diffCsv).toContain('"Baseline","Comparison","ComparedBasepairs"');
    expect(diffCsv).toContain('"bp 6 G>A"');
  });
});
