"use client";

import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Typography,
} from "@mui/material";
import FocusTrap from "@mui/base/FocusTrap";

interface GoalSelectionStepProps {
  onFinish: () => void;
}

export default function GoalSelectionStep({ onFinish }: GoalSelectionStepProps) {
  const [goal, setGoal] = useState("");

  return (
    <FocusTrap open>
      <Box aria-label="goal selection step">
        <Typography>Select a goal to customize your experience.</Typography>
        <FormControl sx={{ mt: 2 }}>
          <FormLabel id="goal-label">Goal</FormLabel>
          <RadioGroup
            aria-labelledby="goal-label"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          >
            <FormControlLabel
              value="findJob"
              control={<Radio />}
              label="Find a job"
            />
            <FormControlLabel
              value="improveResume"
              control={<Radio />}
              label="Improve my resume"
            />
            <FormControlLabel
              value="practiceInterview"
              control={<Radio />}
              label="Practice interviews"
            />
          </RadioGroup>
        </FormControl>
        <Button
          variant="contained"
          onClick={onFinish}
          disabled={!goal}
          sx={{ mt: 2 }}
          aria-label="finish onboarding"
        >
          Finish
        </Button>
      </Box>
    </FocusTrap>
  );
}

