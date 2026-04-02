"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";

import type { TalentForgeGoalTag } from "@/app/talentforge/_utils/promptRegistry";
import { getGoals, setGoals } from "@/app/talentforge/_utils/dataStore";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

const GOAL_OPTIONS: Array<{
  key: TalentForgeGoalTag;
  label: string;
  description: string;
}> = [
  {
    key: "resume",
    label: "Polish my resume",
    description: "Highlight achievements, tailor bullets, and generate summaries.",
  },
  {
    key: "networking",
    label: "Grow my network",
    description: "Draft recruiter outreach, follow-up nudges, and elevator pitches.",
  },
  {
    key: "search",
    label: "Accelerate my job search",
    description: "Analyze job descriptions, prep for interviews, and compare offers.",
  },
];

export default function GoalSelectionStep({ onNext, onBack }: StepProps) {
  const [selectedGoals, setSelectedGoals] = useState<TalentForgeGoalTag[]>([]);

  useEffect(() => {
    setSelectedGoals(getGoals());
  }, []);

  const handleChange = (goal: TalentForgeGoalTag) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { checked } = event.target;
      setSelectedGoals((current) => {
        if (checked) {
          return current.includes(goal) ? current : [...current, goal];
        }
        return current.filter((item) => item !== goal);
      });
    };

  const handleFinish = () => {
    const orderedGoals = GOAL_OPTIONS.map((option) => option.key).filter((key) =>
      selectedGoals.includes(key),
    );
    setGoals(orderedGoals);
    onNext();
  };

  const hasGoal = selectedGoals.length > 0;

  return (
    <Stack spacing={2} aria-label="Select goals">
      <Typography variant="body1">
        Choose the outcomes you care about most. We&apos;ll highlight prompts that
        match these goals throughout TalentForge.
      </Typography>
      <Stack spacing={1} role="group" aria-label="Goal options">
        {GOAL_OPTIONS.map((option) => (
          <FormControlLabel
            key={option.key}
            control={
              <Checkbox
                checked={selectedGoals.includes(option.key)}
                onChange={handleChange(option.key)}
                inputProps={{ "aria-label": option.label }}
              />
            }
            label={
              <Stack spacing={0.5}>
                <Typography variant="subtitle1">{option.label}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {option.description}
                </Typography>
              </Stack>
            }
          />
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        {onBack && (
          <Button onClick={onBack} aria-label="Back">
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleFinish}
          disabled={!hasGoal}
          aria-label="Finish onboarding"
        >
          Finish
        </Button>
      </Stack>
    </Stack>
  );
}

