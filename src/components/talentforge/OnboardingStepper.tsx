"use client";

import { useEffect, useState } from "react";
import { Box, Button, Step, StepLabel, Stepper, Typography } from "@mui/material";

const steps = ["Profile Info", "Upload Resume", "Connect Accounts", "Finish"];

export default function OnboardingStepper() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("onboardingStep");
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!Number.isNaN(parsed)) {
          setActiveStep(parsed);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("onboardingStep", activeStep.toString());
    }
  }, [activeStep]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("onboardingStep");
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      {activeStep === steps.length ? (
        <Box sx={{ mt: 2 }}>
          <Typography>All steps completed - you&apos;re finished</Typography>
          <Button sx={{ mt: 1 }} onClick={handleReset}>
            Reset
          </Button>
        </Box>
      ) : (
        <Box sx={{ mt: 2 }}>
          <Typography sx={{ mb: 1 }}>{steps[activeStep]}</Typography>
          <Box>
            <Button disabled={activeStep === 0} onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
            <Button variant="contained" onClick={handleNext}>
              {activeStep === steps.length - 1 ? "Finish" : "Next"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}

