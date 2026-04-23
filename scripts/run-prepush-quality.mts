#!/usr/bin/env tsx

import { spawnSync } from "node:child_process";

const QUALITY_STEPS = [
  "check:repo-hygiene",
  "check:file-budgets",
  "validate:resume:strict",
  "format:check",
  "typecheck",
  "lint",
  "test",
] as const;

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const runStep = (stepName: (typeof QUALITY_STEPS)[number]) => {
  process.stderr.write(`\n▶ pre-push: npm run ${stepName}\n\n`);

  const result = spawnSync(npmCommand, ["run", stepName], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      NPM_CONFIG_UPDATE_NOTIFIER: "false",
    },
    stdio: "inherit",
  });

  if (result.error) {
    process.stderr.write(`\n❌ pre-push failed while starting step: npm run ${stepName}\n`);
    process.stderr.write(`↪ error: ${result.error.message}\n`);
    process.stderr.write(`↪ rerun: npm run ${stepName}\n\n`);
    process.exit(1);
  }

  const exitCode = result.status ?? 1;
  if (exitCode !== 0) {
    process.stderr.write(`\n❌ pre-push failed at step: npm run ${stepName}\n`);
    process.stderr.write(`↪ rerun: npm run ${stepName}\n\n`);
    process.exit(exitCode);
  }
};

for (const stepName of QUALITY_STEPS) {
  runStep(stepName);
}

process.stderr.write("\n✅ pre-push checks passed.\n\n");
