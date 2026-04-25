import type { MediaRenderTrackedType } from "@/types/observability/mediaRenderPerf";

export const MEDIA_RENDER_PERF_STORAGE_KEY = "portfolio:media-render-perf";

export const MEDIA_RENDER_FIRST_RENDER_BUDGET_MS: Record<MediaRenderTrackedType, number> = {
  image: 220,
  video: 300,
  pdf: 650,
  diagram: 520,
};
