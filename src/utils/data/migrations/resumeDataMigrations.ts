import type {
  MigrationFn,
  ResumeDataMigrationWarning,
  ResumeDataMigrationPayload,
} from "@/types/data/migrations/resumeDataMigrations";

export const LATEST_RESUME_DATA_SCHEMA_VERSION = 6;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function replaceStringValue(value: unknown, fromValue: string, toValue: string): unknown {
  if (typeof value === "string") {
    return value.includes(fromValue) ? value.replaceAll(fromValue, toValue) : value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => replaceStringValue(item, fromValue, toValue));
  }

  if (value && typeof value === "object") {
    const next: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value)) {
      next[key] = replaceStringValue(nested, fromValue, toValue);
    }
    return next;
  }

  return value;
}

const migrateV1ToV2: MigrationFn = (input) => {
  const withFixedPaths = replaceStringValue(
    input,
    "/personal/images/github/achievments/",
    "/personal/images/github/achievements/",
  );

  return {
    ...(withFixedPaths as ResumeDataMigrationPayload),
    schemaVersion: 2,
  };
};

type LegacyPresentationBehaviorConfig = {
  useSharedOverviewSlide: boolean;
  useSharedDemoSlide: boolean;
  useSharedArchitectureDiagramsSlide: boolean;
  enableWhyThisInterestsSection: boolean;
  demoLayout: "default" | "podcasts";
};

const LEGACY_PRESENTATION_BEHAVIOR_BY_HREF: Record<string, LegacyPresentationBehaviorConfig> = {
  "/patientlistpodcasts": {
    useSharedOverviewSlide: true,
    useSharedDemoSlide: true,
    useSharedArchitectureDiagramsSlide: true,
    enableWhyThisInterestsSection: true,
    demoLayout: "podcasts",
  },
  "/aisummary": {
    useSharedOverviewSlide: true,
    useSharedDemoSlide: true,
    useSharedArchitectureDiagramsSlide: true,
    enableWhyThisInterestsSection: false,
    demoLayout: "default",
  },
  "/patientlist": {
    useSharedOverviewSlide: false,
    useSharedDemoSlide: true,
    useSharedArchitectureDiagramsSlide: true,
    enableWhyThisInterestsSection: false,
    demoLayout: "default",
  },
  "/assignmentlist": {
    useSharedOverviewSlide: false,
    useSharedDemoSlide: true,
    useSharedArchitectureDiagramsSlide: true,
    enableWhyThisInterestsSection: false,
    demoLayout: "default",
  },
};

const DEFAULT_PRESENTATION_PREFETCH_PLAN = {
  overview: ["markdown", "image", "video"],
  why: ["markdown"],
  demo: ["video", "image"],
  technologies: ["markdown"],
  specifications: ["markdown", "pdf"],
  diagrams: ["diagram", "pdf"],
};

const defaultSectionOrderByBehavior = (behavior: LegacyPresentationBehaviorConfig): string[] => {
  const ordered = [
    "overview",
    ...(behavior.enableWhyThisInterestsSection ? ["why"] : []),
    "demo",
    "technologies",
    "specifications",
    "diagrams",
  ];
  return Array.from(new Set(ordered));
};

const migrateV2ToV3: MigrationFn = (input) => {
  const projects = Array.isArray(input.projects) ? input.projects : [];
  const nextProjects = projects.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const project = entry as Record<string, unknown>;
    if (project.type !== "presentation") {
      return project;
    }

    const existingPresentation = project.presentation;
    if (
      existingPresentation &&
      typeof existingPresentation === "object" &&
      !Array.isArray(existingPresentation)
    ) {
      return project;
    }

    const href = typeof project.href === "string" ? project.href.trim().toLowerCase() : "";
    const behavior =
      LEGACY_PRESENTATION_BEHAVIOR_BY_HREF[href] ??
      ({
        useSharedOverviewSlide: false,
        useSharedDemoSlide: false,
        useSharedArchitectureDiagramsSlide: false,
        enableWhyThisInterestsSection: false,
        demoLayout: "default",
      } satisfies LegacyPresentationBehaviorConfig);

    return {
      ...project,
      presentation: {
        ...behavior,
        sectionOrder: defaultSectionOrderByBehavior(behavior),
        prefetchPlan: DEFAULT_PRESENTATION_PREFETCH_PLAN,
      },
    };
  });

  return {
    ...input,
    projects: nextProjects,
    schemaVersion: 3,
  };
};

