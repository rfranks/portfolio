"use client";

import { Suspense } from "react";

import Inbox from "@/components/talentforge/Inbox";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

export default function InboxPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Inbox />
      </Suspense>
    </ErrorBoundary>
  );
}

