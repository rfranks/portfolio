import type * as React from "react";
import type {
  InteractiveViewportPreset,
  PanZoomTransformState,
  PanZoomViewportPreferences,
  PanZoomViewportSnapshot,
} from "@/types/hooks/panZoomViewport";

export function buildInteractiveViewportGridSx(params?: {
  enabled?: boolean;
  dotColor?: string;
  dotSizePx?: number;
  spacingPx?: number;
  backgroundColor?: string;
}): React.CSSProperties {
  const enabled = params?.enabled ?? false;
  if (!enabled) {
    return {
      backgroundColor: params?.backgroundColor ?? "#fff",
    };
  }

  const dotSizePx = Math.max(0.5, params?.dotSizePx ?? 2);
  const spacingPx = Math.max(4, params?.spacingPx ?? 30);
  const dotColor = params?.dotColor ?? "#cecece";

  return {
    backgroundColor: params?.backgroundColor ?? "#fff",
    backgroundImage: `radial-gradient(${dotColor} ${dotSizePx}px, transparent ${dotSizePx}px)`,
    backgroundSize: `${spacingPx}px ${spacingPx}px`,
  };
}

const clampNumber = (value: unknown, fallback: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return value;
};

export const normalizeViewportSnapshot = (raw: unknown): PanZoomViewportSnapshot | null => {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const candidate = raw as Partial<PanZoomViewportSnapshot> & {
    transform?: Partial<PanZoomTransformState>;
    preferences?: PanZoomViewportPreferences;
  };
  const transform = candidate.transform;
  if (!transform || typeof transform !== "object") {
    return null;
  }

  const preset: InteractiveViewportPreset = candidate.preset === "diagram" ? "diagram" : "media";
  const preferences =
    candidate.preferences && typeof candidate.preferences === "object" ? candidate.preferences : {};

  return {
    v: 1,
    preset,
    transform: {
      scale: clampNumber(transform.scale, 1),
      translateX: clampNumber(transform.translateX, 0),
      translateY: clampNumber(transform.translateY, 0),
    },
    preferences,
  };
};

const encodeBase64Url = (value: string): string => {
  const utf8 = encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, hex: string) =>
    String.fromCharCode(Number.parseInt(hex, 16)),
  );
  return window.btoa(utf8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const binary = window.atob(`${normalized}${padding}`);
  const escaped = Array.from(binary)
    .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`)
    .join("");
  return decodeURIComponent(escaped);
};

export const serializePanZoomViewportSnapshot = (state: PanZoomViewportSnapshot): string => {
  if (typeof window === "undefined") {
    return "";
  }
  return encodeBase64Url(JSON.stringify(state));
};

export const deserializePanZoomViewportSnapshot = (
  encoded: string,
): PanZoomViewportSnapshot | null => {
  if (!encoded || typeof window === "undefined") {
    return null;
  }
  try {
    const decoded = decodeBase64Url(encoded);
    const parsed = JSON.parse(decoded) as unknown;
    return normalizeViewportSnapshot(parsed);
  } catch {
    return null;
  }
};
