/**
 * Base path prefix used when the app is deployed under a subdirectory.
 *
 * The value comes from the `NEXT_PUBLIC_BASE_PATH` environment variable. When
 * running locally this defaults to an empty string.
 */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Prefix a path with `BASE_PATH` so asset URLs resolve correctly both locally
 * and when deployed under a GitHub Pages style subpath.
 *
 * Absolute URLs (including protocol‑relative ones) are returned unchanged so
 * that external resources aren't accidentally prefixed with the local
 * deployment path.
 */
export function withBasePath(path: string): string {
  // Skip prefixing if the path is already an absolute URL like "http://"
  // or "mailto:" or a protocol-relative URL starting with "//".
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(path) || path.startsWith("//")) {
    return path;
  }

  const base = BASE_PATH.endsWith("/") ? BASE_PATH.slice(0, -1) : BASE_PATH;
  if (BASE_PATH && path.startsWith(BASE_PATH)) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
