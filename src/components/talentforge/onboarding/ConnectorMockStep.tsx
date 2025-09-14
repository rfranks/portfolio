"use client";

import { useState } from "react";
import { Button, Checkbox, FormControlLabel, Stack } from "@mui/material";
import FocusTrap from "@mui/base/FocusTrap";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function ConnectorMockStep({ onNext, onBack }: StepProps) {
  const [connected, setConnected] = useState(false);

  return (
    <FocusTrap open>
      <Stack spacing={2} aria-label="Connect accounts">
        <FormControlLabel
          control={
            <Checkbox
              checked={connected}
              onChange={(e) => setConnected(e.target.checked)}
              inputProps={{ "aria-label": "Mock connector" }}
            />
          }
          label="Mock Connector"
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
            disabled={!connected}
            aria-label="Continue"
          >
            Continue
          </Button>
        </Stack>
      </Stack>
    </FocusTrap>
  );
}

