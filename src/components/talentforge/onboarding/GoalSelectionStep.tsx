"use client";

import { useState } from "react";
import { Button, Checkbox, FormControlLabel, Stack } from "@mui/material";
import FocusTrap from "@mui/base/FocusTrap";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function GoalSelectionStep({ onNext, onBack }: StepProps) {
  const [goals, setGoals] = useState({
    resume: false,
    networking: false,
    search: false,
  });

  const handleChange = (key: "resume" | "networking" | "search") => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setGoals((g) => ({ ...g, [key]: event.target.checked }));
  };

  const hasGoal = Object.values(goals).some(Boolean);

  return (
    <FocusTrap open>
      <Stack spacing={2} aria-label="Select goals">
        <FormControlLabel
          control={
            <Checkbox
              checked={goals.resume}
              onChange={handleChange("resume")}
              inputProps={{ "aria-label": "Improve resume" }}
            />
          }
          label="Improve resume"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={goals.networking}
              onChange={handleChange("networking")}
              inputProps={{ "aria-label": "Enhance networking" }}
            />
          }
          label="Enhance networking"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={goals.search}
              onChange={handleChange("search")}
              inputProps={{ "aria-label": "Streamline job search" }}
            />
          }
          label="Streamline job search"
        />
        <Stack direction="row" spacing={1}>
          {onBack && (
            <Button onClick={onBack} aria-label="Back">
              Back
            </Button>
          )}
          <Button
            variant="contained"
            onClick={onNext}
            disabled={!hasGoal}
            aria-label="Finish"
          >
            Finish
          </Button>
        </Stack>
      </Stack>
    </FocusTrap>
  );
}

