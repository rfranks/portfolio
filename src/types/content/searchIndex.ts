import type { CommandPaletteAction } from "@/types/components/portfolio";

export type StaticSearchIndexAction = Omit<CommandPaletteAction, "onSelect">;

export type StaticSearchIndexSnapshot = {
  generatedAt: string;
  actionCount: number;
  actions: StaticSearchIndexAction[];
};
