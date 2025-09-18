"use client";

import { useEffect, useState } from "react";
import { Button, Stack, Typography } from "@mui/material";
import { v4 as uuid } from "uuid";

import { ConnectorToken } from "@/types/connector";
import {
  useTalentForgeData,
  useTalentForgeSelector,
} from "@/contexts/TalentForgeDataContext";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function ConnectorMockStep({ onNext, onBack }: StepProps) {
  const dataStore = useTalentForgeData();
  const storedToken = useTalentForgeSelector(
    (store) => store.getConnectorToken("mock"),
    { keys: ["connectorTokens"] },
  );
  const [token, setToken] = useState<ConnectorToken | null>(
    storedToken ?? null,
  );

  useEffect(() => {
    setToken(storedToken ?? null);
  }, [storedToken]);

  const handleConnect = () => {
    const newToken: ConnectorToken = { accessToken: uuid() };
    dataStore.saveConnectorToken("mock", newToken);
    setToken(newToken);
  };

  const handleDisconnect = () => {
    dataStore.deleteConnectorToken("mock");
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

