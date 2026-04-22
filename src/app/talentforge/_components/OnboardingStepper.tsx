"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Box, Button, Step, StepLabel, Stepper, Typography } from "@mui/material";

import {
  getOnboardingStep,
  setOnboardingStep,
  clearOnboardingStep,
} from "@/app/talentforge/_utils/dataStore";

import KeyEntryStep from "./onboarding/KeyEntryStep";
import PersonalInfoStep from "./onboarding/PersonalInfoStep";
import ResumeImportStep from "./onboarding/ResumeImportStep";
import ResumePreviewStep from "./onboarding/ResumePreviewStep";
import ConnectorMockStep from "./onboarding/ConnectorMockStep";
import DemoDataStep from "./onboarding/DemoDataStep";
import CompensationStep from "./onboarding/CompensationStep";
import GoalSelectionStep from "./onboarding/GoalSelectionStep";

type OnboardingStepComponent = ComponentType<{
  onNext: () => void;
  onBack?: () => void;
}>;

const steps: Array<{
  label: string;
  ariaLabel: string;
  Component: OnboardingStepComponent;
}> = [
  {
    label: "Connect OpenAI",
    ariaLabel: "Step 1 of 8: Connect your OpenAI API key",
    Component: KeyEntryStep,
  },
  {
    label: "Add Your Name",
    ariaLabel: "Step 2 of 8: Provide your first and last name",
    Component: PersonalInfoStep,
  },
  {
    label: "Upload Resume",
    ariaLabel: "Step 3 of 8: Upload your resume",
    Component: ResumeImportStep,
  },
  {
    label: "Review Resume",
    ariaLabel: "Step 4 of 8: Review your imported resume",
    Component: ResumePreviewStep,
  },
  {
    label: "Sync Connectors",
    ariaLabel: "Step 5 of 8: Sync the mock connector",
    Component: ConnectorMockStep,
  },
  {
    label: "Demo Data",
    ariaLabel: "Step 6 of 8: Toggle demo data",
    Component: DemoDataStep,
  },
  {
    label: "Current Compensation",
    ariaLabel: "Step 7 of 8: Enter your current compensation",
    Component: CompensationStep,
  },
  {
    label: "Choose Goals",
    ariaLabel: "Step 8 of 8: Choose your goals",
    Component: GoalSelectionStep,
  },
];

export const TOTAL_ONBOARDING_STEPS = steps.length;

export default function OnboardingStepper({ onComplete }: { onComplete?: () => void }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const step = getOnboardingStep();
    setActiveStep(step);
    setOnboardingStep(step);
  }, []);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => {
      const next = prevActiveStep + 1;
      setOnboardingStep(next);
      if (next === TOTAL_ONBOARDING_STEPS) onComplete?.();
      return next;
    });
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => {
      const next = prevActiveStep - 1;
      setOnboardingStep(next);
      return next;
    });
  };

  const handleReset = () => {
    clearOnboardingStep();
    setActiveStep(0);
  };

  const Current = steps[activeStep]?.Component;
  const stepLabelId = activeStep < steps.length ? `onboarding-step-label-${activeStep}` : undefined;
  const stepPanelId = activeStep < steps.length ? `onboarding-step-panel-${activeStep}` : undefined;

  const stepperAriaLabel = useMemo(
    () =>
      `TalentForge onboarding progress, step ${Math.min(activeStep + 1, steps.length)} of ${steps.length}`,
    [activeStep],
  );

  return (
    <Box>
      <Stepper
        component="nav"
        activeStep={activeStep}
        alternativeLabel
        aria-label={stepperAriaLabel}
      >
        {steps.map((step, index) => (
          <Step key={step.label} aria-label={step.ariaLabel}>
            <StepLabel
              id={`onboarding-step-label-${index}`}
              aria-label={step.ariaLabel}
              aria-current={activeStep === index ? "step" : undefined}
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length ? (
        <Box sx={{ mt: 3 }} role="status" aria-live="polite">
          <Typography tabIndex={0}>
            All steps completed — you&apos;re ready to explore TalentForge.
          </Typography>
          <Button sx={{ mt: 1 }} onClick={handleReset} aria-label="Restart onboarding">
            Reset
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 3 }} role="region" id={stepPanelId} aria-labelledby={stepLabelId}>
          {Current && <Current onNext={handleNext} onBack={handleBack} />}
        </Box>
      )}
    </Box>
  );
}
