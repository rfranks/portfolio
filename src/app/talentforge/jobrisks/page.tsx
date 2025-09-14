"use client";

import JobDescriptionRisk from "@/components/talentforge/JobDescriptionRisk";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

export default function JobRisksPage() {
  return (
    <ErrorBoundary>
      <JobDescriptionRisk />
    </ErrorBoundary>
  );
}

