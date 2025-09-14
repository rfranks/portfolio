"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import OpenAiKeyModal from "@/components/talentforge/OpenAiKeyModal";

export default function SettingsPage() {
  const [open, setOpen] = useState(false);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Settings
      </Typography>
      <Button variant="contained" onClick={() => setOpen(true)}>
        Set OpenAI API Key
      </Button>
      <OpenAiKeyModal open={open} onClose={() => setOpen(false)} />
    </Box>
  );
}

