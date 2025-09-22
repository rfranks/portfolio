"use client";

import React from "react";
import Dashboard from "@/components/talentforge/Dashboard";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import OpenAIKeyInterstitial from "@/components/talentforge/OpenAIKeyInterstitial";
import OnboardingStepper, {
  TOTAL_ONBOARDING_STEPS,
} from "@/components/talentforge/OnboardingStepper";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";
import insertMockData from "@/utils/mockData";
import { getOnboardingStep } from "@/utils/talentforge/dataStore";

export default function TalentForgePage() {
  const { setDocumentTitle } = useDocumentTitle();
  const [step, setStep] = React.useState(getOnboardingStep());
  const { hasKey } = useOpenAIKey();

  React.useEffect(() => {
    insertMockData();
    setDocumentTitle("TalentForge");
  }, [setDocumentTitle]);

  if (!hasKey) {
    return <OpenAIKeyInterstitial />;
  }

  if (step < TOTAL_ONBOARDING_STEPS) {
    return <OnboardingStepper onComplete={() => setStep(TOTAL_ONBOARDING_STEPS)} />;
  }

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}

