"use client";

import ResumeManager from "@/components/talentforge/ResumeManager";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

export default function ResumesPage() {
  return (
    <ErrorBoundary>
      <ResumeManager />
    </ErrorBoundary>
  );
}

