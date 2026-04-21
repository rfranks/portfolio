#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const resumeDataPath = path.join(
  repoRoot,
  "public",
  "personal",
  "data",
  "resumeData.json",
);
const publicDir = path.join(repoRoot, "public");
const appsPublicDir = path.join(publicDir, "apps");
const personalDir = path.join(publicDir, "personal");
const personalImagesDir = path.join(personalDir, "images");
const shenanigansDir = path.join(personalImagesDir, "ai-shenanigans");
const projectsImagesDir = path.join(personalImagesDir, "projects");
const personalDataDir = path.join(personalDir, "data");
const personalDemoGifsDir = path.join(personalDir, "demogifs");
const personalDemoVideosDir = path.join(personalDir, "demovideos");
const personalPdfsDir = path.join(personalDir, "pdfs");
const faviconPath = path.join(publicDir, "favicon.ico");
const faviconDefaultPath = path.join(publicDir, "favicon.ico.default");

const imageExtensions = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".svg",
]);
const videoExtensions = new Set([".mp4", ".webm", ".mov", ".m4v"]);
const audioExtensions = new Set([".mp3", ".wav", ".ogg", ".m4a"]);
const pdfExtensions = new Set([".pdf"]);
const markdownExtensions = new Set([".md", ".markdown"]);
const jsExtensions = new Set([".js", ".mjs", ".cjs"]);
const wasmExtensions = new Set([".wasm"]);
const dataExtensions = new Set([".json", ".csv", ".tsv", ".txt", ".xml"]);
const supportsColor =
  Boolean(output.isTTY) &&
  !("NO_COLOR" in process.env) &&
  process.env.TERM !== "dumb";

const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
};

const uiIcons = {
  section: "🧭",
  prompt: "❯",
  success: "✅",
  warning: "⚠️",
  error: "❌",
  info: "ℹ️",
};

type WizardReadline = ReturnType<typeof readline.createInterface>;
type AnsiKey = keyof typeof ansi;
type JsonRecord = Record<string, unknown>;

type AskTextOptions = {
  defaultValue?: string;
  required?: boolean;
  transform?: (value: string) => string;
};

type ChoiceOption<TValue = string> = {
  label: string;
  value: TValue;
  description?: string;
};

type ScopedAssetOptions = {
  title: string;
  scopeAbsDir: string;
  webBase: string;
  extensions: Set<string>;
  fallbackRelative: string;
  optional?: boolean;
};

type ProjectEntry = {
  href: string;
  name: string;
  [key: string]: unknown;
};

type ShenaniganEntry = {
  slug: string;
  title: string;
  [key: string]: unknown;
};

type NavigationRoute = {
  label: string;
  href: string;
};

type ExperienceEntry = {
  company: string;
  position: string;
  location: string;
  start: string;
  end: string;
  details: string[];
  image: string;
};

type EducationEntry = {
  school: string;
  degree: string;
  year: string;
  awards: string[];
  image: string;
};

type RecommendationEntry = {
  name: string;
  title: string;
  date: string;
  relationship: string;
  imageSrcUrl?: string;
  text: string;
};

type CompetencySkillEntry = {
  label: string;
  description: string;
  [key: string]: unknown;
};

type CompetencyCategoryEntry = {
  title: string;
  shortText?: string;
  subTitle?: string;
  icon?: string;
  items: CompetencySkillEntry[];
  [key: string]: unknown;
};

type CompetenciesData = {
  categories?: CompetencyCategoryEntry[];
  skills?: string[];
  [key: string]: unknown;
};

type AppAssetBucket =
  | "images"
  | "videos"
  | "audio"
  | "pdfs"
  | "markdown"
  | "js"
  | "wasm"
  | "data"
  | "assets";

type AppAssetFolderMap = Record<AppAssetBucket, string>;

type ContactInfo = {
  email?: string;
  linkedin?: string;
  github?: string[];
};

type SummaryData = {
  name?: string;
  title?: string;
  location?: string;
  contact?: ContactInfo;
  heroOverline?: string;
  documentTitle?: string;
  metadataTitle?: string;
  [key: string]: unknown;
};

type RecognitionData = {
  snippets?: string[];
  recommendations?: RecommendationEntry[];
  [key: string]: unknown;
};

type AIShenanigansData = {
  items?: ShenaniganEntry[];
  [key: string]: unknown;
};

type ResumeData = JsonRecord & {
  summary?: SummaryData;
  contactCTA?: JsonRecord;
  hobbies?: JsonRecord;
  aiShenanigans?: AIShenanigansData;
  competencies?: CompetenciesData;
  projects?: ProjectEntry[];
  experience?: ExperienceEntry[];
  education?: EducationEntry[];
  recognition?: RecognitionData;
  navigation?: JsonRecord;
  projectsSection?: JsonRecord;
};

function paint(text: string, ...styles: AnsiKey[]): string {
  if (!supportsColor || styles.length === 0) {
    return text;
  }
  const prefix = styles.map((style) => ansi[style]).join("");
  return `${prefix}${text}${ansi.reset}`;
}

function writeLine(line = ""): void {
  output.write(`${line}\n`);
}

function writeSection(title: string): void {
  writeLine();
  writeLine(paint(`${uiIcons.section} ${title}`, "bold", "magenta"));
}

function writeInfo(message: string): void {
  writeLine(`${paint(uiIcons.info, "cyan")} ${message}`);
}

function writeSuccess(message: string): void {
  writeLine(`${paint(uiIcons.success, "green")} ${paint(message, "green")}`);
}

function writeWarning(message: string): void {
  writeLine(`${paint(uiIcons.warning, "yellow")} ${paint(message, "yellow")}`);
}

