"use client";

import { useEffect, useState } from "react";
import { Box, Button, Step, StepLabel, Stepper, Typography } from "@mui/material";

import {
  getOnboardingStep,
  setOnboardingStep,
  clearOnboardingStep,
} from "@/utils/talentforge/dataStore";

import KeyEntryStep from "./onboarding/KeyEntryStep";
import ResumeImportStep from "./onboarding/ResumeImportStep";
import ConnectorMockStep from "./onboarding/ConnectorMockStep";
import CompensationStep from "./onboarding/CompensationStep";
import GoalSelectionStep from "./onboarding/GoalSelectionStep";

const steps = [
  { label: "Enter API Key", Component: KeyEntryStep },
  { label: "Import Resume", Component: ResumeImportStep },
  { label: "Connect Accounts", Component: ConnectorMockStep },
  { label: "Enter Compensation", Component: CompensationStep },
  { label: "Select Goals", Component: GoalSelectionStep },
];

export const TOTAL_ONBOARDING_STEPS = steps.length;

export default function OnboardingStepper({
  onComplete,
}: {
  onComplete?: () => void;
}) {
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

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel aria-label="Onboarding steps">
        {steps.map((step) => (
          <Step key={step.label}>
            <StepLabel aria-label={step.label}>{step.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length ? (
        <Box sx={{ mt: 2 }}>
          <Typography tabIndex={0}>
            All steps completed - you&apos;re finished
          </Typography>
          <Button sx={{ mt: 1 }} onClick={handleReset} aria-label="Reset">
            Reset
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {Current && <Current onNext={handleNext} onBack={handleBack} />}
        </Box>
      )}
    </Box>
  );
}

