"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { Button, FormControlLabel, Stack, Switch, Typography } from "@mui/material";

import { clearDemoData, loadDemoData } from "@/app/talentforge/_utils/demoData";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

const DEMO_DATA_FLAG = "tf_demo_data_inserted";

const readDemoFlag = () =>
  typeof window !== "undefined" && window.localStorage.getItem(DEMO_DATA_FLAG) === "true";

export default function DemoDataStep({ onNext, onBack }: StepProps) {
  const [demoEnabled, setDemoEnabled] = useState(readDemoFlag);

  const handleToggle = useCallback((_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    if (checked) {
      loadDemoData();
    } else {
      clearDemoData();
    }
    setDemoEnabled(checked);
  }, []);

  return (
    <Stack spacing={2} aria-label="Toggle demo data">
      <Typography variant="body1">
        Load demo data to see how TalentForge works with sample resumes and job applications. You
        can turn it off at any time.
      </Typography>
      <FormControlLabel
        control={
          <Switch
            checked={demoEnabled}
            onChange={handleToggle}
            inputProps={{ "aria-label": "Enable demo data" }}
          />
        }
        label={demoEnabled ? "Demo data enabled" : "Demo data disabled"}
      />
      <Typography variant="body2" color="text.secondary">
        Disabling demo data removes the sample user profile, resumes, offers, and applications so
        you can start fresh with your own information.
      </Typography>
      <Stack direction="row" spacing={1}>
        {onBack && (
          <Button onClick={onBack} aria-label="Back">
            Back
          </Button>
        )}
        <Button variant="contained" onClick={onNext} aria-label="Continue">
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}
