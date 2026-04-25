export type MediaRenderTrackedType = "image" | "video" | "pdf" | "diagram";
export type MediaRenderPerfStatus = "pass" | "warn" | "fail" | "unknown";

export type MediaRenderTypeSnapshot = {
  mediaType: MediaRenderTrackedType;
  count: number;
  lastMs: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  budgetMs: number;
  status: MediaRenderPerfStatus;
  lastItemKey: string | null;
  lastRoute: string | null;
  lastRenderedAtIso: string | null;
};

export type MediaRenderPerfSnapshot = {
  generatedAt: string;
  entries: MediaRenderTypeSnapshot[];
};
