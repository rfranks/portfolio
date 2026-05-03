import type { SequenceAnalysisBatchResult } from "./sequenceUtils";

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
