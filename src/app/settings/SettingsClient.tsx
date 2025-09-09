"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { clearTokens, getStoredTokens } from "@/utils/talentforge/oauth";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface Provider {
  id: string;
  name: string;
  authUrl: string;
}

const providers: Provider[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    authUrl: "/api/oauth/authorize?provider=linkedin",
  },
  {
    id: "indeed",
    name: "Indeed",
    authUrl: "/api/oauth/authorize?provider=indeed",
  },
];

export default function SettingsClient() {
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const { setDocumentTitle } = useDocumentTitle();

  useEffect(() => {
    setDocumentTitle("Settings");
    const conn: Record<string, boolean> = {};
    providers.forEach((p) => {
      conn[p.id] = !!getStoredTokens(p.id);
    });
    setConnections(conn);
  }, [setDocumentTitle]);

  const handleConnect = (provider: Provider) => {
    window.location.href = provider.authUrl;
  };

  const handleDisconnect = (provider: Provider) => {
    clearTokens(provider.id);
    setConnections({ ...connections, [provider.id]: false });
  };

  return (
    <Box sx={{ py: 8 }}>
      <Container maxWidth="sm">
        <Typography variant="h4" gutterBottom>
          External Accounts
        </Typography>
        {providers.map((provider) => (
          <Box
            key={provider.id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography>{provider.name}</Typography>
            {connections[provider.id] ? (
              <Button
                variant="outlined"
                onClick={() => handleDisconnect(provider)}
              >
                Disconnect
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={() => handleConnect(provider)}
              >
                Connect
              </Button>
            )}
          </Box>
        ))}
      </Container>
    </Box>
  );
}
