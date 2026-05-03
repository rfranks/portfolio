import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output.mts";
import { writeHealthSnapshot, type HealthStatus } from "./lib/health-dashboard.mts";

const rootDir = process.cwd();
const out = createCliOutput();
const cliArgs = new Set(process.argv.slice(2));
const autoFixEnabled = cliArgs.has("--autofix");
const includeExtensions = new Set([".ts", ".tsx", ".mts", ".js"]);
const ignoredDirs = new Set([".git", "node_modules", ".next", "out", "dist", "coverage"]);
const defaultBudget = 900;

const exactBudgets: Record<string, number> = {
  "src/app/talentforge/_components/ApplicationBoard.tsx": 3100,
  "src/app/warbirds/_hooks/useGameEngine.ts": 2700,
  "src/app/talentforge/_utils/dataStore.ts": 1750,
  "src/app/pathforger/_utils/pipeline.ts": 1000,
  "scripts/portfolio-setup.mts": 2150,
  "src/app/ai-shenanigans/_components/AIShenaniganAdaptation.tsx": 1650,
  "src/app/talentforge/_components/ApplicationDetailDrawer.tsx": 1850,
  "src/app/pathforger/PathForgerPageClient.tsx": 1625,
  "src/app/zombiefish/_hooks/useGameEngine.ts": 950,
  "src/app/ai-shenanigans/_components/AIShenanigan.tsx": 1400,
  "src/components/portfolio/panels/CoreCompetencies.tsx": 1550,
  "src/components/portfolio/project-presentation/hooks/useProjectPresentationController.tsx": 1000,
  "src/app/ai-shenanigans/_components/AIShenaniganWorkSeries.tsx": 1150,
  "src/app/pathforger/_hooks/usePathForgerPersistence.ts": 1150,
  "src/app/blackjack/_components/BlackjackGameSlide.tsx": 1100,
  "src/app/talentforge/_components/ResumeStepperModal.tsx": 1150,
  "src/app/talentforge/_components/Inbox.tsx": 1050,
  "src/app/talentforge/_components/ChatWorkspace.tsx": 1000,
  "src/hooks/html/usePanZoomViewport.ts": 1080,
  "scripts/validate-resume-data.mts": 980,
};

const testFilePattern =
  /(?:^|\/)(__tests__\/.*|.*\.(test|spec)\.(ts|tsx|js|jsx|mts)|.*\.test\.(ts|tsx|js|jsx|mts))$/i;
const a11yTestFilePattern = /(?:^|\/)(accessibility|a11y)(?:\/|[-_.])/i;

function withPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function isTestFile(filePath: string): boolean {
  return testFilePattern.test(filePath);
}

function isA11yTestFile(filePath: string): boolean {
  return a11yTestFilePattern.test(filePath);
}

function serializeExactBudgets(overrides: Record<string, number>): string {
  const entries = Object.entries(overrides).sort(([left], [right]) => left.localeCompare(right));
  const lines = entries.map(([file, budget]) => `  "${withPosixPath(file)}": ${budget},`);
  return `const exactBudgets: Record<string, number> = {\n${lines.join("\n")}\n};`;
}

async function rewriteExactBudgets(overrides: Record<string, number>): Promise<void> {
  const scriptPath = path.join(rootDir, "scripts", "check-file-budgets.mts");
  const content = await fs.readFile(scriptPath, "utf8");
  const objectPattern = /const exactBudgets: Record<string, number> = \{[\s\S]*?\n\};/;
  const nextObjectLiteral = serializeExactBudgets(overrides);
  if (!objectPattern.test(content)) {
    throw new Error("Unable to locate exactBudgets object literal for autofix.");
  }

  const updated = content.replace(objectPattern, nextObjectLiteral);
  if (updated === content) {
    return;
  }
  await fs.writeFile(scriptPath, updated, "utf8");
}

function statusFromCounts(args: {
  total: number;
  violations: number;
  emptyStateStatus?: HealthStatus;
}): HealthStatus {
  if (args.total === 0) {
    return args.emptyStateStatus ?? "unknown";
  }
  if (args.violations > 0) {
    return "warn";
  }
  return "pass";
}

