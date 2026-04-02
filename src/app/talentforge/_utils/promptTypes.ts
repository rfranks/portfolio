import type { PromptTileDefinition } from "@/app/talentforge/_consts/promptTiles";

export type PromptContext = "resume" | "offers" | "messaging" | "jobSearch";
export type TalentForgeGoalTag = "resume" | "networking" | "search";

export interface PromptTileWithMetadata extends PromptTileDefinition {
  contexts: PromptContext[];
  recommendedGoalTags: TalentForgeGoalTag[];
}

export interface PromptTileFilters {
  contexts?: PromptContext | PromptContext[];
  goalTags?: TalentForgeGoalTag | TalentForgeGoalTag[];
  ids?: string[];
}
