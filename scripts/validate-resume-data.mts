#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import * as resumeDataSchemaModule from "../src/consts/resumeDataSchema";
import * as projectPageDataModule from "../src/components/portfolio/projectPageData";
import * as resumeDataMigrationsModule from "../src/utils/data/migrations/resumeDataMigrations";
import * as portfolioSetupUtilsModule from "./portfolio-setup-utils.mts";
import { createCliOutput } from "./lib/cli-output.mts";
import { isPlainObject } from "./lib/metadata-editor.mts";
import { writeHealthSnapshot } from "./lib/health-dashboard.mts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const publicDir = path.join(repoRoot, "public");
const resumeDataPath = path.join(publicDir, "personal", "data", "resumeData.json");
const out = createCliOutput();

function resolveModuleExport<T>(moduleNamespace: unknown, name: string): T {
  if (!moduleNamespace || typeof moduleNamespace !== "object") {
    throw new Error(`Unable to resolve export '${name}': module is not an object.`);
  }

  const namespace = moduleNamespace as Record<string, unknown>;
  if (name in namespace) {
    return namespace[name] as T;
  }

  const maybeDefault = namespace.default;
  if (maybeDefault && typeof maybeDefault === "object") {
    const defaultObject = maybeDefault as Record<string, unknown>;
    if (name in defaultObject) {
      return defaultObject[name] as T;
    }
  }

  throw new Error(`Unable to resolve export '${name}' from module namespace.`);
}

type ResumeDataSchemaModule = typeof import("../src/consts/resumeDataSchema");
type ProjectPageDataModule = typeof import("../src/components/portfolio/projectPageData");
type ResumeDataMigrationsModule =
  typeof import("../src/utils/data/migrations/resumeDataMigrations");
type PortfolioSetupUtilsModule = typeof import("./portfolio-setup-utils.mts");

const RESUME_DATA_SCHEMA_CHANGELOG = resolveModuleExport<
  ResumeDataSchemaModule["RESUME_DATA_SCHEMA_CHANGELOG"]
>(resumeDataSchemaModule, "RESUME_DATA_SCHEMA_CHANGELOG");
const RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV = resolveModuleExport<
  ResumeDataSchemaModule["RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV"]
>(resumeDataSchemaModule, "RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV");
const assertResumeSchemaGovernance = resolveModuleExport<
  ResumeDataSchemaModule["assertResumeSchemaGovernance"]
>(resumeDataSchemaModule, "assertResumeSchemaGovernance");
const getLatestResumeSchemaChangeLogEntry = resolveModuleExport<
  ResumeDataSchemaModule["getLatestResumeSchemaChangeLogEntry"]
>(resumeDataSchemaModule, "getLatestResumeSchemaChangeLogEntry");
const parseResumeDataWithSchema = resolveModuleExport<
  ResumeDataSchemaModule["parseResumeDataWithSchema"]
>(resumeDataSchemaModule, "parseResumeDataWithSchema");
const getPresentationProjectContracts = resolveModuleExport<
  ProjectPageDataModule["getPresentationProjectContracts"]
>(projectPageDataModule, "getPresentationProjectContracts");
const getPresentationProjectDeepLinkIndex = resolveModuleExport<
  ProjectPageDataModule["getPresentationProjectDeepLinkIndex"]
>(projectPageDataModule, "getPresentationProjectDeepLinkIndex");
const LATEST_RESUME_DATA_SCHEMA_VERSION = resolveModuleExport<number>(
  resumeDataMigrationsModule,
  "LATEST_RESUME_DATA_SCHEMA_VERSION",
);
const collectResumeDataMigrationWarnings = resolveModuleExport<
  ResumeDataMigrationsModule["collectResumeDataMigrationWarnings"]
>(resumeDataMigrationsModule, "collectResumeDataMigrationWarnings");
const migrateResumeData = resolveModuleExport<ResumeDataMigrationsModule["migrateResumeData"]>(
  resumeDataMigrationsModule,
  "migrateResumeData",
);
const validateProjectsOrThrow = resolveModuleExport<
  PortfolioSetupUtilsModule["validateProjectsOrThrow"]
