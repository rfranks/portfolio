import { navigation, portfolioApps, projects } from "@/consts/resumeData";
import type { ProjectData } from "@/types/components/portfolio";
import {
  getPortfolioAppRouteEntries,
  type PortfolioAppRouteContract,
  type PortfolioAppRouteKey,
} from "@/utils/portfolio/routeContracts";

export type AppCapabilityKind = "app" | "project";

export type AppCapability = {
  id: string;
  href: string;
  label: string;
  kind: AppCapabilityKind;
  commandGroup: string;
  isPresentationProject: boolean;
  features: string[];
  dataSources: string[];
  qualityCoverage: string[];
};

const normalizeFeature = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

function resolveCommandGroup(
  href: string,
  kind: AppCapabilityKind,
  routeContract?: PortfolioAppRouteContract,
): string {
  if (kind === "project") {
    return "Projects";
  }

  const commandGroup =
    routeContract && "commandGroup" in routeContract
      ? (routeContract.commandGroup ?? undefined)
      : undefined;
  if (typeof commandGroup === "string" && commandGroup.trim()) {
    return commandGroup;
  }

  return "Apps • Portfolio";
}

const toStartCaseLabel = (value: string): string => {
  const words = value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) {
    return value;
  }
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(" ");
};

function resolveCapabilityLabel({
  routeKey,
  routeContract,
  drawerLabelByHref,
}: {
  routeKey: PortfolioAppRouteKey;
  routeContract: PortfolioAppRouteContract;
  drawerLabelByHref: ReadonlyMap<string, string>;
}): string {
  const drawerLabel = drawerLabelByHref.get(routeContract.route);
  if (drawerLabel) {
    return drawerLabel;
  }
  return toStartCaseLabel(routeKey);
}

