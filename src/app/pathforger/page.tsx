import type { Metadata } from "next";
import PathForgerPageClient from "./PathForgerPageClient";
import { portfolioApps } from "@/consts/resumeData";
import "./page.css";

export const metadata: Metadata = {
  title: portfolioApps.pathforger.metadataTitle,
  description: portfolioApps.pathforger.metadataDescription,
};

export default function PathForgerPage() {
  return <PathForgerPageClient />;
}
