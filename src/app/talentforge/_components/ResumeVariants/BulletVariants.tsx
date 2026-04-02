"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { Stack, TextField, Button, Typography } from "@mui/material";
import RequireAIKey from "../RequireAIKey";
import { askOpenAI } from "@/app/talentforge/_utils/utils";

interface Props {
  setContent: Dispatch<SetStateAction<string>>;
}

export default function BulletVariants({ setContent }: Props) {
  const [bulletText, setBulletText] = useState("");
  const [variants, setVariants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateVariants = async () => {
    if (!bulletText) return;
    setLoading(true);
    const response = await askOpenAI({
      context: "",
      user: `Original resume bullet: ${bulletText}`,
      system:
        "You are an expert resume writer. Rewrite the resume bullet in STAR (Situation, Task, Action, Result) format with quantifiable metrics. Provide three distinct bullet point variants separated by newlines.",
      returnFirstResponse: true,
      chatHistory: [],
    });
    const lines = response.message
      .split(/\n+/)
      .map((l) => l.replace(/^[-*\d\.\)]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);
    setVariants(lines);
    setLoading(false);
  };

  const replaceOriginal = (variant: string) => {
    setContent((c) => c.replace(bulletText, variant));
    setBulletText(variant);
    setVariants([]);
  };

  return (
    <RequireAIKey>
      <Stack spacing={1}>
        <TextField
          label="Original Bullet"
          value={bulletText}
          onChange={(e) => setBulletText(e.target.value)}
          multiline
        />
        <Button
          variant="contained"
          onClick={generateVariants}
          disabled={!bulletText || loading}
        >
          Generate Variants
        </Button>
        {variants.map((v, idx) => (
          <Stack key={idx} direction="row" spacing={1} alignItems="center">
            <Typography variant="body2" sx={{ flexGrow: 1 }}>
              {v}
            </Typography>
            <Button onClick={() => replaceOriginal(v)}>Replace Original</Button>
          </Stack>
        ))}
      </Stack>
    </RequireAIKey>
  );
}

