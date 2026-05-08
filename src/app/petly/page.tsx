import type { Metadata } from "next";
import { createProjectPageData } from "@/components/portfolio/projectPageData";
import ProjectShowcaseRoutePage, {
  createProjectShowcaseMetadata,
} from "@/components/shared/content/ProjectShowcaseRoutePage";

const petlyProject = createProjectPageData("/petly");

export const metadata: Metadata = createProjectShowcaseMetadata(petlyProject);

export default function PetlyPage() {
  return <ProjectShowcaseRoutePage project={petlyProject} />;
}
