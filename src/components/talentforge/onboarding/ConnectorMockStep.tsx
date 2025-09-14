"use client";

import { useState, useEffect, useRef } from "react";
import { Box, Button, FormControlLabel, Checkbox, Stack } from "@mui/material";

interface ConnectorMockStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function ConnectorMockStep({ onNext, onBack }: ConnectorMockStepProps) {
  const [linkedIn, setLinkedIn] = useState(false);
  const [indeed, setIndeed] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  return (
    <Box aria-label="connector selection">
      <Stack spacing={1}>
        <FormControlLabel
          control={<Checkbox inputRef={firstRef} checked={linkedIn} onChange={(e) => setLinkedIn(e.target.checked)} />}
          label="LinkedIn"
        />
        <FormControlLabel
          control={<Checkbox checked={indeed} onChange={(e) => setIndeed(e.target.checked)} />}
          label="Indeed"
        />
      </Stack>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button variant="outlined" onClick={onBack} aria-label="back">
          Back
        </Button>
        <Button variant="contained" onClick={onNext} aria-label="save connectors">
          Save Connections
        </Button>
      </Stack>
    </Box>
  );
}