function writeError(message: string): void {
  writeLine(`${paint(uiIcons.error, "red")} ${paint(message, "red")}`);
}

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function parseCommaList(inputValue: string): string[] {
  return inputValue
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function withLeadingSlash(p: string): string {
  if (!p) {
    return "";
  }
  return p.startsWith("/") ? p : `/${p}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNumericPathSegment(segment: string): boolean {
  return /^\d+$/.test(segment);
}

function parseMetadataPath(pathInput: string): string[] {
  return pathInput
    .trim()
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .map((segment) => segment.trim())
    .filter(Boolean);
}

function formatValueForDisplay(value: unknown): string {
  if (value === undefined) {
    return "undefined";
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getValueAtPath(root: unknown, segments: string[]): unknown {
  let current: unknown = root;

  for (const segment of segments) {
    if (Array.isArray(current)) {
      if (!isNumericPathSegment(segment)) {
        return undefined;
      }
      const index = Number(segment);
      current = current[index];
      continue;
    }

    if (isPlainObject(current)) {
      current = current[segment];
      continue;
    }

    return undefined;
  }

  return current;
}

function setValueAtPath(root: JsonRecord, segments: string[], value: unknown): boolean {
  if (!segments.length) {
    return false;
  }

  let current: unknown = root;

  for (let idx = 0; idx < segments.length - 1; idx += 1) {
    const segment = segments[idx];
    const nextSegment = segments[idx + 1];
    const shouldCreateArray = isNumericPathSegment(nextSegment);

    if (Array.isArray(current)) {
      if (!isNumericPathSegment(segment)) {
        return false;
      }
      const index = Number(segment);
      const existing = current[index];
      if (!isPlainObject(existing) && !Array.isArray(existing)) {
        current[index] = shouldCreateArray ? [] : {};
      }
      current = current[index];
      continue;
    }

    if (isPlainObject(current)) {
      const existing = current[segment];
      if (!isPlainObject(existing) && !Array.isArray(existing)) {
        current[segment] = shouldCreateArray ? [] : {};
      }
      current = current[segment];
      continue;
    }

    return false;
  }

  const last = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (!isNumericPathSegment(last)) {
      return false;
    }
    current[Number(last)] = value;
    return true;
  }

  if (isPlainObject(current)) {
    current[last] = value;
    return true;
  }

  return false;
}

function deleteValueAtPath(root: JsonRecord, segments: string[]): boolean {
  if (!segments.length) {
    return false;
  }

  let current: unknown = root;
  for (let idx = 0; idx < segments.length - 1; idx += 1) {
    const segment = segments[idx];
    if (Array.isArray(current)) {
      if (!isNumericPathSegment(segment)) {
        return false;
      }
      current = current[Number(segment)];
      continue;
    }
    if (isPlainObject(current)) {
      current = current[segment];
      continue;
    }
    return false;
  }

  const last = segments[segments.length - 1];
  if (Array.isArray(current)) {
    if (!isNumericPathSegment(last)) {
      return false;
    }
    const index = Number(last);
    if (index < 0 || index >= current.length) {
      return false;
    }
    current.splice(index, 1);
    return true;
  }

  if (isPlainObject(current)) {
    if (!(last in current)) {
      return false;
    }
    delete current[last];
    return true;
  }

  return false;
}

function inferAppAssetBucket(ext: string): AppAssetBucket {
  if (imageExtensions.has(ext)) {
    return "images";
  }
  if (videoExtensions.has(ext)) {
    return "videos";
  }
  if (audioExtensions.has(ext)) {
    return "audio";
  }
  if (pdfExtensions.has(ext)) {
    return "pdfs";
  }
  if (markdownExtensions.has(ext)) {
    return "markdown";
  }
  if (jsExtensions.has(ext)) {
    return "js";
  }
  if (wasmExtensions.has(ext)) {
    return "wasm";
  }
  if (dataExtensions.has(ext)) {
    return "data";
  }
  return "assets";
}

async function ensureScopedFoldersForAppAssets(slug: string): Promise<AppAssetFolderMap> {
  const appRoot = path.join(appsPublicDir, slug);
  const folders: AppAssetFolderMap = {
    images: path.join(appRoot, "images"),
    videos: path.join(appRoot, "videos"),
    audio: path.join(appRoot, "audio"),
    pdfs: path.join(appRoot, "pdfs"),
    markdown: path.join(appRoot, "markdown"),
    js: path.join(appRoot, "js"),
    wasm: path.join(appRoot, "wasm"),
    data: path.join(appRoot, "data"),
    assets: path.join(appRoot, "assets"),
  };

  for (const folder of Object.values(folders)) {
    await ensureDir(folder);
    await fs.writeFile(path.join(folder, ".gitkeep"), "", "utf8");
  }

  return folders;
}

function resolvePublicPath(inputPath: string): {
  absPath: string;
  relPath: string;
  webPath: string;
} | null {
  const trimmed = inputPath.trim();
  if (!trimmed) {
    return null;
  }

  let absolutePath = trimmed;
  if (!path.isAbsolute(trimmed)) {
    const relativePath = toPosix(path.posix.normalize(trimmed.replace(/^\/+/, "")));
    if (!relativePath || relativePath.startsWith("..")) {
      return null;
    }
    absolutePath = path.resolve(publicDir, relativePath);
  }

  const normalizedAbs = path.resolve(absolutePath);
  const publicRootWithSep = `${path.resolve(publicDir)}${path.sep}`;
  if (
    normalizedAbs !== path.resolve(publicDir) &&
    !normalizedAbs.startsWith(publicRootWithSep)
  ) {
    return null;
  }

  const rel = toPosix(path.relative(publicDir, normalizedAbs));
  if (!rel || rel.startsWith("..")) {
    return null;
  }

  return {
    absPath: normalizedAbs,
    relPath: rel,
    webPath: withLeadingSlash(rel),
  };
}

async function moveFileSafely(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    await fs.rename(sourcePath, destinationPath);
    return;
  } catch (error) {
    const isCrossDevice =
      isPlainObject(error) && "code" in error && error.code === "EXDEV";
    if (!isCrossDevice) {
      throw error;
    }
  }

  await fs.copyFile(sourcePath, destinationPath);
  await fs.rm(sourcePath);
}

function replacePathReferencesInObject(
  value: unknown,
  oldPath: string,
  newPath: string,
): number {
  let replacements = 0;

  if (typeof value === "string") {
    return 0;
  }

  if (Array.isArray(value)) {
    value.forEach((item, idx) => {
      if (typeof item === "string") {
        const occurrences = item.split(oldPath).length - 1;
        if (occurrences > 0) {
          value[idx] = item.split(oldPath).join(newPath);
          replacements += occurrences;
        }
        return;
      }
      replacements += replacePathReferencesInObject(item, oldPath, newPath);
    });
    return replacements;
  }

  if (!isPlainObject(value)) {
    return 0;
  }

  Object.entries(value).forEach(([key, child]) => {
    if (typeof child === "string") {
      const occurrences = child.split(oldPath).length - 1;
      if (occurrences > 0) {
        value[key] = child.split(oldPath).join(newPath);
        replacements += occurrences;
      }
      return;
    }
    replacements += replacePathReferencesInObject(child, oldPath, newPath);
  });

  return replacements;
}

function defaultProjectDiagrams(projectName: string): {
  blockDiagram: string;
  componentDiagram: string;
  sequenceDiagram: string;
} {
  const safeName = projectName || "Project";
  return {
    blockDiagram:
      `graph TD;\n` +
      `  U[User] --> UI[${safeName} UI];\n` +
      `  UI --> API[Service Layer];\n` +
      `  API --> DB[(Data Store)];`,
    componentDiagram:
      `graph LR;\n` +
      `  A[Page Route] --> B[Client Components];\n` +
      `  B --> C[Shared UI];\n` +
      `  B --> D[Data Adapter];\n` +
      `  D --> E[Resume Data];`,
    sequenceDiagram:
      `sequenceDiagram\n` +
      `  participant U as User\n` +
      `  participant P as Page\n` +
      `  participant D as Data\n\n` +
      `  U->>P: Open route\n` +
      `  P->>D: Load project metadata\n` +
      `  D-->>P: Render payload\n` +
      `  P-->>U: Display project`,
  };
}

const shenaniganTypeChoices = [
  {
    value: "default",
    label: "Default (image -> stylized -> motion)",
    description: "Example: a portrait transformed into style and then short motion.",
  },
  {
    value: "book-to-limited-series",
    label: "Book to Limited Series",
    description: "Example: cover + manuscript + trailer + episode plan.",
  },
  {
    value: "work-to-series-adaptation",
    label: "Work to Series Adaptation",
    description: "Example: source work and adaptation trailer/series artifacts.",
  },
  {
    value: "palmylyzer-pro",
    label: "Palm Analysis",
    description: "Example: raw image + analysis image + line map + reading.",
  },
  {
    value: "song-recording",
    label: "Song Recording",
    description: "Example: album cover + audio + lyrics markdown.",
  },
];

const competencyOptionIconChoices: ChoiceOption<string>[] = [
  {
    label: "Auto awesome (AI/LLM)",
    value: "auto-awesome",
    description: "Best fit for AI/LLM and RAG systems.",
  },
  {
    label: "Web (Frontend)",
    value: "web",
    description: "Frontend and UX-focused competency category.",
  },
  {
    label: "DNS (Backend)",
    value: "dns",
    description: "Backend services and API category.",
  },
  {
    label: "Cloud",
    value: "cloud",
    description: "Cloud platforms and DevOps workflows.",
  },
  {
    label: "Hub (Data/Integration)",
    value: "hub",
    description: "Data, integration, and distributed connections.",
  },
  {
    label: "Groups (Leadership)",
    value: "groups",
    description: "Leadership and team collaboration category.",
  },
  {
    label: "Custom icon key",
    value: "__custom__",
    description: "Enter your own icon key string.",
  },
];

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(targetPath: string): Promise<void> {
  await fs.mkdir(targetPath, { recursive: true });
}

async function readJson<T = JsonRecord>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson(filePath: string, data: unknown): Promise<void> {
  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, json, "utf8");
}

async function walkFiles(baseDir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith(".")) {
        continue;
      }
      const abs = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
        continue;
      }
      const rel = path.relative(baseDir, abs);
      files.push(toPosix(rel));
    }
  }

  if (!(await pathExists(baseDir))) {
    return files;
  }

  await walk(baseDir);
  files.sort((a, b) => a.localeCompare(b));
  return files;
}

function matchesExtensions(file: string, extSet: Set<string>): boolean {
  return extSet.has(path.extname(file).toLowerCase());
}

async function askText(
  rl: WizardReadline,
  prompt: string,
  options: AskTextOptions = {},
): Promise<string> {
  const { defaultValue = "", required = false, transform } = options;
  for (;;) {
    const defaultSuffix = defaultValue ? ` (${defaultValue})` : "";
    const answer = await rl.question(
      `${paint(uiIcons.prompt, "cyan")} ${paint(prompt, "bold")}${paint(defaultSuffix, "dim")}: `,
    );
    const resolved = answer.trim() || defaultValue;
    const finalValue = transform ? transform(resolved) : resolved;
    if (required && !String(finalValue).trim()) {
      writeError("Please provide a value.");
      continue;
    }
    return finalValue;
  }
}

async function askYesNo(
  rl: WizardReadline,
  prompt: string,
  defaultYes = true,
): Promise<boolean> {
  const hint = defaultYes ? "Y/n" : "y/N";
  for (;;) {
    const answer = (
      await rl.question(
        `${paint(uiIcons.prompt, "cyan")} ${paint(prompt, "bold")} ${paint(`[${hint}]`, "dim")}: `,
      )
    )
      .trim()
      .toLowerCase();
    if (!answer) {
      return defaultYes;
    }
    if (["y", "yes"].includes(answer)) {
      return true;
    }
    if (["n", "no"].includes(answer)) {
      return false;
    }
    writeError("Please answer yes or no.");
  }
}

async function chooseOne<TValue>(
  rl: WizardReadline,
  prompt: string,
  options: ChoiceOption<TValue>[],
  defaultIndex = 0,
): Promise<ChoiceOption<TValue>> {
  writeLine();
  writeLine(paint(prompt, "bold", "cyan"));
  options.forEach((option, idx) => {
    const number = idx + 1;
    const description = option.description ? ` — ${option.description}` : "";
    writeLine(
      `  ${paint(`${number}.`, "bold")} ${option.label}${paint(description, "dim")}`,
    );
  });

  for (;;) {
    const answer = await rl.question(
      `${paint(uiIcons.prompt, "cyan")} ${paint(`Choose [1-${options.length}]`, "bold")} ${paint(`(default ${defaultIndex + 1})`, "dim")}: `,
    );
    if (!answer.trim()) {
      return options[defaultIndex];
    }
    const numeric = Number.parseInt(answer.trim(), 10);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= options.length) {
      return options[numeric - 1];
    }
    writeError("Invalid choice. Try again.");
  }
}

async function chooseIndex(
  rl: WizardReadline,
  prompt: string,
  labels: string[],
): Promise<number> {
  writeLine();
  writeLine(paint(prompt, "bold", "cyan"));
  labels.forEach((label, idx) => {
    writeLine(`  ${paint(`${idx + 1}.`, "bold")} ${label}`);
  });

  for (;;) {
    const answer = await rl.question(
      `${paint(uiIcons.prompt, "cyan")} ${paint(`Choose [1-${labels.length}]`, "bold")}: `,
    );
    const numeric = Number.parseInt(answer.trim(), 10);
    if (!Number.isNaN(numeric) && numeric >= 1 && numeric <= labels.length) {
      return numeric - 1;
    }
    writeError("Invalid choice. Try again.");
  }
}

async function ensureScopedFoldersForApp(slug: string): Promise<{
  appRoot: string;
  imagesDir: string;
  videosDir: string;
}> {
  const appRoot = path.join(appsPublicDir, slug);
  const imagesDir = path.join(appRoot, "images");
  const videosDir = path.join(appRoot, "videos");
  await ensureDir(imagesDir);
  await ensureDir(videosDir);
  await fs.writeFile(path.join(imagesDir, ".gitkeep"), "", "utf8");
  await fs.writeFile(path.join(videosDir, ".gitkeep"), "", "utf8");
  return { appRoot, imagesDir, videosDir };
}

async function ensureScopedFolderForShenanigan(slug: string): Promise<string> {
  const folder = path.join(shenanigansDir, slug);
  await ensureDir(folder);
  await fs.writeFile(path.join(folder, ".gitkeep"), "", "utf8");
  return folder;
}

async function chooseScopedAsset(
  rl: WizardReadline,
  options: ScopedAssetOptions,
): Promise<string> {
  const {
    title,
    scopeAbsDir,
    webBase,
    extensions,
    fallbackRelative,
    optional = true,
  } = options;
  await ensureDir(scopeAbsDir);
  const allFiles = await walkFiles(scopeAbsDir);
  const candidates = allFiles.filter((file) => matchesExtensions(file, extensions));

  if (!candidates.length) {
    writeLine();
    writeWarning(`No matching files detected for ${title}.`);
    writeInfo(`Move files into ${scopeAbsDir} and rerun update to pick them.`);
    if (optional) {
      return "";
    }
    return withLeadingSlash(toPosix(path.posix.join(webBase, fallbackRelative)));
  }

  const choices = candidates.map((file) => ({
    label: file,
    value: withLeadingSlash(toPosix(path.posix.join(webBase, file))),
  }));

  if (optional) {
    choices.unshift({ label: "Skip for now", value: "" });
  }

  const choice = await chooseOne(rl, title, choices, 0);
  return choice.value;
}

async function createProjectRouteSkeleton(
  rl: WizardReadline,
  slug: string,
  projectName: string,
): Promise<boolean> {
  const routeDir = path.join(repoRoot, "src", "app", slug);
  const projectFile = path.join(routeDir, "project.ts");
  const pageFile = path.join(routeDir, "page.tsx");

  await ensureDir(routeDir);

  const shouldOverwriteExisting =
    !(await pathExists(pageFile)) ||
    (await askYesNo(rl, `Route /${slug} already exists. Overwrite page.tsx and project.ts?`, false));

  if (!shouldOverwriteExisting) {
    return false;
  }

  const projectTs = `import { createProjectPageData } from "@/components/portfolio/projectPageData";

export const projectData = createProjectPageData("/${slug}", {
  project: ${JSON.stringify(projectName)},
});
`;

  const pageTsx = `import type { Metadata } from "next";
import ProjectShowcasePage from "@/components/portfolio/ProjectShowcasePage";
import { projectData } from "./project";

export const metadata: Metadata = {
  title: \`\${projectData.project} Project\`,
  description: projectData.description,
};

export default function ${toPascalCase(slug)}Page() {
  return (
    <ProjectShowcasePage
      documentTitle={\`\${projectData.project} Project\`}
      heading={projectData.project}
      project={projectData}
      subtitle="Project Showcase"
    />
  );
}
`;

  await fs.writeFile(projectFile, projectTs, "utf8");
  await fs.writeFile(pageFile, pageTsx, "utf8");
  return true;
}

function toPascalCase(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function projectWatermarkFromPath(
  projectName: string,
  imagePath: string,
): {
  kind: "image";
  containerClassName: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  imageClassName: string;
} | null {
  if (!imagePath) {
    return null;
  }
  return {
    kind: "image",
    containerClassName:
      "pointer-events-none absolute bottom-5 right-5 opacity-[0.1] transition-all duration-500 group-hover:translate-y-[-2px] group-hover:opacity-[0.2]",
    src: imagePath,
    alt: `${projectName} watermark`,
    width: 240,
    height: 160,
    imageClassName: "h-auto w-52 rounded-2xl object-contain",
  };
}

function upsertProject(projects: ProjectEntry[], nextProject: ProjectEntry): void {
  const index = projects.findIndex((item) => item.href === nextProject.href);
  if (index === -1) {
    projects.push(nextProject);
    return;
  }
  projects[index] = nextProject;
}

function upsertShenanigan(
  items: ShenaniganEntry[],
  shenanigan: ShenaniganEntry,
): void {
  const index = items.findIndex((item) => item.slug === shenanigan.slug);
  if (index === -1) {
    items.push(shenanigan);
    return;
  }
  items[index] = shenanigan;
}

function ensureNavigationItems(
  resumeData: JsonRecord,
  projectRoutes: NavigationRoute[],
): void {
  const base = [{ label: "Home", href: "/", icon: "home" }];
  const shenanigans = {
    label: "AI Shenanigans",
    href: "/ai-shenanigans",
    icon: "autoFixHigh",
  };
  const projectItems = projectRoutes.map((route) => ({
    label: route.label,
    href: route.href,
    icon: "apps",
  }));

  resumeData.navigation = {
    ...(resumeData.navigation || {}),
    drawerItems: [...base, ...projectItems, shenanigans],
  };
}

function buildGenericFaviconIcoBuffer() {
  const width = 32;
  const height = 32;
  const xorBytes = width * height * 4;
  const maskRowBytes = Math.ceil(width / 32) * 4;
  const andMaskBytes = maskRowBytes * height;

  const bitmapInfoHeaderSize = 40;
  const imageSize = bitmapInfoHeaderSize + xorBytes + andMaskBytes;

  const totalSize = 6 + 16 + imageSize;
  const buffer = Buffer.alloc(totalSize, 0);

  let offset = 0;

  buffer.writeUInt16LE(0, offset);
  offset += 2;
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(1, offset);
  offset += 2;

  buffer.writeUInt8(width, offset++);
  buffer.writeUInt8(height, offset++);
  buffer.writeUInt8(0, offset++);
  buffer.writeUInt8(0, offset++);
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(32, offset);
  offset += 2;
  buffer.writeUInt32LE(imageSize, offset);
  offset += 4;
  buffer.writeUInt32LE(6 + 16, offset);
  offset += 4;

  buffer.writeUInt32LE(40, offset);
  offset += 4;
  buffer.writeInt32LE(width, offset);
  offset += 4;
  buffer.writeInt32LE(height * 2, offset);
  offset += 4;
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(32, offset);
  offset += 2;
  buffer.writeUInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(xorBytes, offset);
  offset += 4;
  buffer.writeInt32LE(0, offset);
  offset += 4;
  buffer.writeInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(0, offset);
  offset += 4;

  const pixelStart = offset;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const drawY = height - 1 - y;
      const pixelOffset = pixelStart + (drawY * width + x) * 4;

      const radialX = (x - width / 2) / (width / 2);
      const radialY = (y - height / 2) / (height / 2);
      const radius = Math.sqrt(radialX * radialX + radialY * radialY);

      const bgBlue = 230;
      const bgGreen = 145 + Math.max(0, Math.floor((1 - radius) * 70));
      const bgRed = 60 + Math.max(0, Math.floor((1 - radius) * 50));

      let r = bgRed;
      let g = bgGreen;
      let b = bgBlue;
      let a = 255;

      if (radius > 0.97) {
        a = 0;
      }

      const px = x;
      const py = y;
      const isPStem = px >= 10 && px <= 13 && py >= 7 && py <= 24;
      const isPTop = px >= 13 && px <= 21 && py >= 7 && py <= 11;
      const isPRight = px >= 20 && px <= 23 && py >= 10 && py <= 17;
      const isPMid = px >= 13 && px <= 20 && py >= 16 && py <= 19;
      const isCutout = px >= 15 && px <= 19 && py >= 11 && py <= 15;

      if ((isPStem || isPTop || isPRight || isPMid) && !isCutout) {
        r = 248;
        g = 252;
        b = 255;
        a = 255;
      }

      buffer[pixelOffset] = b;
      buffer[pixelOffset + 1] = g;
      buffer[pixelOffset + 2] = r;
      buffer[pixelOffset + 3] = a;
    }
  }

  return buffer;
}

async function ensureGenericFaviconDefault() {
  if (await pathExists(faviconDefaultPath)) {
    return;
  }
  const buffer = buildGenericFaviconIcoBuffer();
  await fs.writeFile(faviconDefaultPath, buffer);
}

async function replaceFaviconWithDefault() {
  await ensureGenericFaviconDefault();
  await fs.copyFile(faviconDefaultPath, faviconPath);
}

async function clearInitAssets() {
  const pathsToReset = [
    appsPublicDir,
    personalDataDir,
    personalDemoGifsDir,
    personalDemoVideosDir,
    shenanigansDir,
    projectsImagesDir,
    path.join(personalImagesDir, "personal"),
    path.join(personalImagesDir, "employers"),
    personalPdfsDir,
  ];

  for (const target of pathsToReset) {
    await fs.rm(target, { recursive: true, force: true });
  }

  const dirsToRecreate = [
    appsPublicDir,
    personalDataDir,
    personalDemoGifsDir,
    personalDemoVideosDir,
    shenanigansDir,
    projectsImagesDir,
    path.join(personalImagesDir, "personal"),
    path.join(personalImagesDir, "employers"),
    personalPdfsDir,
  ];

  for (const dir of dirsToRecreate) {
    await ensureDir(dir);
    await fs.writeFile(path.join(dir, ".gitkeep"), "", "utf8");
  }
}

function defaultExperienceTemplate(): ExperienceEntry {
  return {
    company: "Example Company",
    position: "Senior Software Engineer",
    location: "Remote",
    start: "January 2022",
    end: "Present",
    details: [
      "Built production-grade full-stack features from concept to release.",
      "Improved delivery speed through automation, reusable components, and better developer ergonomics.",
    ],
    image: "/personal/images/employers/company-logo.png",
  };
}

function defaultEducationTemplate(): EducationEntry {
  return {
    school: "Example University",
    degree: "B.S. in Computer Science",
    year: "2018",
    awards: ["Dean's List"],
    image: "/personal/images/personal/education-logo.png",
  };
}

function defaultRecognitionSnippetTemplate(): string {
  return "Recognized for delivering high-quality product engineering with speed and consistency.";
}

function defaultRecommendationTemplate(): RecommendationEntry {
  return {
    name: "Colleague Name",
    title: "Engineering Leader",
    date: "January 1, 2026",
    relationship: "Worked with me on the same team",
    imageSrcUrl: "/personal/images/colleagues/colleague.jpeg",
    text: "A short recommendation highlighting impact, collaboration, and technical strength.",
  };
}

function defaultCompetencyCategoryTemplate(): CompetencyCategoryEntry {
  return {
    title: "New Competency Category",
    shortText: "Short one-line summary for pager options.",
    subTitle: "Short one-line summary for pager options.",
    icon: "web",
    items: [
      {
        label: "Example skill",
        description: "Describe the capability shown by this skill.",
      },
    ],
  };
}

function serializeCompetencyItems(items: CompetencySkillEntry[]): string {
  return (items || [])
    .map((item) => `${item.label}::${item.description}`)
    .join(" | ");
}

function parseCompetencyItems(inputValue: string): CompetencySkillEntry[] {
  return inputValue
    .split("|")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      const [rawLabel, ...rawDescription] = segment.split("::");
      const label = rawLabel?.trim() || "";
      const description = rawDescription.join("::").trim();
      return {
        label: label || "Unnamed skill",
        description: description || "Add a short description.",
      };
    });
}

