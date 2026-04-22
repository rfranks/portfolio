"use client";

import { ReactNode, useRef } from "react";
import { Alert, Box, Button, Stack } from "@mui/material";

import OpenAIKeyModal from "./OpenAIKeyModal";
import useOpenAIKey from "@/app/talentforge/_hooks/useOpenAIKey";

interface RequireAIKeyProps {
  children: ReactNode;
}

export default function RequireAIKey({ children }: RequireAIKeyProps) {
  const { hasKey, isChecking, modalOpen, openModal, closeModal } = useOpenAIKey();
  const ctaRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    closeModal();
    ctaRef.current?.focus();
  };

  if (isChecking) {
    return null;
  }

  return (
    <>
      <OpenAIKeyModal open={modalOpen} onClose={handleClose} />
      {hasKey ? (
        <>{children}</>
      ) : (
        <Box role="region" aria-live="polite">
          <Stack spacing={2} alignItems="flex-start">
            <Alert severity="warning" sx={{ width: "100%" }}>
              OpenAI API key not found. Please add your key to use this feature.
            </Alert>
            <Button variant="contained" onClick={openModal} ref={ctaRef} autoFocus>
              Add your OpenAI key
            </Button>
          </Stack>
        </Box>
      )}
    </>
  );
}
