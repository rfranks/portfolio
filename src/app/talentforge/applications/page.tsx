"use client";

import ApplicationBoard from "@/app/talentforge/_components/ApplicationBoard";
import ErrorBoundary from "@/app/talentforge/_components/ErrorBoundary";

export default function ApplicationsPage() {
  return (
    <ErrorBoundary>
      <ApplicationBoard />
    </ErrorBoundary>
  );
}

