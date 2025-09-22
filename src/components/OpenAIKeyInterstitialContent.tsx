"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Image from "next/image";

export interface OpenAIKeyInterstitialContentProps {
  appName: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  buttonLabel?: string;
  logoSrc?: string;
  logoAlt?: string;
  textFieldName?: string;
}

export default function OpenAIKeyInterstitialContent({
  appName,
  value,
  onChange,
  onSubmit,
  inputRef,
  buttonLabel = "Continue",
  logoSrc = "/logo192.png",
  logoAlt,
  textFieldName = "apiKey",
}: OpenAIKeyInterstitialContentProps) {
  const resolvedLogoAlt = logoAlt ?? `${appName} logo`;
  const description = `${appName} needs an OpenAI API key to talk with OpenAI. The key you type here goes straight from your browser to OpenAI and stays between you and OpenAI. ${appName} does not store your key anywhere and does not send it anywhere else. If you do not fully trust ${appName}, do not enter your key.`;

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Image
        src={logoSrc}
        style={{ width: "192px", height: "auto" }}
        alt={resolvedLogoAlt}
        width={192}
        height={194}
      />
      <Typography variant="h4" component="h1" gutterBottom>
        {`Welcome to ${appName}`}
      </Typography>
      <Typography variant="body1" paragraph>
        {description}
      </Typography>
      <Box component="form" onSubmit={onSubmit}>
        <TextField
          label="OpenAI API Key"
          name={textFieldName}
          type="password"
          fullWidth
          required
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputRef={inputRef}
        />
        <Button type="submit" variant="contained" sx={{ mt: 2 }}>
          {buttonLabel}
        </Button>
      </Box>
    </Container>
  );
}
