#!/usr/bin/env tsx

import { spawn } from "node:child_process";
import { createCliOutput } from "./lib/cli-output";
import { writeHealthSnapshot, type HealthStatus } from "./lib/health-dashboard";

const out = createCliOutput();

async function runTypecheck(): Promise<number> {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  return new Promise<number>((resolve) => {
    const child = spawn(npmCommand, ["run", "typecheck"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: "inherit",
    });

    child.on("error", () => resolve(1));
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function writeTypecheckSnapshot(status: HealthStatus, exitCode: number): Promise<void> {
  const snapshot = await writeHealthSnapshot({
    key: "typecheckRunner",
    status,
    summary:
      status === "pass" ? "Typecheck passed." : `Typecheck failed with exit code ${exitCode}.`,
    details: {
      exitCode,
    },
  });
  out.metric(
    `Health snapshot: ${snapshot.publicPath} (aggregate: ${snapshot.aggregatePublicPath})`,
  );
}

async function main(): Promise<void> {
  out.section("Typecheck runner");
  const exitCode = await runTypecheck();
  const status: HealthStatus = exitCode === 0 ? "pass" : "fail";
  await writeTypecheckSnapshot(status, exitCode);
  if (exitCode === 0) {
    out.success("Typecheck passed.");
    return;
  }
  out.error("Typecheck failed.");
  process.exit(exitCode);
}

main().catch(async (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  out.error(`Typecheck wrapper failed: ${message}`);
  await writeTypecheckSnapshot("fail", 1);
  process.exit(1);
});
