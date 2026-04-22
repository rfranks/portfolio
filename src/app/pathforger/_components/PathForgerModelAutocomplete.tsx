import * as React from "react";
import { Autocomplete, TextField } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

type PathForgerModelAutocompleteProps = {
  label: string;
  value: string;
  options: string[];
  loading: boolean;
  fallbackValue: string;
  onChange: (value: string) => void;
  helperText?: string;
  sx?: SxProps<Theme>;
};

export default function PathForgerModelAutocomplete(props: PathForgerModelAutocompleteProps) {
  const { label, value, options, loading, fallbackValue, onChange, helperText, sx } = props;

  return (
    <Autocomplete
      freeSolo
      options={options}
      loading={loading}
      value={value}
      inputValue={value}
      onInputChange={(_event, nextValue) => onChange(nextValue)}
      onChange={(_event, nextValue) => {
        onChange(
          typeof nextValue === "string" && nextValue.trim().length > 0
            ? nextValue.trim()
            : fallbackValue,
        );
      }}
      renderInput={(params) => (
        <TextField {...params} fullWidth label={label} helperText={helperText} />
      )}
      sx={sx}
    />
  );
}