>(portfolioSetupUtilsModule, "validateProjectsOrThrow");

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
  runningInCi: boolean;
  schemaVersion: number | null;
  schemaMigrationVersion: number;
  schemaChangelogEntryCount: number;
  schemaChangelogLatestVersion: number;
  schemaChangelogLatestDate: string;
  schemaChangelogLatestSummary: string;
  schemaChangelogLatestMigration: string;
  schemaChangelogLatestBreakingFieldCount: number;
  schemaBreakingFieldsGuardApproved: boolean;
  schemaBreakingFieldsGuardEnvVar: string;
  rawTopLevelKeyCount: number;
  topLevelKeyCount: number;
  newTopLevelKeys: string[];
  removedTopLevelKeys: string[];
  topLevelKeys: string[];
  projectCount: number;
  projectTypeCounts: Record<string, number>;
  presentationProjectCount: number;
  presentationSlugCount: number;
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
  missingOptionalEnrichmentsCount: number;
  missingOptionalEnrichments: string[];
  expectedDeepLinkCount: number;
  actualDeepLinkCount: number;
  deepLinkCoveragePct: number;
  migrationWarningCount: number;
  contentLintWarningCount: number;
  contentLintErrorCount: number;
};

type ValidationRunResult = {
  issues: ValidationIssue[];
  stats: ValidationStats;
};

type ContentLintIssue = ValidationIssue & {
  rule: string;
};

function isTruthyFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

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

function normalizeHrefToSlug(href: string): string {
  return href.replace(/^\/+/, "").trim();
}

function normalizeForDuplicateCheck(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

const NARRATIVE_SPECIFICITY_SIGNAL_PATTERN =
  /\b(api|schema|migration|latency|wasm|webassembly|telemetry|retry|cache|pipeline|vector|embedding|llm|rag|state machine|observability|contract|prefetch|hydration|fallback|orchestration|checkpoint)\b/gi;
const PRESENTATION_SECTION_KEYS = [
  "overview",
  "why",
  "demo",
  "technologies",
  "specifications",
  "diagrams",
] as const;

function countNarrativeSpecificitySignals(args: {
  description: string;
  technologyNames: string[];
}): number {
  const lowered = args.description.toLowerCase();
  const keywordSignals = args.description.match(NARRATIVE_SPECIFICITY_SIGNAL_PATTERN)?.length ?? 0;
  const technologySignals = args.technologyNames.filter((technologyName) => {
    const normalized = technologyName.trim().toLowerCase();
    if (!normalized || normalized.length < 3) {
      return false;
    }
    return lowered.includes(normalized);
  }).length;
  return keywordSignals + technologySignals;
}

function collectRepeatedSentences(description: string): string[] {
  const normalizedSentences = description
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => normalizeForDuplicateCheck(sentence))
    .filter((sentence) => sentence.length >= 20);
  const seen = new Map<string, number>();
  const duplicates: string[] = [];
  normalizedSentences.forEach((sentence) => {
    const nextCount = (seen.get(sentence) ?? 0) + 1;
    seen.set(sentence, nextCount);
    if (nextCount === 2) {
      duplicates.push(sentence);
    }
  });
  return duplicates;
}

