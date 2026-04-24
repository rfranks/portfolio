import fs from "node:fs/promises";
import path from "node:path";

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath: string): Promise<void> {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function readJson<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

export async function createJsonBackup(filePath: string): Promise<string> {
  const backupDir = path.join(path.dirname(filePath), ".backups");
  await ensureDir(backupDir);

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(
    backupDir,
    `${path.basename(filePath, path.extname(filePath))}.${timestamp}${path.extname(filePath)}`,
  );
  await fs.copyFile(filePath, backupPath);
  return backupPath;
}

type WriteJsonOptions = {
  createBackup?: boolean;
  dryRun?: boolean;
  showDiff?: boolean;
  fileLabel?: string;
  renderDiff?: (currentContent: string, nextContent: string, fileLabel: string) => string;
  onInfo?: (message: string) => void;
  onWarning?: (message: string) => void;
  onSuccess?: (message: string) => void;
};

export async function writeJson(
  filePath: string,
  data: unknown,
  options?: WriteJsonOptions,
): Promise<void> {
  const label = options?.fileLabel || filePath;
  const info = options?.onInfo || (() => undefined);
  const warning = options?.onWarning || (() => undefined);
  const success = options?.onSuccess || (() => undefined);
  const json = `${JSON.stringify(data, null, 2)}\n`;
  const fileExists = await pathExists(filePath);
  const currentContent = fileExists ? await fs.readFile(filePath, "utf8") : "";

  if (currentContent === json) {
    info(`No changes detected for ${label}.`);
    return;
  }

  if (options?.showDiff !== false && options?.renderDiff) {
    info(`Diff preview for ${label}:`);
    info(options.renderDiff(currentContent, json, label));
  }

  if (options?.dryRun) {
    warning(`Dry run enabled. Skipped writing ${label}.`);
    return;
  }

  if (options?.createBackup && fileExists) {
    const backupPath = await createJsonBackup(filePath);
    info(`Backup created: ${backupPath}`);
  }

  const tempPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(tempPath, json, "utf8");
  await fs.rename(tempPath, filePath);
  success(`Wrote ${label}.`);
}
