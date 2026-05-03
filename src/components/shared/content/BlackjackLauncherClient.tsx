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

type BlackjackLauncherClientProps = {
  routeKey: PortfolioAppRouteKey;
  routeContract: PortfolioAppRouteContract;
};

export default function BlackjackLauncherClient({
  routeKey,
  routeContract,
}: BlackjackLauncherClientProps) {
  const { coreComponentTarget: targetId } = getPortfolioAppLauncherConfig(routeContract);
  const BlackjackPageClient = targetId
    ? resolveAppLauncherTargetComponent({
        coreComponentId: "blackjack",
        targetId,
      })
    : null;

  if (!BlackjackPageClient) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.75 }}>
          Launcher Mismatch
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <code>coreComponent=blackjack</code> has no launcher target mapping for{" "}
          <code>portfolioApps.{routeKey}.coreComponentTarget</code>.
        </Typography>
      </Box>
    );
  }

  return <BlackjackPageClient />;
}
