"use client";

import { useEffect } from "react";
import { Container, Typography } from "@mui/material";
import { useDocumentTitle } from "@/hooks/window/useDocumentTitle";
import { useResumeData } from "@/providers/ResumeDataProvider";
import { getPortfolioAppRouteContract } from "@/utils/portfolio/routeContracts";
import { withBasePath } from "@/utils/basePath";

export default function PetlyPage() {
  const { portfolioApps } = useResumeData();
  const petlyRoute = getPortfolioAppRouteContract(portfolioApps, "petly");
  const { setDocumentTitle } = useDocumentTitle();
  useEffect(() => {
    setDocumentTitle(petlyRoute.documentTitle);
  }, [petlyRoute.documentTitle, setDocumentTitle]);

  return (
    <Container sx={{ py: 8 }}>
      <Typography variant="h4" gutterBottom>
        {petlyRoute.documentTitle}
      </Typography>
      <video
        src={withBasePath("/personal/demovideos/petly.mov")}
        controls
        style={{ width: "100%", maxWidth: 800 }}
      />
      <Typography variant="body1" sx={{ mt: 2 }}>
        Petly blended a Facebook-style experience for pet owners with full veterinary health
        records—vaccinations, x-rays, visits, and invoices. Built at IDEXX, the portal transformed
        boxy Liferay widgets into a playful notebook of sticky notes, lists, and photos.
      </Typography>
    </Container>
  );
}
