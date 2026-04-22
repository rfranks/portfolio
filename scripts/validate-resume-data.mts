#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseResumeDataWithSchema } from "../src/consts/resumeDataSchema";
import { migrateResumeData } from "../src/utils/data/migrations/resumeDataMigrations";
import { validateProjectsOrThrow } from "./portfolio-setup-utils";
import { createCliOutput } from "./lib/cli-output";
import { isPlainObject } from "./lib/metadata-editor";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicDir = path.join(repoRoot, "public");
const resumeDataPath = path.join(publicDir, "personal", "data", "resumeData.json");
const out = createCliOutput();

const mediaKeyPattern =
  /(image|video|audio|pdf|gif|avatar|headshot|logo|icon|thumbnail|watermark|movie|rendering|markdown|path|src|url)$/i;
const staticAssetExtensionPattern =
  /\.(png|jpg|jpeg|webp|gif|svg|mp4|webm|mov|m4v|mp3|wav|ogg|m4a|pdf|md|markdown|json|txt|wasm|js|mjs|cjs)$/i;

type ValidationIssue = {
  severity: "error" | "warning";
  message: string;
};

type ValidateResumeOptions = {
  strictAssets: boolean;
};

type ValidationStats = {
  resumeDataPath: string;
  strictAssets: boolean;
  schemaVersion: number | null;
  topLevelKeyCount: number;
  topLevelKeys: string[];
  projectCount: number;
  projectTypeCounts: Record<string, number>;
  projectsWithDiagrams: number;
  diagramCount: number;
  projectsWithTerminalDemo: number;
  experienceCount: number;
  educationCount: number;
  recognitionSnippetCount: number;
  recognitionRecommendationCount: number;
  recognitionGithubAchievementCount: number;
  aiShenaniganCount: number;
  hobbyCount: number;
  assetReferenceCount: number;
  uniqueAssetReferenceCount: number;
  missingAssetCount: number;
};

type ValidationRunResult = {
  issues: ValidationIssue[];
  stats: ValidationStats;
};

function parseValidateArgs(argv: string[]): {
  options: ValidateResumeOptions;
  usageError: string | null;
} {
  const options: ValidateResumeOptions = {
    strictAssets: false,
  };

  let usageError: string | null = null;
  for (const rawArg of argv) {
    const arg = rawArg.trim();
    if (!arg) {
      continue;
    }
    if (arg === "--strict-assets") {
      options.strictAssets = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      usageError = "USAGE";
      break;
    }
    usageError = `Unknown argument: ${arg}`;
    break;
  }

  return { options, usageError };
}

function withPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

function isLikelyStaticPublicAsset(key: string, value: string): boolean {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return false;
  }
  if (!mediaKeyPattern.test(key)) {
    return false;
  }
  return staticAssetExtensionPattern.test(value.split(/[?#]/)[0] || "");
}

function collectAssetReferences(
  value: unknown,
  currentPath: string[] = [],
): Array<{ jsonPath: string; assetPath: string }> {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) =>
      collectAssetReferences(entry, [...currentPath, String(index)]),
    );
  }

  if (!isPlainObject(value)) {
    return [];
  }

  const references: Array<{ jsonPath: string; assetPath: string }> = [];
  for (const [key, child] of Object.entries(value)) {
    const childPath = [...currentPath, key];
    if (typeof child === "string" && isLikelyStaticPublicAsset(key, child.trim())) {
      references.push({
        jsonPath: childPath.join("."),
        assetPath: child.trim(),
      });
      continue;
    }
    references.push(...collectAssetReferences(child, childPath));
  }

  return references;
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function countByProjectType(projects: Array<{ type: string }>): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const project of projects) {
    const type = project.type?.trim() || "unknown";
    counts[type] = (counts[type] ?? 0) + 1;
  }
  return counts;
}

function formatProjectTypeCounts(counts: Record<string, number>): string {
  return Object.entries(counts)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([type, count]) => `${type}: ${count}`)
    .join(", ");
}

