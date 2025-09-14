"use client";

import React from "react";
import Dashboard from "@/components/talentforge/Dashboard";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import insertMockData from "@/utils/mockData";

export default function TalentForgePage() {
  const { setDocumentTitle } = useDocumentTitle();

  React.useEffect(() => {
    insertMockData();
    setDocumentTitle("TalentForge");
  }, [setDocumentTitle]);

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}

