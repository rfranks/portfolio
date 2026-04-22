import { PROMPT_TILES, type PromptTileDefinition } from "@/app/talentforge/_consts/promptTiles";
import { getCustomPromptTiles as loadCustomPromptTiles, type CustomPromptTile } from "./dataStore";
import type {
  PromptContext,
  PromptTileFilters,
  PromptTileWithMetadata,
  TalentForgeGoalTag,
} from "./promptTypes";

const TILE_METADATA: Record<
  keyof typeof PROMPT_TILES,
  {
    contexts: PromptContext[];
    recommendedGoalTags: TalentForgeGoalTag[];
  }
> = {
  resumeSummary: {
    contexts: ["resume"],
    recommendedGoalTags: ["resume"],
  },
  tailorResumeToRole: {
    contexts: ["resume"],
    recommendedGoalTags: ["resume"],
  },
  coverLetter: {
    contexts: ["resume", "messaging"],
    recommendedGoalTags: ["resume", "networking"],
  },
  targetedCoverLetter: {
    contexts: ["resume", "messaging"],
    recommendedGoalTags: ["resume", "networking"],
  },
  bulletRewrite: {
    contexts: ["resume"],
    recommendedGoalTags: ["resume"],
  },
  negotiateOffer: {
    contexts: ["offers", "messaging"],
    recommendedGoalTags: ["search", "networking"],
  },
  negotiateBetterOffer: {
    contexts: ["offers", "messaging"],
    recommendedGoalTags: ["search", "networking"],
  },
  interviewPreparation: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  salaryResearch: {
    contexts: ["offers", "jobSearch"],
    recommendedGoalTags: ["search"],
  },
  skillGapAnalysis: {
    contexts: ["jobSearch", "resume"],
    recommendedGoalTags: ["resume", "search"],
  },
  compareResumeToJob: {
    contexts: ["resume", "jobSearch"],
    recommendedGoalTags: ["resume", "search"],
  },
  compareTwoOffers: {
    contexts: ["offers"],
    recommendedGoalTags: ["search"],
  },
  jobDescriptionRewrite: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  jobDescriptionRisk: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  screenRole: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  screenRoleForRedFlags: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  jobRequirements: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  extractKeyRequirements: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  networkingOutreach: {
    contexts: ["messaging", "jobSearch"],
    recommendedGoalTags: ["networking"],
  },
  recruiterFollowUp: {
    contexts: ["messaging"],
    recommendedGoalTags: ["networking"],
  },
  recruiterDecline: {
    contexts: ["messaging"],
    recommendedGoalTags: ["networking"],
  },
  recruiterNudge: {
    contexts: ["messaging"],
    recommendedGoalTags: ["networking"],
  },
  recruiterFollowUpNudge: {
    contexts: ["messaging"],
    recommendedGoalTags: ["networking"],
  },
  portfolioReview: {
    contexts: ["resume"],
    recommendedGoalTags: ["resume"],
  },
  elevatorPitch: {
    contexts: ["messaging", "resume"],
    recommendedGoalTags: ["networking", "resume"],
  },
  projectSummary: {
    contexts: ["resume"],
    recommendedGoalTags: ["resume"],
  },
  careerGoals: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  linkedinProfileOptimization: {
    contexts: ["messaging", "jobSearch"],
    recommendedGoalTags: ["networking", "search"],
  },
  resumeRewrite: {
    contexts: ["resume"],
    recommendedGoalTags: ["resume"],
  },
  resumeCompare: {
    contexts: ["resume", "jobSearch"],
    recommendedGoalTags: ["resume", "search"],
  },
  jdRequirements: {
    contexts: ["jobSearch"],
    recommendedGoalTags: ["search"],
  },
  compareOffers: {
    contexts: ["offers"],
    recommendedGoalTags: ["search"],
  },
  offerDetails: {
    contexts: ["offers"],
    recommendedGoalTags: ["search"],
  },
  offerNegotiation: {
    contexts: ["offers", "messaging"],
    recommendedGoalTags: ["search", "networking"],
  },
  compareCurrentComp: {
    contexts: ["offers"],
    recommendedGoalTags: ["search"],
  },
};

const registryEntries = Object.entries(PROMPT_TILES) as Array<
  [keyof typeof PROMPT_TILES, PromptTileDefinition]
>;

