"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import OfferDetail from "@/components/talentforge/Offers/OfferDetail";
import OfferList from "@/components/talentforge/Offers/OfferList";
import type { Offer } from "@/utils/talentforge/dataStore";

export default function OffersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOffer, setSelectedOffer] = useState<Offer | undefined>();

  const handleSave = () => {
    setRefreshKey((k) => k + 1);
    setSelectedOffer(undefined);
  };

  return (
    <ErrorBoundary>
      <Box>
        <OfferDetail offer={selectedOffer} onSave={handleSave} />
        <OfferList refreshKey={refreshKey} onSelect={setSelectedOffer} />
      </Box>
    </ErrorBoundary>
  );
}

