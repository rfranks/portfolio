import { notFound } from "next/navigation";
import ProjectShowcaseClientPage from "@/components/shared/content/ProjectShowcaseClientPage";
import { createProjectShowcaseMetadata } from "@/components/shared/content/ProjectShowcaseRoutePage";
import {
  createPresentationProjectPageData,
  getPresentationProjectSlugs,
} from "@/components/portfolio/projectPageData";

export const dynamicParams = false;

type ProjectRouteParams = {
  projectSlug: string;
};
type ProjectRouteProps = {
  params: Promise<ProjectRouteParams>;
};

export function generateStaticParams(): ProjectRouteParams[] {
  return getPresentationProjectSlugs().map((projectSlug) => ({ projectSlug }));
}

export async function generateMetadata({ params }: ProjectRouteProps) {
  const { projectSlug } = await params;
  const project = createPresentationProjectPageData(projectSlug);
  if (!project) {
    return {};
  }
  return createProjectShowcaseMetadata(project);
}

export default async function ProjectShowcaseDynamicPage({ params }: ProjectRouteProps) {
  const { projectSlug } = await params;
  const project = createPresentationProjectPageData(projectSlug);
  if (!project) {
    notFound();
  }

  return <ProjectShowcaseClientPage project={project} />;
}
