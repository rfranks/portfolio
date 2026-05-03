import type { ResumeData } from "@/consts/resumeData";

export type PortfolioAppsContract = ResumeData["portfolioApps"];
export type PortfolioAppRouteKey = Exclude<keyof PortfolioAppsContract, "site">;
export type PortfolioAppRouteContract<K extends PortfolioAppRouteKey = PortfolioAppRouteKey> =
  PortfolioAppsContract[K];

const isPortfolioAppRouteKey = (value: string): value is PortfolioAppRouteKey => value !== "site";

export function getPortfolioAppRouteContract<K extends PortfolioAppRouteKey>(
  portfolioApps: PortfolioAppsContract,
  routeKey: K,
): PortfolioAppRouteContract<K> {
  return portfolioApps[routeKey];
}

export function getPortfolioAppRouteEntries(
  portfolioApps: PortfolioAppsContract,
): Array<[PortfolioAppRouteKey, PortfolioAppRouteContract]> {
  return Object.entries(portfolioApps).flatMap(([routeKey, routeContract]) =>
    isPortfolioAppRouteKey(routeKey)
      ? [[routeKey, routeContract as PortfolioAppRouteContract]]
      : [],
  );
}

export function resolvePortfolioAppRouteBySlug(
  portfolioApps: PortfolioAppsContract,
  slug: string,
): { routeKey: PortfolioAppRouteKey; routeContract: PortfolioAppRouteContract } | null {
  const normalizedRoute = `/${slug.replace(/^\/+/, "")}`;
  const matched = getPortfolioAppRouteEntries(portfolioApps).find(
    ([, routeContract]) => routeContract.route === normalizedRoute,
  );

  if (!matched) {
    return null;
  }

  return {
    routeKey: matched[0],
    routeContract: matched[1],
  };
}

export function getPortfolioAppPageMetadata<K extends PortfolioAppRouteKey>(
  portfolioApps: PortfolioAppsContract,
  routeKey: K,
): {
  title: string;
  description: string;
} {
  const routeContract = getPortfolioAppRouteContract(portfolioApps, routeKey);
  const metadataTitle =
    "metadataTitle" in routeContract ? (routeContract.metadataTitle ?? undefined) : undefined;
  const metadataDescription =
    "metadataDescription" in routeContract
      ? (routeContract.metadataDescription ?? undefined)
      : undefined;

  return {
    title: metadataTitle ?? routeContract.documentTitle,
    description: metadataDescription ?? routeContract.documentTitle,
  };
}

export function getPortfolioAppLauncherConfig(routeContract: PortfolioAppRouteContract): {
  coreComponent?: string;
  coreComponentTarget?: string;
} {
  const coreComponent = "coreComponent" in routeContract ? routeContract.coreComponent : undefined;
  const coreComponentTarget =
    "coreComponentTarget" in routeContract ? routeContract.coreComponentTarget : undefined;

  return {
    coreComponent: coreComponent?.trim() || undefined,
    coreComponentTarget: coreComponentTarget?.trim() || undefined,
  };
}
