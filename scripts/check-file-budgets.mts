import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output";
import { writeHealthSnapshot, type HealthStatus } from "./lib/health-dashboard";

const rootDir = process.cwd();
const out = createCliOutput();
const includeExtensions = new Set([".ts", ".tsx", ".mts", ".js"]);
const ignoredDirs = new Set([".git", "node_modules", ".next", "out", "dist", "coverage"]);
const defaultBudget = 750;

const exactBudgets: Record<string, number> = {
  "src/app/talentforge/_components/ApplicationBoard.tsx": 3650,
  "src/app/warbirds/_hooks/useGameEngine.ts": 2900,
  "src/app/talentforge/_utils/dataStore.ts": 2850,
  "src/app/pathforger/_utils/pipeline.ts": 2700,
  "scripts/portfolio-setup.mts": 2150,
  "src/app/ai-shenanigans/_components/AIShenaniganAdaptation.tsx": 1650,
  "src/app/talentforge/_components/ApplicationDetailDrawer.tsx": 1850,
  "src/app/pathforger/PathForgerPageClient.tsx": 1650,
  "src/app/zombiefish/_hooks/useGameEngine.ts": 1550,
  "src/app/ai-shenanigans/_components/AIShenanigan.tsx": 1400,
  "src/components/portfolio/panels/CoreCompetencies.tsx": 1550,
  "src/components/shared/media/MediaCycler.tsx": 1300,
  "src/components/portfolio/project-presentation/hooks/useProjectPresentationController.tsx": 1600,
  "src/app/ai-shenanigans/_components/AIShenaniganWorkSeries.tsx": 1150,
  "src/app/pathforger/_hooks/usePathForgerPersistence.ts": 1150,
  "src/app/pathforger/_components/PathForgerCreateStoryPanel.tsx": 950,
  "src/app/blackjack/_components/BlackjackGameSlide.tsx": 1100,
  "src/app/talentforge/_components/ResumeStepperModal.tsx": 1150,
  "src/app/talentforge/_components/Inbox.tsx": 1050,
  "src/app/talentforge/_components/ChatWorkspace.tsx": 1000,
  "src/app/talentforge/_utils/schemas.ts": 925,
  "src/components/shared/monitoring/NavigationTelemetry.tsx": 1050,
  "src/hooks/html/usePanZoomViewport.ts": 940,
  "src/consts/resumeDataSchema.ts": 860,
  "scripts/validate-resume-data.mts": 820,
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
  await collectFiles(rootDir, files);

  const violations: Array<{ file: string; lines: number; budget: number }> = [];
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
      out.warning(
        `exactBudget ${withPosixPath(file)} → budget ${budget} lines, actual n/a (file not found in scan)`,
      );
      continue;
    }

    const percentUsed = ((lines / budget) * 100).toFixed(1);
    out.warning(
      `exactBudget ${withPosixPath(file)} → budget ${budget}, actual ${lines}, used ${percentUsed}%`,
    );
  }

  const sortedViolations = [...violations].sort(
    (a, b) => b.lines - b.budget - (a.lines - a.budget),
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

  const snapshotStatus: HealthStatus =
    sortedViolations.length > 0
      ? "fail"
      : testHealthStatus === "fail"
        ? "warn"
        : a11yStatus === "warn"
          ? "warn"
          : "pass";

  await writeFileBudgetHealthSnapshot({
    status: snapshotStatus,
    summary:
      sortedViolations.length > 0
        ? `File budget check failed: ${sortedViolations.length} file(s) exceed limits.`
        : "File budget check passed.",
    details: {
      totals: {
        scannedFileCount: files.length,
        codeFileCount: files.filter((file) => !isTestFile(file)).length,
        violationCount: sortedViolations.length,
      },
      budget: {
        defaultBudget,
        exactBudgetOverrideCount: Object.keys(exactBudgets).length,
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