async function promptProject(
  rl: WizardReadline,
): Promise<{ project: ProjectEntry; slug: string; name: string; generateRoute: boolean }> {
  writeSection("Project setup");
  const name = await askText(rl, "Project name", {
    defaultValue: "My New App",
    required: true,
  });

  const routeInput = await askText(rl, "Project route slug (kebab-case)", {
    defaultValue: normalizeSlug(name),
    required: true,
    transform: normalizeSlug,
  });

  const slug = routeInput;
  const href = `/${slug}`;

  const typeChoice = await chooseOne(
    rl,
    "Project type",
    [
      { label: "Personal", value: "personal" },
      { label: "Work", value: "work" },
    ],
    0,
  );

  const description = await askText(rl, "Short project description", {
    defaultValue:
      "Short summary of what this project does and why it is useful.",
    required: true,
  });

  const interestsMeWhy = await askText(
    rl,
    "Why this project is interesting (shown in project cards)",
    {
      defaultValue:
        "This project showcases architecture decisions, product thinking, and practical delivery.",
      required: true,
    },
  );

  const { imagesDir } = await ensureScopedFoldersForApp(slug);
  const watermarkPath = await chooseScopedAsset(rl, {
    title: `Pick watermark image for ${name} (scoped to public/apps/${slug}/images)`,
    scopeAbsDir: imagesDir,
    webBase: `/apps/${slug}/images`,
    extensions: imageExtensions,
    fallbackRelative: "cover.png",
    optional: true,
  });

  const demoGifUrl = await chooseScopedAsset(rl, {
    title: `Optional demo GIF (scoped to public/apps/${slug}/images)`,
    scopeAbsDir: imagesDir,
    webBase: `/apps/${slug}/images`,
    extensions: new Set([".gif"]),
    fallbackRelative: "demo.gif",
    optional: true,
  });

  const demoVideoUrl = await chooseScopedAsset(rl, {
    title: `Optional demo video (scoped to public/apps/${slug}/videos)`,
    scopeAbsDir: path.join(appsPublicDir, slug, "videos"),
    webBase: `/apps/${slug}/videos`,
    extensions: videoExtensions,
    fallbackRelative: "demo.mp4",
    optional: true,
  });

  const techInput = await askText(
    rl,
    "Technologies (comma-separated)",
    {
      defaultValue: "Next.js, React, TypeScript",
      required: true,
    },
  );

  const technologiesUsed = parseCommaList(techInput).map((nameValue) => ({
    name: nameValue,
  }));

  const diagrams = defaultProjectDiagrams(name);

  const project: ProjectEntry = {
    name,
    description,
    href,
    type: typeChoice.value,
    interestsMeWhy,
    watermark: projectWatermarkFromPath(name, watermarkPath),
    demoGifUrl: demoGifUrl || undefined,
    demoVideoUrl: demoVideoUrl || undefined,
    project: name,
    wowFactor: "Architecture + UX + execution",
    specifications: {
      overview:
        "Describe your architecture, major constraints, and tradeoffs here.",
      status:
        "Use this section to track scope, quality goals, and rollout notes.",
    },
    technologiesUsed,
    blockDiagram: diagrams.blockDiagram,
    componentDiagram: diagrams.componentDiagram,
    sequenceDiagram: diagrams.sequenceDiagram,
  };

  const generateRoute = await askYesNo(
    rl,
    `Generate route skeleton for ${href}?`,
    true,
  );

  return { project, slug, name, generateRoute };
}

