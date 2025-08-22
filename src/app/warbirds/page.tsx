"use client";

import React from "react";
import { Container } from "@mui/material";
import Game from "@/games/warbirds";
import "./page.css";

export default function WarbirdsPage() {
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
