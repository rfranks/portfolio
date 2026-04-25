import type { Metadata } from "next";
import CapabilitiesPageClient from "./CapabilitiesPageClient";
import { portfolioApps } from "@/consts/resumeData";
import { getPortfolioAppPageMetadata } from "@/utils/portfolio/routeContracts";

const capabilitiesMetadata = getPortfolioAppPageMetadata(portfolioApps, "capabilities");

export const metadata: Metadata = {
  title: capabilitiesMetadata.title,
  description: capabilitiesMetadata.description,
};

export default function CapabilitiesPage() {
  return <CapabilitiesPageClient />;
}
