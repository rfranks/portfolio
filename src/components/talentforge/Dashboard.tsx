"use client";

import { useEffect, useState } from "react";
import { Box, Card, CardContent, Grid, Typography } from "@mui/material";
import { useTalentForgeData } from "@/contexts/TalentForgeDataContext";

interface Counts {
  resumes: number;
  applications: number;
  offers: number;
  messages: number;
}

export default function Dashboard() {
  const data = useTalentForgeData();
  const [counts, setCounts] = useState<Counts>({
    resumes: 0,
    applications: 0,
    offers: 0,
    messages: 0,
  });

  useEffect(() => {
    setCounts({
      resumes: data.getResumes().length,
      applications: data.getJobApplications().length,
      offers: data.getOffers().length,
      messages: data.getMessages().length,
    });
  }, [data]);

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
        {items.map((item) => (
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

