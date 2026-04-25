"use client";

import * as React from "react";
import Container from "@mui/material/Container";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";

export interface ArcadeGamePageProps {
  documentTitle: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export default function ArcadeGamePage({
  documentTitle,
  fullWidth = true,
  children,
}: ArcadeGamePageProps) {
  const { setDocumentTitle } = useDocumentTitle();

  React.useEffect(() => {
    setDocumentTitle(documentTitle);
  }, [documentTitle, setDocumentTitle]);

  return (
    <Container
      maxWidth={fullWidth ? false : undefined}
      disableGutters={fullWidth}
      sx={{
        width: "100%",
        minHeight: "100dvh",
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: fullWidth ? "flex-start" : "center",
        alignItems: fullWidth ? "stretch" : "center",
        overflow: "hidden",
      }}
    >
      {children}
    </Container>
  );
}
