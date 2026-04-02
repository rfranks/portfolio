"use client";

import React from "react";
import Dashboard from "@/app/talentforge/_components/Dashboard";
import ErrorBoundary from "@/app/talentforge/_components/ErrorBoundary";
import OpenAIKeyInterstitial from "@/app/talentforge/_components/OpenAIKeyInterstitial";
import OnboardingStepper, {
  TOTAL_ONBOARDING_STEPS,
} from "@/app/talentforge/_components/OnboardingStepper";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";
import insertMockData from "@/app/talentforge/_utils/mockData";
import { getOnboardingStep } from "@/app/talentforge/_utils/dataStore";
import { portfolioApps } from "@/consts/resumeData";

export default function TalentForgePage() {
  const { setDocumentTitle } = useDocumentTitle();
  const [step, setStep] = React.useState(getOnboardingStep());
  const { hasKey } = useOpenAIKey();

  React.useEffect(() => {
    insertMockData();
    setDocumentTitle(portfolioApps.talentforge.documentTitle);
  }, [setDocumentTitle]);

  if (!hasKey) {
    return <OpenAIKeyInterstitial />;
  }

  if (step < TOTAL_ONBOARDING_STEPS) {
    return (
      <OnboardingStepper onComplete={() => setStep(TOTAL_ONBOARDING_STEPS)} />
    );
  }

  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
  );
}