async function promptShenanigan(rl: WizardReadline): Promise<ShenaniganEntry> {
  writeSection("AI shenanigan setup");

  const typeChoice = await chooseOne(
    rl,
    "Shenanigan type (pick-list with examples)",
    shenaniganTypeChoices,
    0,
  );

  const title = await askText(rl, "Shenanigan title", {
    defaultValue: "Neon City Transformation",
    required: true,
  });

  const slug = await askText(rl, "Shenanigan slug (kebab-case)", {
    defaultValue: normalizeSlug(title),
    required: true,
    transform: normalizeSlug,
  });

  const shortText = await askText(rl, "Short pager subtext", {
    defaultValue: "Source image to stylized concept and motion beat.",
    required: true,
  });

  const blurb = await askText(rl, "Shenanigan blurb", {
    defaultValue:
      "This piece demonstrates multi-step generative content from source media to a polished creative artifact.",
    required: true,
  });

  const scopeDir = await ensureScopedFolderForShenanigan(slug);
  const webBase = `/personal/images/ai-shenanigans/${slug}`;

  const base = {
    type: typeChoice.value,
    slug,
    title,
    shortText,
    blurb,
  };

  if (typeChoice.value === "default") {
    const realisticImage = await chooseScopedAsset(rl, {
      title: `Realistic source image (public/personal/images/ai-shenanigans/${slug})`,
      scopeAbsDir: scopeDir,
      webBase,
      extensions: imageExtensions,
      fallbackRelative: "realistic.png",
      optional: false,
    });

    const stylizedRendering = await chooseScopedAsset(rl, {
      title: "Optional stylized image",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: imageExtensions,
      fallbackRelative: "stylized.png",
      optional: true,
    });

    const movieRendering = await chooseScopedAsset(rl, {
      title: "Optional motion video",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: videoExtensions,
      fallbackRelative: "movie.mp4",
      optional: true,
    });

    const pagerOptionImage = await chooseScopedAsset(rl, {
      title: "Optional pager option cover image",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: imageExtensions,
      fallbackRelative: "cover.png",
      optional: true,
    });

    return {
      ...base,
      realisticImage,
      stylizedRendering: stylizedRendering || undefined,
      movieRendering: movieRendering || undefined,
      pagerOptionImage: pagerOptionImage || undefined,
    };
  }

  if (typeChoice.value === "book-to-limited-series") {
    const bookCoverImage = await chooseScopedAsset(rl, {
      title: "Book cover image",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: imageExtensions,
      fallbackRelative: "book-cover.png",
      optional: false,
    });
    const manuscriptPdf = await chooseScopedAsset(rl, {
      title: "Manuscript PDF",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: pdfExtensions,
      fallbackRelative: "manuscript.pdf",
      optional: true,
    });
    const trailerMovie = await chooseScopedAsset(rl, {
      title: "Optional trailer video",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: videoExtensions,
      fallbackRelative: "trailer.mp4",
      optional: true,
    });
    const episodesPdf = await chooseScopedAsset(rl, {
      title: "Optional episodes PDF",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: pdfExtensions,
      fallbackRelative: "episodes.pdf",
      optional: true,
    });

    return {
      ...base,
      bookCoverImage,
      realisticImage: bookCoverImage,
      manuscriptPdf: manuscriptPdf || undefined,
      trailerMovie: trailerMovie || undefined,
      episodesPdf: episodesPdf || undefined,
    };
  }

  if (typeChoice.value === "work-to-series-adaptation") {
    const workPdf = await chooseScopedAsset(rl, {
      title: "Work PDF",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: pdfExtensions,
      fallbackRelative: "work.pdf",
      optional: false,
    });

    const seriesMovie = await chooseScopedAsset(rl, {
      title: "Series adaptation video",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: videoExtensions,
      fallbackRelative: "series.mp4",
      optional: true,
    });

    const pagerOptionImage = await chooseScopedAsset(rl, {
      title: "Optional pager cover image",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: imageExtensions,
      fallbackRelative: "cover.png",
      optional: true,
    });

    return {
      ...base,
      realisticImage: pagerOptionImage || "/personal/images/personal/placeholder.png",
      workPdf,
      seriesMovie: seriesMovie || undefined,
      pagerOptionImage: pagerOptionImage || undefined,
    };
  }

  if (typeChoice.value === "palmylyzer-pro") {
    const rawImage = await chooseScopedAsset(rl, {
      title: "Raw palm image",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: imageExtensions,
      fallbackRelative: "raw.png",
      optional: false,
    });

    const analyzedImage = await chooseScopedAsset(rl, {
      title: "Analyzed palm image",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: imageExtensions,
      fallbackRelative: "analyzed.png",
      optional: true,
    });

    const palmLineAnalysisImage = await chooseScopedAsset(rl, {
      title: "Palm line map image",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: imageExtensions,
      fallbackRelative: "map.png",
      optional: true,
    });

    const palmReadingMarkdownPath = await chooseScopedAsset(rl, {
      title: "Optional reading markdown",
      scopeAbsDir: scopeDir,
      webBase,
      extensions: markdownExtensions,
      fallbackRelative: "reading.md",
      optional: true,
    });

    return {
      ...base,
      realisticImage: rawImage,
      rawImage,
      analyzedImage: analyzedImage || undefined,
      palmLineAnalysisImage: palmLineAnalysisImage || undefined,
      palmReadingMarkdownPath: palmReadingMarkdownPath || undefined,
    };
  }

  const songAlbumImage = await chooseScopedAsset(rl, {
    title: "Album artwork",
    scopeAbsDir: scopeDir,
    webBase,
    extensions: imageExtensions,
    fallbackRelative: "album.png",
    optional: false,
  });

  const songAudio = await chooseScopedAsset(rl, {
    title: "Song audio file",
    scopeAbsDir: scopeDir,
    webBase,
    extensions: audioExtensions,
    fallbackRelative: "song.mp3",
    optional: true,
  });

  const songLyricsMarkdownPath = await chooseScopedAsset(rl, {
    title: "Optional lyrics markdown",
    scopeAbsDir: scopeDir,
    webBase,
    extensions: markdownExtensions,
    fallbackRelative: "lyrics.md",
    optional: true,
  });

  return {
    ...base,
    realisticImage: songAlbumImage,
    songAlbumImage,
    songAudio: songAudio || undefined,
    songLyricsMarkdownPath: songLyricsMarkdownPath || undefined,
  };
}

