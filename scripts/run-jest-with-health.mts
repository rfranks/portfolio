#!/usr/bin/env tsx

import path from "node:path";
import { spawn } from "node:child_process";
import { createCliOutput } from "./lib/cli-output.mts";
import {
  writeHealthSnapshot,
  type HealthSnapshotKey,
  type HealthStatus,
} from "./lib/health-dashboard.mts";

type Suite = "unit" | "a11y";
type QualityLane =
  | "portfolio"
  | "pathforger"
  | "blackjack"
  | "warbirds"
  | "zombiefish"
  | "games"
  | "rickbert-studio"
  | "dna"
  | "ai-shenanigans";

type ParsedArgs = {
  suite: Suite;
  lane: QualityLane;
  passthrough: string[];
};

const out = createCliOutput();
const VALID_LANES: QualityLane[] = [
  "portfolio",
  "pathforger",
  "blackjack",
  "warbirds",
  "zombiefish",
  "games",
  "rickbert-studio",
  "dna",
  "ai-shenanigans",
];
const LANE_TEST_PATTERN: Record<QualityLane, string | null> = {
  portfolio: null,
  pathforger: "pathforger|PathForger",
  blackjack: "blackjack|Blackjack",
  warbirds: "warbirds",
  zombiefish: "zombiefish",
  games: "warbirds|zombiefish|blasteroids|bookworm|games",
  "rickbert-studio": "rickbert",
  dna: "dna",
  "ai-shenanigans": "ai-shenanigans|AIShenanigan",
};

function parseArgs(argv: string[]): ParsedArgs {
  let suite: Suite = "unit";
  let lane: QualityLane = "portfolio";
  const passthrough: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--suite") {
      const next = argv[index + 1]?.trim();
      if (next === "unit" || next === "a11y") {
        suite = next;
        index += 1;
        continue;
      }
    }
    if (token === "--lane") {
      const next = argv[index + 1]?.trim() as QualityLane | undefined;
      if (next && VALID_LANES.includes(next)) {
        lane = next;
        index += 1;
        continue;
      }
    }
    passthrough.push(token);
  }

  return { suite, lane, passthrough };
}

function getSnapshotKeyForSuite(suite: Suite): HealthSnapshotKey {
  return suite === "a11y" ? "a11yRunner" : "testRunner";
}

function getDefaultJestArgs(suite: Suite, lane: QualityLane): string[] {
  const lanePattern = LANE_TEST_PATTERN[lane];
  if (suite === "a11y") {
    const args = ["src/tests/accessibility", "--runInBand"];
    if (lanePattern) {
      args.push("--passWithNoTests", "--testPathPattern", lanePattern);
    }
    return args;
  }
  if (!lanePattern) {
    return [];
  }
  return ["--runInBand", "--passWithNoTests", "--testPathPattern", lanePattern];
}

function getJestCommandPath(cwd: string): string {
  const executable = process.platform === "win32" ? "jest.cmd" : "jest";
  return path.join(cwd, "node_modules", ".bin", executable);
}

async function runJest(args: { suite: Suite; cwd: string; jestArgs: string[] }): Promise<number> {
  const jestCommand = getJestCommandPath(args.cwd);

  return new Promise<number>((resolve) => {
    const child = spawn(jestCommand, args.jestArgs, {
      cwd: args.cwd,
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", () => {
      resolve(1);
    });

    child.on("close", (code) => {
      resolve(code ?? 1);
    });
  });
}

async function writeRunnerSnapshot(args: {
  suite: Suite;
  lane: QualityLane;
  status: HealthStatus;
  exitCode: number;
  jestArgs: string[];
}): Promise<void> {
  const key = getSnapshotKeyForSuite(args.suite);
  const summary =
    args.status === "pass"
      ? `${args.suite} test runner passed for lane ${args.lane}.`
      : `${args.suite} test runner failed for lane ${args.lane} with exit code ${args.exitCode}.`;
  const snapshot = await writeHealthSnapshot({
    key,
    status: args.status,
    summary,
    details: {
      suite: args.suite,
      lane: args.lane,
      exitCode: args.exitCode,
      jestArgs: args.jestArgs,
    },
  });

  out.metric(
    `Health snapshot: ${snapshot.publicPath} (aggregate: ${snapshot.aggregatePublicPath})`,
  );
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const defaultArgs = getDefaultJestArgs(parsed.suite, parsed.lane);
  const jestArgs = [...defaultArgs, ...parsed.passthrough];
  const suiteLabel = parsed.suite === "a11y" ? "A11y" : "Unit";

  out.section(`${suiteLabel} test runner (${parsed.lane} lane)`);
  const exitCode = await runJest({
    suite: parsed.suite,
    cwd: process.cwd(),
    jestArgs,
  });

  const status: HealthStatus = exitCode === 0 ? "pass" : "fail";
  await writeRunnerSnapshot({
    suite: parsed.suite,
    lane: parsed.lane,
    status,
    exitCode,
    jestArgs,
  });

  if (exitCode === 0) {
    out.success(`${suiteLabel} test runner passed (${parsed.lane}).`);
    return;
  }

  out.error(`${suiteLabel} test runner failed (${parsed.lane}).`);
  process.exit(exitCode);
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  out.error(`Test runner wrapper failed: ${message}`);
  const parsed = parseArgs(process.argv.slice(2));
  await writeRunnerSnapshot({
    suite: parsed.suite,
    lane: parsed.lane,
    status: "fail",
    exitCode: 1,
    jestArgs: [...getDefaultJestArgs(parsed.suite, parsed.lane), ...parsed.passthrough],
  });
  process.exit(1);
});
