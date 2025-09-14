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
import GoalSelectionStep from "./onboarding/GoalSelectionStep";

const steps = [
  { label: "Enter API Key", Component: KeyEntryStep },
  { label: "Import Resume", Component: ResumeImportStep },
  { label: "Connect Accounts", Component: ConnectorMockStep },
  { label: "Select Goals", Component: GoalSelectionStep },
];

export default function OnboardingStepper() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    setActiveStep(getOnboardingStep());
  }, []);

  useEffect(() => {
    setOnboardingStep(activeStep);
  }, [activeStep]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    clearOnboardingStep();
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

