"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import FocusTrap from "@mui/base/FocusTrap";

interface ConnectorMockStepProps {
  onNext: () => void;
}

export default function ConnectorMockStep({ onNext }: ConnectorMockStepProps) {
  const [connected, setConnected] = useState(false);

  return (
    <FocusTrap open>
      <Box aria-label="connect accounts step">
        <Typography>Mock connecting your job board accounts.</Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={connected}
              onChange={(e) => setConnected(e.target.checked)}
              inputProps={{ "aria-label": "connect mock accounts" }}
            />
          }
          label="Connect mock accounts"
          sx={{ mt: 2 }}
        />
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!connected}
          sx={{ mt: 2 }}
          aria-label="continue after connecting accounts"
        >
          Continue
        </Button>
      </Box>
    </FocusTrap>
  );
}

