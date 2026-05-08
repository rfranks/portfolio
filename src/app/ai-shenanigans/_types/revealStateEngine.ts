export type RevealViewMode = "chips" | "timeline";

export type RevealTimelineItem<TKey extends string = string> = {
  key: TKey;
  label: string;
  active: boolean;
  reached: boolean;
};
