import { PROMPT_TILES, type PromptTileDefinition } from "@/consts/promptTiles";

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

const TILE_METADATA: Record<keyof typeof PROMPT_TILES, {
  contexts: PromptContext[];
  recommendedGoalTags: TalentForgeGoalTag[];
}> = {
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

const registryEntries = Object.entries(PROMPT_TILES) as Array<[
  keyof typeof PROMPT_TILES,
  PromptTileDefinition,
]>;

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

export const PROMPT_CONTEXT_ORDER: PromptContext[] = [
  "resume",
  "offers",
  "messaging",
  "jobSearch",
];

const toArray = <T,>(value?: T | T[]): T[] => {
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
};

const matchesContexts = (
  tile: PromptTileWithMetadata,
  contexts: PromptContext[],
) =>
  contexts.length === 0 || contexts.some((ctx) => tile.contexts.includes(ctx));

const matchesGoalTags = (
  tile: PromptTileWithMetadata,
  goalTags: TalentForgeGoalTag[],
) =>
  goalTags.length === 0 || goalTags.some((tag) => tile.recommendedGoalTags.includes(tag));

export function getPromptTile(
  id: string,
  filters: PromptTileFilters = {},
): PromptTileWithMetadata | undefined {
  const tile = PROMPT_TILE_REGISTRY[id];
  if (!tile) return undefined;

  const contexts = toArray(filters.contexts);
  const goalTags = toArray(filters.goalTags);

  if (!matchesContexts(tile, contexts)) return undefined;
  if (!matchesGoalTags(tile, goalTags)) return undefined;

  return tile;
}

export function getPromptTiles(
  filters: PromptTileFilters = {},
): PromptTileWithMetadata[] {
  const contexts = toArray(filters.contexts);
  const goalTags = toArray(filters.goalTags);

  if (filters.ids && filters.ids.length > 0) {
    return filters.ids
      .map((id) => getPromptTile(id, { contexts, goalTags }))
      .filter((tile): tile is PromptTileWithMetadata => Boolean(tile));
  }

  return Object.values(PROMPT_TILE_REGISTRY).filter(
    (tile) => matchesContexts(tile, contexts) && matchesGoalTags(tile, goalTags),
  );
}