type CapabilityProjectRecord = {
  href: string;
  name: string;
  type?: string;
  terminalDemoMediaType?: string;
  hasDiagrams: boolean;
  hasTechnologies: boolean;
  hasInterestsMeWhy: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const asNonEmptyString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value.trim() : null;

const toCapabilityProjectRecord = (value: unknown): CapabilityProjectRecord | null => {
  if (!isRecord(value)) {
    return null;
  }
  const href = asNonEmptyString(value.href);
  if (!href || !href.startsWith("/")) {
    return null;
  }
  const diagrams = value.diagrams;
  const technologies = value.technologiesUsed;
  return {
    href,
    name: asNonEmptyString(value.name) ?? href.replace(/^\/+/, ""),
    type: asNonEmptyString(value.type) ?? undefined,
    terminalDemoMediaType: isRecord(value.terminalDemo)
      ? (asNonEmptyString(value.terminalDemo.mediaType) ?? undefined)
      : undefined,
    hasDiagrams: Array.isArray(diagrams) && diagrams.length > 0,
    hasTechnologies: Array.isArray(technologies) && technologies.length > 0,
    hasInterestsMeWhy: Boolean(asNonEmptyString(value.interestsMeWhy)),
  };
};

const toProjectFeatures = (project: CapabilityProjectRecord): string[] => {
  const features = new Set<string>();
  if (project.type === "presentation") {
    features.add("presentation");
  }
  if (project.terminalDemoMediaType) {
    features.add(`demo-${project.terminalDemoMediaType}`);
  }
  if (project.hasDiagrams) {
    features.add("architecture-diagrams");
  }
  if (project.hasTechnologies) {
    features.add("technology-overview");
  }
  if (project.hasInterestsMeWhy) {
    features.add("why-this-interests-me");
  }
  return Array.from(features);
};

const toProjectDataSources = (project: CapabilityProjectRecord): string[] => {
  const sources = new Set<string>(["resume-data.projects"]);
  if (project.terminalDemoMediaType) {
    sources.add("public-media-assets");
  }
  if (project.hasDiagrams) {
    sources.add("mermaid-diagram-content");
  }
  if (project.hasTechnologies) {
    sources.add("resume-data.technologiesUsed");
  }
  if (project.hasInterestsMeWhy) {
    sources.add("resume-data.interestsMeWhy");
  }
  return Array.from(sources);
};

const toQualityCoverage = (kind: AppCapabilityKind, isPresentationProject: boolean): string[] => {
  const coverage = new Set<string>(["typecheck", "lint", "file-budgets", "bundle-budgets"]);
  if (kind === "project") {
    coverage.add("resume-schema-validation");
    coverage.add("presentation-routing-contracts");
  }
  if (isPresentationProject) {
    coverage.add("media-integration-tests");
    coverage.add("diagram-hydration-tests");
    coverage.add("pager-a11y-tests");
  }
  return Array.from(coverage);
};

export function getAppCapabilityRegistry(): AppCapability[] {
  const capabilities: AppCapability[] = [];
  const drawerLabelByHref = new Map(
    navigation.drawerItems
      .filter(
        (item) =>
          typeof item.href === "string" &&
          typeof item.label === "string" &&
          item.href.trim().startsWith("/") &&
          item.href.trim().length > 0 &&
          item.label.trim().length > 0,
      )
      .map((item) => [item.href.trim(), item.label.trim()] as const),
  );

  getPortfolioAppRouteEntries(portfolioApps).forEach(([routeKey, routeContract]) => {
    const href = routeContract.route.trim();
    const isInDrawer = drawerLabelByHref.has(href);
    const coreComponent =
      "coreComponent" in routeContract ? (routeContract.coreComponent ?? undefined) : undefined;
    const coreComponentTarget =
      "coreComponentTarget" in routeContract
        ? (routeContract.coreComponentTarget ?? undefined)
        : undefined;

    const features = new Set<string>([
      "launchable-app",
      isInDrawer ? "drawer-visible" : "drawer-hidden",
    ]);
    if (typeof coreComponent === "string" && coreComponent.trim()) {
      features.add(`core-component-${normalizeFeature(coreComponent)}`);
    }
    if (typeof coreComponentTarget === "string" && coreComponentTarget.trim()) {
      features.add(`core-target-${normalizeFeature(coreComponentTarget)}`);
    }

    const dataSources = new Set<string>([
      "resume-data.portfolioApps",
      "app-local-state",
      "app-local-assets",
    ]);
    if (isInDrawer) {
      dataSources.add("resume-data.navigation.drawerItems");
    }

    capabilities.push({
      id: `app:${href}`,
      href,
      label: resolveCapabilityLabel({
        routeKey,
        routeContract,
        drawerLabelByHref,
      }),
      kind: "app",
      commandGroup: resolveCommandGroup(href, "app", routeContract),
      isPresentationProject: false,
      features: Array.from(features),
      dataSources: Array.from(dataSources),
      qualityCoverage: toQualityCoverage("app", false),
    });
  });

  projects
    .map(toCapabilityProjectRecord)
    .filter((project): project is CapabilityProjectRecord => Boolean(project))
    .forEach((project) => {
      const href = project.href;
      capabilities.push({
        id: `project:${href}`,
        href,
        label: project.name,
        kind: "project",
        commandGroup: resolveCommandGroup(href, "project"),
        isPresentationProject: project.type === "presentation",
        features: toProjectFeatures(project),
        dataSources: toProjectDataSources(project),
        qualityCoverage: toQualityCoverage("project", project.type === "presentation"),
      });
    });

  const deduped = new Map<string, AppCapability>();
  capabilities.forEach((entry) => {
    const dedupeKey = `${entry.kind}:${entry.href}`;
    const existing = deduped.get(dedupeKey);
    if (!existing) {
      deduped.set(dedupeKey, entry);
      return;
    }
    deduped.set(dedupeKey, {
      ...existing,
      features: Array.from(
        new Set([...existing.features, ...entry.features].map(normalizeFeature)),
      ),
      dataSources: Array.from(new Set([...existing.dataSources, ...entry.dataSources])),
      qualityCoverage: Array.from(new Set([...existing.qualityCoverage, ...entry.qualityCoverage])),
    });
  });

  return Array.from(deduped.values());
}

export function resolveProjectLaunchHref(project: Pick<ProjectData, "href">): string {
  return project.href?.trim() || "/";
}
