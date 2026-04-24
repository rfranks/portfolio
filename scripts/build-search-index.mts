import fs from "node:fs/promises";
import path from "node:path";
import * as projectPageDataModule from "@/components/portfolio/projectPageData";
import { createCliOutput } from "./lib/cli-output.mts";
import type { StaticSearchIndexSnapshot } from "@/types/content/searchIndex";

const out = createCliOutput();
const rootDir = process.cwd();
const staticSearchIndexPath = path.join(
  rootDir,
  "public",
  "personal",
  "data",
  "search",
  "static-search-index.json",
);

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

type ProjectPageDataModule = typeof import("@/components/portfolio/projectPageData");

const getPortfolioStaticSearchIndexActions = resolveModuleExport<
  ProjectPageDataModule["getPortfolioStaticSearchIndexActions"]
>(projectPageDataModule, "getPortfolioStaticSearchIndexActions");

async function main(): Promise<void> {
  out.section("Static search index generation");
  const actions = getPortfolioStaticSearchIndexActions()
    .map((action) => {
      const { onSelect, ...staticAction } = action;
      void onSelect;
      return staticAction;
    })
    .sort((left, right) => left.label.localeCompare(right.label));

  const payload: StaticSearchIndexSnapshot = {
    generatedAt: new Date().toISOString(),
    actionCount: actions.length,
    actions,
  };

  await fs.mkdir(path.dirname(staticSearchIndexPath), { recursive: true });
  await fs.writeFile(staticSearchIndexPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const relativeOutputPath = path.relative(rootDir, staticSearchIndexPath);
  out.success(`Wrote ${actions.length} static search actions to ${relativeOutputPath}.`);
}

main().catch((error) => {
  out.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
