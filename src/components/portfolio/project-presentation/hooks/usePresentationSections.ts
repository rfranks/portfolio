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
};

export function usePresentationSections({
  useWhyThisInterestsSlide,
  hasDemoSection,
  hasDiagramsSection,
}: UsePresentationSectionsParams) {
  const sections = useMemo<PresentationSectionDescriptor[]>(() => {
    const nextSections: PresentationSectionDescriptor[] = [
      {
        key: "overview",
        title: "Overview",
        subtitle: "Project narrative and implementation snapshot",
      },
      ...(useWhyThisInterestsSlide
        ? [
            {
              key: "why" as const,
              title: "Why This Interests Me",
              subtitle: "Personal engineering motivation",
            },
          ]
        : []),
      ...(hasDemoSection
        ? [
            {
              key: "demo" as const,
              title: "Demo",
              subtitle: "Visual walkthrough",
            },
          ]
        : []),
      {
        key: "technologies",
        title: "Technologies Used",
        subtitle: "Stack and tools used",
      },
      {
        key: "specifications",
        title: "Specifications",
        subtitle: "Structure and implementation details",
      },
      ...(hasDiagramsSection
        ? [
            {
              key: "diagrams" as const,
              title: "Architecture",
              subtitle: "Diagram walkthrough",
            },
          ]
        : []),
    ];

    return nextSections;
  }, [hasDemoSection, hasDiagramsSection, useWhyThisInterestsSlide]);

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
