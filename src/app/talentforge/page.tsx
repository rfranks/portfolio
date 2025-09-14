"use client";

import React from "react";
import Dashboard from "@/components/talentforge/Dashboard";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import OnboardingStepper, {
  TOTAL_ONBOARDING_STEPS,
} from "@/components/talentforge/OnboardingStepper";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import insertMockData from "@/utils/mockData";
import { getOnboardingStep } from "@/utils/talentforge/dataStore";

export default function TalentForgePage() {
  const { setDocumentTitle } = useDocumentTitle();
  const [step, setStep] = React.useState(getOnboardingStep());

  React.useEffect(() => {
    insertMockData();
    setDocumentTitle("TalentForge");
  }, [setDocumentTitle]);

  if (step < TOTAL_ONBOARDING_STEPS) {
    return <OnboardingStepper onComplete={() => setStep(TOTAL_ONBOARDING_STEPS)} />;
  }

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}