async function runValidation(options: ValidateResumeOptions): Promise<ValidationRunResult> {
  const issues: ValidationIssue[] = [];
  const rawText = await fs.readFile(resumeDataPath, "utf8");
  const rawData = JSON.parse(rawText) as unknown;
  const parsed = parseResumeDataWithSchema(
    migrateResumeData(rawData as Record<string, unknown>),
    resumeDataPath,
  );

  validateProjectsOrThrow(parsed.projects);

  const navigationDrawerItems = isPlainObject(parsed.navigation)
    ? parsed.navigation.drawerItems
    : undefined;
  if (Array.isArray(navigationDrawerItems) && navigationDrawerItems.length > 0) {
    const firstItem = navigationDrawerItems[0];
    if (isPlainObject(firstItem)) {
      const href = typeof firstItem.href === "string" ? firstItem.href : "";
      if (href.trim() !== "/") {
        issues.push({
          severity: "warning",
          message:
            "navigation.drawerItems[0].href is not '/'. Home should remain the first nav action.",
        });
      }
    }
  }

  const assetReferences = collectAssetReferences(parsed);
  const uniqueAssetPaths = new Set(assetReferences.map((reference) => reference.assetPath));
  let missingAssetCount = 0;

  if (options.strictAssets) {
    for (const reference of assetReferences) {
      const relativeAssetPath = reference.assetPath.replace(/^\/+/, "");
      const absoluteAssetPath = path.join(publicDir, relativeAssetPath);
      if (!(await pathExists(absoluteAssetPath))) {
        missingAssetCount += 1;
        issues.push({
          severity: "error",
          message: `Missing asset referenced at ${reference.jsonPath}: ${reference.assetPath}`,
        });
      }
    }
  }

  const uniqueProjectHrefs = new Set(parsed.projects.map((project) => project.href));
  if (uniqueProjectHrefs.size !== parsed.projects.length) {
    issues.push({
      severity: "error",
      message: "Duplicate project href values detected in resumeData.projects.",
    });
  }

  const topLevelKeys = Object.keys(parsed);
  const recognition = isPlainObject(parsed.recognition) ? parsed.recognition : undefined;
  const hobbies = isPlainObject(parsed.hobbies) ? parsed.hobbies : undefined;
  const aiShenanigans = isPlainObject(parsed.aiShenanigans) ? parsed.aiShenanigans : undefined;
  const diagramCount = parsed.projects.reduce((count, project) => {
    if (!Array.isArray(project.diagrams)) {
      return count;
    }
    return count + project.diagrams.length;
  }, 0);
  const projectsWithDiagrams = parsed.projects.filter(
    (project) => Array.isArray(project.diagrams) && project.diagrams.length > 0,
  ).length;
  const projectsWithTerminalDemo = parsed.projects.filter((project) =>
    isPlainObject(project.terminalDemo),
  ).length;
  const stats: ValidationStats = {
    resumeDataPath: withPosixPath(path.relative(repoRoot, resumeDataPath)),
    strictAssets: options.strictAssets,
    schemaVersion:
      typeof parsed.schemaVersion === "number" && Number.isFinite(parsed.schemaVersion)
        ? parsed.schemaVersion
        : null,
    topLevelKeyCount: topLevelKeys.length,
    topLevelKeys,
    projectCount: parsed.projects.length,
    projectTypeCounts: countByProjectType(parsed.projects as Array<{ type: string }>),
    projectsWithDiagrams,
    diagramCount,
    projectsWithTerminalDemo,
    experienceCount: Array.isArray(parsed.experience) ? parsed.experience.length : 0,
    educationCount: Array.isArray(parsed.education) ? parsed.education.length : 0,
    recognitionSnippetCount: Array.isArray(recognition?.snippets) ? recognition.snippets.length : 0,
    recognitionRecommendationCount: Array.isArray(recognition?.recommendations)
      ? recognition.recommendations.length
      : 0,
    recognitionGithubAchievementCount: Array.isArray(recognition?.githubAchievements)
      ? recognition.githubAchievements.length
      : 0,
    aiShenaniganCount: Array.isArray(aiShenanigans?.items) ? aiShenanigans.items.length : 0,
    hobbyCount: Array.isArray(hobbies?.items) ? hobbies.items.length : 0,
    assetReferenceCount: assetReferences.length,
    uniqueAssetReferenceCount: uniqueAssetPaths.size,
    missingAssetCount,
  };

  return { issues, stats };
}

async function main(): Promise<void> {
  const parsedArgs = parseValidateArgs(process.argv.slice(2));
  if (parsedArgs.usageError) {
    out.section("Resume data validation");
    if (parsedArgs.usageError !== "USAGE") {
      out.error(parsedArgs.usageError);
    }
    out.info("Usage: npm run validate:resume -- [--strict-assets]");
    process.exitCode = parsedArgs.usageError === "USAGE" ? 0 : 1;
    return;
  }

  out.section("Resume data validation");
  const { issues, stats } = await runValidation(parsedArgs.options);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  out.metric(`Source: ${stats.resumeDataPath}`);
  out.metric(
    `Mode: ${stats.strictAssets ? "strict asset checks enabled" : "strict asset checks disabled"}`,
  );
  out.metric(`Schema version: ${stats.schemaVersion ?? "unspecified"}`);
  out.metric(`Top-level keys (${stats.topLevelKeyCount}): ${stats.topLevelKeys.join(", ")}`);
  out.metric(
    `Projects: ${stats.projectCount} (${formatProjectTypeCounts(stats.projectTypeCounts) || "none"})`,
  );
  out.metric(
    `Project media: ${stats.diagramCount} diagrams across ${stats.projectsWithDiagrams} project(s), terminal demos on ${stats.projectsWithTerminalDemo} project(s)`,
  );
  out.metric(
    `Experience/Education: ${stats.experienceCount} experience entries, ${stats.educationCount} education entries`,
  );
  out.metric(
    `Recognition: ${stats.recognitionSnippetCount} snippets, ${stats.recognitionRecommendationCount} recommendations, ${stats.recognitionGithubAchievementCount} GitHub achievements`,
  );
  out.metric(
    `AI shenanigans: ${stats.aiShenaniganCount} items | Hobbies: ${stats.hobbyCount} items`,
  );
  out.metric(
    `Asset references: ${stats.assetReferenceCount} total (${stats.uniqueAssetReferenceCount} unique paths)`,
  );
  if (stats.strictAssets) {
    out.metric(`Missing assets: ${stats.missingAssetCount}`);
  } else {
    out.sparkle("Asset existence checks skipped (pass --strict-assets to verify files exist).");
  }

  if (!issues.length) {
    out.success("resumeData validation passed.");
    return;
  }

  for (const warning of warnings) {
    out.warning(warning.message);
  }
  for (const error of errors) {
    out.error(error.message);
  }

  out.info(
    `Validation completed with ${errors.length} error(s) and ${warnings.length} warning(s).`,
  );

  if (errors.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : `Unknown validation error: ${withPosixPath(String(error))}`;
  out.error(message);
  process.exitCode = 1;
});
