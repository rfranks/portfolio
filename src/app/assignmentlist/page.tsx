import type { Metadata } from "next";
import PageClient from "./PageClient";
import { projectData } from "./project";

export const metadata: Metadata = {
  title: "Patient Assignment List Project",
  description: "Powerpoint-style presentation for the Patient List project",
};

export default function Page() {
  return <PageClient project={projectData} />;
}
