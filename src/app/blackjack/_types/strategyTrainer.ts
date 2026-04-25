import type { BlackjackUiAction } from "./messages";

export type BlackjackStrategyTrainerAction = Extract<
  BlackjackUiAction,
  "hit" | "stand" | "double" | "split" | "insure" | "decline"
>;

export type BlackjackStrategyActionInsight = {
  action: BlackjackStrategyTrainerAction;
  label: string;
  evDeltaPct: number;
  isRecommended: boolean;
  explanation: string;
};

export type BlackjackStrategyTrainerInsight = {
  scenarioLabel: string;
  recommendationLabel: string;
  rationale: string;
  actionInsights: BlackjackStrategyActionInsight[];
};
