"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";

interface OfferDetails {
  salary: string;
  benefits: string;
  equity: string;
  notes: string;
}

export default function OfferComparison() {
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

  const rows = [
    { label: "Salary", a: offerA.salary, b: offerB.salary },
    { label: "Benefits", a: offerA.benefits, b: offerB.benefits },
    { label: "Equity", a: offerA.equity, b: offerB.equity },
    { label: "Notes", a: offerA.notes, b: offerB.notes },
  ];

  const saveComparison = () => {
    const header = "| Aspect | Offer A | Offer B |\n| --- | --- | --- |";
    const body = rows
      .map((r) => `| ${r.label} | ${r.a || ""} | ${r.b || ""} |`)
      .join("\n");
    const markdown = `${header}\n${body}\n`;
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "offer-comparison.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Compare Offers
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
        <Stack spacing={2} flex={1}>
          <Typography variant="subtitle1">Offer A</Typography>
          <TextField
            label="Salary"
            value={offerA.salary}
            onChange={(e) => setOfferA({ ...offerA, salary: e.target.value })}
          />
          <TextField
            label="Benefits"
            value={offerA.benefits}
            onChange={(e) =>
              setOfferA({ ...offerA, benefits: e.target.value })
            }
          />
          <TextField
            label="Equity"
            value={offerA.equity}
            onChange={(e) => setOfferA({ ...offerA, equity: e.target.value })}
          />
          <TextField
            label="Notes"
            multiline
            minRows={3}
            value={offerA.notes}
            onChange={(e) => setOfferA({ ...offerA, notes: e.target.value })}
          />
        </Stack>
        <Stack spacing={2} flex={1}>
          <Typography variant="subtitle1">Offer B</Typography>
          <TextField
            label="Salary"
            value={offerB.salary}
            onChange={(e) => setOfferB({ ...offerB, salary: e.target.value })}
          />
          <TextField
            label="Benefits"
            value={offerB.benefits}
            onChange={(e) =>
              setOfferB({ ...offerB, benefits: e.target.value })
            }
          />
          <TextField
            label="Equity"
            value={offerB.equity}
            onChange={(e) => setOfferB({ ...offerB, equity: e.target.value })}
          />
          <TextField
            label="Notes"
            multiline
            minRows={3}
            value={offerB.notes}
            onChange={(e) => setOfferB({ ...offerB, notes: e.target.value })}
          />
        </Stack>
      </Stack>
      <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Aspect</TableCell>
              <TableCell>Offer A</TableCell>
              <TableCell>Offer B</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell>{row.label}</TableCell>
                <TableCell>{row.a}</TableCell>
                <TableCell>{row.b}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="contained" onClick={saveComparison}>
        Save comparison
      </Button>
    </Box>
  );
}

