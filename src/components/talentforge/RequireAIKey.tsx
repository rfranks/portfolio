"use client";

import { ReactNode, useEffect, useState } from "react";
import { Alert, Box } from "@mui/material";

import { hasValidOpenAIKey } from "@/utils/talentforge/utils";

interface RequireAIKeyProps {
  children: ReactNode;
}

export default function RequireAIKey({ children }: RequireAIKeyProps) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      const valid = await hasValidOpenAIKey();
      setHasKey(valid);
    };
    checkKey();
  }, []);

  if (hasKey === null) return null;
  if (!hasKey) {
    return (
      <Box>
        <Alert severity="warning">
          OpenAI API key not found. Please add your key to use this feature.
        </Alert>
      </Box>
    );
  }

  return <>{children}</>;
}
