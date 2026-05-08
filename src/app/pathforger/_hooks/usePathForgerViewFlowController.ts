import * as React from "react";

type PathForgerPrimaryFlow = "create" | "chapter" | "continue" | "outcome" | null;

type PathForgerViewFlowState = {
  primaryFlow: PathForgerPrimaryFlow;
  journeyOpen: boolean;
};

type PathForgerViewFlowAction =
  | { type: "sync-external"; next: PathForgerViewFlowState }
  | { type: "open-create" }
  | { type: "open-chapter" }
  | { type: "open-continue" }
  | { type: "open-outcome" }
  | { type: "close-primary" }
  | { type: "toggle-chapter"; hasVisibleChapter: boolean }
  | { type: "open-journey" }
  | { type: "close-journey" };

type UsePathForgerViewFlowControllerArgs = {
  createStoryPanelOpen: boolean;
  chapterModalOpen: boolean;
  continueModalOpen: boolean;
  chapterOutcomeModalOpen: boolean;
  pathLedgerModalOpen: boolean;
  setCreateStoryPanelOpen: (value: boolean) => void;
  setChapterModalOpen: (value: boolean) => void;
  setContinueModalOpen: (value: boolean) => void;
  setChapterOutcomeModalOpen: (value: boolean) => void;
  setPathLedgerModalOpen: (value: boolean) => void;
};

const resolvePrimaryFlowFromPanels = (args: {
  createStoryPanelOpen: boolean;
  chapterModalOpen: boolean;
  continueModalOpen: boolean;
  chapterOutcomeModalOpen: boolean;
}): PathForgerPrimaryFlow => {
  if (args.chapterOutcomeModalOpen) return "outcome";
  if (args.continueModalOpen) return "continue";
  if (args.chapterModalOpen) return "chapter";
  if (args.createStoryPanelOpen) return "create";
  return null;
};

const isSameFlowState = (left: PathForgerViewFlowState, right: PathForgerViewFlowState) =>
  left.primaryFlow === right.primaryFlow && left.journeyOpen === right.journeyOpen;

function reducePathForgerViewFlowState(
  current: PathForgerViewFlowState,
  action: PathForgerViewFlowAction,
): PathForgerViewFlowState {
  switch (action.type) {
    case "sync-external":
      return action.next;
    case "open-create":
      return { ...current, primaryFlow: "create" };
    case "open-chapter":
      return { ...current, primaryFlow: "chapter" };
    case "open-continue":
      return { ...current, primaryFlow: "continue" };
    case "open-outcome":
      return { ...current, primaryFlow: "outcome" };
    case "close-primary":
      return { ...current, primaryFlow: null };
    case "toggle-chapter":
      if (!action.hasVisibleChapter) return current;
      return { ...current, primaryFlow: current.primaryFlow === "chapter" ? null : "chapter" };
    case "open-journey":
      return { ...current, journeyOpen: true };
    case "close-journey":
      return { ...current, journeyOpen: false };
    default:
      return current;
  }
}

export function usePathForgerViewFlowController(args: UsePathForgerViewFlowControllerArgs) {
  const externalState = React.useMemo<PathForgerViewFlowState>(
    () => ({
      primaryFlow: resolvePrimaryFlowFromPanels({
        createStoryPanelOpen: args.createStoryPanelOpen,
        chapterModalOpen: args.chapterModalOpen,
        continueModalOpen: args.continueModalOpen,
        chapterOutcomeModalOpen: args.chapterOutcomeModalOpen,
      }),
      journeyOpen: args.pathLedgerModalOpen,
    }),
    [
      args.chapterModalOpen,
      args.chapterOutcomeModalOpen,
      args.continueModalOpen,
      args.createStoryPanelOpen,
      args.pathLedgerModalOpen,
    ],
  );

  const [flowState, dispatch] = React.useReducer(reducePathForgerViewFlowState, externalState);

  React.useEffect(() => {
    if (!isSameFlowState(flowState, externalState)) {
      dispatch({ type: "sync-external", next: externalState });
    }
  }, [externalState, flowState]);

  React.useEffect(() => {
    const shouldShowCreate = flowState.primaryFlow === "create";
    const shouldShowChapter = flowState.primaryFlow === "chapter";
    const shouldShowContinue = flowState.primaryFlow === "continue";
    const shouldShowOutcome = flowState.primaryFlow === "outcome";
    if (args.createStoryPanelOpen !== shouldShowCreate) {
      args.setCreateStoryPanelOpen(shouldShowCreate);
    }
    if (args.chapterModalOpen !== shouldShowChapter) {
      args.setChapterModalOpen(shouldShowChapter);
    }
    if (args.continueModalOpen !== shouldShowContinue) {
      args.setContinueModalOpen(shouldShowContinue);
    }
    if (args.chapterOutcomeModalOpen !== shouldShowOutcome) {
      args.setChapterOutcomeModalOpen(shouldShowOutcome);
    }
    if (args.pathLedgerModalOpen !== flowState.journeyOpen) {
      args.setPathLedgerModalOpen(flowState.journeyOpen);
    }
  }, [args, flowState]);

  const setCreateStoryPanelOpen = React.useCallback(
    (value: boolean) => dispatch({ type: value ? "open-create" : "close-primary" }),
    [],
  );
  const setChapterModalOpen = React.useCallback((value: boolean) => {
    dispatch({ type: value ? "open-chapter" : "close-primary" });
  }, []);
  const setContinueModalOpen = React.useCallback((value: boolean) => {
    dispatch({ type: value ? "open-continue" : "close-primary" });
  }, []);
  const setChapterOutcomeModalOpen = React.useCallback((value: boolean) => {
    dispatch({ type: value ? "open-outcome" : "close-primary" });
  }, []);
  const setPathLedgerModalOpen = React.useCallback(
    (value: boolean) => dispatch({ type: value ? "open-journey" : "close-journey" }),
    [],
  );
  const openHydratedChapterFlow = React.useCallback(() => dispatch({ type: "open-chapter" }), []);
  const openCreateStoryFlow = React.useCallback(() => dispatch({ type: "open-create" }), []);
  const openContinueFlow = React.useCallback(() => dispatch({ type: "open-continue" }), []);
  const openOutcomeFlow = React.useCallback(() => dispatch({ type: "open-outcome" }), []);
  const closePrimaryFlow = React.useCallback(() => dispatch({ type: "close-primary" }), []);
  const toggleChapterFlow = React.useCallback(
    (hasVisibleChapter: boolean) => dispatch({ type: "toggle-chapter", hasVisibleChapter }),
    [],
  );

  return {
    createStoryPanelOpen: flowState.primaryFlow === "create",
    chapterModalOpen: flowState.primaryFlow === "chapter",
    continueModalOpen: flowState.primaryFlow === "continue",
    chapterOutcomeModalOpen: flowState.primaryFlow === "outcome",
    pathLedgerModalOpen: flowState.journeyOpen,
    setCreateStoryPanelOpen,
    setChapterModalOpen,
    setContinueModalOpen,
    setChapterOutcomeModalOpen,
    setPathLedgerModalOpen,
    openHydratedChapterFlow,
    openCreateStoryFlow,
    openContinueFlow,
    openOutcomeFlow,
    closePrimaryFlow,
    toggleChapterFlow,
  };
}
