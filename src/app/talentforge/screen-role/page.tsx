"use client";

import ScreenRole from "@/components/talentforge/ScreenRole";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

export default function ScreenRolePage() {
  return (
    <ErrorBoundary>
      <ScreenRole />
    </ErrorBoundary>
  );
}

