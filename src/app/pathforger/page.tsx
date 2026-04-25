import type { Metadata } from "next";
import PathForgerPageClient from "./PathForgerPageClient";
import { portfolioApps } from "@/consts/resumeData";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";
import "./page.css";

const pathforgerRoute = getPortfolioAppRouteContract(portfolioApps, "pathforger");

export const metadata: Metadata = {
  title: pathforgerRoute.metadataTitle,
  description: pathforgerRoute.metadataDescription,
};

export default function PathForgerPage() {
  return <PathForgerPageClient />;
}
