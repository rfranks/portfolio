"use client";

import Settings from "@/components/talentforge/Settings";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

export default function TalentForgeSettingsPage() {
  return (
    <ErrorBoundary>
      <Settings />
    </ErrorBoundary>
  );
}

