"use client";

import { Suspense } from "react";

import Inbox from "@/app/talentforge/_components/Inbox";
import ErrorBoundary from "@/app/talentforge/_components/ErrorBoundary";

export default function InboxPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <Inbox />
      </Suspense>
    </ErrorBoundary>
  );
}
