"use client";

import * as React from "react";
import { LandingAppBar, type LandingAppBarProps } from "@/components/shared";

export type AppAppBarProps = Omit<LandingAppBarProps, "appWordmark" | "logoSrc" | "logoAlt">;

export default function AppAppBar({ mode, toggleColorMode }: AppAppBarProps) {
  return (
    <LandingAppBar
      mode={mode}
      toggleColorMode={toggleColorMode}
      appWordmark="bookworm"
      logoSrc="/apps/bookworm/images/logo192.png"
      logoAlt="bookworm logo"
    />
  );
}
