"use client";

import * as React from "react";
import PathForgerChapterPanel from "@/app/pathforger/_components/PathForgerChapterPanel";
import PathForgerContinuePanel from "@/app/pathforger/_components/PathForgerContinuePanel";
import PathForgerCreateStoryPanel from "@/app/pathforger/_components/PathForgerCreateStoryPanel";
import PathForgerJourneyPanel from "@/app/pathforger/_components/PathForgerJourneyPanel";
import PathForgerOutcomePanel from "@/app/pathforger/_components/PathForgerOutcomePanel";

type CreateStoryPanelProps = React.ComponentProps<typeof PathForgerCreateStoryPanel>;
type ChapterPanelProps = React.ComponentProps<typeof PathForgerChapterPanel>;
type ContinuePanelProps = React.ComponentProps<typeof PathForgerContinuePanel>;
type OutcomePanelProps = React.ComponentProps<typeof PathForgerOutcomePanel>;
type JourneyPanelProps = React.ComponentProps<typeof PathForgerJourneyPanel>;

export interface PathForgerPanelControllerProps {
  createStoryPanel: CreateStoryPanelProps;
  chapterPanel: ChapterPanelProps;
  continuePanel: ContinuePanelProps;
  outcomePanel: OutcomePanelProps;
  journeyPanel: JourneyPanelProps;
}

export default function PathForgerPanelController({
  createStoryPanel,
  chapterPanel,
  continuePanel,
  outcomePanel,
  journeyPanel,
}: PathForgerPanelControllerProps) {
  return (
    <>
      <PathForgerCreateStoryPanel {...createStoryPanel} />
      <PathForgerChapterPanel {...chapterPanel} />
      <PathForgerContinuePanel {...continuePanel} />
      <PathForgerOutcomePanel {...outcomePanel} />
      <PathForgerJourneyPanel {...journeyPanel} />
    </>
  );
}