function lintResumeContent(
  parsed: Awaited<ReturnType<typeof parseResumeDataWithSchema>>,
): ContentLintIssue[] {
  const issues: ContentLintIssue[] = [];

  const descriptionFingerprintToProject = new Map<string, string>();
  parsed.projects.forEach((project, index) => {
    const description = project.description?.trim() ?? "";
    const isPresentation = project.type === "presentation";
    const minLength = isPresentation ? 400 : 140;
    if (description.length < minLength) {
      issues.push({
        severity: "warning",
        rule: "markdown.length",
        message: `projects.${index}.description is short (${description.length} chars). Target at least ${minLength} chars for richer narrative quality.`,
      });
    }

    const headingLines = description
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("#"));
    headingLines.forEach((line, headingIndex) => {
      if (!/^#{1,6}\s+\S+/.test(line)) {
        issues.push({
          severity: "warning",
          rule: "markdown.heading-style",
          message: `projects.${index}.description heading ${headingIndex + 1} uses inconsistent markdown heading style: '${line}'.`,
        });
      }
    });

    const normalizedFingerprint = normalizeForDuplicateCheck(description).slice(0, 260);
    const priorProject = descriptionFingerprintToProject.get(normalizedFingerprint);
    if (priorProject) {
      issues.push({
        severity: "warning",
        rule: "markdown.duplicate-phrasing",
        message: `projects.${index}.description appears highly similar to project '${priorProject}'. Consider reducing duplicate phrasing.`,
      });
    } else if (normalizedFingerprint) {
      descriptionFingerprintToProject.set(normalizedFingerprint, project.name);
    }

    const repeatedSentences = collectRepeatedSentences(description);
    if (repeatedSentences.length > 0) {
      issues.push({
        severity: "warning",
        rule: "markdown.redundancy",
        message: `projects.${index}.description repeats one or more normalized sentences. Consider tightening narrative repetition.`,
      });
    }

    const specificitySignalCount = countNarrativeSpecificitySignals({
      description,
      technologyNames: project.technologiesUsed?.map((technology) => technology.name) ?? [],
    });
    const minimumSpecificitySignals = isPresentation ? 4 : 2;
    if (specificitySignalCount < minimumSpecificitySignals) {
      issues.push({
        severity: "warning",
        rule: "markdown.specificity",
        message: `projects.${index}.description has low specificity (${specificitySignalCount} signals, target >= ${minimumSpecificitySignals}). Add concrete architecture/implementation details.`,
      });
    }

    if (isPresentation && !project.showcaseHeading?.trim()) {
      issues.push({
        severity: "warning",
        rule: "presentation.missing-showcase-heading",
        message: `projects.${index}.showcaseHeading is missing for project '${project.name}'.`,
      });
    }

    if (isPresentation && !project.showcaseSubtitle?.trim()) {
      issues.push({
        severity: "warning",
        rule: "presentation.missing-showcase-subtitle",
        message: `projects.${index}.showcaseSubtitle is missing for project '${project.name}'.`,
      });
    }

    if (isPresentation) {
      if (!project.presentation) {
        issues.push({
          severity: "error",
          rule: "presentation.missing-config",
          message: `projects.${index}.presentation is required for presentation project '${project.name}'.`,
        });
      }

      const sectionOrder = project.presentation?.sectionOrder ?? [];
      if (sectionOrder.length === 0) {
        issues.push({
          severity: "warning",
          rule: "presentation.section-order-missing",
          message: `projects.${index}.presentation.sectionOrder is missing. Explicit section ordering is recommended for route/deep-link stability.`,
        });
      } else if (!sectionOrder.includes("overview")) {
        issues.push({
          severity: "warning",
          rule: "presentation.section-order-overview",
          message: `projects.${index}.presentation.sectionOrder does not include 'overview'.`,
        });
      }

      if (!project.presentation?.prefetchPlan) {
        issues.push({
          severity: "warning",
          rule: "presentation.prefetch-plan-missing",
          message: `projects.${index}.presentation.prefetchPlan is missing. Add route-aware prefetch hints for better first interaction latency.`,
        });
      }

      if (!project.terminalDemo?.caption?.trim()) {
        issues.push({
          severity: "warning",
          rule: "presentation.missing-caption",
          message: `projects.${index}.terminalDemo.caption is missing for presentation project '${project.name}'.`,
        });
      }

      const hasAnyDemoCaption = Boolean(
        project.demoCaption?.trim() || project.terminalDemo?.caption?.trim(),
      );
      if (!hasAnyDemoCaption) {
        issues.push({
          severity: "warning",
          rule: "presentation.missing-demo-caption",
          message: `projects.${index} is missing demo caption text (demoCaption or terminalDemo.caption).`,
        });
      }

      if (!project.presentation?.sectionCapabilities) {
        issues.push({
          severity: "warning",
          rule: "presentation.section-capabilities-missing",
          message: `projects.${index}.presentation.sectionCapabilities is missing. Add explicit section capability policy for availability/pager/audio/deep-link rules.`,
        });
      } else {
        PRESENTATION_SECTION_KEYS.forEach((sectionKey) => {
          if (!project.presentation?.sectionCapabilities?.[sectionKey]) {
            issues.push({
              severity: "warning",
              rule: "presentation.section-capabilities-incomplete",
              message: `projects.${index}.presentation.sectionCapabilities.${sectionKey} is missing.`,
            });
          }
        });
      }

      project.diagrams?.forEach((diagram, diagramIndex) => {
        if (!diagram.selectorOptionVisual?.type) {
          issues.push({
            severity: "warning",
            rule: "diagram.missing-option-visual",
            message: `projects.${index}.diagrams.${diagramIndex} is missing selectorOptionVisual.`,
          });
        }
      });
    }
  });

  return issues;
}

