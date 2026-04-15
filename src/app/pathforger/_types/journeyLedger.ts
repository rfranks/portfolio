export type JourneyLedgerTone = "danger" | "warning" | "positive" | "neutral";

export type JourneyLedgerField = {
  key: string;
  label: string;
  value: string;
  emoji: string;
  tone: JourneyLedgerTone;
};

export type JourneyTabPanel =
  | { id: string; label: string; kind: "snapshot" }
  | { id: string; label: string; kind: "field"; field: JourneyLedgerField }
  | { id: string; label: string; kind: "notes"; content: string };

export type JourneyLedgerPlaybackEntry = {
  key: string;
  label: string;
  emoji: string;
  tone: JourneyLedgerTone;
  beforeItems: string[];
  afterItems: string[];
  addedItems: string[];
  removedItems: string[];
  unchangedItems: string[];
};

export type JourneyLedgerPlaybackViewModel = {
  active: boolean;
  waitingForChapter: boolean;
  chapterNumber: number | null;
  currentIndex: number;
  total: number;
  currentEntry: JourneyLedgerPlaybackEntry | null;
};
