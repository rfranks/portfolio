import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const gitDir = path.join(repoRoot, ".git");
const supportsColor =
  Boolean(process.stdout.isTTY) && !("NO_COLOR" in process.env) && process.env.TERM !== "dumb";
const useEmoji = !("NO_EMOJI" in process.env) && process.env.CI !== "true";

const ansi = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
} as const;

type AnsiKey = keyof typeof ansi;

function style(text: string, color: Exclude<AnsiKey, "reset">): string {
  if (!supportsColor) {
    return text;
  }
  return `${ansi[color]}${text}${ansi.reset}`;
}

function icon(emoji: string, fallback: string): string {
  return useEmoji ? emoji : fallback;
}

function warn(message: string): void {
  console.warn(`${style(`${icon("⚠️", "!")} HUSKY`, "yellow")} ${message}`);
}

function success(message: string): void {
  console.log(`${style(`${icon("✅", "+")} HUSKY`, "green")} ${message}`);
}

if (process.env.HUSKY === "0") {
  warn("Skipping install because HUSKY=0");
  process.exit(0);
}

if (!fs.existsSync(gitDir)) {
  warn("Skipping install because .git directory is missing");
  process.exit(0);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCommand, ["--no-install", "husky"], {
  cwd: repoRoot,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

success("Hooks installed");
