"use client";

import * as React from "react";
import Game from "./_Game";
import { ArcadeGamePage } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";
import "./page.css";

export default function WarbirdsPage() {
  const { portfolioApps } = useResumeData();
  const warbirdsRoute = getPortfolioAppRouteContract(portfolioApps, "warbirds");

  return (
    <ArcadeGamePage documentTitle={warbirdsRoute.documentTitle}>
      <Game />
    </ArcadeGamePage>
  );
}
