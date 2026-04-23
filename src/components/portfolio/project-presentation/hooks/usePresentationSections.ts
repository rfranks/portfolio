import { useCallback, useEffect, useMemo, useState } from "react";
import type { ProjectPresentationSectionKey } from "@/types/components/portfolio";

export type PresentationSectionDescriptor = {
  key: ProjectPresentationSectionKey;
  title: string;
  subtitle: string;
};

type UsePresentationSectionsParams = {
  useWhyThisInterestsSlide: boolean;
  hasDemoSection: boolean;
  hasDiagramsSection: boolean;
  sectionOrder?: readonly ProjectPresentationSectionKey[];
};

export function usePresentationSections({
  useWhyThisInterestsSlide,
  hasDemoSection,
  hasDiagramsSection,
  sectionOrder,
}: UsePresentationSectionsParams) {
  const sections = useMemo<PresentationSectionDescriptor[]>(() => {
    const descriptorByKey: Record<ProjectPresentationSectionKey, PresentationSectionDescriptor> = {
      overview: {
        key: "overview",
        title: "Overview",
        subtitle: "Project narrative and implementation snapshot",
      },
      why: {
        key: "why",
        title: "Why This Interests Me",
        subtitle: "Personal engineering motivation",
      },
      demo: {
        key: "demo",
        title: "Demo",
        subtitle: "Visual walkthrough",
      },
      technologies: {
        key: "technologies",
        title: "Technologies Used",
        subtitle: "Stack and tools used",
      },
      specifications: {
        key: "specifications",
        title: "Specifications",
        subtitle: "Structure and implementation details",
      },
      diagrams: {
        key: "diagrams",
        title: "Architecture",
        subtitle: "Diagram walkthrough",
      },
    };

    const availabilityByKey: Record<ProjectPresentationSectionKey, boolean> = {
      overview: true,
      why: useWhyThisInterestsSlide,
      demo: hasDemoSection,
      technologies: true,
      specifications: true,
      diagrams: hasDiagramsSection,
    };

    const defaultOrder: readonly ProjectPresentationSectionKey[] = [
      "overview",
      "why",
      "demo",
      "technologies",
      "specifications",
      "diagrams",
    ];
    const requestedOrder = sectionOrder && sectionOrder.length > 0 ? sectionOrder : defaultOrder;
    const orderedUniqueKeys = Array.from(new Set(requestedOrder));
    const fallbackKeys = defaultOrder.filter((key) => !orderedUniqueKeys.includes(key));
    const mergedOrder = [...orderedUniqueKeys, ...fallbackKeys];

    return mergedOrder.filter((key) => availabilityByKey[key]).map((key) => descriptorByKey[key]);
  }, [hasDemoSection, hasDiagramsSection, sectionOrder, useWhyThisInterestsSlide]);

  const [activeSectionKey, setActiveSectionKey] = useState<ProjectPresentationSectionKey>(
    sections[0]?.key ?? "overview",
  );

  useEffect(() => {
    if (!sections.some((section) => section.key === activeSectionKey)) {
      setActiveSectionKey(sections[0]?.key ?? "overview");
    }
  }, [activeSectionKey, sections]);

  const activeSectionIndex = Math.max(
    0,
    sections.findIndex((section) => section.key === activeSectionKey),
  );
  const activeSection = sections[activeSectionIndex] ?? sections[0];
  const hasMultipleSections = sections.length > 1;

  const handlePreviousSection = useCallback(() => {
    if (!hasMultipleSections) {
      return;
    }

    if (activeSectionIndex <= 0) {
      setActiveSectionKey(sections[sections.length - 1]?.key ?? sections[0]!.key);
      return;
    }

    setActiveSectionKey(sections[activeSectionIndex - 1]!.key);
  }, [activeSectionIndex, hasMultipleSections, sections]);

  const handleNextSection = useCallback(() => {
    if (!hasMultipleSections) {
      return;
    }

    if (activeSectionIndex >= sections.length - 1) {
      setActiveSectionKey(sections[0]!.key);
      return;
    }

    setActiveSectionKey(sections[activeSectionIndex + 1]!.key);
  }, [activeSectionIndex, hasMultipleSections, sections]);

  return {
    sections,
    activeSection,
    activeSectionKey,
    activeSectionIndex,
    hasMultipleSections,
    setActiveSectionKey,
    handlePreviousSection,
    handleNextSection,
  };
}
