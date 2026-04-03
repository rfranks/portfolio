import type { Metadata } from "next";
import PageClient from "./PageClient";
import { projectData } from "./project";

export const metadata: Metadata = {
  title: `${projectData.project} Project`,
  description: projectData.description,
};

export default function Page() {
  return <PageClient project={projectData} />;
}
