import type { ResumeData } from "@/consts/resumeData";

export type PortfolioAppsContract = ResumeData["portfolioApps"];
export type PortfolioAppRouteKey = Exclude<keyof PortfolioAppsContract, "site">;
export type PortfolioAppRouteContract<K extends PortfolioAppRouteKey = PortfolioAppRouteKey> =
  PortfolioAppsContract[K];

export function getPortfolioAppRouteContract<K extends PortfolioAppRouteKey>(
  portfolioApps: PortfolioAppsContract,
  routeKey: K,
): PortfolioAppRouteContract<K> {
  return portfolioApps[routeKey];
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
