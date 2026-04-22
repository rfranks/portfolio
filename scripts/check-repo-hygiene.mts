import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output";

const rootDir = process.cwd();
const out = createCliOutput();
const ignoredDirs = new Set([".git", "node_modules", ".next", "out", "dist", "coverage"]);

async function walk(dir: string, found: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".DS_Store") {
      found.push(path.relative(rootDir, path.join(dir, entry.name)));
      continue;
    }

    if (!entry.isDirectory()) {
      continue;
    }

    if (ignoredDirs.has(entry.name)) {
      continue;
    }

    await walk(path.join(dir, entry.name), found);
  }
}

async function main(): Promise<void> {
  const found: string[] = [];
  out.section("Repository hygiene scan");
  await walk(rootDir, found);

  if (found.length > 0) {
    out.error("Repository hygiene check failed. Remove .DS_Store files:");
    for (const file of found.sort()) {
      out.listItem(file);
    }
    process.exit(1);
  }

  out.success("Repository hygiene check passed.");
}

void main();
