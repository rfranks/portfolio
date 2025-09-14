"use client";

import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import CoverLetter from "@/components/talentforge/CoverLetter";

export default function CoverLetterPage() {
  return (
    <ErrorBoundary>
      <CoverLetter />
    </ErrorBoundary>
  );
}

