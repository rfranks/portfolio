"use client";

import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import {
  Box,
  Stack,
  Typography,
} from "@mui/material";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";

import OfferCompare from "@/components/talentforge/OfferCompare";
import { getOffers, type Offer } from "@/utils/talentforge/dataStore";

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);

  const refreshOffers = () => {
    setOffers(getOffers());
  };

  useEffect(() => {
    refreshOffers();
  }, []);

  return (
    <ErrorBoundary>
      <Box>
        <OfferCompare onSave={refreshOffers} />
        {offers.length > 0 && (
          <Stack spacing={2} sx={{ mt: 4 }}>
            <Typography variant="h6">Past Offers</Typography>
            {offers.map((offer) => (
              <Box
                key={offer.id}
                sx={{ border: "1px solid", borderColor: "divider", p: 2, borderRadius: 1 }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  Current Compensation
                </Typography>
                <Typography variant="body2" gutterBottom>
                  {offer.compensation}
                </Typography>
                <Typography variant="subtitle2" gutterBottom>
                  Draft Response
                </Typography>
                <Typography variant="body2" component="div">
                  <Markdown>{offer.result}</Markdown>
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </Box>
    </ErrorBoundary>
  );
}

