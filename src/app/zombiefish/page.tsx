"use client";

import * as React from "react";
import Game from "./_Game";
import { ArcadeGamePage } from "@/components/shared";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";
import "./page.css";

export default function ZombieFishPage() {
  const { portfolioApps } = useResumeData();
  const zombiefishRoute = getPortfolioAppRouteContract(portfolioApps, "zombiefish");

  return (
    <ArcadeGamePage documentTitle={zombiefishRoute.documentTitle}>
      <Game />
    </ArcadeGamePage>
  );
}
