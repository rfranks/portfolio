import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output.mts";

const rootDir = process.cwd();
const out = createCliOutput();
const candidateChunkRoots = [
  path.join(rootDir, ".next", "static", "chunks"),
  path.join(rootDir, ".next", "build", "chunks"),
];

async function collectChunkFiles(dir: string, files: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collectChunkFiles(abs, files);
      continue;
    }
    if (entry.name.endsWith(".js")) {
      files.push(abs);
    }
  }
}

async function main(): Promise<void> {
  out.section("Bundle analysis");
  const chunksRoot = await (async () => {
    for (const candidate of candidateChunkRoots) {
      try {
        const stat = await fs.stat(candidate);
        if (stat.isDirectory()) {
          return candidate;
        }
      } catch {
        // continue searching candidates
      }
    }
    return null;
  })();

  if (!chunksRoot) {
    throw new Error("No bundle chunk directory found. Run npm run build before analysis.");
  }

  const files: string[] = [];
  await collectChunkFiles(chunksRoot, files);

  const sizes: Array<{ rel: string; sizeKb: number }> = [];
  for (const file of files) {
    const fileStat = await fs.stat(file);
    sizes.push({
      rel: path.relative(rootDir, file),
      sizeKb: Math.round(fileStat.size / 1024),
    });
  }

  sizes.sort((a, b) => b.sizeKb - a.sizeKb);
  const totalKb = sizes.reduce((acc, item) => acc + item.sizeKb, 0);

  out.metric(`Analyzed ${sizes.length} chunks. Total: ${totalKb} KB.`);
  out.sparkle("Top 20 chunks:");
  sizes.slice(0, 20).forEach((chunk, index) => {
    out.listItem(`${String(index + 1).padStart(2, "0")}. ${chunk.sizeKb} KB  ${chunk.rel}`);
  });
}

void main();
