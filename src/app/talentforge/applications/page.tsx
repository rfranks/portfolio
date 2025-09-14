"use client";

import ApplicationBoard from "@/components/talentforge/ApplicationBoard";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

export default function ApplicationsPage() {
  return (
    <ErrorBoundary>
      <ApplicationBoard />
    </ErrorBoundary>
  );
}

