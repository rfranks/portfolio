"use client";

import ScreenRole from "@/app/talentforge/_components/ScreenRole";
import ErrorBoundary from "@/app/talentforge/_components/ErrorBoundary";

export default function ScreenRolePage() {
  return (
    <ErrorBoundary>
      <ScreenRole />
    </ErrorBoundary>
  );
}

