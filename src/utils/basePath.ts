const normalizeBasePath = (value: string | null | undefined): string => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === "/") {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash;

  return withoutTrailingSlash === "/" ? "" : withoutTrailingSlash;
};

const STATIC_BASE_PATH = normalizeBasePath(process.env.NEXT_PUBLIC_BASE_PATH);
let cachedRuntimeBasePath: string | null = null;

const inferBasePathFromAssetPath = (assetPath: string): string | null => {
  const marker = "/_next/";
  const markerIndex = assetPath.indexOf(marker);
  if (markerIndex < 0) {
    return null;
  }

  return normalizeBasePath(assetPath.slice(0, markerIndex));
};

const resolveBasePathFromRuntime = (): string => {
  if (typeof window === "undefined") {
    return STATIC_BASE_PATH;
  }

  if (cachedRuntimeBasePath !== null) {
    return cachedRuntimeBasePath;
  }

  if (STATIC_BASE_PATH) {
    cachedRuntimeBasePath = STATIC_BASE_PATH;
    return cachedRuntimeBasePath;
  }

  const nextData = (
    window as typeof window & {
      __NEXT_DATA__?: {
        assetPrefix?: string;
      };
      __NEXT_ROUTER_BASEPATH?: string;
    }
  ).__NEXT_DATA__;

  const fromNextData = normalizeBasePath(nextData?.assetPrefix);
  if (fromNextData) {
    cachedRuntimeBasePath = fromNextData;
    return cachedRuntimeBasePath;
  }

  const fromRouterBasePath = normalizeBasePath(
    (window as typeof window & { __NEXT_ROUTER_BASEPATH?: string }).__NEXT_ROUTER_BASEPATH,
  );
  if (fromRouterBasePath) {
    cachedRuntimeBasePath = fromRouterBasePath;
    return cachedRuntimeBasePath;
  }

  const assetNodes = document.querySelectorAll<HTMLScriptElement | HTMLLinkElement>(
    "script[src*='/_next/'],link[href*='/_next/']",
  );
  for (const node of assetNodes) {
    const candidateUrl = node instanceof HTMLScriptElement ? node.src : node.href;
    if (!candidateUrl) {
      continue;
    }

    try {
      const parsed = new URL(candidateUrl, window.location.origin);
      const inferred = inferBasePathFromAssetPath(parsed.pathname);
      if (inferred !== null) {
        cachedRuntimeBasePath = inferred;
        return cachedRuntimeBasePath;
      }
    } catch {
      // Skip invalid URLs and continue probing.
    }
  }

  const pathSegments = window.location.pathname.split("/").filter(Boolean);
  if (window.location.hostname.endsWith(".github.io") && pathSegments.length > 0) {
    cachedRuntimeBasePath = normalizeBasePath(`/${pathSegments[0]}`);
    return cachedRuntimeBasePath;
  }

  cachedRuntimeBasePath = "";
  return cachedRuntimeBasePath;
};

/**
 * Base path prefix used when the app is deployed under a subdirectory.
 *
 * This is the static build-time value from `NEXT_PUBLIC_BASE_PATH`.
 * For runtime-safe path joining, prefer `withBasePath()`.
 */
export const BASE_PATH = STATIC_BASE_PATH;

export function getBasePath(): string {
  return resolveBasePathFromRuntime();
}

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

  const base = getBasePath();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!base) {
    return normalizedPath;
  }

  if (path.startsWith("/") && (normalizedPath === base || normalizedPath.startsWith(`${base}/`))) {
    return normalizedPath;
  }

  return `${base}${normalizedPath}`;
}
