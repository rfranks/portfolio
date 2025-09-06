"use client";

import React, { useEffect } from "react";
import { Container } from "@mui/material";
import Game from "@/games/warbirds";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import "./page.css";

export default function WarbirdsPage() {
  const { setDocumentTitle } = useDocumentTitle();
  useEffect(() => {
    setDocumentTitle("Warbirds");
  }, [setDocumentTitle]);

  return (
    <Container
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Game />
    </Container>
  );
}
