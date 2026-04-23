#!/usr/bin/env tsx

import path from "node:path";
import { spawn } from "node:child_process";
import { createCliOutput } from "./lib/cli-output";
import {
  writeHealthSnapshot,
  type HealthSnapshotKey,
  type HealthStatus,
} from "./lib/health-dashboard";

type Suite = "unit" | "a11y";

type ParsedArgs = {
  suite: Suite;
  passthrough: string[];
};

const out = createCliOutput();

function parseArgs(argv: string[]): ParsedArgs {
  let suite: Suite = "unit";
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
    passthrough.push(token);
  }

  return { suite, passthrough };
}

function getSnapshotKeyForSuite(suite: Suite): HealthSnapshotKey {
  return suite === "a11y" ? "a11yRunner" : "testRunner";
}

function getDefaultJestArgs(suite: Suite): string[] {
  if (suite === "a11y") {
    return ["src/tests/accessibility", "--runInBand"];
  }
  return [];
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
  status: HealthStatus;
  exitCode: number;
  jestArgs: string[];
}): Promise<void> {
  const key = getSnapshotKeyForSuite(args.suite);
  const summary =
    args.status === "pass"
      ? `${args.suite} test runner passed.`
      : `${args.suite} test runner failed with exit code ${args.exitCode}.`;
  const snapshot = await writeHealthSnapshot({
    key,
    status: args.status,
    summary,
    details: {
      suite: args.suite,
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
  const defaultArgs = getDefaultJestArgs(parsed.suite);
  const jestArgs = [...defaultArgs, ...parsed.passthrough];
  const suiteLabel = parsed.suite === "a11y" ? "A11y" : "Unit";

  out.section(`${suiteLabel} test runner`);
  const exitCode = await runJest({
    suite: parsed.suite,
    cwd: process.cwd(),
    jestArgs,
  });

  const status: HealthStatus = exitCode === 0 ? "pass" : "fail";
  await writeRunnerSnapshot({
    suite: parsed.suite,
    status,
    exitCode,
    jestArgs,
  });

  if (exitCode === 0) {
    out.success(`${suiteLabel} test runner passed.`);
    return;
  }

  out.error(`${suiteLabel} test runner failed.`);
  process.exit(exitCode);
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  out.error(`Test runner wrapper failed: ${message}`);
  const parsed = parseArgs(process.argv.slice(2));
  await writeRunnerSnapshot({
    suite: parsed.suite,
    status: "fail",
    exitCode: 1,
    jestArgs: [...getDefaultJestArgs(parsed.suite), ...parsed.passthrough],
  });
  process.exit(1);
});
