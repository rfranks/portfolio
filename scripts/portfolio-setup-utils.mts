export type ProjectEntry = {
  href: string;
  name: string;
  [key: string]: unknown;
};

export type PortfolioSetupRuntimeOptions = {
  dryRun: boolean;
  showDiff: boolean;
};

export type PortfolioSetupMode = "init" | "update";

export type ParsedPortfolioSetupArgs = {
  mode: PortfolioSetupMode | null;
  options: PortfolioSetupRuntimeOptions;
  usageError: string | null;
};

function withLeadingSlash(p: string): string {
  if (!p) {
    return "";
  }
  return p.startsWith("/") ? p : `/${p}`;
}

export function normalizeProjectEntry(nextProject: ProjectEntry): ProjectEntry {
  const name = String(nextProject.name || "").trim();
  const href = withLeadingSlash(String(nextProject.href || "").trim());

  if (!name) {
    throw new Error("Project name is required.");
  }
  if (!href || href === "/") {
    throw new Error(`Project '${name}' must include a non-root href.`);
  }

  return {
    ...nextProject,
    name,
    href,
  };
}

export function validateProjectsOrThrow(projects: ProjectEntry[]): void {
  const hrefs = new Set<string>();
  for (const project of projects) {
    const normalized = normalizeProjectEntry(project);
    if (hrefs.has(normalized.href)) {
      throw new Error(`Duplicate project href detected: ${normalized.href}`);
    }
    hrefs.add(normalized.href);
  }
}

export function parsePortfolioSetupArgs(argv: string[]): ParsedPortfolioSetupArgs {
  const options: PortfolioSetupRuntimeOptions = {
    dryRun: false,
    showDiff: true,
  };

  let mode: PortfolioSetupMode | null = null;
  let usageError: string | null = null;

  for (const rawArg of argv) {
    const arg = rawArg.trim();
    if (!arg) {
      continue;
    }

    if (arg === "--dry-run" || arg === "-n") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--no-diff") {
      options.showDiff = false;
      continue;
    }
    if (arg === "--diff") {
      options.showDiff = true;
      continue;
    }

    if (!mode && (arg === "init" || arg === "update")) {
      mode = arg;
      continue;
    }

    usageError = `Unknown argument: ${arg}`;
    break;
  }

  return {
    mode,
    options,
    usageError,
  };
}

const normalizeLineEndings = (value: string) => value.replace(/\r\n/g, "\n");

export function buildSingleHunkDiffPreview(
  currentContent: string,
  nextContent: string,
  fileLabel: string,
  contextLines = 2,
): string {
  const previous = normalizeLineEndings(currentContent);
  const next = normalizeLineEndings(nextContent);

  if (previous === next) {
    return `No changes for ${fileLabel}.`;
  }

  const previousLines = previous.split("\n");
  const nextLines = next.split("\n");

  let firstChangedIndex = 0;
  while (
    firstChangedIndex < previousLines.length &&
    firstChangedIndex < nextLines.length &&
    previousLines[firstChangedIndex] === nextLines[firstChangedIndex]
  ) {
    firstChangedIndex += 1;
  }

  let previousLastChanged = previousLines.length - 1;
  let nextLastChanged = nextLines.length - 1;

  while (
    previousLastChanged >= firstChangedIndex &&
    nextLastChanged >= firstChangedIndex &&
    previousLines[previousLastChanged] === nextLines[nextLastChanged]
  ) {
    previousLastChanged -= 1;
    nextLastChanged -= 1;
  }

  const contextStart = Math.max(0, firstChangedIndex - contextLines);
  const beforeContext = previousLines.slice(contextStart, firstChangedIndex);
  const removedLines =
    previousLastChanged >= firstChangedIndex
      ? previousLines.slice(firstChangedIndex, previousLastChanged + 1)
      : [];
  const addedLines =
    nextLastChanged >= firstChangedIndex
      ? nextLines.slice(firstChangedIndex, nextLastChanged + 1)
      : [];
  const afterContext = previousLines.slice(
    previousLastChanged + 1,
    Math.min(previousLines.length, previousLastChanged + 1 + contextLines),
  );

  const previousStart = contextStart + 1;
  const nextStart = contextStart + 1;
  const previousCount = beforeContext.length + removedLines.length + afterContext.length;
  const nextCount = beforeContext.length + addedLines.length + afterContext.length;

  const diffLines: string[] = [
    `--- ${fileLabel}`,
    `+++ ${fileLabel} (updated)`,
    `@@ -${previousStart},${Math.max(previousCount, 1)} +${nextStart},${Math.max(nextCount, 1)} @@`,
    ...beforeContext.map((line) => ` ${line}`),
    ...removedLines.map((line) => `-${line}`),
    ...addedLines.map((line) => `+${line}`),
    ...afterContext.map((line) => ` ${line}`),
  ];

  return diffLines.join("\n");
}