async function promptExperienceEntry(
  rl: WizardReadline,
  current: ExperienceEntry | null = null,
): Promise<ExperienceEntry> {
  const base = current || defaultExperienceTemplate();

  const company = await askText(rl, "Company", {
    defaultValue: base.company,
    required: true,
  });
  const position = await askText(rl, "Position", {
    defaultValue: base.position,
    required: true,
  });
  const location = await askText(rl, "Location", {
    defaultValue: base.location,
  });
  const start = await askText(rl, "Start date label", {
    defaultValue: base.start,
    required: true,
  });
  const end = await askText(rl, "End date label", {
    defaultValue: base.end || "Present",
  });

  const detailsInput = await askText(
    rl,
    "Details (separate items with |)",
    {
      defaultValue: (base.details || []).join(" | "),
      required: true,
    },
  );

  const image = await askText(
    rl,
    "Image path (example: /personal/images/employers/company-logo.png)",
    {
      defaultValue: base.image || "/personal/images/employers/company-logo.png",
      required: true,
    },
  );

  return {
    company,
    position,
    location,
    start,
    end,
    details: detailsInput
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean),
    image: withLeadingSlash(image.trim()),
  };
}

async function promptEducationEntry(
  rl: WizardReadline,
  current: EducationEntry | null = null,
): Promise<EducationEntry> {
  const base = current || defaultEducationTemplate();
  const school = await askText(rl, "School", {
    defaultValue: base.school,
    required: true,
  });
  const degree = await askText(rl, "Degree", {
    defaultValue: base.degree,
    required: true,
  });
  const year = await askText(rl, "Year", {
    defaultValue: base.year,
    required: true,
  });
  const awardsInput = await askText(rl, "Awards (comma-separated)", {
    defaultValue: (base.awards || []).join(", "),
  });
  const image = await askText(
    rl,
    "Image path (example: /personal/images/personal/education-logo.png)",
    {
      defaultValue:
        base.image || "/personal/images/personal/education-logo.png",
      required: true,
    },
  );

  return {
    school,
    degree,
    year,
    awards: parseCommaList(awardsInput),
    image: withLeadingSlash(image),
  };
}

async function promptRecognitionSnippet(
  rl: WizardReadline,
  current = "",
): Promise<string> {
  return askText(rl, "Recognition snippet", {
    defaultValue: current || defaultRecognitionSnippetTemplate(),
    required: true,
  });
}

async function promptRecommendationEntry(
  rl: WizardReadline,
  current: RecommendationEntry | null = null,
): Promise<RecommendationEntry> {
  const base = current || defaultRecommendationTemplate();
  const name = await askText(rl, "Name", {
    defaultValue: base.name,
    required: true,
  });
  const title = await askText(rl, "Title", {
    defaultValue: base.title,
    required: true,
  });
  const date = await askText(rl, "Date label", {
    defaultValue: base.date,
    required: true,
  });
  const relationship = await askText(rl, "Relationship label", {
    defaultValue: base.relationship,
    required: true,
  });
  const imageSrcUrl = await askText(
    rl,
    "Image path (optional, example: /personal/images/colleagues/colleague.jpeg)",
    {
      defaultValue: base.imageSrcUrl || "",
      required: false,
    },
  );
  const text = await askText(rl, "Recommendation text", {
    defaultValue: base.text,
    required: true,
  });

  return {
    name,
    title,
    date,
    relationship,
    imageSrcUrl: imageSrcUrl.trim() ? withLeadingSlash(imageSrcUrl.trim()) : undefined,
    text,
  };
}

async function promptCompetencyCategoryEntry(
  rl: WizardReadline,
  current: CompetencyCategoryEntry | null = null,
): Promise<CompetencyCategoryEntry> {
  const base = current || defaultCompetencyCategoryTemplate();
  const title = await askText(rl, "Category title", {
    defaultValue: base.title,
    required: true,
  });

  const subtitle = await askText(rl, "Pager subtitle / short text", {
    defaultValue: base.shortText || base.subTitle || "",
    required: true,
  });

  const defaultIconIndex = Math.max(
    0,
    competencyOptionIconChoices.findIndex(
      (choice) => choice.value === (base.icon || ""),
    ),
  );
  const iconChoice = await chooseOne(
    rl,
    "Icon key for this competency category",
    competencyOptionIconChoices,
    defaultIconIndex,
  );
  const icon =
    iconChoice.value === "__custom__"
      ? await askText(rl, "Custom icon key", {
          defaultValue: base.icon || "category",
          required: true,
        })
      : iconChoice.value;

  const itemsInput = await askText(
    rl,
    "Skills (label::description separated with |)",
    {
      defaultValue: serializeCompetencyItems(base.items),
      required: true,
    },
  );

  return {
    ...base,
    title,
    icon,
    shortText: subtitle,
    subTitle: subtitle,
    items: parseCompetencyItems(itemsInput),
  };
}

