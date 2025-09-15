"use client";

import { useState } from "react";
import { Button, Stack, TextField, Typography } from "@mui/material";

interface StepProps {
  onNext: () => void;
  onBack?: () => void;
}

export default function CompensationStep({ onNext, onBack }: StepProps) {
  const [comp, setComp] = useState({
    salary: "",
    benefits: "",
    stock: "",
  });

  const handleChange = (field: "salary" | "benefits" | "stock") => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setComp((c) => ({ ...c, [field]: event.target.value }));
  };

  const hasValue = Object.values(comp).some((v) => v.trim() !== "");

  return (
    <Stack spacing={2} aria-label="Enter current compensation">
      <Typography variant="body2" tabIndex={0}>
        This information is only used to negotiate better offers on your
        behalf and compare them against your current compensation.
      </Typography>
      <TextField
        label="Current Salary"
        value={comp.salary}
        onChange={handleChange("salary")}
        inputProps={{ "aria-label": "Current salary" }}
      />
      <TextField
        label="Benefits"
        value={comp.benefits}
        onChange={handleChange("benefits")}
        inputProps={{ "aria-label": "Benefits" }}
      />
      <TextField
        label="Stock Options / RSUs"
        value={comp.stock}
        onChange={handleChange("stock")}
        inputProps={{ "aria-label": "Stock options and RSUs" }}
      />
      <Stack direction="row" spacing={1}>
        {onBack && (
          <Button onClick={onBack} aria-label="Back">
            Back
          </Button>
        )}
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!hasValue}
          aria-label="Next"
        >
          Next
        </Button>
      </Stack>
    </Stack>
  );
}

