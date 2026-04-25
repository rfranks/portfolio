import type { Metadata } from "next";
import RickbertPageClient from "./RickbertPageClient";
import "./page.css";
import { portfolioApps } from "@/consts/resumeData";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

const rickbertRoute = getPortfolioAppRouteContract(portfolioApps, "rickbert");

export const metadata: Metadata = {
  title: rickbertRoute.metadataTitle,
  description: rickbertRoute.metadataDescription,
};

export default function RickbertPage() {
  return <RickbertPageClient />;
}
