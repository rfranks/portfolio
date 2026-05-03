import { notFound } from "next/navigation";
import { portfolioApps } from "@/consts/resumeData";
import AppLauncherPageClient from "@/components/shared/content/AppLauncherPageClient";
import ProjectShowcaseClientPage from "@/components/shared/content/ProjectShowcaseClientPage";
import { createProjectShowcaseMetadata } from "@/components/shared/content/ProjectShowcaseRoutePage";
import {
  createPresentationProjectPageData,
  getPresentationProjectSlugs,
} from "@/components/portfolio/projectPageData";
import {
  getPortfolioAppLauncherConfig,
  getPortfolioAppPageMetadata,
  getPortfolioAppRouteEntries,
  resolvePortfolioAppRouteBySlug,
} from "@/utils/portfolio/routeContracts";

export const dynamicParams = false;

const PRESENTATION_PROJECT_SLUGS = getPresentationProjectSlugs();
const APP_LAUNCHER_SLUGS = getPortfolioAppRouteEntries(portfolioApps)
  .filter(([routeKey, routeContract]) => {
    if (routeKey === "blackjack") {
      return false;
    }
    const launcherConfig = getPortfolioAppLauncherConfig(routeContract);
    return Boolean(launcherConfig.coreComponent && launcherConfig.coreComponentTarget);
  })
  .map(([, routeContract]) => routeContract.route.replace(/^\/+/, ""));
const COLLIDING_ROUTE_SLUGS = APP_LAUNCHER_SLUGS.filter((slug) =>
  PRESENTATION_PROJECT_SLUGS.includes(slug),
);

if (COLLIDING_ROUTE_SLUGS.length > 0) {
  throw new Error(
    `Route contract collision: app launcher slugs overlap presentation slugs: ${COLLIDING_ROUTE_SLUGS.join(", ")}`,
  );
}

type ProjectRouteParams = {
  projectSlug: string;
};
type ProjectRouteProps = {
  params: Promise<ProjectRouteParams>;
};

export function generateStaticParams(): ProjectRouteParams[] {
  const combinedSlugs = Array.from(new Set([...PRESENTATION_PROJECT_SLUGS, ...APP_LAUNCHER_SLUGS]));
  return combinedSlugs.map((projectSlug) => ({ projectSlug }));
}

export async function generateMetadata({ params }: ProjectRouteProps) {
  const { projectSlug } = await params;
  const appRouteMatch = resolvePortfolioAppRouteBySlug(portfolioApps, projectSlug);
  if (appRouteMatch && appRouteMatch.routeKey !== "blackjack") {
    const metadata = getPortfolioAppPageMetadata(portfolioApps, appRouteMatch.routeKey);
    return {
      title: metadata.title,
      description: metadata.description,
    };
  }

  const project = createPresentationProjectPageData(projectSlug);
  if (!project) {
    return {};
  }
  return createProjectShowcaseMetadata(project);
}

export default async function ProjectShowcaseDynamicPage({ params }: ProjectRouteProps) {
  const { projectSlug } = await params;
  const appRouteMatch = resolvePortfolioAppRouteBySlug(portfolioApps, projectSlug);
  if (appRouteMatch && appRouteMatch.routeKey !== "blackjack") {
    return <AppLauncherPageClient routeKey={appRouteMatch.routeKey} />;
  }

  const project = createPresentationProjectPageData(projectSlug);
  if (!project) {
    notFound();
  }

  return <ProjectShowcaseClientPage project={project} />;
}
