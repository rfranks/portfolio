"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { ArcadeGamePage } from "@/components/shared";
import {
  getPortfolioAppLauncherConfig,
  type PortfolioAppRouteContract,
  type PortfolioAppRouteKey,
} from "@/utils/portfolio/routeContracts";
import { resolveAppLauncherTargetComponent } from "./appLauncherTargetRegistry";

type ArcadeCanvasLauncherClientProps = {
  routeKey: PortfolioAppRouteKey;
  routeContract: PortfolioAppRouteContract;
};

export default function ArcadeCanvasLauncherClient({
  routeKey,
  routeContract,
}: ArcadeCanvasLauncherClientProps) {
  const { coreComponentTarget: targetId } = getPortfolioAppLauncherConfig(routeContract);
  const GameComponent = targetId
    ? resolveAppLauncherTargetComponent({
        coreComponentId: "arcadeCanvas",
        targetId,
      })
    : null;

  if (!GameComponent) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
          Missing Arcade Canvas Launcher
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <code>coreComponent=arcadeCanvas</code> has no launcher target mapping for{" "}
          <code>portfolioApps.{routeKey}.coreComponentTarget</code>.
        </Typography>
      </Box>
    );
  }

  return (
    <ArcadeGamePage documentTitle={routeContract.documentTitle}>
      <GameComponent />
    </ArcadeGamePage>
  );
}