const migrateV3ToV4: MigrationFn = (input) => {
  const projects = Array.isArray(input.projects) ? input.projects : [];
  const nextProjects = projects.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const project = entry as Record<string, unknown>;
    const projectDiagrams = Array.isArray(project.diagrams) ? project.diagrams : null;
    if (!projectDiagrams || projectDiagrams.length === 0) {
      return project;
    }

    const nextDiagrams = projectDiagrams.map((diagramEntry) => {
      if (!diagramEntry || typeof diagramEntry !== "object" || Array.isArray(diagramEntry)) {
        return diagramEntry;
      }

      const diagram = diagramEntry as Record<string, unknown>;
      const existingAutoFit =
        diagram.autoFit && typeof diagram.autoFit === "object" && !Array.isArray(diagram.autoFit)
          ? (diagram.autoFit as Record<string, unknown>)
          : {};

      const resolveNumeric = (value: unknown, fallback: number): number =>
        typeof value === "number" && Number.isFinite(value) ? value : fallback;
      const resolveVerticalAlign = (value: unknown): "top" | "center" =>
        value === "center" || value === "top" ? value : "top";

      const normalizedAutoFit = {
        padding: resolveNumeric(existingAutoFit.padding ?? diagram.autoFitPadding, 14),
        scaleMultiplier: resolveNumeric(
          existingAutoFit.scaleMultiplier ?? diagram.autoFitScaleMultiplier,
          1,
        ),
        verticalAlign: resolveVerticalAlign(
          existingAutoFit.verticalAlign ?? diagram.autoFitVerticalAlign,
        ),
        offsetX: resolveNumeric(existingAutoFit.offsetX ?? diagram.autoFitOffsetX, 0),
        offsetY: resolveNumeric(existingAutoFit.offsetY ?? diagram.autoFitOffsetY, 0),
      };

      return {
        ...diagram,
        autoFit: normalizedAutoFit,
      };
    });

    return {
      ...project,
      diagrams: nextDiagrams,
    };
  });

  return {
    ...input,
    projects: nextProjects,
    schemaVersion: 4,
  };
};

const PRESENTATION_SECTION_KEYS = [
  "overview",
  "why",
  "demo",
  "technologies",
  "specifications",
  "diagrams",
] as const;

const migrateV4ToV5: MigrationFn = (input) => {
  const projects = Array.isArray(input.projects) ? input.projects : [];
  const nextProjects = projects.map((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return entry;
    }

    const project = entry as Record<string, unknown>;
    if (project.type !== "presentation") {
      return project;
    }

    const presentation =
      project.presentation &&
      typeof project.presentation === "object" &&
      !Array.isArray(project.presentation)
        ? (project.presentation as Record<string, unknown>)
        : {};
    const sectionPagerSfx =
      project.sectionPagerSfx &&
      typeof project.sectionPagerSfx === "object" &&
      !Array.isArray(project.sectionPagerSfx)
        ? (project.sectionPagerSfx as Record<string, unknown>)
        : {};
    const existingCapabilities =
      presentation.sectionCapabilities &&
      typeof presentation.sectionCapabilities === "object" &&
      !Array.isArray(presentation.sectionCapabilities)
        ? (presentation.sectionCapabilities as Record<string, unknown>)
        : {};

    const mergedCapabilities = Object.fromEntries(
      PRESENTATION_SECTION_KEYS.map((sectionKey) => {
        const existingEntry =
          existingCapabilities[sectionKey] &&
          typeof existingCapabilities[sectionKey] === "object" &&
          !Array.isArray(existingCapabilities[sectionKey])
            ? (existingCapabilities[sectionKey] as Record<string, unknown>)
            : {};
        const audioProfileValue = sectionPagerSfx[sectionKey];

        return [
          sectionKey,
          {
            enabled: typeof existingEntry.enabled === "boolean" ? existingEntry.enabled : true,
            pagerActions:
              existingEntry.pagerActions &&
              typeof existingEntry.pagerActions === "object" &&
              !Array.isArray(existingEntry.pagerActions)
                ? existingEntry.pagerActions
                : {
                    allowPrevious: true,
                    allowNext: true,
                    allowSelector: true,
                  },
            audioProfile:
              typeof existingEntry.audioProfile === "string" && existingEntry.audioProfile.trim()
                ? existingEntry.audioProfile
                : typeof audioProfileValue === "string" && audioProfileValue.trim()
                  ? audioProfileValue
                  : "random",
            deepLinkRestore:
              existingEntry.deepLinkRestore === "always" ||
              existingEntry.deepLinkRestore === "if-present" ||
              existingEntry.deepLinkRestore === "never"
                ? existingEntry.deepLinkRestore
                : "always",
          },
        ];
      }),
    );

    return {
      ...project,
      presentation: {
        ...presentation,
        sectionCapabilities: mergedCapabilities,
      },
    };
  });

  return {
    ...input,
    projects: nextProjects,
    schemaVersion: 5,
  };
};