async function writeFileBudgetHealthSnapshot(args: {
  status: HealthStatus;
  summary: string;
  details: Record<string, unknown>;
}): Promise<void> {
  const snapshot = await writeHealthSnapshot({
    key: "fileBudgets",
    status: args.status,
    summary: args.summary,
    details: args.details,
  });
  out.metric(
    `Health snapshot: ${snapshot.publicPath} (aggregate: ${snapshot.aggregatePublicPath})`,
  );
}

async function collectFiles(dir: string, files: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (ignoredDirs.has(entry.name)) {
        continue;
      }
      await collectFiles(path.join(dir, entry.name), files);
      continue;
    }

    const ext = path.extname(entry.name);
    if (!includeExtensions.has(ext)) {
      continue;
    }

    const rel = path.relative(rootDir, path.join(dir, entry.name));
    if (!rel.startsWith("src/") && !rel.startsWith("scripts/")) {
      continue;
    }

    files.push(rel);
  }
}

async function lineCount(filePath: string): Promise<number> {
  const content = await fs.readFile(path.join(rootDir, filePath), "utf8");
  if (content.length === 0) {
    return 0;
  }
  return content.split("\n").length;
}

async function main(): Promise<void> {
  const files: string[] = [];
  out.section("File budget scan");
  if (autoFixEnabled) {
    out.info("Autofix mode enabled: stale exactBudget overrides will be cleaned automatically.");
  }
  await collectFiles(rootDir, files);

  const violations: Array<{ file: string; lines: number; budget: number }> = [];
  const missingExactBudgetViolations: Array<{
    file: string;
    budget: number;
  }> = [];
  const exactBudgetUnderuseViolations: Array<{
    file: string;
    lines: number;
    budget: number;
    percentUsed: number;
    reasons: string[];
    recommendedBudget: number;
  }> = [];
  const lineCountsByFile: Record<string, number> = {};
  for (const file of files) {
    const lines = await lineCount(file);
    lineCountsByFile[file] = lines;
    const budget = exactBudgets[file] ?? defaultBudget;
    if (lines > budget) {
      violations.push({ file, lines, budget });
    }
  }

  const exactBudgetEntries = Object.entries(exactBudgets).sort(([a], [b]) => a.localeCompare(b));
  for (const [file, budget] of exactBudgetEntries) {
    const lines = lineCountsByFile[file];
    if (typeof lines !== "number") {
      missingExactBudgetViolations.push({ file, budget });
      out.error(
        `exactBudget ${withPosixPath(file)} is stale: budget ${budget}, actual n/a (file not found in scan).`,
      );
      continue;
    }

    const percentUsed = (lines / budget) * 100;
    const percentUsedText = percentUsed.toFixed(1);
    const reasons: string[] = [];
    if (percentUsed <= 75) {
      reasons.push("exactBudget utilization is 75% or lower");
    }
    if (lines < defaultBudget) {
      reasons.push(`actual lines (${lines}) are below defaultBudget (${defaultBudget})`);
    }

    if (reasons.length > 0) {
      exactBudgetUnderuseViolations.push({
        file,
        lines,
        budget,
        percentUsed,
        reasons,
        recommendedBudget: Math.max(lines + 40, defaultBudget),
      });
      out.error(
        `exactBudget ${withPosixPath(file)} is stale: budget ${budget}, actual ${lines}, used ${percentUsedText}%. ${reasons.join("; ")}.`,
      );
      continue;
    }

    out.warning(
      `exactBudget ${withPosixPath(file)} → budget ${budget}, actual ${lines}, used ${percentUsedText}%`,
    );
  }

  const staleExactBudgetViolations = [
    ...missingExactBudgetViolations.map((violation) => ({
      file: violation.file,
      kind: "missing" as const,
      budget: violation.budget,
    })),
    ...exactBudgetUnderuseViolations.map((violation) => ({
      file: violation.file,
      kind: "underuse" as const,
      budget: violation.budget,
      recommendedBudget: violation.recommendedBudget,
      lines: violation.lines,
    })),
  ];
  let autofixApplied = false;
  const autofixSummary = {
    removedMissing: 0,
    removedBelowDefault: 0,
    tightened: 0,
  };

  if (autoFixEnabled && staleExactBudgetViolations.length > 0) {
    const nextExactBudgets = { ...exactBudgets };

    for (const violation of missingExactBudgetViolations) {
      if (violation.file in nextExactBudgets) {
        delete nextExactBudgets[violation.file];
        autofixSummary.removedMissing += 1;
      }
    }

    for (const violation of exactBudgetUnderuseViolations) {
      if (!(violation.file in nextExactBudgets)) {
        continue;
      }
      if (violation.lines < defaultBudget) {
        delete nextExactBudgets[violation.file];
        autofixSummary.removedBelowDefault += 1;
        continue;
      }
      nextExactBudgets[violation.file] = violation.recommendedBudget;
      autofixSummary.tightened += 1;
    }

    await rewriteExactBudgets(nextExactBudgets);
    autofixApplied = true;
    out.success(
      `Autofix applied to exactBudget overrides: removed missing ${autofixSummary.removedMissing}, removed below-default ${autofixSummary.removedBelowDefault}, tightened ${autofixSummary.tightened}.`,
    );
  }

  const sortedViolations = [...violations].sort(
    (a, b) => b.lines - b.budget - (a.lines - a.budget),
  );
  const sortedExactBudgetUnderuseViolations = [...exactBudgetUnderuseViolations].sort(
    (a, b) => a.percentUsed - b.percentUsed,
  );
  const testFiles = files.filter((file) => isTestFile(file));
  const a11yTestFiles = testFiles.filter((file) => isA11yTestFile(file));
  const schemaValidationTestFiles = testFiles.filter((file) => /resumeDataSchema/i.test(file));
  const testViolations = sortedViolations.filter((violation) => isTestFile(violation.file));
  const a11yViolations = sortedViolations.filter((violation) => isA11yTestFile(violation.file));
  const testHealthStatus = statusFromCounts({
    total: testFiles.length,
    violations: testViolations.length,
    emptyStateStatus: "fail",
  });
  const a11yStatus = statusFromCounts({
    total: a11yTestFiles.length,
    violations: a11yViolations.length,
    emptyStateStatus: "warn",
  });

  const staleExactBudgetViolationCount =
    missingExactBudgetViolations.length + sortedExactBudgetUnderuseViolations.length;
  const snapshotStatus: HealthStatus =
    sortedViolations.length > 0 || (staleExactBudgetViolationCount > 0 && !autofixApplied)
      ? "fail"
      : testHealthStatus === "fail"
        ? "warn"
        : a11yStatus === "warn"
          ? "warn"
          : "pass";

  await writeFileBudgetHealthSnapshot({
    status: snapshotStatus,
    summary:
      sortedViolations.length > 0 || (staleExactBudgetViolationCount > 0 && !autofixApplied)
        ? `File budget check failed: ${sortedViolations.length} file(s) exceed limits, ${staleExactBudgetViolationCount} file(s) have stale exactBudget entries.`
        : autofixApplied
          ? "File budget check passed after autofix of stale exactBudget entries."
          : "File budget check passed.",
    details: {
      totals: {
        scannedFileCount: files.length,
        codeFileCount: files.filter((file) => !isTestFile(file)).length,
        violationCount: sortedViolations.length,
        missingExactBudgetViolationCount: missingExactBudgetViolations.length,
        exactBudgetUnderuseViolationCount: sortedExactBudgetUnderuseViolations.length,
        staleExactBudgetViolationCount,
      },
      budget: {
        defaultBudget,
        exactBudgetOverrideCount: Object.keys(exactBudgets).length,
      },
      autofix: {
        enabled: autoFixEnabled,
        applied: autofixApplied,
        removedMissingOverrides: autofixSummary.removedMissing,
        removedBelowDefaultOverrides: autofixSummary.removedBelowDefault,
        tightenedOverrides: autofixSummary.tightened,
      },
      testHealth: {
        status: testHealthStatus,
        totalTestFiles: testFiles.length,
        violatingTestFiles: testViolations.length,
      },
      a11yHealth: {
        status: a11yStatus,
        totalA11yTestFiles: a11yTestFiles.length,
        violatingA11yTestFiles: a11yViolations.length,
      },
      schemaValidation: {
        schemaTestFileCount: schemaValidationTestFiles.length,
      },
      topViolations: sortedViolations.slice(0, 30).map((violation) => ({
        ...violation,
        file: withPosixPath(violation.file),
        overBy: violation.lines - violation.budget,
      })),
      exactBudgetUnderuseViolations: sortedExactBudgetUnderuseViolations
        .slice(0, 30)
        .map((violation) => ({
          file: withPosixPath(violation.file),
          lines: violation.lines,
          budget: violation.budget,
          percentUsed: Number(violation.percentUsed.toFixed(1)),
          reasons: violation.reasons,
          recommendedBudget: violation.recommendedBudget,
        })),
      missingExactBudgetViolations: missingExactBudgetViolations.slice(0, 30).map((violation) => ({
        file: withPosixPath(violation.file),
        budget: violation.budget,
      })),
    },
  });

  if (violations.length > 0) {
    out.error(
      `File budget check failed: ${sortedViolations.length} file${
        sortedViolations.length === 1 ? "" : "s"
      } exceed budget.`,
    );

    // Print details to stderr so Git hooks / IDE terminals that only surface stderr
    // still show exactly which files exceeded limits.
    for (const violation of sortedViolations) {
      const overBy = violation.lines - violation.budget;
      console.error(
        `  - ${violation.file}: ${violation.lines} lines (budget ${violation.budget}, +${overBy})`,
      );
    }

    out.info("Run `npm run check:file-budgets` locally to see the full report.");
    process.exit(1);
  }

  if (missingExactBudgetViolations.length > 0 || exactBudgetUnderuseViolations.length > 0) {
    if (autofixApplied) {
      out.info("Re-run `npm run check:file-budgets` to verify the updated exactBudget overrides.");
      out.success(`File budget check passed for ${files.length} files.`);
      return;
    }

    out.error(
      `File budget check failed: ${missingExactBudgetViolations.length + sortedExactBudgetUnderuseViolations.length} exactBudget override${
        missingExactBudgetViolations.length + sortedExactBudgetUnderuseViolations.length === 1
          ? ""
          : "s"
      } are stale.`,
    );

    for (const violation of missingExactBudgetViolations) {
      const file = withPosixPath(violation.file);
      console.error(
        `  - ${file}: budget ${violation.budget}, actual n/a (file not found in scan). Fix: remove this exactBudget entry.`,
      );
    }

    for (const violation of sortedExactBudgetUnderuseViolations) {
      const file = withPosixPath(violation.file);
      const reasons = violation.reasons.join("; ");
      if (violation.lines < defaultBudget) {
        console.error(
          `  - ${file}: budget ${violation.budget}, actual ${violation.lines}, used ${violation.percentUsed.toFixed(1)}%. ${reasons}. Fix: remove this exactBudget entry and let defaultBudget (${defaultBudget}) apply.`,
        );
        continue;
      }

      console.error(
        `  - ${file}: budget ${violation.budget}, actual ${violation.lines}, used ${violation.percentUsed.toFixed(1)}%. ${reasons}. Fix: tighten exactBudget near current size (for example ${violation.recommendedBudget} lines) so the override stays meaningful.`,
      );
    }

    out.info("Run `npm run check:file-budgets` locally to see the full report.");
    process.exit(1);
  }

  out.success(`File budget check passed for ${files.length} files.`);
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  out.error(`File budget check crashed: ${message}`);
  await writeFileBudgetHealthSnapshot({
    status: "fail",
    summary: "File budget check crashed.",
    details: {
      error: message,
    },
  });
  process.exit(1);
});
