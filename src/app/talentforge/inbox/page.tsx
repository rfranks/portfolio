"use client";

import Inbox from "@/components/talentforge/Inbox";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

export default function InboxPage() {
  return (
    <ErrorBoundary>
      <Inbox />
    </ErrorBoundary>
  );
}

