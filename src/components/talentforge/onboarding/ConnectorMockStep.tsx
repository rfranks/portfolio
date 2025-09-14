"use client";

import { useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { v4 as uuid } from "uuid";

import { ConnectorToken } from "@/types/connector";
import {
  deleteConnectorToken,
  getConnectorToken,
  saveConnectorToken,
} from "@/utils/talentforge/dataStore";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function ConnectorMockStep({ onNext, onBack }: StepProps) {
  const [token, setToken] = useState<ConnectorToken | null>(() =>
    getConnectorToken("mock") ?? null,
  );

  const handleConnect = () => {
    const newToken: ConnectorToken = { accessToken: uuid() };
    saveConnectorToken("mock", newToken);
    setToken(newToken);
  };

  const handleDisconnect = () => {
    deleteConnectorToken("mock");
    setToken(null);
  };

  return (
    <Stack spacing={2} aria-label="Connect accounts">
      <Typography aria-label="Connection status">
        {token ? `Connected: ${token.accessToken}` : "Not connected"}
      </Typography>
      {token ? (
        <Button onClick={handleDisconnect} aria-label="Disconnect">
          Disconnect
        </Button>
      ) : (
        <Button onClick={handleConnect} aria-label="Connect">
          Generate Token
        </Button>
      )}
      <Stack direction="row" spacing={1}>
        {onBack && (
          <Button onClick={onBack} aria-label="Back">
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!token}
          aria-label="Continue"
        >
          Continue
        </Button>
      </Stack>
    </Stack>
  );
}

