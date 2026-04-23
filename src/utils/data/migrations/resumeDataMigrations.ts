import type {
  MigrationFn,
  ResumeDataMigrationWarning,
  ResumeDataMigrationPayload,
} from "@/types/data/migrations/resumeDataMigrations";

export const LATEST_RESUME_DATA_SCHEMA_VERSION = 3;

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

const MIGRATIONS: Record<number, MigrationFn> = {
  1: migrateV1ToV2,
  2: migrateV2ToV3,
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
