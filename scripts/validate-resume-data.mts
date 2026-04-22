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

async function runValidation(options: ValidateResumeOptions): Promise<ValidationIssue[]> {
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

  if (options.strictAssets) {
    const assetReferences = collectAssetReferences(parsed);
    for (const reference of assetReferences) {
      const relativeAssetPath = reference.assetPath.replace(/^\/+/, "");
      const absoluteAssetPath = path.join(publicDir, relativeAssetPath);
      if (!(await pathExists(absoluteAssetPath))) {
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

  return issues;
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
  const issues = await runValidation(parsedArgs.options);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  if (!issues.length) {
    if (!parsedArgs.options.strictAssets) {
      out.success(
        "resumeData validation passed (asset existence checks skipped; use --strict-assets to enable).",
      );
    } else {
      out.success("resumeData validation passed.");
    }
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
