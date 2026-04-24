#!/usr/bin/env tsx

import { spawn } from "node:child_process";

const QUALITY_STEPS = [
  "check:repo-hygiene",
  "check:asset-integrity",
  "check:file-budgets",
  "validate:resume:strict",
  "format:check",
  "typecheck:health",
  "lint",
  "test",
] as const;

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const tailLines = (value: string, maxLines = 80) => {
  const normalized = value.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return "";
  }
  const lines = normalized.split("\n");
  if (lines.length <= maxLines) {
    return normalized;
  }
  return lines.slice(lines.length - maxLines).join("\n");
};

const runStep = async (stepName: (typeof QUALITY_STEPS)[number]) => {
  process.stderr.write(`\n▶ pre-push: npm run ${stepName}\n\n`);

  const result = await new Promise<{
    exitCode: number;
    output: string;
    error?: Error;
  }>((resolve) => {
    const command = spawn(npmCommand, ["run", stepName], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        NPM_CONFIG_UPDATE_NOTIFIER: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    command.stdout.on("data", (chunk: Buffer | string) => {
      const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      stdout += text;
      process.stdout.write(text);
    });

    command.stderr.on("data", (chunk: Buffer | string) => {
      const text = typeof chunk === "string" ? chunk : chunk.toString("utf8");
      stderr += text;
      process.stderr.write(text);
    });

    command.on("error", (error) => {
      resolve({
        exitCode: 1,
        output: `${stdout}${stderr}`,
        error,
      });
    });

    command.on("close", (code) => {
      resolve({
        exitCode: code ?? 1,
        output: `${stdout}${stderr}`,
      });
    });
  });

  if (result.error) {
    process.stderr.write(`\n❌ pre-push failed while starting step: npm run ${stepName}\n`);
    process.stderr.write(`↪ error: ${result.error.message}\n`);
    process.stderr.write(`↪ rerun: npm run ${stepName}\n\n`);
    process.exit(1);
  }

  const exitCode = result.exitCode;
  if (exitCode !== 0) {
    const outputTail = tailLines(result.output);
    if (outputTail) {
      process.stderr.write("\n----- failing step output (tail) -----\n");
      process.stderr.write(`${outputTail}\n`);
      process.stderr.write("----- end failing output -----\n");
    } else {
      process.stderr.write(
        "\n⚠️ failing step produced no stdout/stderr output. Run it directly for details.\n",
      );
    }
    process.stderr.write(`\n❌ pre-push failed at step: npm run ${stepName}\n`);
    process.stderr.write(`↪ rerun: npm run ${stepName}\n\n`);
    process.exit(exitCode);
  }
};

for (const stepName of QUALITY_STEPS) {
  await runStep(stepName);
}

process.stderr.write("\n✅ pre-push checks passed.\n\n");
