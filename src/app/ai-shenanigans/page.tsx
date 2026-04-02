import type { Metadata } from "next";
import AIShenanigansPageClient from "./AIShenanigansPageClient";
import { portfolioApps } from "@/consts/resumeData";

export const metadata: Metadata = {
  title: portfolioApps.aiShenanigans.metadataTitle,
  description: portfolioApps.aiShenanigans.metadataDescription,
};

export default function AIShenanigansPage() {
  return <AIShenanigansPageClient />;
}
