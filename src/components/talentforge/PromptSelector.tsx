"use client";

import React from "react";
import {
  MenuItem,
  Select,
  ListSubheader,
  SelectChangeEvent,
} from "@mui/material";

import { PROMPT_TEMPLATES, PROMPT_GROUPS } from "@/consts/prompts";

interface PromptSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PromptSelector({ value, onChange }: PromptSelectorProps) {
  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value as string);
  };

  return (
    <Select value={value} onChange={handleChange} displayEmpty fullWidth>
      <MenuItem value="" disabled>
        Select a prompt
      </MenuItem>
      {Object.entries(PROMPT_GROUPS).map(([group, keys]) => (
        <React.Fragment key={group}>
          <ListSubheader>{group}</ListSubheader>
          {keys.map((key) => {
            const template = PROMPT_TEMPLATES[key];
            if (!template) return null;
            return (
              <MenuItem key={key} value={key}>
                {template.displayText}
              </MenuItem>
            );
          })}
        </React.Fragment>
      ))}
    </Select>
  );
}

