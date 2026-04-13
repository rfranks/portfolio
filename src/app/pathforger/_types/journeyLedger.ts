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
