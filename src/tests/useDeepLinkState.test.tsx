import { renderHook, waitFor } from "@testing-library/react";
import { useDeepLinkState } from "@/components/portfolio/project-presentation/hooks/useDeepLinkState";

describe("useDeepLinkState query handling", () => {
  const sections = [
    { key: "overview" as const, title: "Overview" },
    { key: "diagrams" as const, title: "Architecture" },
  ];
  const diagramEntries = [{ key: "diagram-a" }, { key: "diagram-b" }];

  it("ignores invalid slide/diagram query params", async () => {
    window.history.replaceState({}, "", "/test?project=demo&slide=999&diagram=999");

    const setActiveSectionKey = jest.fn();
    const setActiveDiagramKey = jest.fn();

    const { result } = renderHook(() =>
      useDeepLinkState({
        projectSlug: "demo",
        sections,
        diagramEntries,
        activeSectionKey: "overview",
        setActiveSectionKey,
        activeDiagramKey: "diagram-a",
        setActiveDiagramKey,
      }),
    );

    await waitFor(() => {
      expect(result.current.deepLinkInitialized).toBe(true);
    });

    expect(setActiveSectionKey).not.toHaveBeenCalled();
    expect(setActiveDiagramKey).not.toHaveBeenCalled();
  });

  it("resolves numeric slide and diagram indices from query", async () => {
    window.history.replaceState({}, "", "/test?project=demo&slide=2&diagram=2");

    const setActiveSectionKey = jest.fn();
    const setActiveDiagramKey = jest.fn();

    const { result } = renderHook(() =>
      useDeepLinkState({
        projectSlug: "demo",
        sections,
        diagramEntries,
        activeSectionKey: "overview",
        setActiveSectionKey,
        activeDiagramKey: "diagram-a",
        setActiveDiagramKey,
      }),
    );

    await waitFor(() => {
      expect(result.current.deepLinkInitialized).toBe(true);
    });

    expect(setActiveSectionKey).toHaveBeenCalledWith("diagrams");
    expect(setActiveDiagramKey).toHaveBeenCalledWith("diagram-b");
  });
});
