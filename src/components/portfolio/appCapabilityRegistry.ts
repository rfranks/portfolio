import { navigation, projects } from "@/consts/resumeData";
import type { ProjectData } from "@/types/components/portfolio";

export type AppCapabilityKind = "app" | "project";

export type AppCapability = {
  id: string;
  href: string;
  label: string;
  kind: AppCapabilityKind;
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

  navigation.drawerItems
    .filter(
      (item) => item.href?.trim() && item.href.trim().startsWith("/") && item.href.trim() !== "/",
    )
    .forEach((item) => {
      capabilities.push({
        id: `app:${item.href.trim()}`,
        href: item.href.trim(),
        label: item.label.trim(),
        kind: "app",
        isPresentationProject: false,
        features: ["launchable-app"],
        dataSources: ["resume-data.navigation", "app-local-state", "app-local-assets"],
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
