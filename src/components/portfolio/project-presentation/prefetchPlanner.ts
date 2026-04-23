import type { SubsectionPagerItem } from "@/components/portfolio/layout/SubsectionPager";
import type {
  ProjectPresentationPrefetchPlan,
  ProjectPresentationSectionKey,
} from "@/types/components/portfolio";
import type { MediaCyclerMediaType } from "@/types/media/mediaCycler";

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
}): ProjectPresentationSectionKey[] {
  const { activeSectionKey, pagerItems, lookahead = 1 } = args;
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
}): {
  sectionKeys: ProjectPresentationSectionKey[];
  mediaTypes: MediaCyclerMediaType[];
} {
  const sectionKeys = resolveLikelySectionKeys({
    activeSectionKey: args.activeSectionKey,
    pagerItems: args.pagerItems,
    lookahead: args.lookahead,
  });

  const mediaTypes = dedupe(
    sectionKeys.flatMap((key) => args.prefetchPlan?.[key] ?? DEFAULT_SECTION_MEDIA_PREFETCH[key]),
  );

  return { sectionKeys, mediaTypes };
}
