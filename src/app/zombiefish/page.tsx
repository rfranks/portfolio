"use client";

import React from "react";
import { Container } from "@mui/material";
import Game from "@/games/zombiefish";
import "./page.css";

export default function ZombieFishPage() {
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
