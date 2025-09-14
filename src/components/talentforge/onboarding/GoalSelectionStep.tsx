"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Button, Checkbox, FormControlLabel, Stack } from "@mui/material";

interface GoalSelectionStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function GoalSelectionStep({ onNext, onBack }: GoalSelectionStepProps) {
  const [goals, setGoals] = useState({ job: false, resume: false, networking: false });
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const handleChange = (key: keyof typeof goals) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setGoals((g) => ({ ...g, [key]: e.target.checked }));
  };

  return (
    <Box aria-label="goal selection">
      <Stack spacing={1}>
        <FormControlLabel
          control={<Checkbox inputRef={firstRef} checked={goals.job} onChange={handleChange("job")} />}
          label="Find a new job"
        />
        <FormControlLabel
          control={<Checkbox checked={goals.resume} onChange={handleChange("resume")} />}
          label="Improve my resume"
        />
        <FormControlLabel
          control={<Checkbox checked={goals.networking} onChange={handleChange("networking")} />}
          label="Expand my network"
        />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="outlined" onClick={onBack} aria-label="back">
          Back
        </Button>
        <Button variant="contained" onClick={onNext} aria-label="finish onboarding" disabled={!Object.values(goals).some(Boolean)}>
          Finish
        </Button>
      </Stack>
    </Box>
  );
}

