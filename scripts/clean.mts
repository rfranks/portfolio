import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output.mts";

const out = createCliOutput();
const rootDir = process.cwd();

const cleanTargets = [
  "node_modules",
  ".next",
  ".turbo",
  "out",
  "coverage",
  "public/personal/data/health",
  "public/personal/data/search",
] as const;

async function removeTarget(relativePath: string): Promise<"removed" | "skipped"> {
  const absolutePath = path.join(rootDir, relativePath);
  try {
    await fs.stat(absolutePath);
  } catch {
    return "skipped";
  }

  await fs.rm(absolutePath, { recursive: true, force: true });
  return "removed";
}

async function main(): Promise<void> {
  out.section("Clean generated artifacts");

  const removed: string[] = [];
  const skipped: string[] = [];

  for (const target of cleanTargets) {
    const result = await removeTarget(target);
    if (result === "removed") {
      removed.push(target);
      out.listItem(`removed ${target}`);
    } else {
      skipped.push(target);
    }
  }

  out.metric(`Removed: ${removed.length}`);
  out.metric(`Skipped (not present): ${skipped.length}`);
  out.success("Clean completed.");
}

void main();
