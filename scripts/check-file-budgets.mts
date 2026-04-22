import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output";

const rootDir = process.cwd();
const out = createCliOutput();
const includeExtensions = new Set([".ts", ".tsx", ".mts", ".js"]);
const ignoredDirs = new Set([".git", "node_modules", ".next", "out", "dist", "coverage"]);
const defaultBudget = 900;

const exactBudgets: Record<string, number> = {
  "src/app/talentforge/_components/ApplicationBoard.tsx": 3850,
  "src/app/warbirds/_hooks/useGameEngine.ts": 3600,
  "src/app/talentforge/_utils/dataStore.ts": 3100,
  "src/app/pathforger/_utils/pipeline.ts": 2850,
  "scripts/portfolio-setup.mts": 2800,
  "src/app/ai-shenanigans/_components/AIShenaniganAdaptation.tsx": 2000,
  "src/app/talentforge/_components/ApplicationDetailDrawer.tsx": 2000,
  "src/app/pathforger/PathForgerPageClient.tsx": 1800,
  "src/app/zombiefish/_hooks/useGameEngine.ts": 1750,
  "src/app/ai-shenanigans/_components/AIShenanigan.tsx": 1600,
  "src/components/portfolio/panels/CoreCompetencies.tsx": 1600,
  "src/components/portfolio/ProjectPresentation.tsx": 1500,
  "src/components/shared/visualization/Diagram.tsx": 1200,
  "src/components/shared/media/MediaCycler.tsx": 1400,
  "src/app/ai-shenanigans/_components/AIShenaniganWorkSeries.tsx": 1400,
  "src/app/pathforger/_hooks/usePathForgerPersistence.ts": 1400,
  "src/app/pathforger/_components/PathForgerCreateStoryPanel.tsx": 1200,
  "src/app/blackjack/_components/BlackjackGameSlide.tsx": 1200,
  "src/app/talentforge/_components/ResumeStepperModal.tsx": 1200,
  "src/app/talentforge/_components/Inbox.tsx": 1150,
  "src/app/talentforge/_components/ChatWorkspace.tsx": 1050,
  "src/app/HomePageClient.tsx": 1000,
};

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
  for (const file of files) {
    const lines = await lineCount(file);
    const budget = exactBudgets[file] ?? defaultBudget;
    if (lines > budget) {
      violations.push({ file, lines, budget });
    }
  }

  if (violations.length > 0) {
    const sortedViolations = violations.sort((a, b) => b.lines - b.budget - (a.lines - a.budget));
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

void main();
