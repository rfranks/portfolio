import { useEffect, useRef } from "react";
import { useAudio } from "@/hooks/audio/useAudio";
import type { ProjectPresentationSectionKey } from "@/types/components/portfolio";
import { rewindAndPlayAudio } from "@/utils/audio";

type SectionPagerSfxPaths = Record<ProjectPresentationSectionKey, string>;

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
  const overviewSectionPagerSfx = useAudio(sectionPagerSfxPaths.overview);
  const whySectionPagerSfx = useAudio(sectionPagerSfxPaths.why);
  const demoSectionPagerSfx = useAudio(sectionPagerSfxPaths.demo);
  const technologiesSectionPagerSfx = useAudio(sectionPagerSfxPaths.technologies);
  const specificationsSectionPagerSfx = useAudio(sectionPagerSfxPaths.specifications);
  const diagramsSectionPagerSfx = useAudio(sectionPagerSfxPaths.diagrams);
  const hasInitializedSectionPagerAudioRef = useRef(false);

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

  useEffect(() => {
    hasInitializedSectionPagerAudioRef.current = false;
  }, [projectSlug]);

  useEffect(() => {
    if (!deepLinkInitialized) {
      return;
    }

    if (!hasInitializedSectionPagerAudioRef.current) {
      hasInitializedSectionPagerAudioRef.current = true;
      return;
    }

    rewindAndPlayAudio(activeSectionPagerSfxRef, { volume: 0.34 });
  }, [activeSectionKey, activeSectionPagerSfxRef, deepLinkInitialized]);
}