async function writeSchemaValidationSnapshot(args: {
  status: "pass" | "warn" | "fail" | "unknown";
  summary: string;
  details: Record<string, unknown>;
}): Promise<void> {
  const snapshot = await writeHealthSnapshot({
    key: "schemaValidation",
    status: args.status,
    summary: args.summary,
    details: args.details,
  });
  out.metric(
    `Health snapshot: ${snapshot.publicPath} (aggregate: ${snapshot.aggregatePublicPath})`,
  );
}

async function runValidation(options: ValidateResumeOptions): Promise<ValidationRunResult> {
  const issues: ValidationIssue[] = [];
  const runningInCi = isTruthyFlag(process.env.CI) || isTruthyFlag(process.env.GITHUB_ACTIONS);
  const schemaBreakingFieldsGuardApproved = isTruthyFlag(
    process.env[RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV],
  );
  assertResumeSchemaGovernance();
  const latestSchemaChangeLogEntry = getLatestResumeSchemaChangeLogEntry();

  const rawText = await fs.readFile(resumeDataPath, "utf8");
  const rawData = JSON.parse(rawText) as unknown;
  const migratedData = migrateResumeData(rawData as Record<string, unknown>);
  const parsed = parseResumeDataWithSchema(migratedData, resumeDataPath);
  const migrationWarnings = collectResumeDataMigrationWarnings(migratedData);
  const contentLintIssues = lintResumeContent(parsed);

  validateProjectsOrThrow(parsed.projects);

  if (parsed.schemaVersion !== LATEST_RESUME_DATA_SCHEMA_VERSION) {
    issues.push({
      severity: "error",
      message: `schemaVersion mismatch after migration: expected ${LATEST_RESUME_DATA_SCHEMA_VERSION}, received ${String(parsed.schemaVersion)}.`,
    });
  }

  migrationWarnings.forEach((warning) => {
    issues.push({
      severity: "warning",
      message: `[${warning.code}] ${warning.message} (${warning.path})`,
    });
  });

  contentLintIssues.forEach((issue) => {
    issues.push({
      severity: issue.severity,
      message: `[${issue.rule}] ${issue.message}`,
    });
  });

  if (
    runningInCi &&
    latestSchemaChangeLogEntry.breakingFields.length > 0 &&
    !schemaBreakingFieldsGuardApproved
  ) {
    issues.push({
      severity: "error",
      message: `Schema changelog version ${latestSchemaChangeLogEntry.version} declares breaking fields (${latestSchemaChangeLogEntry.breakingFields.join(", ")}). Set ${RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV}=true to explicitly acknowledge this CI gate.`,
    });
  }

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

  const presentationProjects = parsed.projects.filter((project) => project.type === "presentation");
  const presentationSlugs = new Map<string, number>();
  for (const [index, project] of presentationProjects.entries()) {
    const href = project.href.trim();
    const slug = normalizeHrefToSlug(href);

    if (!slug) {
      issues.push({
        severity: "error",
        message: `Presentation project '${project.name}' has an empty href slug.`,
      });
      continue;
    }

    if (slug.includes("/")) {
      issues.push({
        severity: "error",
        message: `Presentation project '${project.name}' href '${href}' must be a single-segment route (e.g. '/${slug.split("/")[0]}').`,
      });
    }

    if (href.includes("?") || href.includes("#")) {
      issues.push({
        severity: "error",
        message: `Presentation project '${project.name}' href '${href}' must not include query/hash fragments.`,
      });
    }

    const normalizedSlug = slug.toLowerCase();
    const priorIndex = presentationSlugs.get(normalizedSlug);
    if (priorIndex !== undefined) {
      issues.push({
        severity: "error",
        message: `Duplicate presentation slug '${slug}' between presentation projects at indexes ${priorIndex} and ${index}.`,
      });
    } else {
      presentationSlugs.set(normalizedSlug, index);
    }

    if (!project.showcaseHeading?.trim()) {
      issues.push({
        severity: "warning",
        message: `Presentation project '${project.name}' is missing showcaseHeading; route page will fall back to project title.`,
      });
    }
    if (!project.showcaseSubtitle?.trim()) {
      issues.push({
        severity: "warning",
        message: `Presentation project '${project.name}' is missing showcaseSubtitle; route page will fall back to project title.`,
      });
    }
  }

  if (presentationProjects.length > 0) {
    const dynamicRoutePath = path.join(repoRoot, "src", "app", "[projectSlug]", "page.tsx");
    if (!(await pathExists(dynamicRoutePath))) {
      issues.push({
        severity: "error",
        message:
          "Presentation projects exist but src/app/[projectSlug]/page.tsx is missing. Dynamic presentation routing will fail.",
      });
    }

    for (const project of presentationProjects) {
      const slug = normalizeHrefToSlug(project.href);
      if (!slug) {
        continue;
      }
      const shadowingPath = path.join(repoRoot, "src", "app", slug);
      if (await pathExists(shadowingPath)) {
        issues.push({
          severity: "error",
          message: `Presentation route '/${slug}' is shadowed by existing path src/app/${slug}. Remove or rename that route directory.`,
        });
      }
    }
  }

  const rawTopLevelKeys = isPlainObject(rawData)
    ? Object.keys(rawData as Record<string, unknown>)
    : [];
  const topLevelKeys = Object.keys(parsed);
  const rawTopLevelKeySet = new Set(rawTopLevelKeys);
  const parsedTopLevelKeySet = new Set(topLevelKeys);
  const newTopLevelKeys = topLevelKeys.filter((key) => !rawTopLevelKeySet.has(key));
  const removedTopLevelKeys = rawTopLevelKeys.filter((key) => !parsedTopLevelKeySet.has(key));
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
  const missingOptionalEnrichments: string[] = [];
  parsed.projects.forEach((project, index) => {
    if (!project.showcaseHeading?.trim()) {
      missingOptionalEnrichments.push(`projects.${index}.showcaseHeading`);
    }
    if (!project.showcaseSubtitle?.trim()) {
      missingOptionalEnrichments.push(`projects.${index}.showcaseSubtitle`);
    }
    if (!project.wowFactor?.trim()) {
      missingOptionalEnrichments.push(`projects.${index}.wowFactor`);
    }
    if (!project.terminalDemo?.caption?.trim()) {
      missingOptionalEnrichments.push(`projects.${index}.terminalDemo.caption`);
    }
    project.diagrams?.forEach((diagram, diagramIndex) => {
      if (!diagram.shortText?.trim()) {
        missingOptionalEnrichments.push(`projects.${index}.diagrams.${diagramIndex}.shortText`);
      }
      if (!diagram.description?.trim()) {
        missingOptionalEnrichments.push(`projects.${index}.diagrams.${diagramIndex}.description`);
      }
    });
  });

  const presentationContracts = getPresentationProjectContracts();
  const deepLinkIndex = getPresentationProjectDeepLinkIndex();
  const expectedDeepLinkCount = presentationContracts.reduce(
    (sum, contract) => sum + contract.sections.length + contract.diagrams.length,
    0,
  );
  const actualDeepLinkCount = deepLinkIndex.length;
  const deepLinkCoveragePct =
    expectedDeepLinkCount === 0
      ? 100
      : Math.round((actualDeepLinkCount / expectedDeepLinkCount) * 100);
  const stats: ValidationStats = {
    resumeDataPath: withPosixPath(path.relative(repoRoot, resumeDataPath)),
    strictAssets: options.strictAssets,
    runningInCi,
    schemaVersion:
      typeof parsed.schemaVersion === "number" && Number.isFinite(parsed.schemaVersion)
        ? parsed.schemaVersion
        : null,
    schemaMigrationVersion: LATEST_RESUME_DATA_SCHEMA_VERSION,
    schemaChangelogEntryCount: RESUME_DATA_SCHEMA_CHANGELOG.length,
    schemaChangelogLatestVersion: latestSchemaChangeLogEntry.version,
    schemaChangelogLatestDate: latestSchemaChangeLogEntry.date,
    schemaChangelogLatestSummary: latestSchemaChangeLogEntry.summary,
    schemaChangelogLatestMigration: latestSchemaChangeLogEntry.migration,
    schemaChangelogLatestBreakingFieldCount: latestSchemaChangeLogEntry.breakingFields.length,
    schemaBreakingFieldsGuardApproved,
    schemaBreakingFieldsGuardEnvVar: RESUME_SCHEMA_BREAKING_FIELDS_APPROVAL_ENV,
    rawTopLevelKeyCount: rawTopLevelKeys.length,
    topLevelKeyCount: topLevelKeys.length,
    newTopLevelKeys,
    removedTopLevelKeys,
    topLevelKeys,
    projectCount: parsed.projects.length,
    projectTypeCounts: countByProjectType(parsed.projects as Array<{ type: string }>),
    presentationProjectCount: presentationProjects.length,
    presentationSlugCount: presentationSlugs.size,
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
    missingOptionalEnrichmentsCount: missingOptionalEnrichments.length,
    missingOptionalEnrichments,
    expectedDeepLinkCount,
    actualDeepLinkCount,
    deepLinkCoveragePct,
    migrationWarningCount: migrationWarnings.length,
    contentLintWarningCount: contentLintIssues.filter((issue) => issue.severity === "warning")
      .length,
    contentLintErrorCount: contentLintIssues.filter((issue) => issue.severity === "error").length,
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
  out.metric(
    `Schema version: ${stats.schemaVersion ?? "unspecified"} (migration latest: ${stats.schemaMigrationVersion})`,
  );
  out.metric(
    `Schema changelog: ${stats.schemaChangelogEntryCount} entries, latest v${stats.schemaChangelogLatestVersion} on ${stats.schemaChangelogLatestDate} (${stats.schemaChangelogLatestMigration})`,
  );
  out.metric(`  Latest schema summary: ${stats.schemaChangelogLatestSummary}`);
  out.metric(
    `  Breaking fields in latest changelog entry: ${stats.schemaChangelogLatestBreakingFieldCount}`,
  );
  if (stats.runningInCi) {
    out.metric(
      `  CI breaking-field guard: ${stats.schemaBreakingFieldsGuardApproved ? "acknowledged" : "not acknowledged"} via ${stats.schemaBreakingFieldsGuardEnvVar}`,
    );
  }
  out.metric(`Top-level keys (${stats.topLevelKeyCount}): ${stats.topLevelKeys.join(", ")}`);
  out.metric(
    `Top-level key delta: +${stats.newTopLevelKeys.length} / -${stats.removedTopLevelKeys.length} (from raw ${stats.rawTopLevelKeyCount})`,
  );
  if (stats.newTopLevelKeys.length > 0) {
    out.metric(`  Added keys: ${stats.newTopLevelKeys.join(", ")}`);
  }
  if (stats.removedTopLevelKeys.length > 0) {
    out.metric(`  Removed keys: ${stats.removedTopLevelKeys.join(", ")}`);
  }
  out.metric(
    `Projects: ${stats.projectCount} (${formatProjectTypeCounts(stats.projectTypeCounts) || "none"})`,
  );
  out.metric(
    `Presentation routes: ${stats.presentationProjectCount} project(s), ${stats.presentationSlugCount} unique slug(s)`,
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
  out.metric(
    `Presentation deep-link coverage: ${stats.actualDeepLinkCount}/${stats.expectedDeepLinkCount} (${stats.deepLinkCoveragePct}%)`,
  );
  out.metric(
    `Schema migration warnings: ${stats.migrationWarningCount} | Content lint warnings/errors: ${stats.contentLintWarningCount}/${stats.contentLintErrorCount}`,
  );
  out.metric(`Missing optional enrichments: ${stats.missingOptionalEnrichmentsCount}`);
  if (stats.missingOptionalEnrichments.length > 0) {
    out.metric(
      `  Missing fields: ${stats.missingOptionalEnrichments.slice(0, 12).join(", ")}${
        stats.missingOptionalEnrichments.length > 12 ? " ..." : ""
      }`,
    );
  }
  if (stats.strictAssets) {
    out.metric(`Missing assets: ${stats.missingAssetCount}`);
  } else {
    out.sparkle("Asset existence checks skipped (pass --strict-assets to verify files exist).");
  }

  const snapshotStatus: "pass" | "warn" | "fail" =
    errors.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass";
  await writeSchemaValidationSnapshot({
    status: snapshotStatus,
    summary:
      errors.length > 0
        ? `resumeData validation failed with ${errors.length} error(s) and ${warnings.length} warning(s).`
        : warnings.length > 0
          ? `resumeData validation passed with ${warnings.length} warning(s).`
          : "resumeData validation passed with no warnings.",
    details: {
      strictAssets: stats.strictAssets,
      issueCounts: {
        errors: errors.length,
        warnings: warnings.length,
      },
      issues: issues.slice(0, 80),
      stats,
    },
  });

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

main().catch(async (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : `Unknown validation error: ${withPosixPath(String(error))}`;
  out.error(message);
  await writeSchemaValidationSnapshot({
    status: "fail",
    summary: "resumeData validation crashed.",
    details: {
      error: message,
    },
  });
  process.exitCode = 1;
});