async function promptMetadataValue(
  rl: WizardReadline,
  currentValue: unknown,
): Promise<unknown> {
  const currentType = Array.isArray(currentValue)
    ? "array"
    : currentValue === null
      ? "null"
      : typeof currentValue === "object"
        ? "object"
        : typeof currentValue;

  const valueType = await chooseOne(
    rl,
    "Value type",
    [
      { label: "String", value: "string" },
      { label: "Number", value: "number" },
      { label: "Boolean", value: "boolean" },
      { label: "Null", value: "null" },
      { label: "Object (JSON)", value: "object" },
      { label: "Array (JSON)", value: "array" },
    ],
    ["string", "number", "boolean", "null", "object", "array"].indexOf(
      currentType,
    ) >= 0
      ? ["string", "number", "boolean", "null", "object", "array"].indexOf(
        currentType,
      )
      : 0,
  );

  if (valueType.value === "string") {
    const defaultValue =
      typeof currentValue === "string" ? currentValue : String(currentValue ?? "");
    return askText(rl, "String value", { defaultValue, required: true });
  }

  if (valueType.value === "number") {
    for (;;) {
      const candidate = await askText(rl, "Number value", {
        defaultValue:
          typeof currentValue === "number" ? String(currentValue) : "0",
        required: true,
      });
      const parsed = Number(candidate);
      if (!Number.isFinite(parsed)) {
        writeError("Please provide a valid number.");
        continue;
      }
      return parsed;
    }
  }

  if (valueType.value === "boolean") {
    return askYesNo(
      rl,
      "Boolean value",
      typeof currentValue === "boolean" ? currentValue : false,
    );
  }

  if (valueType.value === "null") {
    return null;
  }

  for (;;) {
    const defaultJson =
      valueType.value === "array"
        ? Array.isArray(currentValue)
          ? JSON.stringify(currentValue)
          : "[]"
        : isPlainObject(currentValue)
          ? JSON.stringify(currentValue)
          : "{}";
    const inputJson = await askText(rl, "JSON value", {
      defaultValue: defaultJson,
      required: true,
    });
    try {
      const parsed = JSON.parse(inputJson);
      if (valueType.value === "array" && !Array.isArray(parsed)) {
        writeError("Expected a JSON array.");
        continue;
      }
      if (valueType.value === "object" && !isPlainObject(parsed)) {
        writeError("Expected a JSON object.");
        continue;
      }
      return parsed;
    } catch {
      writeError("Invalid JSON. Please try again.");
    }
  }
}

async function handleMetadataEditor(
  rl: WizardReadline,
  resumeData: ResumeData,
): Promise<void> {
  const operation = await chooseOne(
    rl,
    "Metadata editor",
    [
      {
        label: "View value at path",
        value: "view",
        description: "Inspect any nested value in resumeData.json.",
      },
      {
        label: "Set or replace value at path",
        value: "set",
        description: "Create missing path segments as needed.",
      },
      {
        label: "Delete value at path",
        value: "delete",
        description: "Deletes object keys or removes array items by index.",
      },
      { label: "Back", value: "back" },
    ],
    0,
  );

  if (operation.value === "back") {
    return;
  }

  writeInfo(
    `Top-level keys: ${Object.keys(resumeData)
      .sort((left, right) => left.localeCompare(right))
      .join(", ")}`,
  );

  const pathInput = await askText(
    rl,
    "Metadata path (e.g. summary.title or projects[0].href)",
    { required: true },
  );
  const segments = parseMetadataPath(pathInput);

  if (!segments.length) {
    writeError("Invalid path.");
    return;
  }

  if (operation.value === "view") {
    const value = getValueAtPath(resumeData, segments);
    if (value === undefined) {
      writeWarning("No value found at that path.");
      return;
    }
    writeLine();
    writeInfo(`Current value at ${pathInput}:`);
    writeLine(formatValueForDisplay(value));
    return;
  }

  if (operation.value === "set") {
    const currentValue = getValueAtPath(resumeData, segments);
    writeLine();
    writeInfo(`Current value at ${pathInput}:`);
    writeLine(formatValueForDisplay(currentValue));
    const nextValue = await promptMetadataValue(rl, currentValue);
    const didSet = setValueAtPath(resumeData, segments, nextValue);
    if (!didSet) {
      writeError("Unable to set value at that path.");
      return;
    }
    writeSuccess(`Updated ${pathInput}.`);
    return;
  }

  const currentValue = getValueAtPath(resumeData, segments);
  if (currentValue === undefined) {
    writeWarning("No value found at that path.");
    return;
  }
  writeLine();
  writeInfo(`Current value at ${pathInput}:`);
  writeLine(formatValueForDisplay(currentValue));
  const confirmDelete = await askYesNo(
    rl,
    `Delete value at ${pathInput}?`,
    false,
  );
  if (!confirmDelete) {
    writeWarning("Delete canceled.");
    return;
  }

  const didDelete = deleteValueAtPath(resumeData, segments);
  if (!didDelete) {
    writeError("Unable to delete value at that path.");
    return;
  }
  writeSuccess(`Deleted ${pathInput}.`);
}

async function handleAppAssetOrganizer(
  rl: WizardReadline,
  resumeData: ResumeData,
): Promise<void> {
  const slug = await askText(rl, "Target app slug (kebab-case)", {
    required: true,
    transform: normalizeSlug,
  });

  const sourceInput = await askText(
    rl,
    "Source file path (relative to public/ or absolute path under public)",
    { required: true },
  );

  const sourcePath = resolvePublicPath(sourceInput);
  if (!sourcePath) {
    writeError("Invalid source path. It must resolve inside public/.");
    return;
  }

  if (!(await pathExists(sourcePath.absPath))) {
    writeError(`Source does not exist: ${sourcePath.absPath}`);
    return;
  }

  const sourceStat = await fs.stat(sourcePath.absPath);
  if (!sourceStat.isFile()) {
    writeError("Source path must point to a file.");
    return;
  }

  const ext = path.extname(sourcePath.absPath).toLowerCase();
  const inferredBucket = inferAppAssetBucket(ext);
  const bucketChoice = await chooseOne<AppAssetBucket | "auto">(
    rl,
    `Destination bucket for ${sourcePath.relPath}`,
    [
      { label: `Auto (${inferredBucket})`, value: "auto" },
      { label: "images", value: "images" },
      { label: "videos", value: "videos" },
      { label: "audio", value: "audio" },
      { label: "pdfs", value: "pdfs" },
      { label: "markdown", value: "markdown" },
      { label: "js", value: "js" },
      { label: "wasm", value: "wasm" },
      { label: "data", value: "data" },
      { label: "assets", value: "assets" },
    ],
    0,
  );

  const bucket = bucketChoice.value === "auto" ? inferredBucket : bucketChoice.value;
  const targetFileName = await askText(rl, "Destination file name", {
    defaultValue: path.basename(sourcePath.relPath),
    required: true,
  });
  const appFolders = await ensureScopedFoldersForAppAssets(slug);
  const destinationAbsPath = path.join(appFolders[bucket], targetFileName);
  const destinationRelPath = toPosix(path.relative(publicDir, destinationAbsPath));
  const destinationWebPath = withLeadingSlash(destinationRelPath);

  if (destinationRelPath === sourcePath.relPath) {
    writeWarning("Source and destination are the same path. Nothing to move.");
    return;
  }

  if (await pathExists(destinationAbsPath)) {
    const shouldOverwrite = await askYesNo(
      rl,
      `Destination exists (${destinationRelPath}). Overwrite?`,
      false,
    );
    if (!shouldOverwrite) {
      writeWarning("Move canceled.");
      return;
    }
    await fs.rm(destinationAbsPath, { force: true });
  }

  await ensureDir(path.dirname(destinationAbsPath));
  await moveFileSafely(sourcePath.absPath, destinationAbsPath);
  writeSuccess(`Moved ${sourcePath.relPath} -> ${destinationRelPath}`);

  const shouldUpdateReferences = await askYesNo(
    rl,
    "Update matching paths in resumeData.json?",
    true,
  );
  if (!shouldUpdateReferences) {
    return;
  }

  const replacementCount = replacePathReferencesInObject(
    resumeData,
    sourcePath.webPath,
    destinationWebPath,
  );

  if (!replacementCount) {
    writeWarning("No matching references were found in resumeData.json.");
    return;
  }

  writeSuccess(
    `Updated ${replacementCount} path reference${replacementCount === 1 ? "" : "s"} in resumeData.json.`,
  );
}

