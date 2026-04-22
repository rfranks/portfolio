import fs from "node:fs/promises";
import path from "node:path";
import { isPlainObject } from "./metadata-editor";

export type AppAssetBucket =
  | "images"
  | "videos"
  | "audio"
  | "pdfs"
  | "markdown"
  | "js"
  | "wasm"
  | "data"
  | "assets";

export function inferAppAssetBucket(
  ext: string,
  extensionSets: {
    imageExtensions: Set<string>;
    videoExtensions: Set<string>;
    audioExtensions: Set<string>;
    pdfExtensions: Set<string>;
    markdownExtensions: Set<string>;
    jsExtensions: Set<string>;
    wasmExtensions: Set<string>;
    dataExtensions: Set<string>;
  },
): AppAssetBucket {
  if (extensionSets.imageExtensions.has(ext)) {
    return "images";
  }
  if (extensionSets.videoExtensions.has(ext)) {
    return "videos";
  }
  if (extensionSets.audioExtensions.has(ext)) {
    return "audio";
  }
  if (extensionSets.pdfExtensions.has(ext)) {
    return "pdfs";
  }
  if (extensionSets.markdownExtensions.has(ext)) {
    return "markdown";
  }
  if (extensionSets.jsExtensions.has(ext)) {
    return "js";
  }
  if (extensionSets.wasmExtensions.has(ext)) {
    return "wasm";
  }
  if (extensionSets.dataExtensions.has(ext)) {
    return "data";
  }
  return "assets";
}

export function resolvePublicPath(
  inputPath: string,
  publicDir: string,
): {
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
    const relativePath = trimmed.replace(/^\/+/, "").split(path.sep).join("/").replace(/\/+/g, "/");
    if (!relativePath || relativePath.startsWith("..")) {
      return null;
    }
    absolutePath = path.resolve(publicDir, relativePath);
  }

  const normalizedAbs = path.resolve(absolutePath);
  const publicRoot = path.resolve(publicDir);
  const publicRootWithSep = `${publicRoot}${path.sep}`;
  if (normalizedAbs !== publicRoot && !normalizedAbs.startsWith(publicRootWithSep)) {
    return null;
  }

  const rel = path.relative(publicRoot, normalizedAbs).split(path.sep).join("/");
  if (!rel || rel.startsWith("..")) {
    return null;
  }

  return {
    absPath: normalizedAbs,
    relPath: rel,
    webPath: rel.startsWith("/") ? rel : `/${rel}`,
  };
}

export async function moveFileSafely(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    await fs.rename(sourcePath, destinationPath);
    return;
  } catch (error) {
    const isCrossDevice = isPlainObject(error) && "code" in error && error.code === "EXDEV";
    if (!isCrossDevice) {
      throw error;
    }
  }

  await fs.copyFile(sourcePath, destinationPath);
  await fs.rm(sourcePath);
}

export function replacePathReferencesInObject(
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
