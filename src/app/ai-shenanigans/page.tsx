import type { Metadata } from "next";
import AIShenanigansPageClient from "./AIShenanigansPageClient";
import { portfolioApps } from "@/consts/resumeData";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

const aiShenanigansRoute = getPortfolioAppRouteContract(portfolioApps, "aiShenanigans");

export const metadata: Metadata = {
  title: aiShenanigansRoute.metadataTitle,
  description: aiShenanigansRoute.metadataDescription,
};

export default function AIShenanigansPage() {
  return <AIShenanigansPageClient />;
}
