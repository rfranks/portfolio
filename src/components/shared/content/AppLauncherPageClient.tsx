"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useResumeData } from "@/providers/ResumeDataProvider";
import {
  getPortfolioAppRouteContract,
  getPortfolioAppLauncherConfig,
  type PortfolioAppRouteKey,
} from "@/utils/portfolio/routeContracts";
import { resolveAppLauncherCoreComponent } from "./appLauncherCoreRegistry";

type AppLauncherPageClientProps = {
  routeKey: PortfolioAppRouteKey;
};

export default function AppLauncherPageClient({ routeKey }: AppLauncherPageClientProps) {
  const { portfolioApps } = useResumeData();
  const routeContract = getPortfolioAppRouteContract(portfolioApps, routeKey);
  const { coreComponent, coreComponentTarget } = getPortfolioAppLauncherConfig(routeContract);
  const CoreComponent = coreComponent ? resolveAppLauncherCoreComponent(coreComponent) : null;

  if (!coreComponentTarget || !CoreComponent) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.75 }}>
          Missing App Launcher Contract
        </Typography>
        <Typography variant="body2" color="text.secondary">
          <code>portfolioApps.{routeKey}.coreComponent</code> and{" "}
          <code>portfolioApps.{routeKey}.coreComponentTarget</code> must map to a registered
          launcher component.
        </Typography>
      </Box>
    );
  }

  return <CoreComponent routeKey={routeKey} routeContract={routeContract} />;
}
