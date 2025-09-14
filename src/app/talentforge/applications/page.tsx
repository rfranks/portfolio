"use client";

import JobApplications from "@/components/talentforge/JobApplications";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

export default function ApplicationsPage() {
  return (
    <ErrorBoundary>
      <JobApplications />
    </ErrorBoundary>
  );
}

