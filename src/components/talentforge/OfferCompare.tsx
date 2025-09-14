"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";

interface OfferDetails {
  salary: string;
  benefits: string;
  equity: string;
  notes: string;
}

interface OfferCompareProps {
  onSave?: () => void;
}

export default function OfferCompare({ onSave }: OfferCompareProps) {
  const [offerA, setOfferA] = useState<OfferDetails>({
    salary: "",
    benefits: "",
    equity: "",
    notes: "",
  });
  const [offerB, setOfferB] = useState<OfferDetails>({
    salary: "",
    benefits: "",
    equity: "",
    notes: "",
  });

  const handleChange = (
    offer: "A" | "B",
    field: keyof OfferDetails,
    value: string,
  ) => {
    const setter = offer === "A" ? setOfferA : setOfferB;
    const current = offer === "A" ? offerA : offerB;
    setter({ ...current, [field]: value });
  };

  const generateMarkdown = () => {
    return (
      `| Category | Offer A | Offer B |\n` +
      `| --- | --- | --- |\n` +
      `| Salary | ${offerA.salary} | ${offerB.salary} |\n` +
      `| Benefits | ${offerA.benefits} | ${offerB.benefits} |\n` +
      `| Equity | ${offerA.equity} | ${offerB.equity} |\n` +
      `| Notes | ${offerA.notes} | ${offerB.notes} |\n`
    );
  };

  const saveComparison = () => {
    const markdown = generateMarkdown();
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "offer-comparison.md";
    a.click();
    URL.revokeObjectURL(url);
    onSave?.();
  };

  const hasData =
    Object.values(offerA).some(Boolean) || Object.values(offerB).some(Boolean);

  return (
    <Box>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Offer A Salary"
            value={offerA.salary}
            onChange={(e) => handleChange("A", "salary", e.target.value)}
            fullWidth
          />
          <TextField
            label="Offer B Salary"
            value={offerB.salary}
            onChange={(e) => handleChange("B", "salary", e.target.value)}
            fullWidth
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Offer A Benefits"
            value={offerA.benefits}
            onChange={(e) => handleChange("A", "benefits", e.target.value)}
            fullWidth
          />
          <TextField
            label="Offer B Benefits"
            value={offerB.benefits}
            onChange={(e) => handleChange("B", "benefits", e.target.value)}
            fullWidth
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Offer A Equity"
            value={offerA.equity}
            onChange={(e) => handleChange("A", "equity", e.target.value)}
            fullWidth
          />
          <TextField
            label="Offer B Equity"
            value={offerB.equity}
            onChange={(e) => handleChange("B", "equity", e.target.value)}
            fullWidth
          />
        </Stack>
        <Stack direction="row" spacing={2}>
          <TextField
            label="Offer A Notes"
            value={offerA.notes}
            onChange={(e) => handleChange("A", "notes", e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
          <TextField
            label="Offer B Notes"
            value={offerB.notes}
            onChange={(e) => handleChange("B", "notes", e.target.value)}
            multiline
            minRows={3}
            fullWidth
          />
        </Stack>

        {hasData && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Offer A</TableCell>
                <TableCell>Offer B</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Salary</TableCell>
                <TableCell>{offerA.salary}</TableCell>
                <TableCell>{offerB.salary}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Benefits</TableCell>
                <TableCell>{offerA.benefits}</TableCell>
                <TableCell>{offerB.benefits}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Equity</TableCell>
                <TableCell>{offerA.equity}</TableCell>
                <TableCell>{offerB.equity}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Notes</TableCell>
                <TableCell>{offerA.notes}</TableCell>
                <TableCell>{offerB.notes}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}

        <Button
          variant="contained"
          onClick={saveComparison}
          disabled={!hasData}
        >
          Save comparison
        </Button>
      </Stack>
    </Box>
  );
}

