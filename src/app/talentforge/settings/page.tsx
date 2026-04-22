"use client";

import Settings from "@/app/talentforge/_components/Settings";
import ErrorBoundary from "@/app/talentforge/_components/ErrorBoundary";

export default function TalentForgeSettingsPage() {
  return (
    <ErrorBoundary>
      <Settings />
    </ErrorBoundary>
  );
}
