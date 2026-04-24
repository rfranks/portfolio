import fs from "node:fs/promises";
import path from "node:path";
import { createCliOutput } from "./lib/cli-output.mts";
import { writeHealthSnapshot } from "./lib/health-dashboard.mts";

const rootDir = process.cwd();
const out = createCliOutput();
const candidateChunkRoots = [
  path.join(rootDir, ".next", "static", "chunks"),
  path.join(rootDir, ".next", "build", "chunks"),
];
const candidateManifestRoots = [
  path.join(rootDir, ".next", "server", "app"),
  path.join(rootDir, ".next", "build", "server", "app"),
];

const maxTotalKb = Number(process.env.BUNDLE_MAX_TOTAL_KB ?? 25000);
const maxLargestKb = Number(process.env.BUNDLE_MAX_LARGEST_CHUNK_KB ?? 3000);
const defaultRouteMaxTotalKb = Number(process.env.BUNDLE_ROUTE_MAX_TOTAL_KB ?? maxTotalKb);
const defaultRouteMaxLargestKb = Number(
  process.env.BUNDLE_ROUTE_MAX_LARGEST_CHUNK_KB ?? maxLargestKb,
);
const defaultSectionMaxTotalKb = Number(process.env.BUNDLE_SECTION_MAX_TOTAL_KB ?? maxTotalKb);
const defaultSectionMaxLargestKb = Number(
  process.env.BUNDLE_SECTION_MAX_LARGEST_CHUNK_KB ?? maxLargestKb,
);

const isCi = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";
const routeGroupPattern = /^\(.*\)$/;
const dynamicSegmentPattern = /^\[.*\]$/;
const chunkReferencePattern = /\/_next\/static\/chunks\/[^"'`\s)]+?\.js(?:\?[^"'`\s)]*)?/g;
type QualityLane =
  | "portfolio"
  | "pathforger"
  | "warbirds"
  | "zombiefish"
  | "rickbert-studio"
  | "dna"
  | "ai-shenanigans";
const validLanes: QualityLane[] = [
  "portfolio",
  "pathforger",
  "warbirds",
  "zombiefish",
  "rickbert-studio",
  "dna",
  "ai-shenanigans",
];

type BudgetLimits = {
  maxTotalKb: number;
  maxLargestKb: number;
};

type BudgetOverrides = Record<string, Partial<BudgetLimits>>;

type ChunkInfo = {
  abs: string;
  rel: string;
  webPath: string;
  size: number;
};

type RouteStats = {
  route: string;
  section: string;
  chunkCount: number;
  totalKb: number;
  largestKb: number;
  largestChunkRel: string;
  budget: BudgetLimits;
  withinBudget: boolean;
  missingChunkRefs: string[];
  chunkRefs: string[];
};

type SectionStats = {
  section: string;
  routeCount: number;
  chunkCount: number;
  totalKb: number;
  largestKb: number;
  largestChunkRel: string;
  budget: BudgetLimits;
  withinBudget: boolean;
};

function parseLaneArg(argv: string[]): QualityLane {
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "--lane") {
      continue;
    }
    const next = argv[index + 1]?.trim() as QualityLane | undefined;
    if (next && validLanes.includes(next)) {
      return next;
    }
  }
  return "portfolio";
}

function laneRouteKey(lane: QualityLane): string | null {
  if (lane === "portfolio") {
    return null;
  }
  if (lane === "rickbert-studio") {
    return "/rickbert-studio";
  }
  if (lane === "ai-shenanigans") {
    return "/ai-shenanigans";
  }
  return `/${lane}`;
}

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

