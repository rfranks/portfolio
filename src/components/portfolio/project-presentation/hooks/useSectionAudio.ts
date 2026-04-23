import { useEffect, useMemo, useRef } from "react";
import { useAudio } from "@/hooks/audio/useAudio";
import type {
  ProjectPresentationSectionKey,
  ProjectSectionPagerSfxValue,
} from "@/types/components/portfolio";
import { rewindAndPlayAudio } from "@/utils/audio";

type SectionPagerSfxPaths = Record<ProjectPresentationSectionKey, ProjectSectionPagerSfxValue>;
const RANDOM_SECTION_PAGER_SFX_POOL = [
  "/audio/click_001.mp3",
  "/audio/question_001.mp3",
  "/audio/select_001.ogg",
  "/audio/switch_001.ogg",
  "/audio/tick_002.mp3",
  "/audio/switch_007.ogg",
] as const;

type UseSectionAudioParams = {
  projectSlug: string;
  activeSectionKey: ProjectPresentationSectionKey;
  deepLinkInitialized: boolean;
  sectionPagerSfxPaths: SectionPagerSfxPaths;
};

export function useSectionAudio({
  projectSlug,
  activeSectionKey,
  deepLinkInitialized,
  sectionPagerSfxPaths,
}: UseSectionAudioParams) {
  const overviewSectionPagerSfx = useAudio(
    sectionPagerSfxPaths.overview === "random"
      ? RANDOM_SECTION_PAGER_SFX_POOL[0]
      : sectionPagerSfxPaths.overview,
  );
  const whySectionPagerSfx = useAudio(
    sectionPagerSfxPaths.why === "random"
      ? RANDOM_SECTION_PAGER_SFX_POOL[0]
      : sectionPagerSfxPaths.why,
  );
  const demoSectionPagerSfx = useAudio(
    sectionPagerSfxPaths.demo === "random"
      ? RANDOM_SECTION_PAGER_SFX_POOL[0]
      : sectionPagerSfxPaths.demo,
  );
  const technologiesSectionPagerSfx = useAudio(
    sectionPagerSfxPaths.technologies === "random"
      ? RANDOM_SECTION_PAGER_SFX_POOL[0]
      : sectionPagerSfxPaths.technologies,
  );
  const specificationsSectionPagerSfx = useAudio(
    sectionPagerSfxPaths.specifications === "random"
      ? RANDOM_SECTION_PAGER_SFX_POOL[0]
      : sectionPagerSfxPaths.specifications,
  );
  const diagramsSectionPagerSfx = useAudio(
    sectionPagerSfxPaths.diagrams === "random"
      ? RANDOM_SECTION_PAGER_SFX_POOL[0]
      : sectionPagerSfxPaths.diagrams,
  );
  const randomSectionPagerSfxA = useAudio(RANDOM_SECTION_PAGER_SFX_POOL[0]);
  const randomSectionPagerSfxB = useAudio(RANDOM_SECTION_PAGER_SFX_POOL[1]);
  const randomSectionPagerSfxC = useAudio(RANDOM_SECTION_PAGER_SFX_POOL[2]);
  const randomSectionPagerSfxD = useAudio(RANDOM_SECTION_PAGER_SFX_POOL[3]);
  const randomSectionPagerSfxE = useAudio(RANDOM_SECTION_PAGER_SFX_POOL[4]);
  const randomSectionPagerSfxF = useAudio(RANDOM_SECTION_PAGER_SFX_POOL[5]);
  const hasInitializedSectionPagerAudioRef = useRef(false);
  const lastRandomSfxIndexRef = useRef<number | null>(null);
  const randomSectionPagerSfxRefs = useMemo(
    () =>
      [
        randomSectionPagerSfxA,
        randomSectionPagerSfxB,
        randomSectionPagerSfxC,
        randomSectionPagerSfxD,
        randomSectionPagerSfxE,
        randomSectionPagerSfxF,
      ] as const,
    [
      randomSectionPagerSfxA,
      randomSectionPagerSfxB,
      randomSectionPagerSfxC,
      randomSectionPagerSfxD,
      randomSectionPagerSfxE,
      randomSectionPagerSfxF,
    ],
  );

  const activeSectionPagerSfxRef =
    activeSectionKey === "overview"
      ? overviewSectionPagerSfx
      : activeSectionKey === "why"
        ? whySectionPagerSfx
        : activeSectionKey === "demo"
          ? demoSectionPagerSfx
          : activeSectionKey === "technologies"
            ? technologiesSectionPagerSfx
            : activeSectionKey === "specifications"
              ? specificationsSectionPagerSfx
              : diagramsSectionPagerSfx;
  const activeSectionPagerSfxSetting = sectionPagerSfxPaths[activeSectionKey];

  useEffect(() => {
    hasInitializedSectionPagerAudioRef.current = false;
    lastRandomSfxIndexRef.current = null;
  }, [projectSlug]);

  useEffect(() => {
    if (!deepLinkInitialized) {
      return;
    }

    if (!hasInitializedSectionPagerAudioRef.current) {
      hasInitializedSectionPagerAudioRef.current = true;
      return;
    }

    if (activeSectionPagerSfxSetting === "random") {
      if (randomSectionPagerSfxRefs.length === 0) {
        return;
      }
      let randomIndex = Math.floor(Math.random() * randomSectionPagerSfxRefs.length);
      if (randomSectionPagerSfxRefs.length > 1 && lastRandomSfxIndexRef.current != null) {
        while (randomIndex === lastRandomSfxIndexRef.current) {
          randomIndex = Math.floor(Math.random() * randomSectionPagerSfxRefs.length);
        }
      }
      lastRandomSfxIndexRef.current = randomIndex;
      const randomSfxRef = randomSectionPagerSfxRefs[randomIndex];
      rewindAndPlayAudio(randomSfxRef, { volume: 0.34 });
      return;
    }

    rewindAndPlayAudio(activeSectionPagerSfxRef, { volume: 0.34 });
  }, [
    activeSectionKey,
    activeSectionPagerSfxRef,
    activeSectionPagerSfxSetting,
    deepLinkInitialized,
    randomSectionPagerSfxRefs,
  ]);
}
