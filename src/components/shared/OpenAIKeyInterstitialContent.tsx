"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import type { OpenAIKeyInterstitialContentProps } from "@/types/components/shared";
export type { OpenAIKeyInterstitialContentProps } from "@/types/components/shared";

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
  isSubmitting = false,
  errorText,
  logoFrameSx,
}: OpenAIKeyInterstitialContentProps) {
  const resolvedLogoAlt = logoAlt ?? `${appName} logo`;
  const description = `${appName} needs an OpenAI API key to talk with OpenAI. The key you type here goes straight from your browser to OpenAI and stays between you and OpenAI. ${appName} does not store your key anywhere and does not send it anywhere else. If you do not fully trust ${appName}, do not enter your key.`;

  return (
    <Container
      component="main"
      maxWidth="sm"
      sx={(theme) => ({
        mt: 8,
        mb: 4,
        color: "text.primary",
        "& .openai-key-form": {
          display: "flex",
          flexDirection: "column",
          gap: 2,
        },
        "& .MuiOutlinedInput-root": {
          backgroundColor:
            theme.palette.mode === "dark"
              ? alpha(theme.palette.common.black, 0.16)
              : alpha(theme.palette.common.white, 0.48),
          boxShadow:
            theme.palette.mode === "dark"
              ? "inset 0 1px 0 rgba(255,255,255,0.04)"
              : "inset 0 1px 0 rgba(255,255,255,0.65)",
        },
      })}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
          ...logoFrameSx,
        }}
      >
        <Image
          src={logoSrc}
          style={{ width: "192px", height: "auto" }}
          alt={resolvedLogoAlt}
          width={192}
          height={194}
        />
      </Box>
      <Typography variant="h4" component="h1" gutterBottom>
        {`Welcome to ${appName}`}
      </Typography>
      <Typography variant="body1" paragraph>
        {description}
      </Typography>
      <Box component="form" onSubmit={onSubmit} className="openai-key-form">
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
        {errorText ? (
          <Typography color="error" sx={{ mt: 1 }} role="alert">
            {errorText}
          </Typography>
        ) : null}
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? <CircularProgress size={18} color="inherit" /> : buttonLabel}
        </Button>
      </Box>
    </Container>
  );
}
