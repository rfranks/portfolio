import type { Metadata } from "next";
import HealthDashboardPageClient from "./HealthDashboardPageClient";
import { portfolioApps } from "@/consts/resumeData";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

const healthRoute = getPortfolioAppRouteContract(portfolioApps, "health");

export const metadata: Metadata = {
  title: healthRoute.metadataTitle,
  description: healthRoute.metadataDescription,
};

export default function HealthPage() {
  return <HealthDashboardPageClient />;
}