const DEFAULT_PORTFOLIO_APP_ROUTE_METADATA = {
  site: {
    route: "/",
    description:
      "Résumé of Richard Franks, Principal Full Stack Engineer and AI-driven systems architect.",
  },
  aiShenanigans: {
    route: "/ai-shenanigans",
    documentTitle: "AI Shenanigans",
    metadataTitle: "AI Shenanigans",
    metadataDescription:
      "AI creative lab for stylized visuals, motion shorts, and narrative adaptation experiments from source image to story-world prototype.",
  },
  dna: {
    route: "/dna",
    documentTitle: "GeneBoard",
  },
  bookworm: {
    route: "/bookworm",
    documentTitle: "Bookworm",
  },
  talentforge: {
    route: "/talentforge",
    documentTitle: "TalentForge",
  },
  rickbert: {
    route: "/rickbert-studio",
    documentTitle: "Rickbert Studio",
    metadataTitle: "Rickbert Studio",
    metadataDescription: "Structured comic strip generation studio for the RICKBERT series.",
  },
  pathforger: {
    route: "/pathforger",
    documentTitle: "PathForger",
    metadataTitle: "PathForger",
    metadataDescription:
      "Interactive story-forging studio that generates A/B/C pitches, chapter packages, and parallel cinematic image outputs through staged OpenAI calls.",
  },
  blackjack: {
    route: "/blackjack",
    documentTitle: "Blackjack",
  },
  warbirds: {
    route: "/warbirds",
    documentTitle: "Warbirds",
  },
  zombiefish: {
    route: "/zombiefish",
    documentTitle: "ZombieFish",
  },
  blasteroids: {
    route: "/blasteroids",
    documentTitle: "Blasteroids",
  },
  petly: {
    route: "/petly",
    documentTitle: "Petly",
  },
  health: {
    route: "/health",
    documentTitle: "Portfolio Health Dashboard",
    metadataTitle: "Portfolio Health Dashboard",
    metadataDescription:
      "Bundle budget, test and accessibility health, and resume schema validation snapshots.",
  },
  replay: {
    route: "/replay",
    documentTitle: "Session Replay Lite Viewer",
    metadataTitle: "Session Replay Lite Viewer",
    metadataDescription:
      "Load and inspect session replay-lite JSON exports with timeline scrubbing and event filters.",
  },
  capabilities: {
    route: "/capabilities",
    documentTitle: "App Capability Matrix",
    metadataTitle: "App Capability Matrix",
    metadataDescription:
      "Cross-route capability matrix with measured quality and performance coverage snapshots.",
  },
} as const;

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const migrateV5ToV6: MigrationFn = (input) => {
  const portfolioApps = toRecord(input.portfolioApps);
  const nextPortfolioApps = Object.fromEntries(
    Object.entries(DEFAULT_PORTFOLIO_APP_ROUTE_METADATA).map(([appKey, defaults]) => {
      const existing = toRecord(portfolioApps[appKey]);
      return [appKey, { ...defaults, ...existing, route: defaults.route }];
    }),
  );

  return {
    ...input,
    portfolioApps: nextPortfolioApps,
    schemaVersion: 6,
  };
};

const MIGRATIONS: Record<number, MigrationFn> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
  3: migrateV3ToV4,
  4: migrateV4ToV5,
  5: migrateV5ToV6,
};

export function migrateResumeData(payload: ResumeDataMigrationPayload): ResumeDataMigrationPayload {
  const working = deepClone(payload);
  const currentVersionRaw =
    typeof working.schemaVersion === "number" && Number.isFinite(working.schemaVersion)
      ? working.schemaVersion
      : 1;

  let currentVersion = Math.max(1, Math.floor(currentVersionRaw));
  let migrated = working;

  while (currentVersion < LATEST_RESUME_DATA_SCHEMA_VERSION) {
    const migration = MIGRATIONS[currentVersion];
    if (!migration) {
      throw new Error(`Missing migration from schemaVersion ${currentVersion}.`);
    }

    migrated = migration(migrated);
    currentVersion += 1;
  }

  if (typeof migrated.schemaVersion !== "number") {
    migrated.schemaVersion = LATEST_RESUME_DATA_SCHEMA_VERSION;
  }

  return migrated;
}

export function collectResumeDataMigrationWarnings(
  payload: ResumeDataMigrationPayload,
): ResumeDataMigrationWarning[] {
  const warnings: ResumeDataMigrationWarning[] = [];
  const projects = Array.isArray(payload.projects) ? payload.projects : [];

  projects.forEach((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return;
    }

    const project = entry as Record<string, unknown>;
    if (typeof project.blockDiagram === "string" && project.blockDiagram.trim()) {
      warnings.push({
        code: "deprecated.legacy-diagram-field",
        message:
          "Legacy project.blockDiagram is deprecated; prefer projects[].diagrams[].diagram entries.",
        path: `projects.${index}.blockDiagram`,
      });
    }
    if (typeof project.componentDiagram === "string" && project.componentDiagram.trim()) {
      warnings.push({
        code: "deprecated.legacy-diagram-field",
        message:
          "Legacy project.componentDiagram is deprecated; prefer projects[].diagrams[].diagram entries.",
        path: `projects.${index}.componentDiagram`,
      });
    }
    if (typeof project.sequenceDiagram === "string" && project.sequenceDiagram.trim()) {
      warnings.push({
        code: "deprecated.legacy-diagram-field",
        message:
          "Legacy project.sequenceDiagram is deprecated; prefer projects[].diagrams[].diagram entries.",
        path: `projects.${index}.sequenceDiagram`,
      });
    }
  });

  return warnings;
}