function parseBudgetOverrides(
  raw: string | undefined,
  context: { envName: string; valueLabel: string },
): BudgetOverrides {
  if (!raw) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${context.envName} must be valid JSON: ${message}`);
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`${context.envName} must be a JSON object.`);
  }

  const input = parsed as Record<string, unknown>;
  const overrides: BudgetOverrides = {};

  for (const [key, value] of Object.entries(input)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(
        `${context.envName}.${key} must be an object with optional maxTotalKb/maxLargestKb.`,
      );
    }

    const record = value as Record<string, unknown>;
    const rawMaxTotal = record.maxTotalKb;
    const rawMaxLargest = record.maxLargestKb;

    const budget: Partial<BudgetLimits> = {};
    if (rawMaxTotal !== undefined) {
      const num = Number(rawMaxTotal);
      if (!Number.isFinite(num) || num <= 0) {
        throw new Error(
          `${context.envName}.${key}.maxTotalKb must be a positive number for ${context.valueLabel}.`,
        );
      }
      budget.maxTotalKb = num;
    }

    if (rawMaxLargest !== undefined) {
      const num = Number(rawMaxLargest);
      if (!Number.isFinite(num) || num <= 0) {
        throw new Error(
          `${context.envName}.${key}.maxLargestKb must be a positive number for ${context.valueLabel}.`,
        );
      }
      budget.maxLargestKb = num;
    }

    overrides[key] = budget;
  }

  return overrides;
}

function validateBudget(name: string, value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
}

function findOverride(key: string, overrides: BudgetOverrides): Partial<BudgetLimits> | undefined {
  return overrides[key] ?? overrides.default ?? overrides["*"];
}

function resolveBudget(
  key: string,
  defaults: BudgetLimits,
  overrides: BudgetOverrides,
): BudgetLimits {
  const override = findOverride(key, overrides);
  return {
    maxTotalKb: override?.maxTotalKb ?? defaults.maxTotalKb,
    maxLargestKb: override?.maxLargestKb ?? defaults.maxLargestKb,
  };
}

function normalizeChunkReference(ref: string): string {
  return ref.split("?")[0];
}

function deriveRouteFromManifestPath(manifestRoot: string, manifestPath: string): string {
  const manifestDir = path.dirname(manifestPath);
  const rel = path.relative(manifestRoot, manifestDir);
  if (!rel || rel === ".") {
    return "/";
  }

  const segments = rel
    .split(path.sep)
    .filter(Boolean)
    .filter((segment) => !routeGroupPattern.test(segment) && !segment.startsWith("@"));

  if (segments.length === 0) {
    return "/";
  }

  return `/${segments.join("/")}`;
}

function sectionFromRoute(route: string): string {
  if (route === "/" || route === "/_not-found") {
    return "portfolio";
  }

  const first = route.split("/").filter(Boolean)[0];
  if (!first) {
    return "portfolio";
  }
  if (dynamicSegmentPattern.test(first) || first.startsWith("_")) {
    return "portfolio";
  }

  return first;
}

function mdEscape(value: string): string {
  return value.replace(/\|/g, "\\|");
}

async function collectManifestFiles(root: string, files: string[]): Promise<void> {
  const entries = await fs.readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(root, entry.name);
    if (entry.isDirectory()) {
      await collectManifestFiles(abs, files);
      continue;
    }

    if (entry.name === "page_client-reference-manifest.js") {
      files.push(abs);
    }
  }
}

async function resolveFirstExistingDirectory(candidates: string[]): Promise<string | null> {
  for (const candidate of candidates) {
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
}

async function writeGitHubSummary(
  globalMetrics: {
    totalKb: number;
    maxTotalKb: number;
    largestKb: number;
    maxLargestKb: number;
    largestChunkRel: string;
    chunkCount: number;
  },
  sections: SectionStats[],
  routes: RouteStats[],
): Promise<void> {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }

  const lines: string[] = [];
  lines.push("## Bundle Budget Report");
  lines.push("");
  lines.push(
    `Global: total ${globalMetrics.totalKb} / ${globalMetrics.maxTotalKb} KB, largest ${globalMetrics.largestKb} / ${globalMetrics.maxLargestKb} KB (${mdEscape(globalMetrics.largestChunkRel)}), chunks ${globalMetrics.chunkCount}.`,
  );
  lines.push("");

  if (sections.length > 0) {
    lines.push("### Per-Section Budgets");
    lines.push("");
    lines.push(
      "| Section | Routes | Chunks | Total KB | Largest KB | Largest Chunk | Budget (Total/Largest) | Status |",
    );
    lines.push("|---|---:|---:|---:|---:|---|---|---|");
    for (const section of sections) {
      lines.push(
        `| ${mdEscape(section.section)} | ${section.routeCount} | ${section.chunkCount} | ${section.totalKb} | ${section.largestKb} | ${mdEscape(section.largestChunkRel)} | ${section.budget.maxTotalKb} / ${section.budget.maxLargestKb} | ${section.withinBudget ? "OK" : "FAIL"} |`,
      );
    }
    lines.push("");
  }

  if (routes.length > 0) {
    lines.push("### Top Routes By Bundle Size");
    lines.push("");
    lines.push("| Route | Section | Chunks | Total KB | Largest KB | Largest Chunk | Status |");
    lines.push("|---|---|---:|---:|---:|---|---|");
    for (const route of routes.slice(0, 15)) {
      lines.push(
        `| ${mdEscape(route.route)} | ${mdEscape(route.section)} | ${route.chunkCount} | ${route.totalKb} | ${route.largestKb} | ${mdEscape(route.largestChunkRel)} | ${route.withinBudget ? "OK" : "FAIL"} |`,
      );
    }
    lines.push("");
  }

  await fs.appendFile(summaryPath, `${lines.join("\n")}\n`);
}

async function writeBundleHealthSnapshot(args: {
  status: "pass" | "warn" | "fail" | "unknown";
  summary: string;
  details: Record<string, unknown>;
}): Promise<void> {
  const snapshot = await writeHealthSnapshot({
    key: "bundleBudget",
    status: args.status,
    summary: args.summary,
    details: args.details,
  });
  out.metric(
    `Health snapshot: ${snapshot.publicPath} (aggregate: ${snapshot.aggregatePublicPath})`,
  );
}

async function main(): Promise<void> {
  out.section("Bundle budget scan");
  const lane = parseLaneArg(process.argv.slice(2));
  let routeBudgetOverrides: BudgetOverrides;
  let sectionBudgetOverrides: BudgetOverrides;
  try {
    validateBudget("BUNDLE_MAX_TOTAL_KB", maxTotalKb);
    validateBudget("BUNDLE_MAX_LARGEST_CHUNK_KB", maxLargestKb);
    validateBudget("BUNDLE_ROUTE_MAX_TOTAL_KB", defaultRouteMaxTotalKb);
    validateBudget("BUNDLE_ROUTE_MAX_LARGEST_CHUNK_KB", defaultRouteMaxLargestKb);
    validateBudget("BUNDLE_SECTION_MAX_TOTAL_KB", defaultSectionMaxTotalKb);
    validateBudget("BUNDLE_SECTION_MAX_LARGEST_CHUNK_KB", defaultSectionMaxLargestKb);
    routeBudgetOverrides = parseBudgetOverrides(process.env.BUNDLE_ROUTE_BUDGETS_JSON, {
      envName: "BUNDLE_ROUTE_BUDGETS_JSON",
      valueLabel: "route",
    });
    sectionBudgetOverrides = parseBudgetOverrides(process.env.BUNDLE_SECTION_BUDGETS_JSON, {
      envName: "BUNDLE_SECTION_BUDGETS_JSON",
      valueLabel: "section",
    });
    if (lane !== "portfolio") {
      const routeKey = laneRouteKey(lane);
      if (routeKey) {
        routeBudgetOverrides = {
          ...routeBudgetOverrides,
          [routeKey]: {
            maxTotalKb: Number((defaultRouteMaxTotalKb * 0.6).toFixed(0)),
            maxLargestKb: Number((defaultRouteMaxLargestKb * 0.65).toFixed(0)),
          },
        };
      }
      const sectionKey = lane === "rickbert-studio" ? "rickbert-studio" : lane;
      sectionBudgetOverrides = {
        ...sectionBudgetOverrides,
        [sectionKey]: {
          maxTotalKb: Number((defaultSectionMaxTotalKb * 0.7).toFixed(0)),
          maxLargestKb: Number((defaultSectionMaxLargestKb * 0.75).toFixed(0)),
        },
      };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    out.error(`Bundle budget configuration invalid: ${message}`);
    await writeBundleHealthSnapshot({
      status: "fail",
      summary: "Bundle budget configuration invalid.",
      details: {
        error: message,
      },
    });
    process.exit(1);
  }

  const chunksRoot = await resolveFirstExistingDirectory(candidateChunkRoots);

  if (!chunksRoot) {
    out.error("Bundle budget check failed: no chunk directory found. Run npm run build first.");
    await writeBundleHealthSnapshot({
      status: "fail",
      summary: "No chunk directory found. Build artifacts are missing.",
      details: {
        rootCandidates: candidateChunkRoots.map((candidate) => candidate.split(path.sep).join("/")),
      },
    });
    process.exit(1);
  }

  const files: string[] = [];
  await collectChunkFiles(chunksRoot, files);

  if (files.length === 0) {
    out.error("Bundle budget check failed: no JS chunks found.");
    await writeBundleHealthSnapshot({
      status: "fail",
      summary: "No JavaScript chunks found in build output.",
      details: {
        chunkRoot: chunksRoot.split(path.sep).join("/"),
      },
    });
    process.exit(1);
  }

  const sizes: Array<{ rel: string; size: number }> = [];
  const chunksByWebPath = new Map<string, ChunkInfo>();
  for (const file of files) {
    const fileStat = await fs.stat(file);
    const rel = path.relative(rootDir, file);
    const webPath = `/_next/static/chunks/${path.relative(chunksRoot, file).split(path.sep).join("/")}`;
    sizes.push({ rel, size: fileStat.size });
    chunksByWebPath.set(webPath, { abs: file, rel, webPath, size: fileStat.size });
  }

  sizes.sort((a, b) => b.size - a.size);
  const largest = sizes[0];
  const total = sizes.reduce((acc, item) => acc + item.size, 0);

  const totalKb = Math.round(total / 1024);
  const largestKb = Math.round(largest.size / 1024);

  out.metric(`Bundle totals: ${totalKb} KB across ${sizes.length} chunks.`);
  out.metric(`Largest chunk: ${largest.rel} (${largestKb} KB).`);

  const globalFailed = totalKb > maxTotalKb || largestKb > maxLargestKb;
  if (globalFailed) {
    out.error(
      `Bundle budget exceeded. Total ${totalKb}/${maxTotalKb} KB, largest ${largestKb}/${maxLargestKb} KB.`,
    );
  }

  const manifestRoot = await resolveFirstExistingDirectory(candidateManifestRoots);
  const routeStats: RouteStats[] = [];
  const sectionStats: SectionStats[] = [];

  if (manifestRoot) {
    const manifestFiles: string[] = [];
    await collectManifestFiles(manifestRoot, manifestFiles);

    const refsByRoute = new Map<string, Set<string>>();
    for (const manifestFile of manifestFiles) {
      const route = deriveRouteFromManifestPath(manifestRoot, manifestFile);
      const content = await fs.readFile(manifestFile, "utf8");
      const matches = content.match(chunkReferencePattern) ?? [];
      if (matches.length === 0) {
        continue;
      }

      const refs = refsByRoute.get(route) ?? new Set<string>();
      for (const match of matches) {
        refs.add(normalizeChunkReference(match));
      }
      refsByRoute.set(route, refs);
    }

    const routeDefaults: BudgetLimits = {
      maxTotalKb: defaultRouteMaxTotalKb,
      maxLargestKb: defaultRouteMaxLargestKb,
    };
    const sectionDefaults: BudgetLimits = {
      maxTotalKb: defaultSectionMaxTotalKb,
      maxLargestKb: defaultSectionMaxLargestKb,
    };

    for (const [route, chunkRefsSet] of refsByRoute.entries()) {
      const section = sectionFromRoute(route);
      const budget = resolveBudget(route, routeDefaults, routeBudgetOverrides);
      const chunkRefs = Array.from(chunkRefsSet).sort();
      const matchedChunks = chunkRefs
        .map((ref) => chunksByWebPath.get(ref))
        .filter((entry): entry is ChunkInfo => Boolean(entry));
      const missingChunkRefs = chunkRefs.filter((ref) => !chunksByWebPath.has(ref));

      matchedChunks.sort((a, b) => b.size - a.size);
      const largestChunk = matchedChunks[0];
      const totalBytes = matchedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const routeTotalKb = Math.round(totalBytes / 1024);
      const routeLargestKb = largestChunk ? Math.round(largestChunk.size / 1024) : 0;
      const routeLargestChunkRel = largestChunk ? largestChunk.rel : "n/a";
      const withinBudget =
        routeTotalKb <= budget.maxTotalKb && routeLargestKb <= budget.maxLargestKb;

      routeStats.push({
        route,
        section,
        chunkCount: matchedChunks.length,
        totalKb: routeTotalKb,
        largestKb: routeLargestKb,
        largestChunkRel: routeLargestChunkRel,
        budget,
        withinBudget,
        missingChunkRefs,
        chunkRefs,
      });
    }

    routeStats.sort((a, b) => b.totalKb - a.totalKb);

    const sectionChunkRefs = new Map<string, Set<string>>();
    const sectionRoutes = new Map<string, Set<string>>();
    for (const routeStat of routeStats) {
      const refs = sectionChunkRefs.get(routeStat.section) ?? new Set<string>();
      for (const ref of routeStat.chunkRefs) {
        refs.add(ref);
      }
      sectionChunkRefs.set(routeStat.section, refs);

      const routes = sectionRoutes.get(routeStat.section) ?? new Set<string>();
      routes.add(routeStat.route);
      sectionRoutes.set(routeStat.section, routes);
    }

    for (const [section, refs] of sectionChunkRefs.entries()) {
      const budget = resolveBudget(section, sectionDefaults, sectionBudgetOverrides);
      const matchedChunks = Array.from(refs)
        .map((ref) => chunksByWebPath.get(ref))
        .filter((entry): entry is ChunkInfo => Boolean(entry));
      matchedChunks.sort((a, b) => b.size - a.size);
      const totalBytes = matchedChunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const largestChunk = matchedChunks[0];
      const sectionTotalKb = Math.round(totalBytes / 1024);
      const sectionLargestKb = largestChunk ? Math.round(largestChunk.size / 1024) : 0;
      const sectionLargestChunkRel = largestChunk ? largestChunk.rel : "n/a";
      const withinBudget =
        sectionTotalKb <= budget.maxTotalKb && sectionLargestKb <= budget.maxLargestKb;

      sectionStats.push({
        section,
        routeCount: sectionRoutes.get(section)?.size ?? 0,
        chunkCount: matchedChunks.length,
        totalKb: sectionTotalKb,
        largestKb: sectionLargestKb,
        largestChunkRel: sectionLargestChunkRel,
        budget,
        withinBudget,
      });
    }

    sectionStats.sort((a, b) => b.totalKb - a.totalKb);

    out.section("Per-section bundle budgets");
    for (const section of sectionStats) {
      const status = section.withinBudget ? "OK" : "OVER";
      out.listItem(
        `[${status}] ${section.section}: ${section.totalKb} KB total (${section.chunkCount} chunks; ${section.routeCount} routes), largest ${section.largestKb} KB (${section.largestChunkRel}), budget ${section.budget.maxTotalKb}/${section.budget.maxLargestKb} KB`,
      );
      if (isCi) {
        console.log(
          `BUNDLE_SECTION name=${section.section} total_kb=${section.totalKb} largest_kb=${section.largestKb} chunks=${section.chunkCount} routes=${section.routeCount} status=${section.withinBudget ? "ok" : "fail"}`,
        );
      }
    }

    out.section("Per-route bundle budgets");
    for (const route of routeStats) {
      const status = route.withinBudget ? "OK" : "OVER";
      out.listItem(
        `[${status}] ${route.route}: ${route.totalKb} KB (${route.chunkCount} chunks), largest ${route.largestKb} KB (${route.largestChunkRel}), budget ${route.budget.maxTotalKb}/${route.budget.maxLargestKb} KB`,
      );
      if (route.missingChunkRefs.length > 0) {
        out.warning(
          `Route ${route.route} has ${route.missingChunkRefs.length} chunk references not found in built chunk output.`,
        );
      }
      if (isCi) {
        console.log(
          `BUNDLE_ROUTE route=${route.route} section=${route.section} total_kb=${route.totalKb} largest_kb=${route.largestKb} chunks=${route.chunkCount} status=${route.withinBudget ? "ok" : "fail"}`,
        );
      }
    }
  } else {
    out.warning(
      "No route client-reference manifests found; skipping per-route and per-section checks.",
    );
  }

  await writeGitHubSummary(
    {
      totalKb,
      maxTotalKb,
      largestKb,
      maxLargestKb,
      largestChunkRel: largest.rel,
      chunkCount: sizes.length,
    },
    sectionStats,
    routeStats,
  );

  const sectionFailures = sectionStats.filter((stat) => !stat.withinBudget);
  const routeFailures = routeStats.filter((stat) => !stat.withinBudget);
  const hasFailures = globalFailed || sectionFailures.length > 0 || routeFailures.length > 0;

  if (sectionFailures.length > 0) {
    out.error(`Section budget exceeded for ${sectionFailures.length} section(s).`);
  }
  if (routeFailures.length > 0) {
    out.error(`Route budget exceeded for ${routeFailures.length} route(s).`);
  }

  await writeBundleHealthSnapshot({
    status: hasFailures ? "fail" : "pass",
    summary: hasFailures
      ? `Bundle budget checks failed (${lane} lane).`
      : `Bundle budget checks passed (${lane} lane).`,
    details: {
      lane,
      totals: {
        totalKb,
        maxTotalKb,
        largestKb,
        maxLargestKb,
        chunkCount: sizes.length,
        largestChunkRel: largest.rel,
      },
      failures: {
        globalFailed,
        sectionFailureCount: sectionFailures.length,
        routeFailureCount: routeFailures.length,
      },
      sections: sectionStats.slice(0, 12),
      routes: routeStats.slice(0, 20),
    },
  });

  if (hasFailures) {
    process.exit(1);
  }

  out.success(`Bundle budget check passed (${lane} lane).`);
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  out.error(`Bundle budget check crashed: ${message}`);
  await writeBundleHealthSnapshot({
    status: "fail",
    summary: "Bundle budget check crashed.",
    details: {
      error: message,
    },
  });
  process.exit(1);
});
