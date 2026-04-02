"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";
import {
  Box,
  Button,
  Stack,
  TextField,
} from "@mui/material";
import { addOffer, updateOffer, deleteOffer } from "@/app/talentforge/_utils/dataStore";
import type { Offer, ApplicationRecord, OfferComp } from "@/types";

interface OfferDetailProps {
  offer?: Offer;
  onSave?: () => void;
}

const defaultComp: OfferComp[] = [
  { type: "salary", amount: 0 },
  { type: "bonus", amount: 0 },
  { type: "equity", amount: 0 },
];

export default function OfferDetail({ offer, onSave }: OfferDetailProps) {
  const [compensation, setCompensation] = useState<OfferComp[]>(
    offer?.compensation ?? defaultComp,
  );
  const [summary, setSummary] = useState(
    offer?.summary?.join("\n") || "",
  );

  useEffect(() => {
    setCompensation(offer?.compensation ?? defaultComp);
    setSummary(offer?.summary?.join("\n") || "");
  }, [offer]);

  const handleCompChange = (
    index: number,
    key: "type" | "amount",
    value: string,
  ) => {
    setCompensation((prev) => {
      const next = [...prev];
      if (key === "amount") {
        next[index] = { ...next[index], amount: parseFloat(value) || 0 };
      } else {
        next[index] = { ...next[index], type: value };
      }
      return next;
    });
  };

  const addCompItem = () => {
    setCompensation((prev) => [...prev, { type: "", amount: 0 }]);
  };

  const removeCompItem = (index: number) => {
    setCompensation((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const filtered = compensation.filter((c) => c.type.trim() !== "");
    const newOffer: Offer = {
      id: offer?.id || uuid(),
      application: offer?.application || ({} as ApplicationRecord),
      compensation: filtered,
      summary: summary
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (offer) {
      updateOffer(newOffer);
    } else {
      addOffer(newOffer);
    }
    onSave?.();
  };

  const handleDelete = () => {
    if (!offer) return;
    deleteOffer(offer.id);
    onSave?.();
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Stack spacing={2}>
        {compensation.map((comp, index) => (
          <Stack key={index} direction="row" spacing={1}>
            <TextField
              label="Type"
              value={comp.type}
              onChange={(e) =>
                handleCompChange(index, "type", e.target.value)
              }
            />
            <TextField
              label="Amount"
              type="number"
              value={comp.amount}
              onChange={(e) =>
                handleCompChange(index, "amount", e.target.value)
              }
            />
            <Button color="error" onClick={() => removeCompItem(index)}>
              Remove
            </Button>
          </Stack>
        ))}
        <Button onClick={addCompItem}>Add Compensation</Button>
        <TextField
          label="Notes"
          multiline
          minRows={3}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
        />
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={handleSave}>
            Save Offer
          </Button>
          {offer && (
            <Button color="error" onClick={handleDelete}>
              Delete
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

