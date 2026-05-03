"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  getPortfolioAppLauncherConfig,
  type PortfolioAppRouteContract,
  type PortfolioAppRouteKey,
} from "@/utils/portfolio/routeContracts";
import { resolveAppLauncherTargetComponent } from "./appLauncherTargetRegistry";

type ArcadeIframeLauncherClientProps = {
  routeKey: PortfolioAppRouteKey;
  routeContract: PortfolioAppRouteContract;
};

export default function ArcadeIframeLauncherClient({
  routeKey,
  routeContract,
}: ArcadeIframeLauncherClientProps) {
  const { coreComponentTarget: targetId } = getPortfolioAppLauncherConfig(routeContract);
  const IframeComponent = targetId
    ? resolveAppLauncherTargetComponent({
        coreComponentId: "arcadeIframe",
        targetId,
      })
    : null;

  if (!IframeComponent) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
          Missing Arcade Iframe Launcher
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <code>coreComponent=arcadeIframe</code> has no launcher target mapping for{" "}
          <code>portfolioApps.{routeKey}.coreComponentTarget</code>.
        </Typography>
      </Box>
    );
  }

  return <IframeComponent />;
}
