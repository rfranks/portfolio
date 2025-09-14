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
  "Enter Key",
  "Import Resume",
  "Connect Accounts",
  "Select Goal",
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

  const renderStep = () => {
    switch (activeStep) {
      case 0:
        return <KeyEntryStep onNext={handleNext} />;
      case 1:
        return <ResumeImportStep onNext={handleNext} />;
      case 2:
        return <ConnectorMockStep onNext={handleNext} />;
      case 3:
        return <GoalSelectionStep onFinish={handleNext} />;
      default:
        return null;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel aria-label="onboarding steps">
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length ? (
        <Box sx={{ mt: 2 }}>
          <Typography>All steps completed - you're finished</Typography>
          <Button sx={{ mt: 1 }} onClick={handleReset} aria-label="reset onboarding">
            Reset
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          {renderStep()}
          {activeStep > 0 && (
            <Button onClick={handleBack} sx={{ mt: 2 }} aria-label="back">
              Back
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}

