import type { Metadata } from "next";
import SessionReplayPageClient from "./SessionReplayPageClient";
import { portfolioApps } from "@/consts/resumeData";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

const replayRoute = getPortfolioAppRouteContract(portfolioApps, "replay");

export const metadata: Metadata = {
  title: replayRoute.metadataTitle,
  description: replayRoute.metadataDescription,
};

export default function SessionReplayPage() {
  return <SessionReplayPageClient />;
}
