"use client";

import { useState } from "react";
import { Box } from "@mui/material";
import ErrorBoundary from "@/components/talentforge/ErrorBoundary";
import OfferDetail from "@/components/talentforge/Offers/OfferDetail";
import OfferList from "@/components/talentforge/Offers/OfferList";

export default function OffersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <ErrorBoundary>
      <Box>
        <OfferDetail onSave={() => setRefreshKey((k) => k + 1)} />
        <OfferList refreshKey={refreshKey} />
      </Box>
    </ErrorBoundary>
  );
}

