"use client";

import { useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Box,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import {
  addOffer,
  updateOffer,
  type Offer,
} from "@/utils/talentforge/dataStore";
import type { ApplicationRecord, OfferComp } from "@/types";

interface OfferDetailProps {
  offer?: Offer;
  onSave?: () => void;
}

const getAmount = (offer: Offer | undefined, type: string): string => {
  return (
    offer?.compensation.find((c) => c.type === type)?.amount.toString() || ""
  );
};

export default function OfferDetail({ offer, onSave }: OfferDetailProps) {
  const [salary, setSalary] = useState(getAmount(offer, "salary"));
  const [bonus, setBonus] = useState(getAmount(offer, "bonus"));
  const [equity, setEquity] = useState(getAmount(offer, "equity"));
  const [summary, setSummary] = useState(offer?.summary || "");

  const handleSave = () => {
    const compensation: OfferComp[] = [
      { type: "salary", amount: parseFloat(salary) || 0 },
      { type: "bonus", amount: parseFloat(bonus) || 0 },
      { type: "equity", amount: parseFloat(equity) || 0 },
    ];

    const newOffer: Offer = {
      id: offer?.id || uuid(),
      application: offer?.application || ({} as ApplicationRecord),
      compensation,
      summary,
    };

    if (offer) {
      updateOffer(newOffer);
    } else {
      addOffer(newOffer);
    }
    onSave?.();
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Stack spacing={2}>
        <TextField
          label="Salary"
          type="number"
          value={salary}
          onChange={(e) => setSalary(e.target.value)}
        />
        <TextField
          label="Bonus"
          type="number"
          value={bonus}
          onChange={(e) => setBonus(e.target.value)}
        />
        <TextField
          label="Equity"
          type="number"
          value={equity}
          onChange={(e) => setEquity(e.target.value)}
        />
        <TextField
          label="Notes"
          multiline
          minRows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <Button variant="contained" onClick={handleSave}>
          Save Offer
        </Button>
      </Stack>
    </Box>
  );
}

