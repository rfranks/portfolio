import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output";

const rootDir = process.cwd();
const out = createCliOutput();
const candidateChunkRoots = [
  path.join(rootDir, ".next", "static", "chunks"),
  path.join(rootDir, ".next", "build", "chunks"),
];

const maxTotalKb = Number(process.env.BUNDLE_MAX_TOTAL_KB ?? 25000);
const maxLargestKb = Number(process.env.BUNDLE_MAX_LARGEST_CHUNK_KB ?? 3000);

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
  out.section("Bundle budget scan");
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
    out.error("Bundle budget check failed: no chunk directory found. Run npm run build first.");
    process.exit(1);
  }

  const files: string[] = [];
  await collectChunkFiles(chunksRoot, files);

  if (files.length === 0) {
    out.error("Bundle budget check failed: no JS chunks found.");
    process.exit(1);
  }

  const sizes: Array<{ rel: string; size: number }> = [];
  for (const file of files) {
    const fileStat = await fs.stat(file);
    sizes.push({ rel: path.relative(rootDir, file), size: fileStat.size });
  }

  sizes.sort((a, b) => b.size - a.size);
  const largest = sizes[0];
  const total = sizes.reduce((acc, item) => acc + item.size, 0);

  const totalKb = Math.round(total / 1024);
  const largestKb = Math.round(largest.size / 1024);

  out.metric(`Bundle totals: ${totalKb} KB across ${sizes.length} chunks.`);
  out.metric(`Largest chunk: ${largest.rel} (${largestKb} KB).`);

  if (totalKb > maxTotalKb || largestKb > maxLargestKb) {
    out.error(
      `Bundle budget exceeded. Total ${totalKb}/${maxTotalKb} KB, largest ${largestKb}/${maxLargestKb} KB.`,
    );
    process.exit(1);
  }

  out.success("Bundle budget check passed.");
}

void main();
