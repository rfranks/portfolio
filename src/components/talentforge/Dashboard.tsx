"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography, Skeleton } from "@mui/material";
import { useTalentForgeSelector } from "@/contexts/TalentForgeDataContext";

interface Counts {
  resumes: number;
  applications: number;
  offers: number;
  messages: number;
}

export default function Dashboard() {
  const resumes = useTalentForgeSelector((store) => store.getResumes());
  const applications = useTalentForgeSelector((store) => store.getJobApplications());
  const offers = useTalentForgeSelector((store) => store.getOffers());
  const messages = useTalentForgeSelector((store) => store.getMessages());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setHydrated(true), 0);
    return () => clearTimeout(id);
  }, []);

  const counts: Counts = {
    resumes: resumes.length,
    applications: applications.length,
    offers: offers.length,
    messages: messages.length,
  };

  const loading = !hydrated;

  const items = [
    { label: "Resumes", value: counts.resumes },
    { label: "Applications", value: counts.applications },
    { label: "Offers", value: counts.offers },
    { label: "Messages", value: counts.messages },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: 4 }).map((_, idx) => (
              <Grid key={idx} item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Skeleton width="60%" />
                    <Skeleton height={40} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          : items.map((item) => (
              <Grid key={item.label} item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>
                      {item.label}
                    </Typography>
                    <Typography variant="h4">{item.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}