async function runInitMode(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    writeSection("Portfolio initializer");
    writeInfo(
      "This will clear public/apps and personal media/data folders, reset favicon, and rebuild starter resume/project data.",
    );

    const confirmed = await askYesNo(
      rl,
      "Proceed with destructive init reset?",
      false,
    );

    if (!confirmed) {
      writeWarning("Init canceled.");
      return;
    }

    const resumeData = await readJson<ResumeData>(resumeDataPath);

    const fullName = await askText(rl, "Your name", {
      defaultValue: "Your Name",
      required: true,
    });
    const professionalTitle = await askText(rl, "Professional title", {
      defaultValue: "Senior Full-stack Engineer",
      required: true,
    });
    const location = await askText(rl, "Location", {
      defaultValue: "Your City, ST",
      required: true,
    });
    const email = await askText(rl, "Email", {
      defaultValue: "you@example.com",
      required: true,
    });
    const linkedin = await askText(rl, "LinkedIn URL", {
      defaultValue: "https://www.linkedin.com/in/your-profile",
      required: true,
    });
    const githubInput = await askText(rl, "GitHub URLs (comma-separated)", {
      defaultValue: "https://github.com/your-handle",
      required: true,
    });

    const projectCountInput = await askText(
      rl,
      "How many starter projects do you want to scaffold?",
      {
        defaultValue: "1",
        required: true,
      },
    );
    const shenaniganCountInput = await askText(
      rl,
      "How many AI shenanigans do you want to scaffold?",
      {
        defaultValue: "1",
        required: true,
      },
    );

    const projectCount = Math.max(0, Number.parseInt(projectCountInput, 10) || 0);
    const shenaniganCount = Math.max(
      0,
      Number.parseInt(shenaniganCountInput, 10) || 0,
    );

    await clearInitAssets();
    await replaceFaviconWithDefault();

    const newProjects: ProjectEntry[] = [];
    const navRoutes: NavigationRoute[] = [];

    for (let idx = 0; idx < projectCount; idx += 1) {
      writeInfo(`Configuring project ${idx + 1} of ${projectCount}`);
      const config = await promptProject(rl);
      newProjects.push(config.project);
      navRoutes.push({ label: config.name, href: `/${config.slug}` });

      if (config.generateRoute) {
        await createProjectRouteSkeleton(rl, config.slug, config.name);
      }
    }

    const newShenanigans: ShenaniganEntry[] = [];
    for (let idx = 0; idx < shenaniganCount; idx += 1) {
      writeInfo(`Configuring shenanigan ${idx + 1} of ${shenaniganCount}`);
      const shenanigan = await promptShenanigan(rl);
      newShenanigans.push(shenanigan);
    }

    if (!newProjects.length) {
      const fallbackDiagrams = defaultProjectDiagrams("Starter Project");
      newProjects.push({
        name: "Starter Project",
        description: "A starter project entry created by init.",
        href: "/starter-project",
        type: "personal",
        interestsMeWhy:
          "Use this placeholder to map your own project story and architecture.",
        watermark: null,
        project: "Starter Project",
        specifications: {
          overview: "Replace with your project architecture notes.",
        },
        technologiesUsed: [{ name: "Next.js" }, { name: "TypeScript" }],
        blockDiagram: fallbackDiagrams.blockDiagram,
        componentDiagram: fallbackDiagrams.componentDiagram,
        sequenceDiagram: fallbackDiagrams.sequenceDiagram,
      });
      navRoutes.push({ label: "Starter Project", href: "/starter-project" });
    }

    if (!newShenanigans.length) {
      const fallbackSlug = "starter-shenanigan";
      await ensureScopedFolderForShenanigan(fallbackSlug);
      newShenanigans.push({
        type: "default",
        slug: fallbackSlug,
        title: "Starter Shenanigan",
        shortText: "Replace with your own AI media sequence.",
        blurb:
          "A starter shenanigan entry. Add real assets in public/personal/images/ai-shenanigans/starter-shenanigan and then run npm run update.",
        realisticImage:
          "/personal/images/ai-shenanigans/starter-shenanigan/realistic.png",
        stylizedRendering:
          "/personal/images/ai-shenanigans/starter-shenanigan/stylized.png",
        movieRendering:
          "/personal/images/ai-shenanigans/starter-shenanigan/movie.mp4",
      });
    }

    const githubLinks = parseCommaList(githubInput);

    resumeData.summary = {
      ...(resumeData.summary || {}),
      name: fullName,
      title: professionalTitle,
      heroOverline: professionalTitle,
      documentTitle: `${fullName} | Portfolio`,
      metadataTitle: `${fullName} | Portfolio`,
      metadataDescription:
        "Portfolio for a software engineer building full-stack and AI-enabled products.",
      location,
      avatarImage: "/personal/images/personal/avatar.jpg",
      headshotImage: "/personal/images/personal/headshot.jpg",
      resumeUrl: "/personal/pdfs/resume.pdf",
      contact: {
        linkedin,
        email,
        github: githubLinks.length ? githubLinks : ["https://github.com/your-handle"],
      },
      gutter: [
        "Full-stack engineer who ships production systems across frontend, backend, and AI workflows.",
        "Comfortable translating ambiguity into clear product direction and maintainable implementation.",
        "Focused on practical architecture, developer experience, and measurable outcomes.",
      ],
    };

    resumeData.contactCTA = {
      ...(resumeData.contactCTA || {}),
      title: "Contact",
      body: "Open to impactful software engineering opportunities.",
      primaryLabel: "Email",
      secondaryLabel: "LinkedIn",
    };

    resumeData.hobbies = {
      title: "Hobbies",
      introText:
        "Outside of work, I enjoy creative experiments, building side projects, and exploring new tools.",
      items: ["Photography", "Storytelling", "Learning", "Fitness"],
      heroImageUrl: "/personal/images/personal/hobbies-hero.png",
      heroVideoUrl: null,
    };

    resumeData.aiShenanigans = {
      ...(resumeData.aiShenanigans || {}),
      title: "AI Shenanigans",
      subtitle:
        "A mixed-media AI storytelling lab: source media, stylized transformation, and adaptation-ready narrative experiments.",
      items: newShenanigans,
    };

    resumeData.projects = newProjects;

    resumeData.experience = [defaultExperienceTemplate()];
    resumeData.education = [defaultEducationTemplate()];
    resumeData.recognition = {
      snippets: [
        "Customize this section with impact metrics, awards, or external recognition.",
      ],
      recommendations: [],
    };

    ensureNavigationItems(resumeData, navRoutes);

    resumeData.projectsSection = {
      ...(resumeData.projectsSection || {}),
      title: "Projects",
      descriptionLines: [
        "Explore selected projects and AI experiments.",
        "Use npm run update to add or edit entries.",
      ],
    };

    await writeJson(resumeDataPath, resumeData);

    writeLine();
    writeSuccess("Init complete.");
    writeInfo(
      "Run npm run update any time to add/edit projects, shenanigans, and resume entries.",
    );
    writeInfo("Hint: place app assets in public/apps/<slug>/(images|videos).");
    writeInfo(
      "Hint: place shenanigan assets in public/personal/images/ai-shenanigans/<slug>.",
    );
  } finally {
    rl.close();
  }
}

