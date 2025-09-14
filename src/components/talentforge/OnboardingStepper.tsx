"use client";

import { useEffect, useState } from "react";
import { Box, Step, StepLabel, Stepper, Typography } from "@mui/material";
import TrapFocus from "@mui/material/Unstable_TrapFocus";

import {
  getOnboardingStep,
  setOnboardingStep,
  clearOnboardingStep,
} from "@/utils/talentforge/dataStore";
import KeyEntryStep from "./onboarding/KeyEntryStep";
import ResumeImportStep from "./onboarding/ResumeImportStep";
import ConnectorMockStep from "./onboarding/ConnectorMockStep";
import GoalSelectionStep from "./onboarding/GoalSelectionStep";

const stepConfigs = [
  { label: "Enter Key", Component: KeyEntryStep },
  { label: "Import Resume", Component: ResumeImportStep },
  { label: "Connect Accounts", Component: ConnectorMockStep },
  { label: "Set Goals", Component: GoalSelectionStep },
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

  if (activeStep >= stepConfigs.length) {
    return (
      <Box sx={{ mt: 2 }}>
        <Typography>All steps completed - you&apos;re finished</Typography>
        <Box sx={{ mt: 1 }}>
          <Typography
            role="button"
            tabIndex={0}
            onClick={handleReset}
            onKeyDown={(e) => e.key === "Enter" && handleReset()}
            sx={{ cursor: "pointer", color: "primary.main" }}
            aria-label="reset onboarding"
          >
            Reset
          </Typography>
        </Box>
      </Box>
    );
  }

  const { Component } = stepConfigs[activeStep];

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel aria-label="onboarding steps">
        {stepConfigs.map((s) => (
          <Step key={s.label} aria-label={s.label}>
            <StepLabel>{s.label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      <TrapFocus open>
        <Box sx={{ mt: 2 }} aria-label="onboarding step">
          <Component onNext={handleNext} onBack={handleBack} />
        </Box>
      </TrapFocus>
    </Box>
  );
}

