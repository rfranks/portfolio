"use client";

import React from "react";
import Dashboard from "@/app/talentforge/_components/Dashboard";
import ErrorBoundary from "@/app/talentforge/_components/ErrorBoundary";
import OpenAIKeyInterstitial from "@/app/talentforge/_components/OpenAIKeyInterstitial";
import OnboardingStepper, {
  TOTAL_ONBOARDING_STEPS,
} from "@/app/talentforge/_components/OnboardingStepper";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import { useOpenAIKey } from "@/contexts/OpenAIKeyContext";
import insertMockData from "@/app/talentforge/_utils/mockData";
import { getOnboardingStep } from "@/app/talentforge/_utils/dataStore";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";

export default function TalentForgePage() {
  const { portfolioApps } = useResumeData();
  const talentforgeRoute = getPortfolioAppRouteContract(portfolioApps, "talentforge");
  const { setDocumentTitle } = useDocumentTitle();
  const [step, setStep] = React.useState(getOnboardingStep());
  const { hasKey } = useOpenAIKey();

  React.useEffect(() => {
    insertMockData();
    setDocumentTitle(talentforgeRoute.documentTitle);
  }, [setDocumentTitle, talentforgeRoute.documentTitle]);

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