export const PROMPT_TILE_REGISTRY: Record<string, PromptTileWithMetadata> = Object.fromEntries(
  registryEntries.map(([id, definition]) => {
    const metadata = TILE_METADATA[id];
    return [
      id,
      {
        ...definition,
        contexts: metadata.contexts,
        recommendedGoalTags: metadata.recommendedGoalTags,
      },
    ];
  }),
);

export const PROMPT_CONTEXT_LABELS: Record<PromptContext, string> = {
  resume: "Resumes",
  offers: "Offers",
  messaging: "Messaging",
  jobSearch: "Job Search",
};

export const PROMPT_CONTEXT_ORDER: PromptContext[] = ["resume", "offers", "messaging", "jobSearch"];

const CONTEXT_GOAL_TAG_MAP: Record<PromptContext, TalentForgeGoalTag> = {
  resume: "resume",
  offers: "search",
  messaging: "networking",
  jobSearch: "search",
};

const toArray = <T>(value?: T | T[]): T[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const matchesContexts = (tile: PromptTileWithMetadata, contexts: PromptContext[]) =>
  contexts.length === 0 || contexts.some((ctx) => tile.contexts.includes(ctx));

const matchesGoalTags = (tile: PromptTileWithMetadata, goalTags: TalentForgeGoalTag[]) =>
  goalTags.length === 0 || goalTags.some((tag) => tile.recommendedGoalTags.includes(tag));

const deriveGoalTags = (contexts: PromptContext[]): TalentForgeGoalTag[] => {
  const tags = new Set<TalentForgeGoalTag>();
  contexts.forEach((context) => {
    const tag = CONTEXT_GOAL_TAG_MAP[context];
    if (tag) {
      tags.add(tag);
    }
  });
  return Array.from(tags);
};

const mapCustomTile = (tile: CustomPromptTile): PromptTileWithMetadata => ({
  id: tile.id,
  display: tile.displayName,
  fullPrompt: tile.fullText ?? "",
  inputs: tile.placeholders.map((placeholder) => placeholder.id),
  contexts: tile.contexts,
  recommendedGoalTags: deriveGoalTags(tile.contexts),
});

const getCustomTileMetadata = (): PromptTileWithMetadata[] =>
  loadCustomPromptTiles().map(mapCustomTile);

export function getPromptTile(
  id: string,
  filters: PromptTileFilters = {},
): PromptTileWithMetadata | undefined {
  const contexts = toArray(filters.contexts);
  const goalTags = toArray(filters.goalTags);

  const customTile = getCustomTileMetadata().find((tile) => tile.id === id);
  if (customTile) {
    if (!matchesContexts(customTile, contexts)) return undefined;
    if (!matchesGoalTags(customTile, goalTags)) return undefined;
    return customTile;
  }

  const tile = PROMPT_TILE_REGISTRY[id];
  if (!tile) return undefined;

  if (!matchesContexts(tile, contexts)) return undefined;
  if (!matchesGoalTags(tile, goalTags)) return undefined;

  return tile;
}

export function getPromptTiles(filters: PromptTileFilters = {}): PromptTileWithMetadata[] {
  const contexts = toArray(filters.contexts);
  const goalTags = toArray(filters.goalTags);

  const defaultTiles = Object.values(PROMPT_TILE_REGISTRY);
  const customTiles = getCustomTileMetadata();

  if (filters.ids && filters.ids.length > 0) {
    const lookup = new Map<string, PromptTileWithMetadata>();
    defaultTiles.forEach((tile) => lookup.set(tile.id, tile));
    customTiles.forEach((tile) => lookup.set(tile.id, tile));
    return filters.ids
      .map((id) => lookup.get(id))
      .filter((tile): tile is PromptTileWithMetadata => Boolean(tile))
      .filter((tile) => matchesContexts(tile, contexts) && matchesGoalTags(tile, goalTags));
  }

  const combined = new Map<string, PromptTileWithMetadata>();
  defaultTiles.forEach((tile) => combined.set(tile.id, tile));
  customTiles.forEach((tile) => combined.set(tile.id, tile));

  return Array.from(combined.values()).filter(
    (tile) => matchesContexts(tile, contexts) && matchesGoalTags(tile, goalTags),
  );
}

export type {
  PromptContext,
  PromptTileFilters,
  PromptTileWithMetadata,
  TalentForgeGoalTag,
} from "./promptTypes";
