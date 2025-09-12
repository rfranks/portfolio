"use client";

import * as React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";

import ResumeUploader from "./ResumeUploader";
import { setOpenAIKey } from "@/utils/talentforge/utils";

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

const steps = ["API Key", "Upload Resume", "Connect Accounts"];

export default function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const [activeStep, setActiveStep] = React.useState(0);
  const [apiKey, setApiKey] = React.useState("");
  const [resumeUploaded, setResumeUploaded] = React.useState(false);
  const [linkedInConnected, setLinkedInConnected] = React.useState(false);
  const [githubConnected, setGithubConnected] = React.useState(false);

  const handleNext = () => {
    if (activeStep === 0) {
      setOpenAIKey(apiKey.trim());
    }
    if (activeStep === steps.length - 1) {
      if (typeof window !== "undefined") {
        window.localStorage.setItem("talentforge:onboardingComplete", "true");
      }
      onClose();
      setActiveStep(0);
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box component="form" sx={{ mt: 2 }}>
            <Typography gutterBottom>
              Enter your OpenAI API key to enable AI features.
            </Typography>
            <TextField
              label="OpenAI API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              fullWidth
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography gutterBottom>Upload your resume.</Typography>
            <ResumeUploader onResumeUpload={() => setResumeUploaded(true)} />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography gutterBottom>Connect your accounts.</Typography>
            <Button
              variant={linkedInConnected ? "contained" : "outlined"}
              onClick={() => setLinkedInConnected((prev) => !prev)}
            >
              {linkedInConnected ? "LinkedIn Connected" : "Connect LinkedIn"}
            </Button>
            <Button
              variant={githubConnected ? "contained" : "outlined"}
              onClick={() => setGithubConnected((prev) => !prev)}
            >
              {githubConnected ? "GitHub Connected" : "Connect GitHub"}
            </Button>
          </Box>
        );
      default:
        return null;
    }
  };

  const handleClose = () => {
    onClose();
    setActiveStep(0);
  };

  const nextDisabled =
    (activeStep === 0 && !apiKey.trim()) ||
    (activeStep === 1 && !resumeUploaded);

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Get Started</DialogTitle>
      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ pt: 2, pb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        {renderStepContent(activeStep)}
      </DialogContent>
      <DialogActions>
        {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
        <Button onClick={handleNext} disabled={nextDisabled}>
          {activeStep === steps.length - 1 ? "Finish" : "Next"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

