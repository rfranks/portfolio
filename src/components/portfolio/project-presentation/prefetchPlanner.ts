import type { SubsectionPagerItem } from "@/components/portfolio/layout/SubsectionPager";
import type {
  ProjectPresentationPrefetchPlan,
  ProjectPresentationSectionKey,
} from "@/types/components/portfolio";
import type { MediaCyclerMediaType } from "@/types/media/mediaCycler";

export type PrefetchNavigationDirection = "forward" | "backward" | "neutral";

const DEFAULT_SECTION_MEDIA_PREFETCH: Record<
  ProjectPresentationSectionKey,
  MediaCyclerMediaType[]
> = {
  overview: ["markdown", "image", "video"],
  why: ["markdown"],
  demo: ["video", "image"],
  technologies: ["markdown"],
  specifications: ["markdown", "pdf"],
  diagrams: ["diagram", "pdf"],
};

const dedupe = <T>(values: T[]): T[] => Array.from(new Set(values));

export function resolveLikelySectionKeys(args: {
  activeSectionKey: ProjectPresentationSectionKey;
  pagerItems: SubsectionPagerItem[];
  lookahead?: number;
  navigationDirection?: PrefetchNavigationDirection;
}): ProjectPresentationSectionKey[] {
  const { activeSectionKey, pagerItems, lookahead = 1, navigationDirection = "neutral" } = args;
  const keys = pagerItems.map((item) => item.key as ProjectPresentationSectionKey);
  if (keys.length === 0) {
    return [activeSectionKey];
  }

  const activeIndex = keys.findIndex((key) => key === activeSectionKey);
  if (activeIndex < 0) {
    return dedupe([activeSectionKey, ...keys.slice(0, Math.min(keys.length, lookahead + 1))]);
  }

  const candidates: ProjectPresentationSectionKey[] = [activeSectionKey];
  for (let offset = 1; offset <= lookahead; offset += 1) {
    const nextKey = keys[(activeIndex + offset) % keys.length];
    const previousKey = keys[(activeIndex - offset + keys.length) % keys.length];
    if (navigationDirection === "forward") {
      if (nextKey) {
        candidates.push(nextKey);
      }
      if (previousKey && offset > 1) {
        candidates.push(previousKey);
      }
      continue;
    }
    if (navigationDirection === "backward") {
      if (previousKey) {
        candidates.push(previousKey);
      }
      if (nextKey && offset > 1) {
        candidates.push(nextKey);
      }
      continue;
    }
    if (nextKey) {
      candidates.push(nextKey);
    }
    if (previousKey) {
      candidates.push(previousKey);
    }
  }

  return dedupe(candidates);
}

export function resolveRouteAwareMediaPrefetch(args: {
  activeSectionKey: ProjectPresentationSectionKey;
  pagerItems: SubsectionPagerItem[];
  prefetchPlan?: ProjectPresentationPrefetchPlan;
  lookahead?: number;
  navigationDirection?: PrefetchNavigationDirection;
}): {
  sectionKeys: ProjectPresentationSectionKey[];
  mediaTypes: MediaCyclerMediaType[];
} {
  const sectionKeys = resolveLikelySectionKeys({
    activeSectionKey: args.activeSectionKey,
    pagerItems: args.pagerItems,
    lookahead: args.lookahead,
    navigationDirection: args.navigationDirection,
  });

  const mediaTypes = dedupe(
    sectionKeys.flatMap((key) => args.prefetchPlan?.[key] ?? DEFAULT_SECTION_MEDIA_PREFETCH[key]),
  );

  return { sectionKeys, mediaTypes };
}
