import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output.mts";

const out = createCliOutput();
const rootDir = process.cwd();

const SCAN_ROOTS = ["src", "public/personal/data"] as const;
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".js", ".json", ".md"]);
const IGNORED_DIRS = new Set(["node_modules", ".next", "out", "dist", "coverage", ".git"]);
const ASSET_PATH_PATTERN = /(["'`])((?:\/assets|\/personal|\/apps)\/[^"'`\s)]+)\1/g;
const TEST_FILE_PATTERN = /(?:^|\/)src\/tests\//;
const KNOWN_LEGACY_MIGRATION_REFERENCES: Readonly<Record<string, ReadonlySet<string>>> = {
  "src/utils/data/migrations/resumeDataMigrations.ts": new Set([
    "/personal/images/github/achievments/",
  ]),
};
const OPTIONAL_GENERATED_ASSET_PATH_PATTERNS = [
  /^\/personal\/data\/health\/[A-Za-z0-9._-]+\.snapshot\.json$/,
] as const;

type AssetUsage = {
  path: string;
  file: string;
  line: number;
};

type AssetIssue = {
  path: string;
  references: AssetUsage[];
};

async function walkFiles(dir: string, collector: string[]): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      await walkFiles(path.join(dir, entry.name), collector);
      continue;
    }

    if (!SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      continue;
    }
    collector.push(path.join(dir, entry.name));
  }
}

function resolveLineNumber(content: string, offset: number): number {
  return content.slice(0, offset).split("\n").length;
}

function isDynamicAssetPath(value: string): boolean {
  return (
    value.includes("${") ||
    value.includes("[") ||
    value.includes("]") ||
    (value.endsWith("_") && !value.includes("."))
  );
}

function normalizeAssetPath(assetPath: string): string {
  const [pathWithoutQuery] = assetPath.split("?");
  const [pathWithoutHash] = pathWithoutQuery.split("#");
  return pathWithoutHash;
}

async function collectAssetUsages(): Promise<Map<string, AssetUsage[]>> {
  const files: string[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    const absoluteRoot = path.join(rootDir, scanRoot);
    try {
      await walkFiles(absoluteRoot, files);
    } catch {
      // Ignore missing optional scan roots.
    }
  }

  const usageMap = new Map<string, AssetUsage[]>();
  for (const absoluteFilePath of files) {
    const content = await fs.readFile(absoluteFilePath, "utf8");
    const relativeFilePath = path.relative(rootDir, absoluteFilePath);
    if (TEST_FILE_PATTERN.test(relativeFilePath)) {
      continue;
    }
    const matches = content.matchAll(ASSET_PATH_PATTERN);

    for (const match of matches) {
      const assetPath = normalizeAssetPath(match[2] ?? "");
      if (
        !assetPath ||
        isDynamicAssetPath(assetPath) ||
        (!assetPath.endsWith("/") && !assetPath.split("/").pop()?.includes("."))
      ) {
        continue;
      }

      const usage: AssetUsage = {
        path: assetPath,
        file: relativeFilePath,
        line: resolveLineNumber(content, match.index ?? 0),
      };

      const knownLegacyPaths = KNOWN_LEGACY_MIGRATION_REFERENCES[relativeFilePath];
      if (knownLegacyPaths?.has(assetPath)) {
        continue;
      }

      const existing = usageMap.get(assetPath) ?? [];
      existing.push(usage);
      usageMap.set(assetPath, existing);
    }
  }

  return usageMap;
}

async function findMissingAssets(usages: Map<string, AssetUsage[]>): Promise<AssetIssue[]> {
  const issues: AssetIssue[] = [];
  for (const [assetPath, references] of usages.entries()) {
    const assetAbsolutePath = path.join(rootDir, "public", assetPath.replace(/^\/+/, ""));
    try {
      const stat = await fs.stat(assetAbsolutePath);
      if (assetPath.endsWith("/") && !stat.isDirectory()) {
        issues.push({
          path: assetPath,
          references,
        });
      }
    } catch {
      if (OPTIONAL_GENERATED_ASSET_PATH_PATTERNS.some((pattern) => pattern.test(assetPath))) {
        continue;
      }
      issues.push({
        path: assetPath,
        references,
      });
    }
  }
  return issues.sort((left, right) => left.path.localeCompare(right.path));
}

async function main(): Promise<void> {
  out.section("Asset integrity scan");
  const usages = await collectAssetUsages();
  const missingAssets = await findMissingAssets(usages);

  if (missingAssets.length === 0) {
    out.success(`Asset integrity check passed (${usages.size} referenced assets verified).`);
    return;
  }

  out.error(`Asset integrity check failed: ${missingAssets.length} missing asset reference(s).`);
  for (const issue of missingAssets) {
    out.listItem(`Missing ${issue.path}`);
    issue.references.slice(0, 5).forEach((usage) => {
      out.listItem(`↳ ${usage.file}:${usage.line}`);
    });
    if (issue.references.length > 5) {
      out.listItem(`↳ +${issue.references.length - 5} more`);
    }
  }
  process.exit(1);
}

main().catch((error) => {
  out.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