async function runUpdateMode(): Promise<void> {
  const rl = readline.createInterface({ input, output });
  try {
    writeSection("Portfolio updater");
    const resumeData = await readJson<ResumeData>(resumeDataPath);
    const projects: ProjectEntry[] = Array.isArray(resumeData.projects)
      ? (resumeData.projects as ProjectEntry[])
      : [];
    const shenanigans: ShenaniganEntry[] = Array.isArray(resumeData.aiShenanigans?.items)
      ? resumeData.aiShenanigans.items
      : [];
    const experience: ExperienceEntry[] = Array.isArray(resumeData.experience)
      ? (resumeData.experience as ExperienceEntry[])
      : [];
    const education: EducationEntry[] = Array.isArray(resumeData.education)
      ? (resumeData.education as EducationEntry[])
      : [];
    const recognition: RecognitionData =
      resumeData.recognition && typeof resumeData.recognition === "object"
      ? resumeData.recognition
      : {};
    const competenciesData: CompetenciesData =
      resumeData.competencies && typeof resumeData.competencies === "object"
      ? resumeData.competencies
      : {};
    const competencyCategories: CompetencyCategoryEntry[] = Array.isArray(
      competenciesData.categories,
    )
      ? (competenciesData.categories as CompetencyCategoryEntry[])
      : [];
    const recognitionSnippets: string[] = Array.isArray(recognition.snippets)
      ? (recognition.snippets as string[])
      : [];
    const recommendations: RecommendationEntry[] = Array.isArray(
      recognition.recommendations,
    )
      ? (recognition.recommendations as RecommendationEntry[])
      : [];

    let keepRunning = true;

    while (keepRunning) {
      const action = await chooseOne(
        rl,
        "What would you like to update?",
        [
          {
            label: "Add or replace a project",
            value: "project",
            description: "Creates app folders and optional route skeleton.",
          },
          {
            label: "Add or replace an AI shenanigan",
            value: "shenanigan",
            description: "Uses type-aware prompts and scoped media paths.",
          },
          {
            label: "Experience (add/edit/remove)",
            value: "experience",
            description: "Manage timeline entries.",
          },
          {
            label: "Education (add/edit/remove)",
            value: "education",
            description: "Manage education entries.",
          },
          {
            label: "Edit summary/contact basics",
            value: "summary",
            description: "Name, title, location, and contact links.",
          },
          {
            label: "Recognition snippets (add/edit/remove)",
            value: "recognition",
            description: "Manage the short recognition highlight cards.",
          },
          {
            label: "Recommendations (add/edit/remove)",
            value: "recommendations",
            description: "Manage recommendation/testimonial entries.",
          },
          {
            label: "Core competencies (add/edit/remove categories)",
            value: "competencies",
            description: "Manage competency category titles, icons, subtitles, and skills.",
          },
          {
            label: "Edit any resumeData metadata (path editor)",
            value: "metadata",
            description: "View/set/delete any nested key in resumeData.json.",
          },
          {
            label: "Organize app assets into /public/apps/<slug>",
            value: "assets",
            description: "Move files (including js/wasm) and optionally update references.",
          },
          {
            label: "Save and exit",
            value: "save",
          },
        ],
        0,
      );

      if (action.value === "project") {
        const config = await promptProject(rl);
        upsertProject(projects, config.project);
        if (config.generateRoute) {
          await createProjectRouteSkeleton(rl, config.slug, config.name);
        }
        writeSuccess(`Saved project ${config.project.name}.`);
      }

      if (action.value === "shenanigan") {
        const shenanigan = await promptShenanigan(rl);
        upsertShenanigan(shenanigans, shenanigan);
        writeSuccess(`Saved shenanigan ${shenanigan.title}.`);
      }

      if (action.value === "experience") {
        const nextAction = await chooseOne(
          rl,
          "Experience action",
          [
            { label: "Add experience entry", value: "add" },
            { label: "Edit existing entry", value: "edit" },
            { label: "Remove entry", value: "remove" },
            { label: "Back", value: "back" },
          ],
          0,
        );

        if (nextAction.value === "add") {
          const entry = await promptExperienceEntry(rl);
          experience.push(entry);
          writeSuccess("Experience entry added.");
        }

        if (nextAction.value === "edit") {
          if (!experience.length) {
            writeWarning("No experience entries to edit.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select experience entry",
              experience.map(
                (item, idx) => `${idx + 1}. ${item.company} — ${item.position}`,
              ),
            );
            experience[index] = await promptExperienceEntry(rl, experience[index]);
            writeSuccess("Experience entry updated.");
          }
        }

        if (nextAction.value === "remove") {
          if (!experience.length) {
            writeWarning("No experience entries to remove.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select experience entry to remove",
              experience.map(
                (item, idx) => `${idx + 1}. ${item.company} — ${item.position}`,
              ),
            );
            experience.splice(index, 1);
            writeSuccess("Experience entry removed.");
          }
        }
      }

      if (action.value === "education") {
        const nextAction = await chooseOne(
          rl,
          "Education action",
          [
            { label: "Add education entry", value: "add" },
            { label: "Edit existing entry", value: "edit" },
            { label: "Remove entry", value: "remove" },
            { label: "Back", value: "back" },
          ],
          0,
        );

        if (nextAction.value === "add") {
          const entry = await promptEducationEntry(rl);
          education.push(entry);
          writeSuccess("Education entry added.");
        }

        if (nextAction.value === "edit") {
          if (!education.length) {
            writeWarning("No education entries to edit.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select education entry",
              education.map(
                (item, idx) => `${idx + 1}. ${item.school} — ${item.degree}`,
              ),
            );
            education[index] = await promptEducationEntry(rl, education[index]);
            writeSuccess("Education entry updated.");
          }
        }

        if (nextAction.value === "remove") {
          if (!education.length) {
            writeWarning("No education entries to remove.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select education entry to remove",
              education.map(
                (item, idx) => `${idx + 1}. ${item.school} — ${item.degree}`,
              ),
            );
            education.splice(index, 1);
            writeSuccess("Education entry removed.");
          }
        }
      }

      if (action.value === "summary") {
        const summary: SummaryData = resumeData.summary || {};
        summary.name = await askText(rl, "Name", {
          defaultValue: summary.name || "Your Name",
          required: true,
        });
        summary.title = await askText(rl, "Title", {
          defaultValue: summary.title || "Senior Full-stack Engineer",
          required: true,
        });
        summary.location = await askText(rl, "Location", {
          defaultValue: summary.location || "Your City, ST",
          required: true,
        });

        const currentContact: ContactInfo = summary.contact || {};
        currentContact.email = await askText(rl, "Email", {
          defaultValue: currentContact.email || "you@example.com",
          required: true,
        });
        currentContact.linkedin = await askText(rl, "LinkedIn URL", {
          defaultValue:
            currentContact.linkedin || "https://www.linkedin.com/in/your-profile",
          required: true,
        });
        const github = await askText(rl, "GitHub URLs (comma-separated)", {
          defaultValue: Array.isArray(currentContact.github)
            ? currentContact.github.join(", ")
            : "https://github.com/your-handle",
          required: true,
        });
        currentContact.github = parseCommaList(github);

        summary.contact = currentContact;
        summary.heroOverline = summary.title;
        summary.documentTitle = `${summary.name} | Portfolio`;
        summary.metadataTitle = `${summary.name} | Portfolio`;
        resumeData.summary = summary;

        writeSuccess("Summary/contact updated.");
      }

      if (action.value === "recognition") {
        const nextAction = await chooseOne(
          rl,
          "Recognition snippet action",
          [
            { label: "Add snippet", value: "add" },
            { label: "Edit existing snippet", value: "edit" },
            { label: "Remove snippet", value: "remove" },
            { label: "Back", value: "back" },
          ],
          0,
        );

        if (nextAction.value === "add") {
          const snippet = await promptRecognitionSnippet(rl);
          recognitionSnippets.push(snippet);
          writeSuccess("Recognition snippet added.");
        }

        if (nextAction.value === "edit") {
          if (!recognitionSnippets.length) {
            writeWarning("No recognition snippets to edit.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select recognition snippet",
              recognitionSnippets.map((snippet, idx) => {
                const preview =
                  snippet.length > 80 ? `${snippet.slice(0, 80)}...` : snippet;
                return `${idx + 1}. ${preview}`;
              }),
            );
            recognitionSnippets[index] = await promptRecognitionSnippet(
              rl,
              recognitionSnippets[index],
            );
            writeSuccess("Recognition snippet updated.");
          }
        }

        if (nextAction.value === "remove") {
          if (!recognitionSnippets.length) {
            writeWarning("No recognition snippets to remove.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select recognition snippet to remove",
              recognitionSnippets.map((snippet, idx) => {
                const preview =
                  snippet.length > 80 ? `${snippet.slice(0, 80)}...` : snippet;
                return `${idx + 1}. ${preview}`;
              }),
            );
            recognitionSnippets.splice(index, 1);
            writeSuccess("Recognition snippet removed.");
          }
        }
      }

      if (action.value === "recommendations") {
        const nextAction = await chooseOne(
          rl,
          "Recommendation action",
          [
            { label: "Add recommendation", value: "add" },
            { label: "Edit existing recommendation", value: "edit" },
            { label: "Remove recommendation", value: "remove" },
            { label: "Back", value: "back" },
          ],
          0,
        );

        if (nextAction.value === "add") {
          const entry = await promptRecommendationEntry(rl);
          recommendations.push(entry);
          writeSuccess("Recommendation added.");
        }

        if (nextAction.value === "edit") {
          if (!recommendations.length) {
            writeWarning("No recommendations to edit.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select recommendation",
              recommendations.map(
                (item, idx) =>
                  `${idx + 1}. ${item.name || "Unknown"} — ${item.title || "No title"} (${item.date || "No date"})`,
              ),
            );
            recommendations[index] = await promptRecommendationEntry(
              rl,
              recommendations[index],
            );
            writeSuccess("Recommendation updated.");
          }
        }

        if (nextAction.value === "remove") {
          if (!recommendations.length) {
            writeWarning("No recommendations to remove.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select recommendation to remove",
              recommendations.map(
                (item, idx) =>
                  `${idx + 1}. ${item.name || "Unknown"} — ${item.title || "No title"} (${item.date || "No date"})`,
              ),
            );
            recommendations.splice(index, 1);
            writeSuccess("Recommendation removed.");
          }
        }
      }

      if (action.value === "competencies") {
        const nextAction = await chooseOne(
          rl,
          "Core competencies action",
          [
            { label: "Add competency category", value: "add" },
            { label: "Edit existing category", value: "edit" },
            { label: "Remove category", value: "remove" },
            { label: "Back", value: "back" },
          ],
          0,
        );

        if (nextAction.value === "add") {
          const category = await promptCompetencyCategoryEntry(rl);
          competencyCategories.push(category);
          writeSuccess("Competency category added.");
        }

        if (nextAction.value === "edit") {
          if (!competencyCategories.length) {
            writeWarning("No competency categories to edit.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select competency category",
              competencyCategories.map(
                (item, idx) =>
                  `${idx + 1}. ${item.title} (${item.items?.length || 0} skills)`,
              ),
            );
            competencyCategories[index] = await promptCompetencyCategoryEntry(
              rl,
              competencyCategories[index],
            );
            writeSuccess("Competency category updated.");
          }
        }

        if (nextAction.value === "remove") {
          if (!competencyCategories.length) {
            writeWarning("No competency categories to remove.");
          } else {
            const index = await chooseIndex(
              rl,
              "Select competency category to remove",
              competencyCategories.map(
                (item, idx) =>
                  `${idx + 1}. ${item.title} (${item.items?.length || 0} skills)`,
              ),
            );
            competencyCategories.splice(index, 1);
            writeSuccess("Competency category removed.");
          }
        }
      }

      if (action.value === "metadata") {
        await handleMetadataEditor(rl, resumeData);
      }

      if (action.value === "assets") {
        await handleAppAssetOrganizer(rl, resumeData);
      }

      if (action.value === "save") {
        keepRunning = false;
      }
    }

    resumeData.projects = projects;
    resumeData.experience = experience;
    resumeData.education = education;
    resumeData.aiShenanigans = {
      ...(resumeData.aiShenanigans || {}),
      items: shenanigans,
    };
    resumeData.recognition = {
      ...(resumeData.recognition || {}),
      snippets: recognitionSnippets,
      recommendations,
    };
    resumeData.competencies = {
      ...(resumeData.competencies || {}),
      ...competenciesData,
      categories: competencyCategories,
    };

    const navRoutes = projects.map((project) => ({
      label: project.name,
      href: project.href,
    }));
    ensureNavigationItems(resumeData, navRoutes);

    await writeJson(resumeDataPath, resumeData);

    writeLine();
    writeSuccess("Update complete.");
    writeInfo(
      "Hint: if asset pick-lists are empty, move files into scoped folders first.",
    );
  } finally {
    rl.close();
  }
}

async function main(): Promise<void> {
  const mode = (process.argv[2] || "").trim().toLowerCase();

  if (!mode || (mode !== "init" && mode !== "update")) {
    writeError("Usage: node scripts/portfolio-setup.mjs <init|update>");
    process.exitCode = 1;
    return;
  }

  if (!(await pathExists(resumeDataPath))) {
    writeError(`Missing required file: ${resumeDataPath}`);
    process.exitCode = 1;
    return;
  }

  if (mode === "init") {
    await runInitMode();
    return;
  }

  await runUpdateMode();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
